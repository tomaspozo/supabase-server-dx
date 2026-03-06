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
