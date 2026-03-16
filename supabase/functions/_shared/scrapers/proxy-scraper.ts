import type { ScrapedOffer } from "../types.ts";

/**
 * Generic proxy-based scraper using ScrapingBee.
 * Two modes:
 *   1. extract_rules — ScrapingBee extracts data via CSS selectors (best for clean SPAs)
 *   2. raw HTML — fetches rendered HTML and we parse it ourselves (for complex pages)
 */

interface ProxyScrapeConfig {
  store_id: string;
  store_name: string;
  target_url: string;
  product_selector: string;
  name_selector: string;
  price_selector: string;
  old_price_selector?: string;
  image_selector?: string;
  category_default: string;
}

export async function scrapeViaProxy(config: ProxyScrapeConfig): Promise<ScrapedOffer[]> {
  const proxyUrl = Deno.env.get("SCRAPING_PROXY_URL");
  const apiKey = Deno.env.get("SCRAPING_API_KEY");

  if (!proxyUrl || !apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url: config.target_url,
      render_js: "true",
      wait: "5000",
      extract_rules: JSON.stringify({
        products: {
          selector: config.product_selector,
          type: "list",
          output: {
            name: { selector: config.name_selector, output: "text" },
            price: { selector: config.price_selector, output: "text" },
            old_price: { selector: config.old_price_selector || ".no-match", output: "text" },
            image: { selector: config.image_selector || "img", output: "@src" },
          },
        },
      }),
    });

    const res = await fetch(`${proxyUrl}?${params.toString()}`);
    if (!res.ok) return [];

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }

    const products = data.products || [];
    const offers: ScrapedOffer[] = [];

    for (const p of products) {
      if (!p.name) continue;
      const price = parsePrice(p.price);
      if (price <= 0) continue;

      const oldPrice = parsePrice(p.old_price);

      offers.push({
        store_id: config.store_id,
        store_name: config.store_name,
        product_name: p.name.trim(),
        offer_price: price,
        original_price: oldPrice > price ? oldPrice : undefined,
        discount_pct:
          oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined,
        image_url: p.image,
        category: config.category_default,
        external_id: `${config.store_id}_${p.name.trim().slice(0, 40).replace(/\s+/g, "_")}`,
        source_url: config.target_url,
      });
    }

    return offers;
  } catch {
    return [];
  }
}

/**
 * Fetch rendered HTML via ScrapingBee and return it for custom parsing.
 */
export async function fetchRenderedHtml(url: string): Promise<string | null> {
  const proxyUrl = Deno.env.get("SCRAPING_PROXY_URL");
  const apiKey = Deno.env.get("SCRAPING_API_KEY");

  if (!proxyUrl || !apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url,
      render_js: "true",
      wait: "5000",
    });

    const res = await fetch(`${proxyUrl}?${params.toString()}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function parsePrice(raw: string | number | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}
