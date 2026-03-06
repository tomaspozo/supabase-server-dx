import { createClient } from "@supabase/supabase-js";
import { createLocalJWKSet, jwtVerify } from "jose";

//#region src/errors.ts
var EnvError = class extends Error {
	constructor(message, code = "ENV_ERROR") {
		super(message);
		this.status = 500;
		this.name = "EnvError";
		this.code = code;
	}
};
var AuthError = class extends Error {
	constructor(message, code = "AUTH_ERROR", status = 401) {
		super(message);
		this.name = "AuthError";
		this.code = code;
		this.status = status;
	}
};

//#endregion
//#region src/core/resolve-env.ts
function getEnvVar(name) {
	if (typeof Deno !== "undefined" && Deno.env?.get) return Deno.env.get(name);
	if (typeof process !== "undefined" && process.env) return process.env[name];
}
function parseNamedKeys(raw) {
	if (!raw) return [];
	return raw.split(",").map((entry) => {
		const trimmed = entry.trim();
		const colonIndex = trimmed.indexOf(":");
		if (colonIndex > 0) return {
			name: trimmed.slice(0, colonIndex),
			key: trimmed.slice(colonIndex + 1)
		};
		return {
			name: "default",
			key: trimmed
		};
	});
}
function parseJwks(raw) {
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function resolveEnv(overrides) {
	const url = overrides?.url ?? getEnvVar("SUPABASE_URL");
	if (!url) return {
		data: null,
		error: new EnvError("SUPABASE_URL is required but not set", "MISSING_SUPABASE_URL")
	};
	return {
		data: {
			url,
			publishableKeys: overrides?.publishableKeys ?? parseNamedKeys(getEnvVar("SUPABASE_PUBLISHABLE_KEYS")),
			secretKeys: overrides?.secretKeys ?? parseNamedKeys(getEnvVar("SUPABASE_SECRET_KEYS")),
			jwks: overrides?.jwks ?? parseJwks(getEnvVar("SUPABASE_JWKS"))
		},
		error: null
	};
}

//#endregion
//#region src/core/create-admin-client.ts
function createAdminClient(env) {
	const { data: resolved, error } = resolveEnv(env);
	if (error) throw error;
	const secretKey = resolved.secretKeys[0]?.key ?? "";
	return createClient(resolved.url, secretKey, { auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false
	} });
}

//#endregion
//#region src/core/create-context-client.ts
function createContextClient(token, env) {
	const { data: resolved, error } = resolveEnv(env);
	if (error) throw error;
	const anonKey = resolved.publishableKeys[0]?.key ?? "";
	return createClient(resolved.url, anonKey, {
		global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});
}

//#endregion
//#region src/core/extract-credentials.ts
function extractCredentials(request) {
	const authHeader = request.headers.get("authorization");
	return {
		token: authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null,
		apikey: request.headers.get("apikey")
	};
}

//#endregion
//#region src/core/utils/timing-safe-equal.ts
const encoder = new TextEncoder();
async function timingSafeEqual(a, b) {
	const key = crypto.getRandomValues(new Uint8Array(32));
	const cryptoKey = await crypto.subtle.importKey("raw", key, {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const [sigA, sigB] = await Promise.all([crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(a)), crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(b))]);
	if (sigA.byteLength !== sigB.byteLength) return false;
	const viewA = new Uint8Array(sigA);
	const viewB = new Uint8Array(sigB);
	let result = 0;
	for (let i = 0; i < viewA.length; i++) result |= viewA[i] ^ viewB[i];
	return result === 0;
}

//#endregion
//#region src/core/verify-credentials.ts
function parseAllowMode(mode) {
	if (mode === "always" || mode === "public" || mode === "secret" || mode === "user") return {
		base: mode,
		keyName: null
	};
	const colonIndex = mode.indexOf(":");
	return {
		base: mode.slice(0, colonIndex),
		keyName: mode.slice(colonIndex + 1)
	};
}
function claimsToUser(claims) {
	return {
		id: claims.sub,
		role: claims.role,
		email: claims.email,
		appMetadata: claims.app_metadata,
		userMetadata: claims.user_metadata
	};
}
async function tryMode(mode, credentials, env) {
	const { base, keyName } = parseAllowMode(mode);
	switch (base) {
		case "always": return {
			authType: "always",
			token: null,
			user: null,
			claims: null
		};
		case "public": {
			if (!credentials.apikey) return null;
			const keys = keyName ? env.publishableKeys.filter((k) => k.name === keyName) : env.publishableKeys;
			for (const k of keys) if (await timingSafeEqual(credentials.apikey, k.key)) return {
				authType: "public",
				token: null,
				user: null,
				claims: null
			};
			return null;
		}
		case "secret": {
			if (!credentials.apikey) return null;
			const keys = keyName ? env.secretKeys.filter((k) => k.name === keyName) : env.secretKeys;
			for (const k of keys) if (await timingSafeEqual(credentials.apikey, k.key)) return {
				authType: "secret",
				token: null,
				user: null,
				claims: null
			};
			return null;
		}
		case "user":
			if (!credentials.token) return null;
			if (!env.jwks) return null;
			try {
				const jwkSet = createLocalJWKSet(env.jwks);
				const { payload } = await jwtVerify(credentials.token, jwkSet);
				const claims = payload;
				return {
					authType: "user",
					token: credentials.token,
					user: claimsToUser(claims),
					claims
				};
			} catch {
				return null;
			}
		default: return null;
	}
}
async function verifyCredentials(credentials, options) {
	const { data: env, error: envError } = resolveEnv(options.env);
	if (envError) return {
		data: null,
		error: new AuthError(envError.message, envError.code, 500)
	};
	const modes = Array.isArray(options.allow) ? options.allow : [options.allow];
	for (const mode of modes) {
		const result = await tryMode(mode, credentials, env);
		if (result) return {
			data: result,
			error: null
		};
	}
	return {
		data: null,
		error: new AuthError("Invalid credentials", "INVALID_CREDENTIALS", 401)
	};
}

//#endregion
//#region src/core/verify-auth.ts
async function verifyAuth(request, options) {
	return verifyCredentials(extractCredentials(request), options);
}

//#endregion
//#region src/core/create-supabase-context.ts
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
export { createContextClient as a, AuthError as c, extractCredentials as i, EnvError as l, verifyAuth as n, createAdminClient as o, verifyCredentials as r, resolveEnv as s, createSupabaseContext as t };