import { c as SupabaseContext, d as WithSupabaseConfig } from "./types-Bl-RE9Fd.mjs";

//#region src/wrappers/with-supabase.d.ts
declare function withSupabase(config: WithSupabaseConfig, handler: (req: Request, ctx: SupabaseContext) => Promise<Response>): (req: Request) => Promise<Response>;
//#endregion
export { withSupabase as t };