import { useState, useCallback } from 'react';
import { fetchMealPlans, insertMealPlans, markMealCooked, deleteWeekMealPlans, getPreviousWeekDays } from '../services/supabase/mealPlans';
import { addFromMealPlan } from '../services/supabase/shopping';
import { generateMealPlan } from '../services/ai/mealPlanner';
import { fetchPantryItems, autoConsumePantryItems } from '../services/supabase/pantry';
import { incrementCooked, incrementUsed } from '../services/supabase/stats';
import type { MealPlan } from '../types';

function getCurrentWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export function useMealPlan() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousDays, setPreviousDays] = useState<string[]>([]);
  const [pantryCount, setPantryCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  const weekStart = getCurrentWeekStart();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, prevDays, pantryItems] = await Promise.all([
        fetchMealPlans(weekStart),
        getPreviousWeekDays(weekStart),
        fetchPantryItems().catch(() => []),
      ]);
      setPlans(data);
      setPreviousDays(prevDays);

      const active = pantryItems.filter((i) => i.status === 'fresh' || i.status === 'expiring');
      setPantryCount(active.length);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiring = active.filter((i) => {
        const exp = new Date(i.estimated_expiry);
        exp.setHours(0, 0, 0, 0);
        const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
      }).length;
      setExpiringSoonCount(expiring);
    } catch (e: any) {
      setError(e.message ?? 'Error cargando plan');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  const generate = useCallback(async (selectedDays: string[]) => {
    setGenerating(true);
    setError(null);
    try {
      console.log('[MealPlan] Fetching pantry items...');
      const pantryItems = await fetchPantryItems();
      console.log('[MealPlan] Got', pantryItems.length, 'items');

      if (pantryItems.filter(i => i.status === 'fresh' || i.status === 'expiring').length === 0) {
        setError('No tienes productos frescos en la despensa');
        setGenerating(false);
        return;
      }

      console.log('[MealPlan] Deleting old plans for', weekStart);
      await deleteWeekMealPlans(weekStart).catch(() => {});

      console.log('[MealPlan] Calling Claude for days:', selectedDays);
      const aiResponse = await generateMealPlan(pantryItems, selectedDays);
      console.log('[MealPlan] Claude returned', aiResponse.meals?.length, 'meals');

      const mealsToInsert = aiResponse.meals.map((m) => ({
        week_start: weekStart,
        day: m.day,
        meal_type: m.meal_type ?? 'dinner',
        meal_name: m.meal_name,
        ingredients: m.ingredients,
        steps: m.steps,
        prep_time_minutes: m.prep_time_minutes,
        servings: m.servings,
        batch_note: m.batch_note,
        reuses_from: m.reuses_from ?? null,
        cooked: false,
      }));

      console.log('[MealPlan] Saving to Supabase...');
      const savedPlans = await insertMealPlans(mealsToInsert);
      console.log('[MealPlan] Saved', savedPlans.length, 'plans');
      setPlans(savedPlans);

      if (aiResponse.shopping_needed?.length > 0) {
        await addFromMealPlan(aiResponse.shopping_needed).catch(() => {});
      }
    } catch (e: any) {
      console.error('[MealPlan] Error:', e);
      setError(e.message ?? 'Error generando plan');
    } finally {
      setGenerating(false);
    }
  }, [weekStart]);

  const markCooked = useCallback(async (id: string) => {
    try {
      await markMealCooked(id);
      await incrementCooked();
      // Auto-consume pantry items
      const meal = plans.find((p) => p.id === id);
      if (meal) {
        const ingredientNames = meal.ingredients.map((i) => i.name);
        const consumed = await autoConsumePantryItems(ingredientNames);
        for (let i = 0; i < consumed; i++) {
          await incrementUsed().catch(() => {});
        }
      }
      setPlans((prev) => prev.map((p) => p.id === id ? { ...p, cooked: true } : p));
    } catch (e: any) {
      setError(e.message ?? 'Error marcando receta');
    }
  }, [plans]);

  return { plans, loading, generating, error, load, generate, markCooked, weekStart, previousDays, pantryCount, expiringSoonCount };
}
