import { useState, useCallback } from 'react';
import { fetchOffers, matchOffersToList } from '../services/offers/offerService';
import type { SupermarketOffer, OfferMatch, UserLocation, ShoppingItem } from '../types';

export function useOffers() {
  const [offers, setOffers] = useState<SupermarketOffer[]>([]);
  const [matches, setMatches] = useState<OfferMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOffers = useCallback(async (
    location: UserLocation | null,
    shoppingItems: ShoppingItem[],
    storeIds?: string[],
  ) => {
    setLoading(true);
    try {
      const fetchedOffers = await fetchOffers(location, storeIds);
      setOffers(fetchedOffers);
      const matched = matchOffersToList(fetchedOffers, shoppingItems);
      setMatches(matched);
    } catch {
      // Silently fail — offers are not critical
    } finally {
      setLoading(false);
    }
  }, []);

  return { offers, matches, loading, loadOffers };
}
