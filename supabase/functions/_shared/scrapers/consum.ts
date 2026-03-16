import type { ScrapeResult, ScrapedOffer } from "../types.ts";

const STORE_ID = "consum";
const STORE_NAME = "Consum";

// Consum has a public REST API at tienda.consum.es
// Products with offers have an OFFER_PRICE in priceData.prices[] and an offers[] array
const API_BASE = "https://tienda.consum.es/api/rest/V1.0";

interface ConsumProduct {
  id: number;
  productData: {
    name: string;
    brand?: { name: string };
    imageURL?: string;
    url?: string;
  };
  priceData: {
    prices: {
      id: string; // "PRICE" or "OFFER_PRICE"
      value: { centAmount: number; centUnitAmount: number };
    }[];
  };
  offers: {
    id: number;
    from: string;
    to: string;
    shortDescription?: string;
  }[];
  categories: { id: number; name: string }[];
  media?: { url: string }[];
}

export async function scrapeConsum(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];
  const PAGE_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  try {
    // Paginate through all products, collecting those with active offers
    while (hasMore && offset < 10000) {
      const res = await fetch(
        `${API_BASE}/catalog/product?showRecommendations=false&offset=${offset}&limit=${PAGE_SIZE}`,
        { headers: { "Accept": "application/json" } },
      );

      if (!res.ok) {
        return {
          store_id: STORE_ID,
          offers,
          error: `API returned ${res.status} at offset ${offset}`,
        };
      }

      const data = await res.json();
      const products: ConsumProduct[] = data.products || [];
      hasMore = data.hasMore === true;

      for (const p of products) {
        // Only include products with active offers
        if (p.offers.length === 0) continue;

        const regularPrice = p.priceData.prices.find((pr) => pr.id === "PRICE");
        const offerPrice = p.priceData.prices.find((pr) => pr.id === "OFFER_PRICE");

        if (!regularPrice) continue;

        const price = offerPrice?.value.centAmount ?? regularPrice.value.centAmount;
        const original = offerPrice ? regularPrice.value.centAmount : undefined;
        const discountPct =
          original && original > price
            ? Math.round(((original - price) / original) * 100)
            : undefined;

        const imageUrl =
          p.media?.[0]?.url || p.productData.imageURL;

        // Check offer validity
        const activeOffer = p.offers.find((o) => {
          const to = new Date(o.to);
          return to >= new Date();
        });
        if (!activeOffer) continue;

        const brandPrefix = p.productData.brand?.name
          ? `${p.productData.brand.name} `
          : "";

        offers.push({
          store_id: STORE_ID,
          store_name: STORE_NAME,
          product_name: `${brandPrefix}${p.productData.name}`,
          original_price: original,
          offer_price: price,
          discount_pct: discountPct,
          category: p.categories?.[0]?.name ?? "General",
          image_url: imageUrl,
          external_id: `consum_${p.id}`,
          source_url: p.productData.url || "https://tienda.consum.es",
          valid_until: activeOffer.to.split("T")[0],
        });
      }

      offset += PAGE_SIZE;

      // Respectful delay between pages
      if (hasMore) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return { store_id: STORE_ID, offers };
  } catch (e) {
    return { store_id: STORE_ID, offers, error: String(e) };
  }
}
