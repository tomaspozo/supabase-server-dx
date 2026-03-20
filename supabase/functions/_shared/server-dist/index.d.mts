import { a as JWTClaims, c as UserClaims, i as Credentials, l as WithSupabaseConfig, n as AllowWithKey, o as SupabaseContext, r as AuthResult, s as SupabaseEnv, t as Allow } from "./types-CRP1ATQs.mjs";
import { a as extractCredentials, c as EnvError, i as verifyCredentials, n as createContextClient, o as resolveEnv, r as verifyAuth, s as AuthError, t as createAdminClient } from "./create-admin-client-BYBo6tQJ.mjs";

//#region src/with-supabase.d.ts
declare function withSupabase(config: WithSupabaseConfig, handler: (req: Request, ctx: SupabaseContext) => Promise<Response>): (req: Request) => Promise<Response>;
//#endregion
//#region src/create-supabase-context.d.ts
declare function createSupabaseContext(request: Request, options?: WithSupabaseConfig): Promise<{
  data: SupabaseContext;
  error: null;
} | {
  data: null;
  error: AuthError;
}>;
//#endregion
export { type Allow, type AllowWithKey, AuthError, type AuthResult, type Credentials, EnvError, type JWTClaims, type SupabaseContext, type SupabaseEnv, type UserClaims, type WithSupabaseConfig, createAdminClient, createContextClient, createSupabaseContext, extractCredentials, resolveEnv, verifyAuth, verifyCredentials, withSupabase };