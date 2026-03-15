import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from './pantry';

export interface FamilyGroup {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  display_name: string | null;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface MyFamily {
  group: FamilyGroup;
  members: FamilyMember[];
}

/** Generate a random 6-character uppercase alphanumeric code */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Create a new family group. The current user becomes the owner. */
export async function createFamily(name: string): Promise<MyFamily> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No autenticado');

  const invite_code = generateInviteCode();

  // Insert the group
  const { data: group, error: groupErr } = await supabase
    .from('family_groups')
    .insert({ name: name.trim(), invite_code, owner_id: userId })
    .select()
    .single();

  if (groupErr) throw groupErr;

  // Add the creator as owner member
  const { error: memberErr } = await supabase
    .from('family_members')
    .insert({
      family_id: group.id,
      user_id: userId,
      display_name: name.trim(),
      role: 'owner',
    });

  if (memberErr) throw memberErr;

  return {
    group: group as FamilyGroup,
    members: [
      {
        id: userId,
        user_id: userId,
        display_name: name.trim(),
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
    ],
  };
}

/** Join an existing family group by invite code. */
export async function joinFamily(code: string): Promise<MyFamily> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No autenticado');

  // Check if already in a family
  const existing = await getMyFamily();
  if (existing) throw new Error('Ya perteneces a un hogar. Sal primero antes de unirte a otro.');

  // Look up the group by invite code
  const { data: group, error: lookupErr } = await supabase
    .from('family_groups')
    .select('*')
    .eq('invite_code', code.trim().toUpperCase())
    .single();

  if (lookupErr || !group) throw new Error('Codigo de invitacion no valido');

  // Join
  const { error: joinErr } = await supabase
    .from('family_members')
    .insert({
      family_id: group.id,
      user_id: userId,
      role: 'member',
    });

  if (joinErr) {
    if (joinErr.code === '23505') throw new Error('Ya eres miembro de este hogar');
    throw joinErr;
  }

  // Return full family info
  const family = await getMyFamily();
  if (!family) throw new Error('Error al unirse al hogar');
  return family;
}

/** Get the current user's family (group + members), or null if not in one. */
export async function getMyFamily(): Promise<MyFamily | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Find the user's membership
  const { data: membership, error: memErr } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (memErr) throw memErr;
  if (!membership) return null;

  // Get the group
  const { data: group, error: groupErr } = await supabase
    .from('family_groups')
    .select('*')
    .eq('id', membership.family_id)
    .single();

  if (groupErr) throw groupErr;

  // Get all members
  const { data: members, error: membersErr } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('joined_at', { ascending: true });

  if (membersErr) throw membersErr;

  return {
    group: group as FamilyGroup,
    members: (members ?? []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      display_name: m.display_name,
      role: m.role as 'owner' | 'member',
      joined_at: m.joined_at,
    })),
  };
}

/** Leave the current family group. If owner, the group is deleted. */
export async function leaveFamily(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No autenticado');

  const family = await getMyFamily();
  if (!family) throw new Error('No perteneces a ningun hogar');

  if (family.group.owner_id === userId) {
    // Owner leaves → delete the entire group (cascade deletes members)
    const { error } = await supabase
      .from('family_groups')
      .delete()
      .eq('id', family.group.id);
    if (error) throw error;
  } else {
    // Member leaves
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', family.group.id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}

/** Get the invite code for the current user's family. */
export async function getFamilyInviteCode(): Promise<string | null> {
  const family = await getMyFamily();
  return family?.group.invite_code ?? null;
}

/** Get the family_id for the current user (used by shopping service). */
export async function getMyFamilyId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  return data?.family_id ?? null;
}
