import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ allow: "user" }, (_req, ctx) => {
    return Response.json({
      demo: "case-ef",
      authType: ctx.authType,
      userClaims: ctx.userClaims,
    });
  }),
};
