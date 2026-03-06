import { a as Credentials, c as SupabaseContext, d as WithSupabaseConfig, i as CorsConfig, l as SupabaseEnv, n as AllowWithKey, o as JWTClaims, r as AuthResult, s as NamedKey, t as Allow, u as UserIdentity } from "./types-D9O4XOqP.cjs";
import { a as extractCredentials, c as EnvError, i as verifyCredentials, n as createContextClient, o as resolveEnv, r as verifyAuth, s as AuthError, t as createAdminClient } from "./create-admin-client-BKhXg7Qr.cjs";

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
//#region src/cors.d.ts
declare function buildCorsHeaders(config?: boolean | CorsConfig): Record<string, string>;
declare function addCorsHeaders(response: Response, config?: boolean | CorsConfig): Response;
//#endregion
export { type Allow, type AllowWithKey, AuthError, type AuthResult, type CorsConfig, type Credentials, EnvError, type JWTClaims, type NamedKey, type SupabaseContext, type SupabaseEnv, type UserIdentity, type WithSupabaseConfig, addCorsHeaders, buildCorsHeaders, createAdminClient, createContextClient, createSupabaseContext, extractCredentials, resolveEnv, verifyAuth, verifyCredentials, withSupabase };