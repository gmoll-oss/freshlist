-- Update cron: offers change weekly, not daily
-- Most Spanish supermarkets update flyers on Monday
-- Run sync on Monday and Thursday at 6:00 UTC to catch mid-week updates too

select cron.unschedule('sync-supermarket-offers');

select cron.schedule(
  'sync-supermarket-offers',
  '0 6 * * 1,4',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/sync-offers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_anon_key')
    ),
    body := '{}',
    timeout_milliseconds := 600000
  );
  $$
);
