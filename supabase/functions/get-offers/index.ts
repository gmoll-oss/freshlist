import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getAnonClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/get-offers/, "");

  // Route: GET /get-offers/offers — list current offers
  if (path === "/offers" || path === "" || path === "/") {
    return handleGetOffers(url);
  }

  // Route: GET /get-offers/stores/nearby — find nearby stores
  if (path === "/stores/nearby") {
    return handleNearbyStores(url);
  }

  // Route: GET /get-offers/sync-status — last sync info
  if (path === "/sync-status") {
    return handleSyncStatus();
  }

  return jsonResponse({ error: "Not found" }, 404);
});

async function handleGetOffers(url: URL) {
  const supabase = getAnonClient();

  const storesParam = url.searchParams.get("stores");
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("q");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabase
    .from("supermarket_offers")
    .select("*")
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split("T")[0]}`)
    .order("discount_pct", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  // Filter by stores
  if (storesParam) {
    const storeIds = storesParam.split(",");
    query = query.in("store_id", storeIds);
  }

  // Filter by category
  if (category) {
    query = query.ilike("category", `%${category}%`);
  }

  // Search by product name
  if (search) {
    query = query.ilike("product_name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    offers: data || [],
    count: data?.length || 0,
  });
}

async function handleNearbyStores(url: URL) {
  const lat = parseFloat(url.searchParams.get("lat") || "0");
  const lng = parseFloat(url.searchParams.get("lng") || "0");
  const radius = parseFloat(url.searchParams.get("radius") || "10");

  if (!lat || !lng) {
    return jsonResponse({ error: "lat and lng are required" }, 400);
  }

  const supabase = getAnonClient();

  const { data, error } = await supabase.rpc("nearby_stores", {
    user_lat: lat,
    user_lng: lng,
    radius_km: radius,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ stores: data || [] });
}

async function handleSyncStatus() {
  const supabase = getAnonClient();

  // Get latest sync per store
  const { data, error } = await supabase
    .from("offer_sync_log")
    .select("*")
    .order("synced_at", { ascending: false })
    .limit(20);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  // Group by store, keep latest
  const byStore: Record<string, any> = {};
  for (const log of data || []) {
    if (!byStore[log.store_id]) {
      byStore[log.store_id] = log;
    }
  }

  return jsonResponse({ sync_status: Object.values(byStore) });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
