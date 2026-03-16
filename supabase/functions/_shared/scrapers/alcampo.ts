import type { ScrapeResult, ScrapedOffer } from "../types.ts";
import { parsePrice } from "./proxy-scraper.ts";

const STORE_ID = "alcampo";
const STORE_NAME = "Alcampo";

// Alcampo product cards contain all text in a flat format.
// We extract card text and parse name + price from it.
// Multiple promo pages to maximize coverage.

const PROMO_URLS = [
  "https://www.compraonline.alcampo.es/promotions",
  "https://www.compraonline.alcampo.es/shop-in-shop/ofertas-exclusivas-online-frescos?type=componentized",
  "https://www.compraonline.alcampo.es/shop-in-shop/ofertas-exclusivas-online-bebidas?type=componentized",
];

export async function scrapeAlcampo(): Promise<ScrapeResult> {
  const proxyUrl = Deno.env.get("SCRAPING_PROXY_URL");
  const apiKey = Deno.env.get("SCRAPING_API_KEY");

  if (!proxyUrl || !apiKey) {
    return { store_id: STORE_ID, offers: [], error: "Alcampo requires scraping proxy" };
  }

  const allOffers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (const url of PROMO_URLS) {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        url,
        render_js: "true",
        wait: "5000",
        js_scenario: JSON.stringify({
          instructions: [
            { scroll_y: 3000 }, { wait: 2000 },
            { scroll_y: 6000 }, { wait: 2000 },
          ],
        }),
        extract_rules: JSON.stringify({
          cards: {
            selector: ".product-card-container",
            type: "list",
            output: "text",
          },
        }),
      });

      const res = await fetch(`${proxyUrl}?${params.toString()}`);
      if (!res.ok) continue;

      const data = await res.json();
      const cards = data.cards || [];

      for (const card of cards) {
        const text = typeof card === "string" ? card : "";
        if (text.length < 20) continue;

        // Extract name: text between known markers
        // Format: "Destacado Este es un producto destacado BRAND Product Xg. Atributos... Precio X,XX €"
        let name: string | null = null;

        // Try pattern: "producto destacado NAME. Something"
        const m1 = text.match(/producto destacado\s+(.+?)(?:\.\s|Refrigerado|Sin Gluten|\(\s*\d)/i);
        if (m1) {
          name = m1[1].trim();
        }

        // Fallback: first meaningful sentence
        if (!name) {
          const m2 = text.match(/^(?:Destacado\s+)?(.+?)(?:\.\s|\(\s*\d)/);
          if (m2) name = m2[1].replace(/^Este es un producto destacado\s*/i, "").trim();
        }

        if (!name || name.length < 5 || name.length > 150) continue;

        // Extract price
        const priceMatch = text.match(/Precio\s*(\d+[,.]\d+)\s*€/) || text.match(/(\d+[,.]\d+)\s*€/);
        const price = priceMatch ? parsePrice(priceMatch[1]) : 0;
        if (price <= 0) continue;

        // Extract old price
        const oldMatch = text.match(/Antes\s+(\d+[,.]\d+)\s*€/) || text.match(/P\.V\.P\.\s*(\d+[,.]\d+)\s*€/);
        const oldPrice = oldMatch ? parsePrice(oldMatch[1]) : undefined;

        if (seen.has(name)) continue;
        seen.add(name);

        allOffers.push({
          store_id: STORE_ID,
          store_name: STORE_NAME,
          product_name: name.replace(/\s+/g, " "),
          offer_price: price,
          original_price: oldPrice && oldPrice > price ? oldPrice : undefined,
          discount_pct: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined,
          category: "Promociones",
          external_id: `alcampo_${name.slice(0, 40).replace(/\s+/g, "_")}`,
          source_url: url,
        });
      }
    } catch {
      // Skip failed URL
    }
  }

  if (allOffers.length === 0) {
    return { store_id: STORE_ID, offers: [], error: "Alcampo: couldn't parse product cards" };
  }

  return { store_id: STORE_ID, offers: allOffers };
}
