/**
 * Next.js adapter for createSupabaseContext
 *
 * Uses core primitives from @supabase/edge-functions/core to verify auth
 * and create Supabase clients. The only Next.js-specific logic is reading
 * the access token from cookies (bridging @supabase/ssr's chunked format).
 *
 * Core primitives used:
 * - resolveEnv      → reads SUPABASE_URL, keys, JWKS from env
 * - verifyCredentials → verifies JWT via JWKS (no throwaway client needed)
 * - createContextClient → user-scoped client with RLS
 * - createAdminClient   → admin client that bypasses RLS
 *
 * Usage in a Server Component, Server Action, or Route Handler:
 *
 *   const { data: ctx, error } = await createSupabaseContext();
 *   if (error) redirect("/auth/login");
 *   const { supabase, supabaseAdmin, user, claims } = ctx;
 */
import { cookies } from "next/headers";
import {
  verifyCredentials,
  createContextClient,
  createAdminClient,
  type AllowWithKey,
  type SupabaseContext,
  type SupabaseEnv,
} from "@/supabase/functions/_shared/server-dist/index.mjs";

const BASE64_PREFIX = "base64-";

/**
 * Reads the access token from Supabase session cookies.
 *
 * Handles the chunked, base64-encoded format that @supabase/ssr uses:
 *   sb-<ref>-auth-token      (single cookie)
 *   sb-<ref>-auth-token.0    (chunked)
 *   sb-<ref>-auth-token.1
 *   ...
 */
function getAccessTokenFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  url: string,
): string | null {
  // Extract project ref from URL — used as cookie key prefix
  // e.g. "https://abc123.supabase.co" → "abc123"
  // e.g. "http://127.0.0.1:54321" → "127"
  const ref = new URL(url).hostname.split(".")[0];
  const storageKey = `sb-${ref}-auth-token`;

  // Try single cookie first, then chunked
  let raw = cookieStore.get(storageKey)?.value ?? null;

  if (!raw) {
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = cookieStore.get(`${storageKey}.${i}`)?.value;
      if (!chunk) break;
      chunks.push(chunk);
    }
    if (chunks.length > 0) {
      raw = chunks.join("");
    }
  }

  if (!raw) return null;

  // Decode base64url if needed
  let decoded = raw;
  if (decoded.startsWith(BASE64_PREFIX)) {
    try {
      const base64 = decoded
        .substring(BASE64_PREFIX.length)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      decoded = atob(base64);
    } catch {
      return null;
    }
  }

  // Parse the session JSON and extract access_token
  try {
    const session = JSON.parse(decoded);
    return session.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Bridge Next.js env vars to the SupabaseEnv shape expected by core primitives.
 *
 * Next.js uses NEXT_PUBLIC_SUPABASE_URL, SB_PUBLISHABLE_KEY, SB_SECRET_KEY.
 * Core expects SUPABASE_URL, SUPABASE_PUBLISHABLE_KEYS, SUPABASE_SECRET_KEYS, SUPABASE_JWKS.
 */
function resolveNextEnv(): Partial<SupabaseEnv> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SB_PUBLISHABLE_KEY;
  const secretKey = process.env.SB_SECRET_KEY;

  return {
    url: url ?? undefined,
    publishableKeys: publishableKey
      ? [{ name: "default", key: publishableKey }]
      : [],
    secretKeys: secretKey ? [{ name: "default", key: secretKey }] : [],
    // JWKS is fetched at startup and cached — see fetchJwks()
  };
}

let cachedJwks: SupabaseEnv["jwks"] = null;

/**
 * Fetches JWKS from the Supabase Auth server's well-known endpoint.
 * Cached after first successful fetch.
 */
async function fetchJwks(): Promise<SupabaseEnv["jwks"]> {
  if (cachedJwks !== null) return cachedJwks;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url}/auth/v1/.well-known/jwks.json`);
    if (!res.ok) return null;
    cachedJwks = await res.json();
    return cachedJwks;
  } catch {
    return null;
  }
}

export async function createSupabaseContext(
  options: { allow?: AllowWithKey | AllowWithKey[] } = { allow: "user" },
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  const nextEnv = resolveNextEnv();

  if (!nextEnv.url) {
    return {
      data: null,
      error: new Error("Missing SUPABASE_URL"),
    };
  }

  // Bridge: extract token from cookies (Next.js-specific)
  const cookieStore = await cookies();
  const token = getAccessTokenFromCookies(cookieStore, nextEnv.url);

  // Fetch JWKS for JWT verification
  const jwks = await fetchJwks();
  const env: Partial<SupabaseEnv> = { ...nextEnv, jwks };

  // Use core primitive: verifyCredentials
  // In edge functions, credentials come from headers (extractCredentials).
  // In Next.js, the token comes from cookies — we pass it directly.
  const { data: auth, error } = await verifyCredentials(
    { token, apikey: null },
    { allow: options.allow ?? "user", env },
  );

  if (error) {
    return { data: null, error };
  }

  // Use core primitives: createContextClient + createAdminClient
  const supabase = createContextClient(auth.token, env);
  const supabaseAdmin = createAdminClient(env);

  return {
    data: {
      supabase,
      supabaseAdmin,
      user: auth.user,
      claims: auth.claims,
      authType: auth.authType,
    },
    error: null,
  };
}
