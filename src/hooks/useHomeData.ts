import { useState, useCallback } from 'react';
import { fetchUserStats } from '../services/supabase/stats';
import { getTodaysMeals } from '../services/supabase/mealPlans';
import { fetchPantryItems } from '../services/supabase/pantry';
import { cacheSet, cacheGet } from '../services/offline/cache';
import type { UserStats, MealPlan, PantryItem } from '../types';

export interface HomeData {
  stats: UserStats;
  todayMeals: MealPlan[];
  expiringItems: PantryItem[];
  pantryCount: number;
  expiringSoonCount: number;
}

const DEFAULT_STATS: UserStats = {
  current_streak: 0,
  longest_streak: 0,
  total_saved_euros: 0,
  total_products_saved: 0,
  total_products_thrown: 0,
  total_recipes_cooked: 0,
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function useHomeData() {
  const [data, setData] = useState<HomeData>({
    stats: DEFAULT_STATS,
    todayMeals: [],
    expiringItems: [],
    pantryCount: 0,
    expiringSoonCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, todayMeals, pantryItems] = await Promise.all([
        fetchUserStats().catch(() => DEFAULT_STATS),
        getTodaysMeals().catch(() => []),
        fetchPantryItems().catch(() => []),
      ]);

      const expiringItems = pantryItems
        .filter((i) => {
          if (i.status === 'used' || i.status === 'thrown') return false;
          const days = daysUntil(i.estimated_expiry);
          return days >= 0 && days <= 1;
        })
        .slice(0, 4);

      const activeItems = pantryItems.filter((i) => i.status === 'fresh' || i.status === 'expiring');
      const expiringSoonCount = pantryItems.filter((i) => {
        if (i.status === 'used' || i.status === 'thrown') return false;
        const days = daysUntil(i.estimated_expiry);
        return days >= 0 && days <= 3;
      }).length;

      const homeData = { stats, todayMeals, expiringItems, pantryCount: activeItems.length, expiringSoonCount };
      setData(homeData);
      // Cache for offline
      cacheSet('homeData', homeData).catch(() => {});
    } catch {
      // Try loading from cache if network fails
      const cached = await cacheGet<HomeData>('homeData');
      if (cached) setData(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  return { ...data, loading, load };
}
