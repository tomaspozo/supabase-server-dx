import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase(
    { allow: "always" },
    async (_req, ctx) => {
      return Response.json({
        demo: "demo-public-status",
        authType: ctx.authType,
        serverTime: new Date().toISOString(),
        runtime: `Deno ${Deno.version.deno}`,
        userClaims: ctx.userClaims,
      })
    }
  ),
}
