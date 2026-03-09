let _supabase_supabase_js = require("@supabase/supabase-js");
let jose = require("jose");

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
	try {
		const parsed = JSON.parse(raw);
		return Object.entries(parsed).map(([name, key]) => ({
			name,
			key
		}));
	} catch {
		return [];
	}
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
	return (0, _supabase_supabase_js.createClient)(resolved.url, secretKey, { auth: {
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
	return (0, _supabase_supabase_js.createClient)(resolved.url, anonKey, {
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
				const jwkSet = (0, jose.createLocalJWKSet)(env.jwks);
				const { payload } = await (0, jose.jwtVerify)(credentials.token, jwkSet);
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
Object.defineProperty(exports, 'AuthError', {
  enumerable: true,
  get: function () {
    return AuthError;
  }
});
Object.defineProperty(exports, 'EnvError', {
  enumerable: true,
  get: function () {
    return EnvError;
  }
});
Object.defineProperty(exports, 'createAdminClient', {
  enumerable: true,
  get: function () {
    return createAdminClient;
  }
});
Object.defineProperty(exports, 'createContextClient', {
  enumerable: true,
  get: function () {
    return createContextClient;
  }
});
Object.defineProperty(exports, 'extractCredentials', {
  enumerable: true,
  get: function () {
    return extractCredentials;
  }
});
Object.defineProperty(exports, 'resolveEnv', {
  enumerable: true,
  get: function () {
    return resolveEnv;
  }
});
Object.defineProperty(exports, 'verifyAuth', {
  enumerable: true,
  get: function () {
    return verifyAuth;
  }
});
Object.defineProperty(exports, 'verifyCredentials', {
  enumerable: true,
  get: function () {
    return verifyCredentials;
  }
});