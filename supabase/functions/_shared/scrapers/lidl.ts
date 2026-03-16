import type { ScrapeResult, ScrapedOffer } from "../types.ts";

const STORE_ID = "lidl";
const STORE_NAME = "Lidl";

// Lidl Spain has a product sitemap (4400+ products) with JSON-LD on each page.
// Strategy: fetch gzipped sitemap -> sample product URLs -> extract JSON-LD.
// No proxy needed - works with Googlebot UA.

const SITEMAP_URL = "https://www.lidl.es/p/export/ES/es/product_sitemap.xml.gz";
const HEADERS = {
  "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
  "Accept": "text/html",
};

export async function scrapeLidl(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];

  try {
    // 1. Fetch gzipped sitemap
    const sitemapRes = await fetch(SITEMAP_URL);
    if (!sitemapRes.ok) {
      return { store_id: STORE_ID, offers: [], error: `Sitemap returned ${sitemapRes.status}` };
    }

    // Decompress gzip
    const compressed = await sitemapRes.arrayBuffer();
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(compressed));
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const xml = new TextDecoder().decode(
      await new Blob(chunks).arrayBuffer(),
    );

    // 2. Extract product URLs
    const urlMatches =
      xml.match(/<loc>(https:\/\/www\.lidl\.es\/p\/[^<]+)<\/loc>/g) || [];
    const productUrls = urlMatches.map((m) =>
      m.replace("<loc>", "").replace("</loc>", ""),
    );

    if (productUrls.length === 0) {
      return {
        store_id: STORE_ID,
        offers: [],
        error: `No product URLs in sitemap (xml: ${xml.length} bytes)`,
      };
    }

    // 3. Sample products (max 300 for Edge Function timeout)
    const MAX_PRODUCTS = 300;
    const step = Math.max(1, Math.floor(productUrls.length / MAX_PRODUCTS));
    const sampled = productUrls
      .filter((_, i) => i % step === 0)
      .slice(0, MAX_PRODUCTS);

    // 4. Fetch product pages in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < sampled.length; i += BATCH_SIZE) {
      const batch = sampled.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch(url, { headers: HEADERS });
            if (!res.ok) return null;
            const html = await res.text();
            return extractProduct(html, url);
          } catch {
            return null;
          }
        }),
      );

      for (const product of results) {
        if (product) offers.push(product);
      }

      // Respectful delay
      if (i + BATCH_SIZE < sampled.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return { store_id: STORE_ID, offers };
  } catch (e) {
    return { store_id: STORE_ID, offers: [], error: String(e) };
  }
}

function extractProduct(
  html: string,
  pageUrl: string,
): ScrapedOffer | null {
  const blocks =
    html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ) || [];

  for (const block of blocks) {
    try {
      const json = block
        .replace('<script type="application/ld+json">', "")
        .replace("</script>", "");
      const data = JSON.parse(json);

      if (data["@type"] !== "Product" || !data.name) continue;

      const offerData = Array.isArray(data.offers)
        ? data.offers[0]
        : data.offers;
      const price = parseFloat(offerData?.price) || 0;
      if (price <= 0) continue;

      const brand = data.brand?.name || "";
      const name = brand
        ? `${brand.toUpperCase()} ${data.name}`
        : data.name;

      const image = Array.isArray(data.image)
        ? data.image[0]
        : data.image;

      return {
        store_id: STORE_ID,
        store_name: STORE_NAME,
        product_name: name,
        offer_price: price,
        category: "Supermercado",
        image_url: image,
        external_id: `lidl_${data.sku || data.name.slice(0, 30)}`,
        source_url: pageUrl,
      };
    } catch {
      // Skip malformed
    }
  }

  return null;
}
