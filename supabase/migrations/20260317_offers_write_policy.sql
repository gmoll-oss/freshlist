-- Allow the Edge Function (service role) to write offers
-- The service role bypasses RLS, but adding explicit policies as fallback

create policy "Service can insert offers"
  on public.supermarket_offers for insert
  with check (true);

create policy "Service can update offers"
  on public.supermarket_offers for update
  using (true)
  with check (true);

create policy "Service can delete offers"
  on public.supermarket_offers for delete
  using (true);

create policy "Service can insert sync log"
  on public.offer_sync_log for insert
  with check (true);
