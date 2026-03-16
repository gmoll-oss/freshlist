import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getServiceClient, getAnonClient } from "../_shared/supabase-client.ts";
import type { ScrapedOffer, ScrapeResult } from "../_shared/types.ts";

import { scrapeMercadona } from "../_shared/scrapers/mercadona.ts";
import { scrapeLidl } from "../_shared/scrapers/lidl.ts";
import { scrapeCarrefour } from "../_shared/scrapers/carrefour.ts";
import { scrapeDia } from "../_shared/scrapers/dia.ts";
import { scrapeAldi } from "../_shared/scrapers/aldi.ts";
import { scrapeAlcampo } from "../_shared/scrapers/alcampo.ts";
import { scrapeConsum } from "../_shared/scrapers/consum.ts";
import { scrapeEroski } from "../_shared/scrapers/eroski.ts";
import { scrapeBonpreu } from "../_shared/scrapers/bonpreu.ts";

const SCRAPERS: Record<string, () => Promise<ScrapeResult>> = {
  mercadona: scrapeMercadona,
  lidl: scrapeLidl,
  carrefour: scrapeCarrefour,
  dia: scrapeDia,
  aldi: scrapeAldi,
  alcampo: scrapeAlcampo,
  consum: scrapeConsum,
  eroski: scrapeEroski,
  bonpreu: scrapeBonpreu,
};

serve(async (req) => {
  // Allow invoking via POST (manual/cron) or GET (testing)
  const url = new URL(req.url);
  const storesParam = url.searchParams.get("stores");

  // Optional: restrict to specific stores
  const targetStores = storesParam
    ? storesParam.split(",").filter((s) => s in SCRAPERS)
    : Object.keys(SCRAPERS);

  // Try service client first, fall back to anon (which uses RLS policies)
  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch {
    supabase = getAnonClient();
  }
  const results: { store_id: string; count: number; error?: string }[] = [];

  // Run all scrapers in parallel
  const scrapePromises = targetStores.map(async (storeId) => {
    const start = Date.now();
    let result: ScrapeResult;

    try {
      result = await SCRAPERS[storeId]();
    } catch (e) {
      result = { store_id: storeId, offers: [], error: String(e) };
    }

    const duration = Date.now() - start;

    // Insert offers into DB
    let dbError = "";
    if (result.offers.length > 0) {
      // Deduplicate by external_id
      const seen = new Set<string>();
      result.offers = result.offers.filter((o) => {
        if (!o.external_id) return true;
        if (seen.has(o.external_id)) return false;
        seen.add(o.external_id);
        return true;
      });

      // Delete existing offers for this store, then insert fresh
      const delRes = await supabase
        .from("supermarket_offers")
        .delete()
        .eq("store_id", storeId);
      if (delRes.error) {
        dbError += `Delete: ${delRes.error.message}. `;
      }

      // Insert in batches of 50
      const batches = chunk(result.offers, 50);
      let insertedCount = 0;
      for (const batch of batches) {
        const rows = batch.map((o) => ({
          store_id: o.store_id,
          store_name: o.store_name,
          product_name: o.product_name,
          description: o.description || null,
          original_price: o.original_price || null,
          offer_price: o.offer_price,
          discount_pct: o.discount_pct || null,
          category: o.category || null,
          image_url: o.image_url || null,
          valid_from: o.valid_from || new Date().toISOString().split("T")[0],
          valid_until: o.valid_until || getDefaultExpiry(),
          source_url: o.source_url || null,
          external_id: o.external_id || null,
        }));

        const insRes = await supabase
          .from("supermarket_offers")
          .insert(rows);

        if (insRes.error) {
          dbError += `Insert batch: ${insRes.error.message}. `;
        } else {
          insertedCount += batch.length;
        }
      }
      if (dbError) {
        result.error = (result.error || "") + " DB: " + dbError;
      }
    }

    // Log sync result
    const logRes = await supabase.from("offer_sync_log").insert({
      store_id: storeId,
      status: result.error ? (result.offers.length > 0 ? "partial" : "error") : "success",
      offers_count: result.offers.length,
      error_message: result.error || null,
      duration_ms: duration,
    });
    if (logRes.error) {
      dbError += `Log: ${logRes.error.message}. `;
    }

    return {
      store_id: storeId,
      count: result.offers.length,
      error: result.error || undefined,
      db_error: dbError || undefined,
    };
  });

  const allResults = await Promise.all(scrapePromises);

  const totalOffers = allResults.reduce((sum, r) => sum + r.count, 0);
  const errors = allResults.filter((r) => r.error);

  return new Response(
    JSON.stringify({
      success: true,
      total_offers: totalOffers,
      stores: allResults,
      errors_count: errors.length,
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    },
  );
});

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function getDefaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7); // Default: offers valid for 1 week
  return d.toISOString().split("T")[0];
}
