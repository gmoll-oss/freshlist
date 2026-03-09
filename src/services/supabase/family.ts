import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';

export interface FamilyMember {
  id: string;
  email: string;
  display_name: string | null;
  role: 'owner' | 'member';
  joined_at: string;
}

export async function getFamilyGroup(): Promise<FamilyMember[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('family_groups')
    .select('*')
    .or(`owner_id.eq.${userId},member_id.eq.${userId}`);

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    email: row.member_email,
    display_name: row.display_name,
    role: row.owner_id === userId ? 'owner' : 'member',
    joined_at: row.created_at,
  }));
}

export async function inviteFamilyMember(email: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No autenticado');

  const { error } = await supabase.from('family_invitations').insert({
    from_user_id: userId,
    to_email: email.trim().toLowerCase(),
    status: 'pending',
  });

  if (error) throw error;
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('family_groups')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

export async function getPendingInvitations(): Promise<{ id: string; to_email: string; status: string }[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('family_invitations')
    .select('*')
    .eq('from_user_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return data ?? [];
}
