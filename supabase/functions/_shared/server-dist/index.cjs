Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_verify_auth = require('./verify-auth-Cs7kMug3.cjs');
const require_create_supabase_context = require('./create-supabase-context-aadlBH3s.cjs');

//#region src/cors.ts
function buildCorsHeaders(config) {
	if (config === false) return {};
	const opts = typeof config === "object" ? config : {};
	const origins = opts.origins ?? "*";
	const origin = Array.isArray(origins) ? origins.join(", ") : origins;
	const headers = {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": opts.methods?.join(", ") ?? "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": opts.headers?.join(", ") ?? "Authorization, apikey, Content-Type, x-client-info"
	};
	if (opts.maxAge != null) headers["Access-Control-Max-Age"] = String(opts.maxAge);
	if (opts.credentials) headers["Access-Control-Allow-Credentials"] = "true";
	return headers;
}
function addCorsHeaders(response, config) {
	if (config === false) return response;
	const corsHeaders = buildCorsHeaders(config);
	const newResponse = new Response(response.body, response);
	for (const [key, value] of Object.entries(corsHeaders)) newResponse.headers.set(key, value);
	return newResponse;
}

//#endregion
//#region src/with-supabase.ts
function withSupabase(config, handler) {
	return async (req) => {
		if (config.cors !== false && req.method === "OPTIONS") return new Response(null, {
			status: 204,
			headers: buildCorsHeaders(config.cors)
		});
		const { data: ctx, error } = await require_create_supabase_context.createSupabaseContext(req, config);
		if (error) return Response.json({
			error: error.message,
			code: error.code
		}, {
			status: error.status,
			headers: config.cors !== false ? buildCorsHeaders(config.cors) : {}
		});
		const response = await handler(req, ctx);
		if (config.cors !== false) return addCorsHeaders(response, config.cors);
		return response;
	};
}

//#endregion
exports.AuthError = require_verify_auth.AuthError;
exports.EnvError = require_verify_auth.EnvError;
exports.addCorsHeaders = addCorsHeaders;
exports.buildCorsHeaders = buildCorsHeaders;
exports.createAdminClient = require_verify_auth.createAdminClient;
exports.createContextClient = require_verify_auth.createContextClient;
exports.createSupabaseContext = require_create_supabase_context.createSupabaseContext;
exports.extractCredentials = require_verify_auth.extractCredentials;
exports.resolveEnv = require_verify_auth.resolveEnv;
exports.verifyAuth = require_verify_auth.verifyAuth;
exports.verifyCredentials = require_verify_auth.verifyCredentials;
exports.withSupabase = withSupabase;