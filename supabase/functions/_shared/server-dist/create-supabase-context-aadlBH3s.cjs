const require_verify_auth = require('./verify-auth-Cs7kMug3.cjs');

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
	return {
		data: {
			supabase: require_verify_auth.createContextClient(auth.token, options?.env),
			supabaseAdmin: require_verify_auth.createAdminClient(options?.env),
			user: auth.user,
			claims: auth.claims,
			authType: auth.authType
		},
		error: null
	};
}

//#endregion
Object.defineProperty(exports, 'createSupabaseContext', {
  enumerable: true,
  get: function () {
    return createSupabaseContext;
  }
});