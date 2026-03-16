import type { ScrapeResult } from "../types.ts";
import { scrapeViaProxy } from "./proxy-scraper.ts";

const STORE_ID = "bonpreu";
const STORE_NAME = "BonPreu";

export async function scrapeBonpreu(): Promise<ScrapeResult> {
  const offers = await scrapeViaProxy({
    store_id: STORE_ID,
    store_name: STORE_NAME,
    target_url: "https://www.bonpreuesclat.cat/ca/productes/ofertes",
    product_selector: ".product-card, .product-item, [data-product]",
    name_selector: ".product-card__title, .product-item__name, h3",
    price_selector: ".product-card__price, .price, .product-item__price",
    old_price_selector: ".product-card__price--old, .price--old",
    image_selector: "img",
    category_default: "Ofertes",
  });

  if (offers.length === 0) {
    const hasProxy = !!Deno.env.get("SCRAPING_PROXY_URL");
    return {
      store_id: STORE_ID,
      offers: [],
      error: hasProxy ? "BonPreu: proxy ok but no products (selectors may need updating)" : "BonPreu requires scraping proxy",
    };
  }

  return { store_id: STORE_ID, offers };
}
