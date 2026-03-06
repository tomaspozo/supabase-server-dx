import { c as SupabaseContext } from "../types-D9O4XOqP.cjs";
import { t as withSupabase } from "../with-supabase-DUjdx8yc.cjs";

//#region src/wrappers/auth-hooks.d.ts
interface AuthHookPayload {
  user: {
    id: string;
    email?: string;
    phone?: string;
    raw_user_meta_data?: Record<string, unknown>;
    raw_app_meta_data?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
interface AuthHookContext extends SupabaseContext {
  userData: AuthHookPayload;
}
interface AuthHookResponse {
  decision: 'continue' | 'reject';
  message?: string;
}
interface AuthHookConfig {
  webhookSecret?: string;
}
declare const beforeUserCreated: (handler: (req: Request, ctx: AuthHookContext) => Promise<AuthHookResponse>, config?: AuthHookConfig) => (req: Request) => Promise<Response>;
declare const afterUserCreated: (handler: (req: Request, ctx: AuthHookContext) => Promise<AuthHookResponse>, config?: AuthHookConfig) => (req: Request) => Promise<Response>;
//#endregion
//#region src/wrappers/webhook.d.ts
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
//#endregion
export { type AuthHookContext, type AuthHookPayload, type AuthHookResponse, afterUserCreated, beforeUserCreated, verifyWebhookSignature, withSupabase };