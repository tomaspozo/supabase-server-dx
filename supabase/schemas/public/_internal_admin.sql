-- Clean up old function names
DROP FUNCTION IF EXISTS public._admin_get_secret(text);
DROP FUNCTION IF EXISTS public._admin_call_edge_function(text, jsonb);
DROP FUNCTION IF EXISTS public._admin_handle_new_user();
DROP FUNCTION IF EXISTS public._admin_enqueue_task(text, jsonb, integer);
DROP FUNCTION IF EXISTS public._internal_call_edge_function_sync(text, jsonb, integer);
DROP FUNCTION IF EXISTS public._internal_get_secret(text);
DROP FUNCTION IF EXISTS public._internal_call_edge_function(text, jsonb);
DROP FUNCTION IF EXISTS public._internal_enqueue_task(text, jsonb, integer);

-- @agentlink _internal_admin_get_secret
-- @type function
-- @summary Retrieves an encrypted secret from Vault by name
-- @description Looks up a secret in vault.decrypted_secrets by its name and
--   returns the decrypted value. Used by other _internal_admin functions
--   to fetch SUPABASE_URL and SB_SECRET_KEY at runtime.
-- @signature _internal_admin_get_secret(secret_name text)
-- @returns text
-- @security SECURITY DEFINER — only service_role can execute
-- @example SELECT _internal_admin_get_secret('SUPABASE_URL');
-- @related vault, SUPABASE_URL, SB_SECRET_KEY, SB_PUBLISHABLE_KEY
CREATE OR REPLACE FUNCTION public._internal_admin_get_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;

  RETURN secret_value;
END;
$$;

REVOKE ALL ON FUNCTION public._internal_admin_get_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._internal_admin_get_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public._internal_admin_get_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._internal_admin_get_secret(text) TO service_role;

-- @agentlink _internal_admin_call_edge_function
-- @type function
-- @summary Invokes a Supabase Edge Function via async HTTP POST
-- @description Builds the full URL from the SUPABASE_URL secret, attaches the
--   SB_SECRET_KEY as the apikey header, and fires a non-blocking HTTP POST
--   using pg_net. Returns the pg_net request ID for optional tracking.
-- @signature _internal_admin_call_edge_function(function_name text, payload jsonb DEFAULT '{}'::jsonb)
-- @returns bigint — pg_net request ID
-- @security SECURITY DEFINER — only service_role can execute
-- @example SELECT _internal_admin_call_edge_function('queue-worker');
-- @related pg_net, _internal_admin_get_secret, queue-worker
CREATE OR REPLACE FUNCTION public._internal_admin_call_edge_function(
  function_name text,
  payload jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  supabase_url text;
  service_key text;
  request_id bigint;
  full_url text;
BEGIN
  supabase_url := public._internal_admin_get_secret('SUPABASE_URL');
  service_key := public._internal_admin_get_secret('SB_SECRET_KEY');

  IF supabase_url IS NULL THEN
    RAISE EXCEPTION 'SUPABASE_URL secret not found in Vault';
  END IF;

  IF service_key IS NULL THEN
    RAISE EXCEPTION 'SB_SECRET_KEY secret not found in Vault';
  END IF;

  full_url := supabase_url || '/functions/v1/' || function_name;

  SELECT net.http_post(
    url := full_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', service_key
    ),
    body := payload
  ) INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public._internal_admin_call_edge_function(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._internal_admin_call_edge_function(text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public._internal_admin_call_edge_function(text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._internal_admin_call_edge_function(text, jsonb) TO service_role;

-- @agentlink set_updated_at
-- @type function
-- @summary Generic trigger function that sets updated_at to now()
-- @description Reusable BEFORE UPDATE trigger function. Attach to any table with
--   an updated_at column: CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON {table}
--   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- @signature set_updated_at()
-- @returns trigger
-- @security SECURITY INVOKER — runs as the trigger caller, no privilege escalation
-- @related profiles, trg_profiles_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- @agentlink _internal_admin_handle_new_user
-- @type function
-- @summary Creates profile, default tenant, and owner membership when a new user signs up
-- @description Trigger function that fires after INSERT on auth.users. Extracts
--   display_name and avatar_url from raw_user_meta_data (supports full_name / name
--   fallbacks for OAuth providers) and inserts into public.profiles. Also creates a
--   default tenant (workspace), an owner membership linking the user, and sets
--   tenant_id + tenant_role in the user's JWT app_metadata.
-- @signature _internal_admin_handle_new_user()
-- @returns trigger
-- @security SECURITY DEFINER — required because it reads from auth.users which RLS can't access
-- @related profiles, tenants, memberships, trg_auth_users_new_user
CREATE OR REPLACE FUNCTION public._internal_admin_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name text;
  v_tenant_id uuid;
  v_slug text;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );

  -- Create default tenant
  v_slug := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '-', 'g')
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  INSERT INTO public.tenants (name, slug)
  VALUES (v_display_name || '''s Workspace', v_slug)
  RETURNING id INTO v_tenant_id;

  -- Create owner membership
  INSERT INTO public.memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, NEW.id, 'owner');

  -- Set JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', v_tenant_id,
    'tenant_role', 'owner'
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public._internal_admin_handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._internal_admin_handle_new_user() TO service_role;
