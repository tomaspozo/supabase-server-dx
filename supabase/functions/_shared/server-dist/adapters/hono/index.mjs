import { t as createSupabaseContext } from "../../create-supabase-context-Cmu0kHIk.mjs";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";

//#region src/adapters/hono/middleware.ts
function supabase(config) {
	return createMiddleware(async (c, next) => {
		if (c.var.supabaseContext) {
			await next();
			return;
		}
		const { data: ctx, error } = await createSupabaseContext(c.req.raw, config);
		if (error) throw new HTTPException(error.status, {
			message: error.message,
			cause: error
		});
		c.set("supabaseContext", ctx);
		await next();
	});
}

//#endregion
export { supabase };