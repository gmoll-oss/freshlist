import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import type { ShoppingItem } from '../../types';

function rowToItem(row: any): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit ?? 'unidad',
    source: row.source,
    purchased: row.purchased,
    store: row.store ?? undefined,
    meal_plan_id: row.meal_plan_id ?? undefined,
  };
}

export async function fetchShoppingItems(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToItem);
}

export async function addShoppingItem(
  item: Pick<ShoppingItem, 'name' | 'category' | 'quantity' | 'unit' | 'source' | 'store' | 'meal_plan_id'>,
): Promise<ShoppingItem> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('shopping_items')
    .insert({
      user_id: userId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit ?? 'unidad',
      source: item.source,
      store: item.store ?? null,
      meal_plan_id: item.meal_plan_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToItem(data);
}

export async function togglePurchased(id: string, purchased: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ purchased })
    .eq('id', id);
  if (error) throw error;
}

export async function clearPurchased(): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('user_id', userId)
    .eq('purchased', true);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}

export async function addFromMealPlan(
  shoppingNeeded: { name: string; reason: string }[],
  mealPlanId?: string,
): Promise<void> {
  const userId = await getCurrentUserId();

  const rows = shoppingNeeded.map((item) => ({
    user_id: userId,
    name: item.name,
    category: 'Otro',
    quantity: 1,
    unit: 'unidad',
    source: 'ai_suggestion' as const,
    purchased: false,
    meal_plan_id: mealPlanId ?? null,
  }));

  if (rows.length === 0) return;
  const { error } = await supabase.from('shopping_items').insert(rows);
  if (error) throw error;
}
