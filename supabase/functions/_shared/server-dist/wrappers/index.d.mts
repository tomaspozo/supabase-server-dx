import "../types-Bl-RE9Fd.mjs";
import { t as withSupabase } from "../with-supabase-AZAb5Oo6.mjs";

//#region src/wrappers/webhook.d.ts
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
//#endregion
export { verifyWebhookSignature, withSupabase };