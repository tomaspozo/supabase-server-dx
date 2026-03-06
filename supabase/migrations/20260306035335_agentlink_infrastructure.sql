-- @agentlink api
-- @type schema
-- @summary Public-facing schema exposed via PostgREST / Supabase Data API
-- @description The only schema exposed to clients through the Supabase Data API.
--   All client-callable RPC functions live here as api.{entity}_{action}.
--   Tables and internal functions stay in the public schema and are never
--   exposed directly. Grants USAGE and EXECUTE to authenticated and service_role.
-- @example SELECT api.todos_list();
-- @related _admin_get_secret, _admin_call_edge_function
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA api
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

-- @agentlink pg_net
-- @type extension
-- @summary Async HTTP requests from PostgreSQL
-- @description Enables non-blocking HTTP calls (GET, POST, etc.) directly from SQL.
--   Used by _admin_call_edge_function to invoke Supabase Edge Functions
--   without waiting for a response (fire-and-forget via net.http_post).
-- @example SELECT net.http_post('https://example.com/api', '{"key":"value"}'::jsonb);
-- @related _admin_call_edge_function, _admin_enqueue_task
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- @agentlink pg_cron
-- @type extension
-- @summary Scheduled job execution inside PostgreSQL
-- @description Runs SQL statements or function calls on a cron schedule.
--   Useful for periodic maintenance, data aggregation, or retry loops.
--   Jobs are created with cron.schedule() and managed in the cron schema.
-- @example SELECT cron.schedule('nightly-cleanup', '0 3 * * *', $$DELETE FROM logs WHERE created_at < now() - interval '30 days'$$);
-- @related pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- @agentlink pgmq
-- @type extension
-- @summary Lightweight transactional message queue for PostgreSQL
-- @description Provides durable, exactly-once message processing with
--   visibility timeouts. AgentLink uses PGMQ to queue async tasks that
--   are processed by the queue-worker edge function. The extension
--   auto-creates its own pgmq schema.
-- @example SELECT pgmq.send('my_queue', '{"task":"process"}'::jsonb);
-- @related agentlink_tasks, _admin_enqueue_task, queue-worker
CREATE EXTENSION IF NOT EXISTS pgmq VERSION '1.5.1';
