import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase(
    { allow: "user" },
    async (_req, ctx) => {
      return Response.json({
        demo: "demo-user-profile",
        authType: ctx.authType,
        user: ctx.user,
      })
    }
  ),
}
