import { SupabaseClient } from "@supabase/supabase-js";

//#region src/types.d.ts
type Allow = 'always' | 'public' | 'secret' | 'user';
type AllowWithKey = Allow | `public:${string}` | `secret:${string}`;
interface SupabaseEnv {
  url: string;
  publishableKeys: Record<string, string>;
  secretKeys: Record<string, string>;
  jwks: JsonWebKeySet | null;
}
interface JsonWebKeySet {
  keys: JsonWebKey[];
}
interface Credentials {
  token: string | null;
  apikey: string | null;
}
interface AuthResult {
  authType: Allow;
  token: string | null;
  userClaims: UserClaims | null;
  claims: JWTClaims | null;
  keyName: string | null;
}
interface JWTClaims {
  sub: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  role?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
interface UserClaims {
  id: string;
  role?: string;
  email?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}
interface WithSupabaseConfig {
  allow?: AllowWithKey | AllowWithKey[];
  env?: Partial<SupabaseEnv>;
  cors?: boolean | Record<string, string>;
}
interface SupabaseContext {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  /** JWT-derived identity. For the full Supabase User object, call `supabase.auth.getUser()`. */
  userClaims: UserClaims | null;
  claims: JWTClaims | null;
  authType: Allow;
}
//#endregion
export { JWTClaims as a, UserClaims as c, Credentials as i, WithSupabaseConfig as l, AllowWithKey as n, SupabaseContext as o, AuthResult as r, SupabaseEnv as s, Allow as t };