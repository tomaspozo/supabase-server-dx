/**
 * Cookie-based Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Uses @supabase/ssr to create a client that reads/writes auth cookies directly.
 * Best for auth flows that need cookie mutation (e.g., auth/confirm, sign-out).
 *
 * For JWKS-verified auth with user/claims context, use createSupabaseContext() from ./context.ts.
 * For session refresh in the proxy middleware, see ./proxy.ts.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: "api" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
