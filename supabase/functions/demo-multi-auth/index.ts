import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase(
    { allow: ["user", "always"] },
    async (_req, ctx) => {
      const greeting = ctx.userClaims
        ? `Hello, ${ctx.userClaims.email ?? ctx.userClaims.id}!`
        : "Hello, anonymous visitor!"

      return Response.json({
        demo: "demo-multi-auth",
        authType: ctx.authType,
        greeting,
        userClaims: ctx.userClaims,
      })
    }
  ),
}
