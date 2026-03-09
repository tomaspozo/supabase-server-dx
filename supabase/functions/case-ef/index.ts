import { withSupabase } from "@supabase/server";
import { env } from "../_shared/env.ts";

Deno.serve(
  withSupabase({ allow: "user", env }, (_req, ctx) => {
    return Response.json({
      demo: "case-ef",
      authType: ctx.authType,
      user: ctx.user,
    });
  }),
);
