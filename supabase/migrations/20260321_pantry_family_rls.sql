-- Fix: pantry_items RLS only checked user_id, blocking family members
-- Apply the same pattern as shopping_items: allow family access

drop policy if exists "Users can manage their own pantry items" on public.pantry_items;

create policy "Users can view own or family pantry items"
  on public.pantry_items for select
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy "Users can insert pantry items"
  on public.pantry_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own or family pantry items"
  on public.pantry_items for update
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy "Users can delete own or family pantry items"
  on public.pantry_items for delete
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );
