import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import { getMyFamilyId } from './family';
import type { MealPlan } from '../../types';

export interface RecipeFavorite {
  id: string;
  meal_name: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  prep_time_minutes: number;
  servings: number;
  meal_type: string;
  times_cooked: number;
  last_cooked: string;
}

function rowToFavorite(row: any): RecipeFavorite {
  return {
    id: row.id,
    meal_name: row.meal_name,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    prep_time_minutes: row.prep_time_minutes,
    servings: row.servings,
    meal_type: row.meal_type ?? 'dinner',
    times_cooked: row.times_cooked,
    last_cooked: row.last_cooked,
  };
}

export async function fetchFavorites(): Promise<RecipeFavorite[]> {
  const familyId = await getMyFamilyId();

  let query = supabase
    .from('recipe_favorites')
    .select('*')
    .order('times_cooked', { ascending: false });

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToFavorite);
}

export async function isFavorite(mealName: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const familyId = await getMyFamilyId();

  let query = supabase
    .from('recipe_favorites')
    .select('id')
    .eq('meal_name', mealName);

  if (familyId) {
    query = query.eq('family_id', familyId);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.maybeSingle();
  return !!data;
}

export async function toggleFavorite(meal: MealPlan): Promise<boolean> {
  const userId = await getCurrentUserId();
  const familyId = await getMyFamilyId();

  let existQuery = supabase
    .from('recipe_favorites')
    .select('id')
    .eq('meal_name', meal.meal_name);

  if (familyId) {
    existQuery = existQuery.eq('family_id', familyId);
  } else {
    existQuery = existQuery.eq('user_id', userId);
  }

  const { data: existing } = await existQuery.maybeSingle();

  if (existing) {
    await supabase.from('recipe_favorites').delete().eq('id', existing.id);
    return false;
  }

  await supabase.from('recipe_favorites').insert({
    user_id: userId,
    family_id: familyId,
    meal_name: meal.meal_name,
    ingredients: meal.ingredients,
    steps: meal.steps,
    prep_time_minutes: meal.prep_time_minutes,
    servings: meal.servings,
    meal_type: meal.meal_type ?? 'dinner',
    times_cooked: 1,
    last_cooked: new Date().toISOString().split('T')[0],
  });
  return true;
}

export async function incrementTimesCooked(mealName: string): Promise<void> {
  const userId = await getCurrentUserId();
  const familyId = await getMyFamilyId();

  let cookQuery = supabase
    .from('recipe_favorites')
    .select('id, times_cooked')
    .eq('meal_name', mealName);

  if (familyId) {
    cookQuery = cookQuery.eq('family_id', familyId);
  } else {
    cookQuery = cookQuery.eq('user_id', userId);
  }

  const { data } = await cookQuery.maybeSingle();

  if (data) {
    await supabase
      .from('recipe_favorites')
      .update({
        times_cooked: data.times_cooked + 1,
        last_cooked: new Date().toISOString().split('T')[0],
      })
      .eq('id', data.id);
  }
}

export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('recipe_favorites').delete().eq('id', id);
  if (error) throw error;
}
