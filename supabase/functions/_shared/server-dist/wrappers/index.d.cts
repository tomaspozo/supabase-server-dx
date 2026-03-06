import "../types-D9O4XOqP.cjs";
import { t as withSupabase } from "../with-supabase-DUjdx8yc.cjs";

//#region src/wrappers/webhook.d.ts
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
//#endregion
export { verifyWebhookSignature, withSupabase };