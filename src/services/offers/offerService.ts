import { supabase } from '../../lib/supabase';
import type { SupermarketOffer, OfferMatch, UserLocation, ShoppingItem } from '../../types';
import { STORES } from '../../constants/stores';

/**
 * Fetch current offers from Supabase Edge Function or directly from DB.
 *
 * Architecture:
 * 1. Edge Function `sync-offers` runs on a schedule (cron) scraping 9 supermarkets
 * 2. Offers are stored in `supermarket_offers` table
 * 3. This service reads from the table (via Edge Function or direct query)
 *
 * Supported supermarkets:
 * Mercadona, Lidl, Carrefour, DIA, Aldi, Alcampo, Consum, Eroski, BonPreu
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export async function fetchOffers(
  location: UserLocation | null,
  storeIds?: string[],
): Promise<SupermarketOffer[]> {
  try {
    // Query offers directly from Supabase table
    let query = supabase
      .from('supermarket_offers')
      .select('*')
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
      .order('discount_pct', { ascending: false, nullsFirst: false })
      .limit(200);

    if (storeIds?.length) {
      query = query.in('store_id', storeIds);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error fetching offers:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      store_name: row.store_name,
      product_name: row.product_name,
      original_price: row.original_price ? Number(row.original_price) : 0,
      offer_price: Number(row.offer_price),
      discount_pct: row.discount_pct ?? 0,
      valid_until: row.valid_until ?? '',
      category: row.category ?? '',
      image_url: row.image_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Search offers by product name.
 */
export async function searchOffers(query: string): Promise<SupermarketOffer[]> {
  try {
    const { data, error } = await supabase
      .from('supermarket_offers')
      .select('*')
      .ilike('product_name', `%${query}%`)
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
      .order('discount_pct', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) return [];

    return (data || []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      store_name: row.store_name,
      product_name: row.product_name,
      original_price: row.original_price ? Number(row.original_price) : 0,
      offer_price: Number(row.offer_price),
      discount_pct: row.discount_pct ?? 0,
      valid_until: row.valid_until ?? '',
      category: row.category ?? '',
      image_url: row.image_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Get sync status for all stores (last scrape time, offer counts).
 */
export async function getSyncStatus(): Promise<{
  store_id: string;
  status: string;
  offers_count: number;
  synced_at: string;
}[]> {
  try {
    const { data, error } = await supabase
      .from('offer_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(20);

    if (error) return [];

    // Keep latest per store
    const byStore: Record<string, any> = {};
    for (const log of data || []) {
      if (!byStore[log.store_id]) {
        byStore[log.store_id] = log;
      }
    }
    return Object.values(byStore);
  } catch {
    return [];
  }
}

/**
 * Get user's favorite stores.
 */
export async function getFavoriteStores(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_favorite_stores')
      .select('store_id')
      .eq('user_id', user.id);

    if (error) return [];
    return (data || []).map((r: any) => r.store_id);
  } catch {
    return [];
  }
}

/**
 * Toggle a favorite store for the current user.
 */
export async function toggleFavoriteStore(storeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorite_stores')
      .select('id')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_favorite_stores').delete().eq('id', existing.id);
      return false; // Removed
    } else {
      await supabase.from('user_favorite_stores').insert({ user_id: user.id, store_id: storeId });
      return true; // Added
    }
  } catch {
    return false;
  }
}

/**
 * Get total offer count per store.
 */
export async function getOfferCountsByStore(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('supermarket_offers')
      .select('store_id')
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`);

    if (error) return {};

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.store_id] = (counts[row.store_id] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Match offers against the user's shopping list and pantry habits.
 * Returns offers sorted by relevance.
 */
export function matchOffersToList(
  offers: SupermarketOffer[],
  shoppingItems: ShoppingItem[],
  pantryHistory?: string[],
): OfferMatch[] {
  const matches: OfferMatch[] = [];
  const shoppingNames = shoppingItems.map((i) => i.name.toLowerCase());
  const historyNames = (pantryHistory ?? []).map((n) => n.toLowerCase());

  for (const offer of offers) {
    const offerLower = offer.product_name.toLowerCase();

    // Exact match with shopping list
    const exactShop = shoppingNames.find(
      (n) => offerLower.includes(n) || n.includes(offerLower),
    );
    if (exactShop) {
      matches.push({ offer, matched_item: exactShop, relevance: 'exact' });
      continue;
    }

    // Similar match with pantry history
    const similarHistory = historyNames.find(
      (n) => offerLower.includes(n) || n.includes(offerLower),
    );
    if (similarHistory) {
      matches.push({ offer, matched_item: similarHistory, relevance: 'similar' });
      continue;
    }

    // Category match with shopping list
    const categoryMatch = shoppingItems.find(
      (i) => i.category.toLowerCase() === offer.category.toLowerCase(),
    );
    if (categoryMatch) {
      matches.push({ offer, matched_item: categoryMatch.name, relevance: 'category' });
    }
  }

  // Sort: exact > similar > category, then by discount
  const relevanceOrder = { exact: 0, similar: 1, category: 2 };
  return matches.sort((a, b) => {
    const rel = relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
    if (rel !== 0) return rel;
    return b.offer.discount_pct - a.offer.discount_pct;
  });
}

/**
 * Get store info (name, color) by id.
 */
export function getStoreInfo(storeId: string) {
  return STORES.find((s) => s.id === storeId) ?? { id: storeId, name: storeId, color: '#666' };
}
