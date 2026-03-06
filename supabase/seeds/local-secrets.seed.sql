-- AgentLink: Vault secrets for local development
-- This file is managed by AgentLink CLI. Do not edit manually.

select vault.create_secret('http://host.docker.internal:54321', 'SUPABASE_URL');
select vault.create_secret('sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH', 'SB_PUBLISHABLE_KEY');
select vault.create_secret('sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz', 'SB_SECRET_KEY');
select vault.create_secret('', 'ALLOWED_SIGNUP_DOMAINS');
