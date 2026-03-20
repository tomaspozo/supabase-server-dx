import { withSupabase } from "@supabase/server";

Deno.serve(
  withSupabase({ allow: "user" }, (_req, ctx) => {
    return Response.json({
      demo: "case-ef",
      authType: ctx.authType,
      user: ctx.user,
    });
  }),
);
