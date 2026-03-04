import { supabase } from '../../lib/supabase';
import type { UserPreferences } from '../../types';

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export async function fetchPreferences(): Promise<UserPreferences | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;

  return {
    display_name: data.display_name,
    people_count: data.people_count,
    meals_config: data.meals_config,
    weekly_meals: data.weekly_meals,
    diet_type: data.diet_type,
    intolerances: data.intolerances,
    cooking_time: data.cooking_time ?? 'normal',
    health_goal: data.health_goal ?? null,
    budget_weekly: data.budget_weekly,
    onboarding_done: data.onboarding_done,
  };
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function markOnboardingDone(): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, onboarding_done: true, updated_at: new Date().toISOString() });

  if (error) throw error;
}
