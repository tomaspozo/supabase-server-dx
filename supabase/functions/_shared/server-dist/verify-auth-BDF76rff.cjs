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
function parseKeys(raw) {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
		return parsed;
	} catch {
		return {};
	}
}
function resolveKeys(singularVar, pluralVar) {
	const plural = getEnvVar(pluralVar);
	if (plural) return parseKeys(plural);
	const singular = getEnvVar(singularVar);
	if (singular) return { default: singular };
	return {};
}
function parseJwks(raw) {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return { keys: parsed };
		return parsed;
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
			publishableKeys: overrides?.publishableKeys ?? resolveKeys("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEYS"),
			secretKeys: overrides?.secretKeys ?? resolveKeys("SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEYS"),
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
	const secretKey = resolved.secretKeys["default"];
	if (!secretKey) throw new EnvError("No default secret key found. Set SUPABASE_SECRET_KEY or include a \"default\" entry in SUPABASE_SECRET_KEYS.", "MISSING_SECRET_KEY");
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
	const anonKey = resolved.publishableKeys["default"];
	if (!anonKey) throw new EnvError("No default publishable key found. Set SUPABASE_PUBLISHABLE_KEY or include a \"default\" entry in SUPABASE_PUBLISHABLE_KEYS.", "MISSING_PUBLISHABLE_KEY");
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
		token: authHeader?.startsWith("Bearer ") ? authHeader.slice(7) || null : null,
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
	const base = mode.slice(0, colonIndex);
	const keyName = mode.slice(colonIndex + 1);
	if (!keyName) return {
		base,
		keyName: null
	};
	return {
		base,
		keyName
	};
}
function claimsToUserClaims(claims) {
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
			userClaims: null,
			claims: null
		};
		case "public": {
			if (!credentials.apikey) return null;
			const keys = env.publishableKeys;
			if (keyName === "*") {
				for (const value of Object.values(keys)) if (await timingSafeEqual(credentials.apikey, value)) return {
					authType: "public",
					token: null,
					userClaims: null,
					claims: null
				};
			} else {
				const value = keys[keyName ?? "default"];
				if (value && await timingSafeEqual(credentials.apikey, value)) return {
					authType: "public",
					token: null,
					userClaims: null,
					claims: null
				};
			}
			return null;
		}
		case "secret": {
			if (!credentials.apikey) return null;
			const keys = env.secretKeys;
			if (keyName === "*") {
				for (const value of Object.values(keys)) if (await timingSafeEqual(credentials.apikey, value)) return {
					authType: "secret",
					token: null,
					userClaims: null,
					claims: null
				};
			} else {
				const value = keys[keyName ?? "default"];
				if (value && await timingSafeEqual(credentials.apikey, value)) return {
					authType: "secret",
					token: null,
					userClaims: null,
					claims: null
				};
			}
			return null;
		}
		case "user":
			if (!credentials.token) return null;
			if (!env.jwks) return null;
			try {
				const jwkSet = (0, jose.createLocalJWKSet)(env.jwks);
				const { payload } = await (0, jose.jwtVerify)(credentials.token, jwkSet);
				if (typeof payload.sub !== "string") return null;
				const claims = payload;
				return {
					authType: "user",
					token: credentials.token,
					userClaims: claimsToUserClaims(claims),
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