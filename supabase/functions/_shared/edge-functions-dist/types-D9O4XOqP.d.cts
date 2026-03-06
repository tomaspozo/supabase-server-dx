import { SupabaseClient } from "@supabase/supabase-js";

//#region src/types.d.ts
type Allow = 'always' | 'public' | 'secret' | 'user';
type AllowWithKey = Allow | `public:${string}` | `secret:${string}`;
interface NamedKey {
  name: string;
  key: string;
}
interface SupabaseEnv {
  url: string;
  publishableKeys: NamedKey[];
  secretKeys: NamedKey[];
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
  user: UserIdentity | null;
  claims: JWTClaims | null;
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
interface UserIdentity {
  id: string;
  role?: string;
  email?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}
interface CorsConfig {
  origins?: string | string[];
  methods?: string[];
  headers?: string[];
  maxAge?: number;
  credentials?: boolean;
}
interface WithSupabaseConfig {
  allow?: AllowWithKey | AllowWithKey[];
  env?: Partial<SupabaseEnv>;
  cors?: boolean | CorsConfig;
}
interface SupabaseContext {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  user: UserIdentity | null;
  claims: JWTClaims | null;
  authType: Allow;
}
//#endregion
export { Credentials as a, SupabaseContext as c, WithSupabaseConfig as d, CorsConfig as i, SupabaseEnv as l, AllowWithKey as n, JWTClaims as o, AuthResult as r, NamedKey as s, Allow as t, UserIdentity as u };