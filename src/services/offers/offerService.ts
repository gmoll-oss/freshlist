import type { SupermarketOffer, OfferMatch, UserLocation, ShoppingItem } from '../../types';
import { STORES } from '../../constants/stores';

/**
 * Fetch current offers from supermarkets.
 *
 * Architecture: This service acts as an abstraction layer over supermarket APIs.
 * In production, it would call individual store APIs or a unified offers aggregator.
 *
 * Supported integrations (to be connected):
 * - Mercadona: Internal API (no public API — requires scraping or partnership)
 * - Lidl: lidl.es/ofertas
 * - Carrefour: API disponible via carrefour.es
 * - DIA: API disponible via dia.es
 * - Aldi: aldi.es/ofertas
 * - Consum: consum.es
 *
 * For MVP, we use a backend proxy endpoint that aggregates offers.
 */

const OFFERS_API_BASE = process.env.EXPO_PUBLIC_OFFERS_API_URL || '';

export async function fetchOffers(
  location: UserLocation | null,
  storeIds?: string[],
): Promise<SupermarketOffer[]> {
  if (!OFFERS_API_BASE) {
    // No API configured — return empty (graceful degradation)
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (location) {
      params.set('lat', String(location.latitude));
      params.set('lng', String(location.longitude));
      if (location.postal_code) params.set('postal_code', location.postal_code);
    }
    if (storeIds?.length) {
      params.set('stores', storeIds.join(','));
    }

    const res = await fetch(`${OFFERS_API_BASE}/offers?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.offers ?? [];
  } catch {
    return [];
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
