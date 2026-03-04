import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import type { MealPlan } from '../../types';

function rowToMealPlan(row: any): MealPlan {
  return {
    id: row.id,
    week_start: row.week_start,
    day: row.day,
    meal_name: row.meal_name,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    prep_time_minutes: row.prep_time_minutes,
    servings: row.servings,
    batch_note: row.batch_note,
    cooked: row.cooked,
  };
}

export async function fetchMealPlans(weekStart: string): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start', weekStart)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToMealPlan);
}

export async function insertMealPlans(plans: Omit<MealPlan, 'id'>[]): Promise<MealPlan[]> {
  const userId = await getCurrentUserId();

  const rows = plans.map((p) => ({
    user_id: userId,
    week_start: p.week_start,
    day: p.day,
    meal_name: p.meal_name,
    ingredients: p.ingredients,
    steps: p.steps,
    prep_time_minutes: p.prep_time_minutes,
    servings: p.servings,
    batch_note: p.batch_note,
    cooked: false,
  }));

  const { data, error } = await supabase.from('meal_plans').insert(rows).select();
  if (error) throw error;
  return (data ?? []).map(rowToMealPlan);
}

export async function markMealCooked(id: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .update({ cooked: true })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWeekMealPlans(weekStart: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', userId)
    .eq('week_start', weekStart);
  if (error) throw error;
}

export async function getPreviousWeekDays(currentWeekStart: string): Promise<string[]> {
  const prev = new Date(currentWeekStart);
  prev.setDate(prev.getDate() - 7);
  const prevWeekStart = prev.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_plans')
    .select('day')
    .eq('week_start', prevWeekStart);

  if (error || !data) return [];
  // Unique days
  return [...new Set(data.map((r: any) => r.day as string))];
}

export async function getTodaysMeal(): Promise<MealPlan | null> {
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = new Date();
  const dayName = DAYS[today.getDay()];

  // Get the current week's Monday
  const monday = new Date(today);
  const dow = today.getDay();
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const weekStart = monday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start', weekStart)
    .eq('day', dayName)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToMealPlan(data) : null;
}
