import type { ScrapeResult, ScrapedOffer } from "../types.ts";
import { scrapeViaProxy } from "./proxy-scraper.ts";

const STORE_ID = "carrefour";
const STORE_NAME = "Carrefour";

// Carrefour uses Cloudflare WAF. ScrapingBee can bypass it.
// Multiple offer category pages to maximize products.

const OFFER_PAGES = [
  {
    url: "https://www.carrefour.es/supermercado/ofertas-del-dia/cat590001/c",
    category: "Ofertas del dia",
  },
  {
    url: "https://www.carrefour.es/supermercado/2x1-y-otras-promociones/N-1pck2ks/c",
    category: "2x1 y promociones",
  },
  {
    url: "https://www.carrefour.es/supermercado/ofertas-en-frescos/cat21489114/c",
    category: "Ofertas frescos",
  },
];

export async function scrapeCarrefour(): Promise<ScrapeResult> {
  const allOffers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  for (const page of OFFER_PAGES) {
    const offers = await scrapeViaProxy({
      store_id: STORE_ID,
      store_name: STORE_NAME,
      target_url: page.url,
      product_selector: ".product-card, .product-card-list__item",
      name_selector: ".product-card__title, .product-card__title-link",
      price_selector: ".product-card__price, .product-card__price-final",
      old_price_selector: ".product-card__price--old, .product-card__price-strikethrough",
      image_selector: "img",
      category_default: page.category,
    });

    for (const o of offers) {
      if (!seen.has(o.product_name)) {
        seen.add(o.product_name);
        allOffers.push(o);
      }
    }
  }

  if (allOffers.length === 0) {
    const hasProxy = !!Deno.env.get("SCRAPING_PROXY_URL");
    return {
      store_id: STORE_ID,
      offers: [],
      error: hasProxy ? "Carrefour: proxy ok but Cloudflare may be blocking" : "Carrefour requires scraping proxy",
    };
  }

  return { store_id: STORE_ID, offers: allOffers };
}
