-- @agentlink _admin_get_secret
-- @type function
-- @summary Retrieves an encrypted secret from Vault by name
-- @description Looks up a secret in vault.decrypted_secrets by its name and
--   returns the decrypted value. Used by other _admin functions
--   to fetch SUPABASE_URL and SB_SECRET_KEY at runtime.
-- @signature _admin_get_secret(secret_name text)
-- @returns text
-- @security SECURITY DEFINER — only service_role can execute
-- @example SELECT _admin_get_secret('SUPABASE_URL');
-- @related vault, SUPABASE_URL, SB_SECRET_KEY, SB_PUBLISHABLE_KEY
CREATE OR REPLACE FUNCTION public._admin_get_secret(secret_name text)
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

REVOKE ALL ON FUNCTION public._admin_get_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._admin_get_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public._admin_get_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._admin_get_secret(text) TO service_role;

-- @agentlink _admin_call_edge_function
-- @type function
-- @summary Invokes a Supabase Edge Function via async HTTP POST
-- @description Builds the full URL from the SUPABASE_URL secret, attaches the
--   SB_SECRET_KEY as the apikey header, and fires a non-blocking HTTP POST
--   using pg_net. Returns the pg_net request ID for optional tracking.
-- @signature _admin_call_edge_function(function_name text, payload jsonb DEFAULT '{}'::jsonb)
-- @returns bigint — pg_net request ID
-- @security SECURITY DEFINER — only service_role can execute
-- @example SELECT _admin_call_edge_function('queue-worker');
-- @related pg_net, _admin_get_secret, queue-worker
CREATE OR REPLACE FUNCTION public._admin_call_edge_function(
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
  supabase_url := public._admin_get_secret('SUPABASE_URL');
  service_key := public._admin_get_secret('SB_SECRET_KEY');

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

REVOKE ALL ON FUNCTION public._admin_call_edge_function(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._admin_call_edge_function(text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public._admin_call_edge_function(text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._admin_call_edge_function(text, jsonb) TO service_role;

-- Clean up old function names
DROP FUNCTION IF EXISTS public._internal_call_edge_function_sync(text, jsonb, integer);
DROP FUNCTION IF EXISTS public._internal_get_secret(text);
DROP FUNCTION IF EXISTS public._internal_call_edge_function(text, jsonb);
DROP FUNCTION IF EXISTS public._internal_enqueue_task(text, jsonb, integer);

-- @agentlink _admin_enqueue_task
-- @type function
-- @summary Enqueues an async task to the PGMQ agentlink_tasks queue
-- @description Sends a message to the agentlink_tasks queue containing the
--   target edge function name and payload. Supports optional delay in seconds.
--   After enqueuing, fires the queue-worker edge function via pg_net so tasks
--   are processed promptly without waiting for a cron trigger.
-- @signature _admin_enqueue_task(function_name text, payload jsonb DEFAULT '{}'::jsonb, delay_seconds integer DEFAULT 0)
-- @returns bigint — PGMQ message ID
-- @security SECURITY DEFINER — only service_role can execute
-- @example SELECT _admin_enqueue_task('send-email', '{"to":"user@example.com"}'::jsonb);
-- @related agentlink_tasks, _admin_queue_read, queue-worker, pgmq
CREATE OR REPLACE FUNCTION public._admin_enqueue_task(
  function_name text,
  payload jsonb DEFAULT '{}'::jsonb,
  delay_seconds integer DEFAULT 0
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send(
    'agentlink_tasks',
    jsonb_build_object(
      'function_name', function_name,
      'payload', payload
    ),
    delay_seconds
  ) INTO msg_id;

  -- Fire the queue worker via pg_net (fire-and-forget)
  PERFORM public._admin_call_edge_function('queue-worker');

  RETURN msg_id;
END;
$$;

REVOKE ALL ON FUNCTION public._admin_enqueue_task(text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._admin_enqueue_task(text, jsonb, integer) TO service_role;

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

-- Clean up old name
DROP FUNCTION IF EXISTS public._internal_set_updated_at();

-- Clean up legacy names from older scaffolds
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public._internal_handle_new_user();

-- @agentlink _admin_handle_new_user
-- @type function
-- @summary Creates a profile row when a new user signs up
-- @description Trigger function that fires after INSERT on auth.users. Extracts
--   display_name and avatar_url from raw_user_meta_data (supports full_name / name
--   fallbacks for OAuth providers) and inserts into public.profiles.
-- @signature _admin_handle_new_user()
-- @returns trigger
-- @security SECURITY DEFINER — required because it reads from auth.users which RLS can't access
-- @related profiles, trg_auth_users_new_user
CREATE OR REPLACE FUNCTION public._admin_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public._admin_handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._admin_handle_new_user() TO service_role;
