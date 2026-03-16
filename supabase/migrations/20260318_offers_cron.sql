-- Enable required extensions for cron + HTTP calls
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Cron job: sync offers every 12 hours (at 6:00 and 18:00 UTC)
-- Calls the sync-offers Edge Function which scrapes all supermarkets
select cron.schedule(
  'sync-supermarket-offers',
  '0 6,18 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/sync-offers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_anon_key')
    ),
    body := '{}',
    timeout_milliseconds := 300000
  );
  $$
);

-- Also add a weekly cleanup job: remove offers older than 30 days
select cron.schedule(
  'cleanup-old-offers',
  '0 3 * * 0',
  $$
  delete from public.supermarket_offers
  where valid_until < current_date - interval '30 days';

  delete from public.offer_sync_log
  where synced_at < now() - interval '30 days';
  $$
);
