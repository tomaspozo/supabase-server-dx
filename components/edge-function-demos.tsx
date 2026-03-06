"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

interface Demo {
  name: string
  title: string
  authMode: string
  description: string
  useProxy?: boolean
}

const demos: Demo[] = [
  {
    name: "demo-user-profile",
    title: "User Profile",
    authMode: "user",
    description:
      "Requires a valid JWT. Returns your identity from the Supabase context. Uses withSupabase.",
  },
  {
    name: "demo-public-status",
    title: "Public Status",
    authMode: "always",
    description:
      "Fully public, no auth needed. Returns server time and Deno runtime info. Uses withSupabase.",
  },
  {
    name: "demo-secret-admin",
    title: "Admin (Secret Key)",
    authMode: "secret",
    description:
      "Requires the secret API key. Lists users via admin client. Invoked through a server-side proxy.",
    useProxy: true,
  },
  {
    name: "demo-multi-auth",
    title: "Multi-Auth",
    authMode: "user, always",
    description:
      'Accepts both authenticated and anonymous requests. Returns a personalized or generic greeting. Uses withSupabase.',
  },
  {
    name: "demo-context-primitive",
    title: "Context Primitive",
    authMode: "user",
    description:
      "Same as User Profile but uses createSupabaseContext directly with manual CORS and error handling.",
  },
]

function AuthBadge({ mode }: { mode: string }) {
  return (
    <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {mode}
    </span>
  )
}

export function EdgeFunctionDemos() {
  const [results, setResults] = useState<Record<string, { data?: unknown; error?: string; loading?: boolean }>>({})

  async function runDemo(demo: Demo) {
    setResults((prev) => ({ ...prev, [demo.name]: { loading: true } }))

    try {
      let data: unknown

      if (demo.useProxy) {
        const res = await fetch("/api/demo-secret-admin")
        data = await res.json()
        if (!res.ok) throw new Error((data as Record<string, string>).error ?? res.statusText)
      } else {
        const supabase = createClient()
        const { data: fnData, error } = await supabase.functions.invoke(demo.name)
        if (error) throw error
        data = fnData
      }

      setResults((prev) => ({ ...prev, [demo.name]: { data } }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [demo.name]: { error: err instanceof Error ? err.message : String(err) },
      }))
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {demos.map((demo) => {
        const result = results[demo.name]
        return (
          <Card key={demo.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{demo.title}</CardTitle>
                <AuthBadge mode={demo.authMode} />
              </div>
              <CardDescription>{demo.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {result?.loading && (
                <p className="text-sm text-muted-foreground">Running...</p>
              )}
              {result?.error && (
                <pre className="text-xs text-destructive whitespace-pre-wrap break-all">
                  {result.error}
                </pre>
              )}
              {'data' in (result ?? {}) && (
                <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-all max-h-48 overflow-auto">
                  {JSON.stringify(result!.data, null, 2)}
                </pre>
              )}
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runDemo(demo)}
                disabled={result?.loading}
              >
                Run
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
