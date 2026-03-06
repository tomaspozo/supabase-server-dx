import { t as createSupabaseContext } from "../../create-supabase-context-DBzKCqYK.mjs";

//#region src/adapters/hono/middleware.ts
function supabase(config) {
	return async (c, next) => {
		const { data: ctx, error } = await createSupabaseContext(c.req.raw, config);
		if (error) return c.json({
			error: error.message,
			code: error.code
		}, error.status);
		c.set("supabase", ctx);
		await next();
	};
}

//#endregion
export { supabase };