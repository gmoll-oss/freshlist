import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import type { MealPlan } from '../../types';

function rowToMealPlan(row: any): MealPlan {
  return {
    id: row.id,
    week_start: row.week_start,
    day: row.day,
    meal_type: row.meal_type ?? 'dinner',
    meal_name: row.meal_name,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    prep_time_minutes: row.prep_time_minutes,
    servings: row.servings,
    batch_note: row.batch_note,
    reuses_from: row.reuses_from ?? null,
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
    meal_type: p.meal_type ?? 'dinner',
    meal_name: p.meal_name,
    ingredients: p.ingredients,
    steps: p.steps,
    prep_time_minutes: p.prep_time_minutes,
    servings: p.servings,
    batch_note: p.batch_note,
    reuses_from: p.reuses_from ?? null,
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

export async function updateMealPlan(id: string, updates: Partial<MealPlan>): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function shiftPlanByDays(weekStart: string, days: number): Promise<void> {
  const userId = await getCurrentUserId();
  const ALL_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .eq('cooked', false);

  if (error) throw error;
  if (!data || data.length === 0) return;

  for (const row of data) {
    const currentIdx = ALL_DAYS.indexOf(row.day);
    if (currentIdx === -1) continue;
    const newIdx = Math.min(currentIdx + days, ALL_DAYS.length - 1);
    if (newIdx !== currentIdx) {
      await supabase
        .from('meal_plans')
        .update({ day: ALL_DAYS[newIdx] })
        .eq('id', row.id);
    }
  }
}

export async function changeServings(mealId: string, newServings: number): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .update({ servings: newServings })
    .eq('id', mealId);
  if (error) throw error;
}

export async function cancelMeal(mealId: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', mealId);
  if (error) throw error;
}

export async function swapDays(mealId1: string, mealId2: string): Promise<void> {
  const { data: m1 } = await supabase.from('meal_plans').select('day').eq('id', mealId1).single();
  const { data: m2 } = await supabase.from('meal_plans').select('day').eq('id', mealId2).single();
  if (!m1 || !m2) return;

  await supabase.from('meal_plans').update({ day: m2.day }).eq('id', mealId1);
  await supabase.from('meal_plans').update({ day: m1.day }).eq('id', mealId2);
}

export async function getTodaysMeal(): Promise<MealPlan | null> {
  const meals = await getTodaysMeals();
  // Return the first uncooked meal, or the first one
  return meals.find((m) => !m.cooked) ?? meals[0] ?? null;
}

export async function getTodaysMeals(): Promise<MealPlan[]> {
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const today = new Date();
  const dayName = DAYS[today.getDay()];

  const monday = new Date(today);
  const dow = today.getDay();
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const weekStart = monday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start', weekStart)
    .eq('day', dayName)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToMealPlan);
}
