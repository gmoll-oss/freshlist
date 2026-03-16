-- Store Supabase URL and anon key in vault for cron jobs to use
-- These are needed so pg_cron can call Edge Functions via pg_net

select vault.create_secret(
  'https://skbjtltneututtgpivew.supabase.co',
  'supabase_url',
  'Supabase project URL for cron HTTP calls'
);

select vault.create_secret(
  'sb_publishable_wk_IOhHBsqVEhWOosteLMQ_el21ByHo',
  'supabase_anon_key',
  'Supabase anon key for cron HTTP calls'
);
