import { withSupabase } from "npm:@supabase/server@0.1.0-alpha.1";

export default {
  fetch: withSupabase({ allow: "user" }, (_req, ctx) => {
    return Response.json({
      demo: "case-ef",
      authType: ctx.authType,
      userClaims: ctx.userClaims,
    });
  }),
};
