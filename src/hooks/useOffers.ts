import { useState, useCallback, useEffect } from 'react';
import {
  fetchOffers,
  searchOffers,
  matchOffersToList,
  getFavoriteStores,
  toggleFavoriteStore,
  getOfferCountsByStore,
} from '../services/offers/offerService';
import type { SupermarketOffer, OfferMatch, UserLocation, ShoppingItem } from '../types';

export function useOffers() {
  const [offers, setOffers] = useState<SupermarketOffer[]>([]);
  const [matches, setMatches] = useState<OfferMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});

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

  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const results = await searchOffers(query);
      setOffers(results);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const favs = await getFavoriteStores();
    setFavoriteStores(favs);
  }, []);

  const toggleFavorite = useCallback(async (storeId: string) => {
    const added = await toggleFavoriteStore(storeId);
    setFavoriteStores((prev) =>
      added ? [...prev, storeId] : prev.filter((s) => s !== storeId),
    );
  }, []);

  const loadCounts = useCallback(async () => {
    const counts = await getOfferCountsByStore();
    setOfferCounts(counts);
  }, []);

  return {
    offers,
    matches,
    loading,
    favoriteStores,
    offerCounts,
    loadOffers,
    search,
    loadFavorites,
    toggleFavorite,
    loadCounts,
  };
}
