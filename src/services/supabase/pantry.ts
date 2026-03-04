import { supabase } from '../../lib/supabase';
import type { PantryItem } from '../../types';

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchPantryItems(): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .order('estimated_expiry', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    purchase_date: row.purchase_date,
    estimated_expiry: row.estimated_expiry,
    status: row.status,
    confidence: row.confidence,
  }));
}

export async function deletePantryItem(id: string): Promise<void> {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<void> {
  const { error } = await supabase.from('pantry_items').update(updates).eq('id', id);
  if (error) throw error;
}

/** Mark pantry items as 'used' that match recipe ingredients (fuzzy name match) */
export async function autoConsumePantryItems(
  ingredientNames: string[],
): Promise<number> {
  const items = await fetchPantryItems();
  const activeItems = items.filter((i) => i.status === 'fresh' || i.status === 'expiring');

  const matchedIds: string[] = [];
  for (const ingredientName of ingredientNames) {
    const lower = ingredientName.toLowerCase();
    const match = activeItems.find(
      (item) =>
        !matchedIds.includes(item.id) &&
        (item.name.toLowerCase().includes(lower) || lower.includes(item.name.toLowerCase())),
    );
    if (match) matchedIds.push(match.id);
  }

  if (matchedIds.length === 0) return 0;

  const { error } = await supabase
    .from('pantry_items')
    .update({ status: 'used' })
    .in('id', matchedIds);

  if (error) throw error;
  return matchedIds.length;
}

export async function insertPantryItems(items: PantryItem[]): Promise<void> {
  const userId = await getCurrentUserId();

  const rows = items.map((item) => ({
    user_id: userId,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    purchase_date: item.purchase_date,
    estimated_expiry: item.estimated_expiry,
    status: item.status,
    confidence: item.confidence,
  }));

  const { error } = await supabase.from('pantry_items').insert(rows);
  if (error) throw error;
}
