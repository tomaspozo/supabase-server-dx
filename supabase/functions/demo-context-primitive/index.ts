import { createSupabaseContext } from "@supabase/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

export default { fetch: async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const { data: ctx, error } = await createSupabaseContext(req, {
    allow: "user",
  })

  if (error) {
    return withCors(
      Response.json({ error: error.message, code: error.code }, { status: error.status })
    )
  }

  return withCors(
    Response.json({
      demo: "demo-context-primitive",
      authType: ctx.authType,
      userClaims: ctx.userClaims,
      note: "This uses createSupabaseContext directly — same result as demo-user-profile, but manual CORS and error handling.",
    })
  )
}}
