import { useState, useCallback } from 'react';
import {
  fetchShoppingItems,
  addShoppingItem,
  togglePurchased as togglePurchasedApi,
  clearPurchased as clearPurchasedApi,
  deleteShoppingItem,
} from '../services/supabase/shopping';
import { fetchPantryItems } from '../services/supabase/pantry';
import type { ShoppingItem } from '../types';

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [pantryNames, setPantryNames] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, pantryItems] = await Promise.all([
        fetchShoppingItems(),
        fetchPantryItems().catch(() => []),
      ]);
      setItems(data);
      const activeNames = new Set(
        pantryItems
          .filter((p) => p.status === 'fresh' || p.status === 'expiring')
          .map((p) => p.name.toLowerCase()),
      );
      setPantryNames(activeNames);
    } catch (e: any) {
      setError(e.message ?? 'Error cargando lista');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (name: string) => {
    try {
      const newItem = await addShoppingItem({
        name,
        category: 'Otro',
        quantity: 1,
        unit: 'unidad',
        source: 'manual',
      });
      setItems((prev) => [...prev, newItem]);
    } catch (e: any) {
      setError(e.message ?? 'Error añadiendo item');
    }
  }, []);

  const togglePurchased = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newVal = !item.purchased;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, purchased: newVal } : i));
    try {
      await togglePurchasedApi(id, newVal);
    } catch (e: any) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, purchased: !newVal } : i));
      setError(e.message ?? 'Error actualizando item');
    }
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteShoppingItem(id);
    } catch (e: any) {
      setError(e.message ?? 'Error eliminando item');
    }
  }, []);

  const clearPurchased = useCallback(async () => {
    const purchased = items.filter((i) => i.purchased);
    setItems((prev) => prev.filter((i) => !i.purchased));
    try {
      await clearPurchasedApi();
    } catch (e: any) {
      setItems((prev) => [...prev, ...purchased]);
      setError(e.message ?? 'Error limpiando comprados');
    }
  }, [items]);

  const filtered = filterStore
    ? items.filter((i) => i.store?.toLowerCase() === filterStore.toLowerCase())
    : items;

  const isInPantry = useCallback(
    (name: string) => {
      const lower = name.toLowerCase();
      for (const pn of pantryNames) {
        if (pn.includes(lower) || lower.includes(pn)) return true;
      }
      return false;
    },
    [pantryNames],
  );

  return {
    items: filtered,
    allItems: items,
    isInPantry,
    loading,
    error,
    filterStore,
    setFilterStore,
    load,
    addItem,
    togglePurchased,
    removeItem,
    clearPurchased,
  };
}
