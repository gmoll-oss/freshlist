import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import type { WeeklySummary } from '../../types';

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - ((dow + 6) % 7));
  return d.toISOString().split('T')[0];
}

export function getPreviousWeekStart(): string {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return getWeekStart(now);
}

export function getCurrentWeekStart(): string {
  return getWeekStart();
}

export async function fetchWeeklySummary(weekStart: string): Promise<WeeklySummary | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    week_start: data.week_start,
    meals_cooked: data.meals_cooked,
    meals_planned: data.meals_planned,
    products_saved: data.products_saved,
    products_thrown: data.products_thrown,
    euros_saved: Number(data.euros_saved),
    favorite_meal: data.favorite_meal,
    ai_feedback: data.ai_feedback,
  };
}

export async function generateAndSaveSummary(weekStart: string): Promise<WeeklySummary> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user');

  // Gather meal plan data for the week
  const { data: meals } = await supabase
    .from('meal_plans')
    .select('meal_name, cooked')
    .eq('user_id', userId)
    .eq('week_start', weekStart);

  const mealsPlanned = meals?.length ?? 0;
  const mealsCooked = meals?.filter((m: any) => m.cooked).length ?? 0;

  // Find the most cooked meal name
  const cookedMeals = meals?.filter((m: any) => m.cooked) ?? [];
  const favoriteMeal = cookedMeals.length > 0 ? cookedMeals[0].meal_name : null;

  // Get user stats for products/euros
  const { data: statsRow } = await supabase
    .from('user_stats')
    .select('total_products_saved, total_products_thrown, total_saved_euros')
    .eq('user_id', userId)
    .maybeSingle();

  const summary: WeeklySummary = {
    week_start: weekStart,
    meals_cooked: mealsCooked,
    meals_planned: mealsPlanned,
    products_saved: statsRow?.total_products_saved ?? 0,
    products_thrown: statsRow?.total_products_thrown ?? 0,
    euros_saved: Number(statsRow?.total_saved_euros ?? 0),
    favorite_meal: favoriteMeal,
    ai_feedback: null,
  };

  // Upsert
  const { data, error } = await supabase
    .from('weekly_summaries')
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        meals_cooked: summary.meals_cooked,
        meals_planned: summary.meals_planned,
        products_saved: summary.products_saved,
        products_thrown: summary.products_thrown,
        euros_saved: summary.euros_saved,
        favorite_meal: summary.favorite_meal,
        ai_feedback: summary.ai_feedback,
      },
      { onConflict: 'user_id,week_start' },
    )
    .select()
    .single();

  if (error) throw error;
  return { ...summary, id: data.id };
}

export async function updateAiFeedback(weekStart: string, feedback: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('weekly_summaries')
    .update({ ai_feedback: feedback })
    .eq('user_id', userId)
    .eq('week_start', weekStart);

  if (error) throw error;
}
