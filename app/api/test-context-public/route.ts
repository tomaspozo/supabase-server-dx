import { createSupabaseContext } from "@/lib/supabase/context"

export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "always" })
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
  return Response.json({
    ok: true,
    authType: ctx.authType,
    hasSupabase: !!ctx.supabase,
    hasAdmin: !!ctx.supabaseAdmin,
    user: ctx.user,
  })
}
