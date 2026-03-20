const require_verify_auth = require('./verify-auth-6a1UPrFz.cjs');

//#region src/create-supabase-context.ts
async function createSupabaseContext(request, options) {
	const { data: auth, error } = await require_verify_auth.verifyAuth(request, {
		allow: options?.allow ?? "user",
		env: options?.env
	});
	if (error) return {
		data: null,
		error
	};
	try {
		return {
			data: {
				supabase: require_verify_auth.createContextClient(auth.token, options?.env, auth.keyName),
				supabaseAdmin: require_verify_auth.createAdminClient(options?.env, auth.keyName),
				userClaims: auth.userClaims,
				claims: auth.claims,
				authType: auth.authType
			},
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof require_verify_auth.EnvError ? new require_verify_auth.AuthError(e.message, e.code, 500) : new require_verify_auth.AuthError("Failed to create Supabase client", "CLIENT_ERROR", 500)
		};
	}
}

//#endregion
Object.defineProperty(exports, 'createSupabaseContext', {
  enumerable: true,
  get: function () {
    return createSupabaseContext;
  }
});