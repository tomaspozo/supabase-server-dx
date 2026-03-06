import { createSupabaseContext } from "@/lib/supabase/context"

export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" })
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 401 })
  }
  return Response.json({
    ok: true,
    authType: ctx.authType,
    user: ctx.user,
    claims: ctx.claims,
    hasSupabase: !!ctx.supabase,
    hasAdmin: !!ctx.supabaseAdmin,
  })
}
