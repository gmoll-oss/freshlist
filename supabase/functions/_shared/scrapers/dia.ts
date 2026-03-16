import type { ScrapeResult, ScrapedOffer } from "../types.ts";

const STORE_ID = "dia";
const STORE_NAME = "DIA";

// DIA Spain has 10000+ products in their sitemap with JSON-LD on each page.
// Works with Googlebot UA from some IPs, and with normal UA from others.

const SITEMAP_URL = "https://www.dia.es/sitemap.xml";

export async function scrapeDia(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];

  try {
    // Try multiple User-Agents in case one is blocked
    const userAgents = [
      "Googlebot/2.1 (+http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; FreshList/1.0)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    ];

    let xml = "";
    for (const ua of userAgents) {
      const res = await fetch(SITEMAP_URL, {
        headers: { "User-Agent": ua, "Accept": "text/xml,application/xml,text/html" },
      });
      if (!res.ok) continue;
      const body = await res.text();
      if (body.includes("<urlset") || body.includes("<loc>")) {
        xml = body;
        break;
      }
    }

    if (!xml) {
      return { store_id: STORE_ID, offers: [], error: "DIA sitemap not accessible from this IP" };
    }

    // Extract product URLs (/p/XXXXX pattern)
    const urlMatches =
      xml.match(/<loc>(https:\/\/www\.dia\.es\/[^<]*\/p\/\d+)<\/loc>/g) || [];
    const productUrls = urlMatches.map((m) =>
      m.replace("<loc>", "").replace("</loc>", ""),
    );

    if (productUrls.length === 0) {
      return { store_id: STORE_ID, offers: [], error: `Sitemap loaded (${xml.length} bytes) but no product URLs found` };
    }

    // Sample (max 300)
    const MAX_PRODUCTS = 300;
    const step = Math.max(1, Math.floor(productUrls.length / MAX_PRODUCTS));
    const sampled = productUrls
      .filter((_, i) => i % step === 0)
      .slice(0, MAX_PRODUCTS);

    // Fetch in batches
    const BATCH_SIZE = 10;
    let failures = 0;
    for (let i = 0; i < sampled.length; i += BATCH_SIZE) {
      const batch = sampled.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch(url, {
              headers: {
                "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
                "Accept": "text/html",
              },
            });
            if (!res.ok) { failures++; return null; }
            const html = await res.text();
            if (html.length < 500) { failures++; return null; }
            return extractDiaProduct(html, url);
          } catch {
            failures++;
            return null;
          }
        }),
      );

      for (const p of results) if (p) offers.push(p);

      // Stop if most requests fail (IP blocked)
      if (failures > BATCH_SIZE * 2 && offers.length === 0) {
        return {
          store_id: STORE_ID,
          offers: [],
          error: `DIA blocking product pages from this IP (${failures} failures)`,
        };
      }

      if (i + BATCH_SIZE < sampled.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return { store_id: STORE_ID, offers };
  } catch (e) {
    return { store_id: STORE_ID, offers: [], error: String(e) };
  }
}

function extractDiaProduct(html: string, url: string): ScrapedOffer | null {
  const blocks =
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];

  for (const block of blocks) {
    try {
      const json = block
        .replace('<script type="application/ld+json">', "")
        .replace("</script>", "");
      const data = JSON.parse(json);

      if (data["@type"] !== "Product" || !data.name) continue;

      const offerData = Array.isArray(data.offers) ? data.offers[0] : data.offers || {};
      const price = parseFloat(offerData.price) || 0;
      if (price <= 0) continue;

      // Category from URL path
      const pathParts = url.replace("https://www.dia.es/", "").split("/");
      const category = pathParts.length >= 1
        ? pathParts[0].replace(/-/g, " ").replace(/^\w/, (c: string) => c.toUpperCase())
        : "General";

      const idMatch = url.match(/\/p\/(\d+)/);

      return {
        store_id: STORE_ID,
        store_name: STORE_NAME,
        product_name: data.name,
        offer_price: price,
        category,
        image_url: data.image || undefined,
        external_id: `dia_${idMatch?.[1] || data.sku || data.name.slice(0, 30)}`,
        source_url: url,
      };
    } catch {
      // skip
    }
  }

  return null;
}
