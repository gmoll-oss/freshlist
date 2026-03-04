import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import type { UserStats } from '../../types';

const DEFAULT_STATS: UserStats = {
  current_streak: 0,
  longest_streak: 0,
  total_saved_euros: 0,
  total_products_saved: 0,
  total_products_thrown: 0,
  total_recipes_cooked: 0,
};

export async function fetchUserStats(): Promise<UserStats> {
  const userId = await getCurrentUserId();
  if (!userId) return DEFAULT_STATS;

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_STATS;

  return {
    current_streak: data.current_streak,
    longest_streak: data.longest_streak,
    total_saved_euros: Number(data.total_saved_euros),
    total_products_saved: data.total_products_saved,
    total_products_thrown: data.total_products_thrown,
    total_recipes_cooked: data.total_recipes_cooked,
  };
}

async function ensureStatsRow(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data } = await supabase
    .from('user_stats')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    await supabase.from('user_stats').insert({ user_id: userId });
  }
}

export async function incrementCooked(): Promise<void> {
  await ensureStatsRow();
  const userId = await getCurrentUserId();
  if (!userId) return;

  const stats = await fetchUserStats();
  const newStreak = stats.current_streak + 1;

  await supabase
    .from('user_stats')
    .update({
      total_recipes_cooked: stats.total_recipes_cooked + 1,
      current_streak: newStreak,
      longest_streak: Math.max(stats.longest_streak, newStreak),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export async function incrementUsed(estimatedEuros: number = 2): Promise<void> {
  await ensureStatsRow();
  const userId = await getCurrentUserId();
  if (!userId) return;

  const stats = await fetchUserStats();

  await supabase
    .from('user_stats')
    .update({
      total_products_saved: stats.total_products_saved + 1,
      total_saved_euros: stats.total_saved_euros + estimatedEuros,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export async function incrementThrown(): Promise<void> {
  await ensureStatsRow();
  const userId = await getCurrentUserId();
  if (!userId) return;

  const stats = await fetchUserStats();

  await supabase
    .from('user_stats')
    .update({
      total_products_thrown: stats.total_products_thrown + 1,
      current_streak: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}
