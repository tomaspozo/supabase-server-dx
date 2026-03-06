import { c as SupabaseContext, d as WithSupabaseConfig } from "../../types-Bl-RE9Fd.mjs";
import { MiddlewareHandler } from "hono";

//#region src/adapters/hono/middleware.d.ts
declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseContext;
  }
}
declare function supabase(config?: Omit<WithSupabaseConfig, 'cors'>): MiddlewareHandler;
//#endregion
export { supabase };