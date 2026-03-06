-- Create default queue (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'pgmq' AND table_name = 'q_agentlink_tasks'
  ) THEN
    PERFORM pgmq.create('agentlink_tasks');
  END IF;
END;
$$;
