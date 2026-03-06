import { createSupabaseContext, buildCorsHeaders, addCorsHeaders } from "@supabase/server"
import { env } from "../_shared/env.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders() })
  }

  const { data: ctx, error } = await createSupabaseContext(req, {
    allow: "user",
    env,
  })

  if (error) {
    return addCorsHeaders(
      Response.json({ error: error.message, code: error.code }, { status: error.status })
    )
  }

  return addCorsHeaders(
    Response.json({
      demo: "demo-context-primitive",
      authType: ctx.authType,
      user: ctx.user,
      note: "This uses createSupabaseContext directly — same result as demo-user-profile, but manual CORS and error handling.",
    })
  )
})
