import { a as Credentials, l as SupabaseEnv, n as AllowWithKey, r as AuthResult } from "./types-Bl-RE9Fd.mjs";
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
export { extractCredentials as a, EnvError as c, verifyCredentials as i, createContextClient as n, resolveEnv as o, verifyAuth as r, AuthError as s, createAdminClient as t };