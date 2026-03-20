import { l as WithSupabaseConfig, o as SupabaseContext } from "../../types-6aN-HUPs.cjs";
import * as hono_types0 from "hono/types";

//#region src/adapters/hono/middleware.d.ts
declare function withSupabase(config?: Omit<WithSupabaseConfig, 'cors'>): hono_types0.MiddlewareHandler<{
  Variables: {
    supabaseContext: SupabaseContext;
  };
}, string, {}, Response>;
//#endregion
export { withSupabase };