Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_create_supabase_context = require('../../create-supabase-context-D31apwMv.cjs');
let hono_http_exception = require("hono/http-exception");
let hono_factory = require("hono/factory");

//#region src/adapters/hono/middleware.ts
function supabase(config) {
	return (0, hono_factory.createMiddleware)(async (c, next) => {
		if (c.var.supabase) {
			await next();
			return;
		}
		const { data: ctx, error } = await require_create_supabase_context.createSupabaseContext(c.req.raw, config);
		if (error) throw new hono_http_exception.HTTPException(error.status, {
			message: error.message,
			cause: error
		});
		c.set("supabase", ctx);
		await next();
	});
}

//#endregion
exports.supabase = supabase;