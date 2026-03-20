import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ allow: "user" }, async (_req, ctx) => {
    const { data: user, error: userError } = await ctx.supabase.auth.getUser();
    if (userError) {
      return Response.json(
        { ok: false, error: userError.message },
        { status: 401 },
      );
    }

    return Response.json({
      demo: "demo-user-profile",
      authType: ctx.authType,
      user: user,
      userClaims: ctx.userClaims,
    });
  }),
};
