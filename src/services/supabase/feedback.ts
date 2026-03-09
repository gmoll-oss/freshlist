import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';

function getCurrentWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export async function saveFeedback(rating: 'buena' | 'mejorable'): Promise<void> {
  const userId = await getCurrentUserId();
  const weekStart = getCurrentWeekStart();

  const { error } = await supabase.from('user_feedback').insert({
    user_id: userId,
    week_start: weekStart,
    rating,
  });
  if (error) throw error;
}
