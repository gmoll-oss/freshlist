import type { ScrapeResult, ScrapedOffer } from "../types.ts";

const STORE_ID = "mercadona";
const STORE_NAME = "Mercadona";

// Mercadona public REST API (used by tienda.mercadona.es)
// Categories: GET /api/categories/ -> { results: [...] }
// Subcategory products: GET /api/categories/{id}/ -> nested categories with products
const API_BASE = "https://tienda.mercadona.es/api";

interface MercadonaProduct {
  id: string;
  display_name: string;
  thumbnail: string;
  categories?: { id: number; name: string }[];
  price_instructions: {
    unit_price: number;
    bulk_price: string;
    reference_price: string;
    previous_unit_price: number | null;
    price_decreased: boolean;
    size_format?: string;
    unit_size?: number;
  };
}

export async function scrapeMercadona(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];

  try {
    // 1. Fetch top-level categories
    const catRes = await fetch(`${API_BASE}/categories/`, {
      headers: { "Accept": "application/json" },
    });

    if (!catRes.ok) {
      return { store_id: STORE_ID, offers: [], error: `Categories API ${catRes.status}` };
    }

    const catData = await catRes.json();
    const topCategories = catData.results || catData || [];

    // 2. Collect all subcategory IDs
    const subCatIds: { id: number; parentName: string }[] = [];
    for (const top of topCategories) {
      for (const sub of top.categories || []) {
        subCatIds.push({ id: sub.id, parentName: top.name });
      }
    }

    // 3. Fetch each subcategory for products (limit concurrency)
    const BATCH_SIZE = 5;
    for (let i = 0; i < subCatIds.length; i += BATCH_SIZE) {
      const batch = subCatIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ id, parentName }) => {
          try {
            const res = await fetch(`${API_BASE}/categories/${id}/`, {
              headers: { "Accept": "application/json" },
            });
            if (!res.ok) return [];

            const data = await res.json();
            return extractProducts(data, parentName);
          } catch {
            return [];
          }
        }),
      );

      for (const products of results) {
        for (const product of products) {
          const pi = product.price_instructions;

          // Include products with price decrease OR all products with price
          if (pi.price_decreased && pi.previous_unit_price && pi.previous_unit_price > pi.unit_price) {
            const discountPct = Math.round(
              ((pi.previous_unit_price - pi.unit_price) / pi.previous_unit_price) * 100,
            );
            offers.push({
              store_id: STORE_ID,
              store_name: STORE_NAME,
              product_name: product.display_name,
              original_price: pi.previous_unit_price,
              offer_price: pi.unit_price,
              discount_pct: discountPct,
              category: product.categories?.[0]?.name ?? "General",
              image_url: product.thumbnail,
              external_id: `mercadona_${product.id}`,
              source_url: `https://tienda.mercadona.es/product/${product.id}`,
            });
          } else {
            // Also store non-discounted products as "regular price" offers
            // so the app always has Mercadona data to show
            offers.push({
              store_id: STORE_ID,
              store_name: STORE_NAME,
              product_name: product.display_name,
              offer_price: pi.unit_price,
              category: product.categories?.[0]?.name ?? "General",
              image_url: product.thumbnail,
              external_id: `mercadona_${product.id}`,
              source_url: `https://tienda.mercadona.es/product/${product.id}`,
            });
          }
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < subCatIds.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return { store_id: STORE_ID, offers };
  } catch (e) {
    return { store_id: STORE_ID, offers: [], error: String(e) };
  }
}

function extractProducts(catData: any, fallbackCategory: string): MercadonaProduct[] {
  const products: MercadonaProduct[] = [];

  // Products can be nested in subcategories
  if (catData.categories) {
    for (const sub of catData.categories) {
      if (sub.products) {
        for (const p of sub.products) {
          if (!p.categories?.length) {
            p.categories = [{ id: 0, name: sub.name || fallbackCategory }];
          }
          products.push(p);
        }
      }
      // Deeper nesting
      if (sub.categories) {
        products.push(...extractProducts(sub, sub.name || fallbackCategory));
      }
    }
  }
  if (catData.products) {
    products.push(...catData.products);
  }

  return products;
}
