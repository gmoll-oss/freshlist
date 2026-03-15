import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';
import { getMyFamilyId } from './family';
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
  const familyId = await getMyFamilyId();

  let query = supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (familyId) {
    // In a family: fetch items that belong to this family
    query = query.eq('family_id', familyId);
  }
  // Without family: RLS already filters to user's own items

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToItem);
}

export async function addShoppingItem(
  item: Pick<ShoppingItem, 'name' | 'category' | 'quantity' | 'unit' | 'source' | 'store' | 'meal_plan_id'>,
): Promise<ShoppingItem> {
  const userId = await getCurrentUserId();
  const familyId = await getMyFamilyId();

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
      family_id: familyId,
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
  const familyId = await getMyFamilyId();

  let query = supabase
    .from('shopping_items')
    .delete()
    .eq('purchased', true);

  if (familyId) {
    query = query.eq('family_id', familyId);
  } else {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
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
  const familyId = await getMyFamilyId();

  const rows = shoppingNeeded.map((item) => ({
    user_id: userId,
    name: item.name,
    category: 'Otro',
    quantity: 1,
    unit: 'unidad',
    source: 'ai_suggestion' as const,
    purchased: false,
    meal_plan_id: mealPlanId ?? null,
    family_id: familyId,
  }));

  if (rows.length === 0) return;
  const { error } = await supabase.from('shopping_items').insert(rows);
  if (error) throw error;
}
