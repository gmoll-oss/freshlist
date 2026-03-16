import { supabase } from '../../lib/supabase';
import { getMyFamilyId } from './family';
import type { PantryItem } from '../../types';

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchPantryItems(): Promise<PantryItem[]> {
  const familyId = await getMyFamilyId();

  let query = supabase
    .from('pantry_items')
    .select('*')
    .order('estimated_expiry', { ascending: true });

  if (familyId) {
    query = query.eq('family_id', familyId);
  }

  const { data, error } = await query;
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

/**
 * Consume a single pantry item, optionally by a specific quantity.
 * - If quantityUsed is provided, subtract from current quantity.
 *   If quantity reaches 0 or below, mark as 'used'.
 *   Otherwise keep the current status.
 * - If no quantityUsed provided, mark the entire item as 'used'.
 */
export async function consumePantryItem(
  id: string,
  quantityUsed?: number,
): Promise<void> {
  if (quantityUsed === undefined) {
    // Mark entire item as used
    await updatePantryItem(id, { status: 'used' });
    return;
  }

  // Fetch current item to get its quantity
  const { data, error: fetchError } = await supabase
    .from('pantry_items')
    .select('quantity, status')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const newQuantity = (data.quantity ?? 0) - quantityUsed;

  if (newQuantity <= 0) {
    await updatePantryItem(id, { quantity: 0, status: 'used' });
  } else {
    await updatePantryItem(id, { quantity: newQuantity });
  }
}

/** Mark pantry items as 'used' that match recipe ingredients (fuzzy name match).
 *  Subtracts 1 from quantity; only marks as 'used' when quantity reaches 0.
 */
export async function autoConsumePantryItems(
  ingredientNames: string[],
): Promise<number> {
  const items = await fetchPantryItems();
  const activeItems = items.filter((i) => i.status === 'fresh' || i.status === 'expiring');

  const matchedItems: PantryItem[] = [];
  const matchedIds: string[] = [];
  for (const ingredientName of ingredientNames) {
    const lower = ingredientName.toLowerCase();
    const match = activeItems.find(
      (item) =>
        !matchedIds.includes(item.id) &&
        (item.name.toLowerCase().includes(lower) || lower.includes(item.name.toLowerCase())),
    );
    if (match) {
      matchedIds.push(match.id);
      matchedItems.push(match);
    }
  }

  if (matchedItems.length === 0) return 0;

  for (const item of matchedItems) {
    const newQuantity = (item.quantity ?? 0) - 1;
    if (newQuantity <= 0) {
      await updatePantryItem(item.id, { quantity: 0, status: 'used' });
    } else {
      await updatePantryItem(item.id, { quantity: newQuantity });
    }
  }

  return matchedItems.length;
}

export async function insertPantryItems(items: PantryItem[]): Promise<void> {
  const userId = await getCurrentUserId();
  const familyId = await getMyFamilyId();

  const rows = items.map((item) => ({
    user_id: userId,
    family_id: familyId,
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
