import { a as createAdminClient, i as createContextClient, t as verifyAuth } from "./verify-auth-DiJdb3qB.mjs";

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
	return {
		data: {
			supabase: createContextClient(auth.token, options?.env),
			supabaseAdmin: createAdminClient(options?.env),
			user: auth.user,
			claims: auth.claims,
			authType: auth.authType
		},
		error: null
	};
}

//#endregion
export { createSupabaseContext as t };