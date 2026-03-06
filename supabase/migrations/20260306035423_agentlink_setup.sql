SET ROLE "postgres";
SET check_function_bodies = false;
CREATE FUNCTION api.profile_get()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT INTO v_result jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'created_at', p.created_at
  )
  FROM public.profiles p
  WHERE p.id = (SELECT auth.uid());

  RETURN v_result;
END;
$function$;
CREATE FUNCTION api.profile_update(p_display_name text DEFAULT NULL::text, p_avatar_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.profiles SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = (SELECT auth.uid());

  SELECT INTO v_result api.profile_get();
  RETURN v_result;
END;
$function$;
CREATE FUNCTION public._admin_call_edge_function(function_name text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
REVOKE ALL ON FUNCTION public._admin_call_edge_function(text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public._admin_call_edge_function(text, jsonb) FROM authenticated;
CREATE FUNCTION public._admin_enqueue_task(function_name text, payload jsonb DEFAULT '{}'::jsonb, delay_seconds integer DEFAULT 0)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
REVOKE ALL ON FUNCTION public._admin_enqueue_task(text, jsonb, integer) FROM anon;
REVOKE ALL ON FUNCTION public._admin_enqueue_task(text, jsonb, integer) FROM authenticated;
CREATE FUNCTION public._admin_get_secret(secret_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;

  RETURN secret_value;
END;
$function$;
REVOKE ALL ON FUNCTION public._admin_get_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public._admin_get_secret(text) FROM authenticated;
CREATE FUNCTION public._admin_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE FUNCTION public._admin_queue_archive(id bigint)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT pgmq.archive('agentlink_tasks', id);
$function$;
REVOKE ALL ON FUNCTION public._admin_queue_archive(bigint) FROM anon;
REVOKE ALL ON FUNCTION public._admin_queue_archive(bigint) FROM authenticated;
CREATE FUNCTION public._admin_queue_delete(id bigint)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT pgmq.delete('agentlink_tasks', id);
$function$;
REVOKE ALL ON FUNCTION public._admin_queue_delete(bigint) FROM anon;
REVOKE ALL ON FUNCTION public._admin_queue_delete(bigint) FROM authenticated;
CREATE FUNCTION public._admin_queue_read(qty integer DEFAULT 5, vt integer DEFAULT 30)
 RETURNS TABLE(msg_id bigint, read_ct integer, enqueued_at timestamp with time zone, vt timestamp with time zone, message jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT msg_id, read_ct, enqueued_at, vt, message FROM pgmq.read('agentlink_tasks', vt, qty);
$function$;
REVOKE ALL ON FUNCTION public._admin_queue_read(integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public._admin_queue_read(integer, integer) FROM authenticated;
CREATE FUNCTION public._hook_before_user_created(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  allowed_domains text;
  user_email text;
  user_domain text;
  domain text;
  domains text[];
BEGIN
  allowed_domains := public._admin_get_secret('ALLOWED_SIGNUP_DOMAINS');

  -- No restriction configured → allow all signups
  IF allowed_domains IS NULL OR trim(allowed_domains) = '' THEN
    RETURN event;
  END IF;

  user_email := event->'user'->>'email';
  IF user_email IS NULL OR user_email = '' THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Email is required for signup.'
      )
    );
  END IF;

  user_domain := lower(split_part(user_email, '@', 2));
  domains := string_to_array(allowed_domains, ',');

  FOREACH domain IN ARRAY domains LOOP
    IF lower(trim(domain)) = user_domain THEN
      RETURN event;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Signups are restricted to authorized domains.'
    )
  );
END;
$function$;
REVOKE ALL ON FUNCTION public._hook_before_user_created(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public._hook_before_user_created(jsonb) FROM authenticated;
GRANT ALL ON FUNCTION public._hook_before_user_created(jsonb) TO supabase_auth_admin;
CREATE FUNCTION public._hook_send_email(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  PERFORM public._admin_enqueue_task(
    'send-email',
    event
  );
  RETURN event;
END;
$function$;
REVOKE ALL ON FUNCTION public._hook_send_email(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public._hook_send_email(jsonb) FROM authenticated;
GRANT ALL ON FUNCTION public._hook_send_email(jsonb) TO supabase_auth_admin;
CREATE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
CREATE TABLE public.profiles (id uuid NOT NULL, email text, display_name text, avatar_url text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));
