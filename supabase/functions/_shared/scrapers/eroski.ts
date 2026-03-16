import type { ScrapeResult, ScrapedOffer } from "../types.ts";
import { fetchRenderedHtml } from "./proxy-scraper.ts";

const STORE_ID = "eroski";
const STORE_NAME = "Eroski";

// Eroski embeds schema.org/Product JSON objects inline in their rendered HTML.
// We fetch rendered HTML via ScrapingBee and extract the JSON Product objects.

// Use subcategory pages for more products per request
const CATEGORY_URLS = [
  "https://supermercado.eroski.es/es/supermercado/2059698-frescos/2059699-frutas/",
  "https://supermercado.eroski.es/es/supermercado/2059698-frescos/2059760-carniceria/",
  "https://supermercado.eroski.es/es/supermercado/2059806-alimentacion/2059807-desayuno-y-merienda/",
];

export async function scrapeEroski(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (const url of CATEGORY_URLS) {
    const html = await fetchRenderedHtml(url);
    if (!html) continue;

    const products = extractJsonProducts(html);
    for (const p of products) {
      const key = p.identifier || p.name;
      if (seen.has(key)) continue;
      seen.add(key);

      const price = parseFloat(p.offers?.price) || 0;
      if (price <= 0 || !p.name) continue;

      const categoryFromUrl = url.split("/").filter(Boolean).pop()?.replace(/^\d+-/, "").replace(/-/g, " ") || "General";

      offers.push({
        store_id: STORE_ID,
        store_name: STORE_NAME,
        product_name: p.description || p.name,
        offer_price: price,
        category: categoryFromUrl.charAt(0).toUpperCase() + categoryFromUrl.slice(1),
        image_url: p.image || undefined,
        external_id: `eroski_${p.identifier || p.name.slice(0, 30)}`,
        source_url: p.offers?.url || url,
      });
    }

    // Delay between category pages (save API credits)
    await new Promise((r) => setTimeout(r, 500));
  }

  if (offers.length === 0) {
    const hasProxy = !!Deno.env.get("SCRAPING_PROXY_URL");
    return {
      store_id: STORE_ID,
      offers: [],
      error: hasProxy ? "Eroski: proxy ok but no products extracted" : "Eroski requires scraping proxy",
    };
  }

  return { store_id: STORE_ID, offers };
}

interface JsonProduct {
  "@type": string;
  name?: string;
  description?: string;
  identifier?: string;
  image?: string;
  offers?: { price?: string; url?: string };
}

function extractJsonProducts(html: string): JsonProduct[] {
  const products: JsonProduct[] = [];
  const regex = /"@type":"Product"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    // Walk backwards to find opening {
    let depth = 0;
    let start = -1;
    for (let i = match.index; i >= Math.max(0, match.index - 2000); i--) {
      if (html[i] === "}") depth++;
      if (html[i] === "{") {
        if (depth === 0) { start = i; break; }
        depth--;
      }
    }
    if (start === -1) continue;

    // Walk forward to find matching }
    depth = 0;
    for (let j = start; j < Math.min(html.length, start + 3000); j++) {
      if (html[j] === "{") depth++;
      if (html[j] === "}") {
        depth--;
        if (depth === 0) {
          try {
            const obj = JSON.parse(html.slice(start, j + 1));
            if (obj["@type"] === "Product") {
              products.push(obj);
            }
          } catch { /* skip malformed */ }
          break;
        }
      }
    }
  }

  return products;
}
