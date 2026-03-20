import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase(
    { allow: ["user", "always"] },
    async (_req, ctx) => {
      const greeting = ctx.user
        ? `Hello, ${ctx.user.email ?? ctx.user.id}!`
        : "Hello, anonymous visitor!"

      return Response.json({
        demo: "demo-multi-auth",
        authType: ctx.authType,
        greeting,
        user: ctx.user,
      })
    }
  ),
}
