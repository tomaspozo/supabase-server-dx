import { a as Credentials, c as SupabaseContext, d as WithSupabaseConfig, i as CorsConfig, l as SupabaseEnv, n as AllowWithKey, o as JWTClaims, r as AuthResult, s as NamedKey, t as Allow, u as UserIdentity } from "./types-D9O4XOqP.cjs";
import { a as verifyCredentials, c as AuthError, i as verifyAuth, l as EnvError, n as createAdminClient, o as extractCredentials, r as createContextClient, s as resolveEnv, t as createSupabaseContext } from "./create-supabase-context-BxLaV7K1.cjs";
import { t as withSupabase } from "./with-supabase-DUjdx8yc.cjs";

//#region src/cors.d.ts
declare function buildCorsHeaders(config?: boolean | CorsConfig): Record<string, string>;
declare function addCorsHeaders(response: Response, config?: boolean | CorsConfig): Response;
//#endregion
export { type Allow, type AllowWithKey, AuthError, type AuthResult, type CorsConfig, type Credentials, EnvError, type JWTClaims, type NamedKey, type SupabaseContext, type SupabaseEnv, type UserIdentity, type WithSupabaseConfig, addCorsHeaders, buildCorsHeaders, createAdminClient, createContextClient, createSupabaseContext, extractCredentials, resolveEnv, verifyAuth, verifyCredentials, withSupabase };