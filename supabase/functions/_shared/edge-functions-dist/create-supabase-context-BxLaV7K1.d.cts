import { a as Credentials, c as SupabaseContext, d as WithSupabaseConfig, l as SupabaseEnv, n as AllowWithKey, r as AuthResult } from "./types-D9O4XOqP.cjs";
import { SupabaseClient } from "@supabase/supabase-js";

//#region src/errors.d.ts
declare class EnvError extends Error {
  readonly status = 500;
  readonly code: string;
  constructor(message: string, code?: string);
}
declare class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, code?: string, status?: number);
}
//#endregion
//#region src/core/resolve-env.d.ts
declare function resolveEnv(overrides?: Partial<SupabaseEnv>): {
  data: SupabaseEnv;
  error: null;
} | {
  data: null;
  error: EnvError;
};
//#endregion
//#region src/core/extract-credentials.d.ts
declare function extractCredentials(request: Request): Credentials;
//#endregion
//#region src/core/verify-credentials.d.ts
interface VerifyCredentialsOptions {
  allow: AllowWithKey | AllowWithKey[];
  env?: Partial<SupabaseEnv>;
}
declare function verifyCredentials(credentials: Credentials, options: VerifyCredentialsOptions): Promise<{
  data: AuthResult;
  error: null;
} | {
  data: null;
  error: AuthError;
}>;
//#endregion
//#region src/core/verify-auth.d.ts
interface VerifyAuthOptions {
  allow: AllowWithKey | AllowWithKey[];
  env?: Partial<SupabaseEnv>;
}
declare function verifyAuth(request: Request, options: VerifyAuthOptions): Promise<{
  data: AuthResult;
  error: null;
} | {
  data: null;
  error: AuthError;
}>;
//#endregion
//#region src/core/create-context-client.d.ts
declare function createContextClient(token?: string | null, env?: Partial<SupabaseEnv>): SupabaseClient;
//#endregion
//#region src/core/create-admin-client.d.ts
declare function createAdminClient(env?: Partial<SupabaseEnv>): SupabaseClient;
//#endregion
//#region src/core/create-supabase-context.d.ts
declare function createSupabaseContext(request: Request, options?: WithSupabaseConfig): Promise<{
  data: SupabaseContext;
  error: null;
} | {
  data: null;
  error: AuthError;
}>;
//#endregion
export { verifyCredentials as a, AuthError as c, verifyAuth as i, EnvError as l, createAdminClient as n, extractCredentials as o, createContextClient as r, resolveEnv as s, createSupabaseContext as t };