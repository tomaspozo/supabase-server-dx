import { Suspense } from "react"
import { createSupabaseContext } from "@/lib/supabase/context"

async function ContextResult() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" })

  if (error) {
    return (
      <p style={{ color: "red" }}>
        Authentication required. <a href="/auth/login">Sign in</a> to view context.
      </p>
    )
  }

  return (
    <pre>
      {JSON.stringify(
        { authType: ctx.authType, user: ctx.user, claims: ctx.claims },
        null,
        2,
      )}
    </pre>
  )
}

export default function TestContextPage() {
  return (
    <div>
      <h2>createSupabaseContext result</h2>
      <nav style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        <a href="/api/test-context-public">/api/test-context-public</a>
        <a href="/api/test-context">/api/test-context</a>
        <a href="/test-context">/test-context</a>
      </nav>
      <Suspense fallback={<p>Loading...</p>}>
        <ContextResult />
      </Suspense>
    </div>
  )
}
