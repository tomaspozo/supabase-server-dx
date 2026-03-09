// @agentlink queue-worker
// @type edge_function
// @summary Processes async tasks from the agentlink_tasks PGMQ queue
// @description Reads pending messages from the queue, invokes the target edge
//   function for each task, and archives successful messages. Failed tasks
//   remain in the queue and become visible again after the visibility timeout
//   expires, enabling automatic retry. Secured with allow: "secret" so only
//   service_role can invoke it.
// @example SELECT _admin_enqueue_task('send-email', '{"to":"user@example.com"}'::jsonb);
// @related agentlink_tasks, _admin_enqueue_task, _admin_queue_read, _admin_queue_archive

// @ts-nocheck
import { withSupabase } from "@supabase/server";
import { env } from "../_shared/env.ts";

Deno.serve(
  withSupabase({ allow: "secret", env }, async (_req, ctx) => {
    const { data: messages, error: readError } = await ctx.supabaseAdmin.rpc(
      "_admin_queue_read",
      { qty: 5, vt: 30 },
    );

    if (readError) {
      console.error("Failed to read queue:", readError);
      return Response.json({ error: readError.message }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return Response.json({ processed: 0 });
    }

    let processed = 0;

    for (const msg of messages) {
      const { function_name, payload } = msg.message;

      try {
        const { error: invokeError } = await ctx.supabaseAdmin.functions.invoke(
          function_name,
          { body: payload },
        );

        if (invokeError) {
          console.error(
            `Task ${msg.msg_id} (${function_name}) failed:`,
            invokeError,
          );
          // Leave in queue — becomes visible again after VT expires
          continue;
        }

        // Archive on success (keeps history)
        await ctx.supabaseAdmin.rpc("_admin_queue_archive", { id: msg.msg_id });
        processed++;
      } catch (err) {
        console.error(
          `Task ${msg.msg_id} (${function_name}) threw:`,
          err,
        );
        // Leave in queue for retry
      }
    }

    return Response.json({ processed, total: messages.length });
  }),
);
