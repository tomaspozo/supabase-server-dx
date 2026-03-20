import { createSupabaseContext } from "@/lib/supabase/context";

export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" });
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 401 });
  }

  const { data: user, error: userError } = await ctx.supabase.auth.getUser();
  if (userError) {
    return Response.json(
      { ok: false, error: userError.message },
      { status: 401 },
    );
  }

  return Response.json({
    ok: true,
    demo: "case-next",
    authType: ctx.authType,
    user,
    userClaims: ctx.userClaims,
    claims: ctx.claims,
  });
}
