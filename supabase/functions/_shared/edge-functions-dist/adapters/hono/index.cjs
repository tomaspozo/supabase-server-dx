Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_create_supabase_context = require('../../create-supabase-context-D31apwMv.cjs');

//#region src/adapters/hono/middleware.ts
function supabase(config) {
	return async (c, next) => {
		const { data: ctx, error } = await require_create_supabase_context.createSupabaseContext(c.req.raw, config);
		if (error) return c.json({
			error: error.message,
			code: error.code
		}, error.status);
		c.set("supabase", ctx);
		await next();
	};
}

//#endregion
exports.supabase = supabase;