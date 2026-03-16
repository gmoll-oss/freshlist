import type { ScrapeResult, ScrapedOffer } from "../types.ts";

const STORE_ID = "aldi";
const STORE_NAME = "Aldi";

// Aldi Spain sitemap contains weekly offer article pages.
// Each article page has structured price and product data in HTML.
const SITEMAP_URL = "https://www.aldi.es/.aldi-nord-sitemap-pages.xml";
const HEADERS = {
  "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
  "Accept": "text/html",
};

export async function scrapeAldi(): Promise<ScrapeResult> {
  const offers: ScrapedOffer[] = [];

  try {
    // 1. Fetch sitemap and find article URLs (offers)
    const sitemapRes = await fetch(SITEMAP_URL, { headers: HEADERS });
    if (!sitemapRes.ok) {
      return { store_id: STORE_ID, offers: [], error: `Sitemap returned ${sitemapRes.status}` };
    }

    const xml = await sitemapRes.text();
    const articleUrls = (
      xml.match(/<loc>(https:\/\/www\.aldi\.es\/ofertas\/[^<]*\.article\.html)<\/loc>/g) || []
    ).map((m) => m.replace("<loc>", "").replace("</loc>", ""));

    if (articleUrls.length === 0) {
      return { store_id: STORE_ID, offers: [], error: "No offer articles in sitemap" };
    }

    // 2. Fetch each article page in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < articleUrls.length; i += BATCH_SIZE) {
      const batch = articleUrls.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch(url, { headers: HEADERS });
            if (!res.ok) return null;
            const html = await res.text();
            return extractAldiProduct(html, url);
          } catch {
            return null;
          }
        }),
      );

      for (const product of results) {
        if (product) offers.push(product);
      }

      if (i + BATCH_SIZE < articleUrls.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return { store_id: STORE_ID, offers };
  } catch (e) {
    return { store_id: STORE_ID, offers: [], error: String(e) };
  }
}

function extractAldiProduct(html: string, pageUrl: string): ScrapedOffer | null {
  try {
    // Extract brand (small headline)
    const brandMatch = html.match(
      /header-headline-small[^>]*>\s*(?:<[^>]+>\s*)*([^<]+)/,
    );
    const brand = brandMatch ? brandMatch[1].trim() : "";

    // Extract product name from h1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!h1Match) return null;

    const h1Text = h1Match[1].replace(/<[^>]+>/g, " ").trim();
    const lines = h1Text.split("\n").map((l) => l.trim()).filter(Boolean);
    // Last meaningful line is usually the product name
    const productName = lines.length > 1
      ? lines.slice(-1)[0]
      : lines[0] || "";

    if (!productName || productName.length < 3) return null;

    const fullName = brand ? `${brand} ${productName}` : productName;

    // Extract main price (first price in mod-article-intro__price)
    const priceBlockMatch = html.match(
      /mod-article-intro__price[^>]*>([\s\S]*?)<\/div>/,
    );
    let price = 0;
    if (priceBlockMatch) {
      const priceText = priceBlockMatch[1].replace(/<[^>]+>/g, "").trim();
      const priceMatch = priceText.match(/(\d+[,.]\d+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(",", "."));
      }
    }

    if (price <= 0) {
      // Fallback: find first €-price in page
      const fallbackPrice = html.match(/(\d+[,.]\d+)\s*€/);
      if (fallbackPrice) {
        price = parseFloat(fallbackPrice[1].replace(",", "."));
      }
    }

    if (price <= 0) return null;

    // Extract image
    const imgMatch = html.match(
      /mod-article-intro__asset[\s\S]*?src="([^"]+)"/,
    );
    const imageUrl = imgMatch ? imgMatch[1] : undefined;

    // Extract offer period from URL (e.g., "desde-14-marzo")
    const periodMatch = pageUrl.match(/ofertas\/(desde-[^/]+)\//);
    const period = periodMatch ? periodMatch[1].replace(/-/g, " ") : "Ofertas semanales";

    // Extract product ID from URL
    const idMatch = pageUrl.match(/(\d{5,})/);
    const productId = idMatch ? idMatch[1] : fullName.slice(0, 30);

    return {
      store_id: STORE_ID,
      store_name: STORE_NAME,
      product_name: fullName,
      offer_price: price,
      category: period.charAt(0).toUpperCase() + period.slice(1),
      image_url: imageUrl,
      external_id: `aldi_${productId}`,
      source_url: pageUrl,
    };
  } catch {
    return null;
  }
}
