import { useState, useCallback } from 'react';
import { fetchPreferences, savePreferences as savePrefsSvc } from '../services/supabase/preferences';
import type { UserPreferences } from '../types';

const DEFAULTS: UserPreferences = {
  display_name: null,
  people_count: 2,
  meals_config: { breakfast: false, lunch: false, dinner: true },
  weekly_meals: 7,
  diet_type: ['omnivoro'],
  intolerances: [],
  cooking_time: 'normal',
  health_goal: null,
  budget_weekly: null,
  onboarding_done: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prefs = await fetchPreferences();
      if (prefs) setPreferences(prefs);
    } catch (e) {
      console.error('Failed to load preferences:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (partial: Partial<UserPreferences>) => {
    try {
      await savePrefsSvc(partial);
      setPreferences((prev) => ({ ...prev, ...partial }));
    } catch (e) {
      console.error('Failed to save preferences:', e);
      throw e;
    }
  }, []);

  return { preferences, loading, load, save };
}
