import { a as createAdminClient, c as EnvError, i as createContextClient, s as AuthError, t as verifyAuth } from "./verify-auth-DsPqpkOT.mjs";

//#region src/create-supabase-context.ts
async function createSupabaseContext(request, options) {
	const { data: auth, error } = await verifyAuth(request, {
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
				supabase: createContextClient(auth.token, options?.env),
				supabaseAdmin: createAdminClient(options?.env),
				userClaims: auth.userClaims,
				claims: auth.claims,
				authType: auth.authType
			},
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof EnvError ? new AuthError(e.message, e.code, 500) : new AuthError("Failed to create Supabase client", "CLIENT_ERROR", 500)
		};
	}
}

//#endregion
export { createSupabaseContext as t };