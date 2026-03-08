import { c as SupabaseContext, d as WithSupabaseConfig } from "../../types-D9O4XOqP.cjs";
import * as hono_types0 from "hono/types";

//#region src/adapters/hono/middleware.d.ts
declare function supabase(config?: Omit<WithSupabaseConfig, 'cors'>): hono_types0.MiddlewareHandler<{
  Variables: {
    supabaseContext: SupabaseContext;
  };
}, string, {}, Response>;
//#endregion
export { supabase };