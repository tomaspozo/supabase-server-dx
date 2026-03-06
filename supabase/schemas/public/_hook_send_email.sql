-- @agentlink _hook_send_email
-- @type function
-- @summary Auth hook that enqueues email jobs into PGMQ
-- @description Enqueues the GoTrue email event into the agentlink_tasks queue
--   via _admin_enqueue_task. The queue-worker picks it up and invokes the
--   send-email edge function asynchronously — no timeout pressure from GoTrue.
-- @signature _hook_send_email(event jsonb)
-- @returns jsonb
-- @security SECURITY DEFINER — granted to supabase_auth_admin
-- @related _admin_enqueue_task, send-email, queue-worker, auth.hook.send_email

CREATE OR REPLACE FUNCTION public._hook_send_email(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public._admin_enqueue_task(
    'send-email',
    event
  );
  RETURN event;
END;
$$;

REVOKE ALL ON FUNCTION public._hook_send_email(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._hook_send_email(jsonb) TO supabase_auth_admin;
