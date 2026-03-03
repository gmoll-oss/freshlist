import { supabase } from '../../lib/supabase';
import type { PantryItem } from '../../types';

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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
