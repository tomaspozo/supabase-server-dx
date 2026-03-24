import { withSupabase } from "npm:@supabase/server@0.1.0-alpha.1"

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
