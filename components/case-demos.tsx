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
} from "@/components/ui/card"
import {
  CollapsibleSnippet,
  AuthBadge,
  PulsingDot,
} from "@/components/edge-function-demos"
import { type CaseDemo } from "@/lib/cases"

function TypeBadge({ type }: { type: CaseDemo["type"] }) {
  const label = { ef: "Edge Function", hono: "Hono", next: "Next.js" }[type]
  return (
    <span className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  )
}

export function CaseDemos({
  demos,
  highlightedSnippets,
}: {
  demos: CaseDemo[]
  highlightedSnippets?: Record<string, string>
}) {
  const [results, setResults] = useState<
    Record<string, { data?: unknown; error?: string; loading?: boolean }>
  >({})

  async function runDemo(demo: CaseDemo) {
    setResults((prev) => ({ ...prev, [demo.name]: { loading: true } }))

    try {
      let res: Response

      if (demo.type === "next") {
        // Next.js API route — session is sent via cookies automatically
        res = await fetch(demo.apiPath!)
      } else {
        // Edge function (ef or hono) — send auth header
        const supabase = createClient()
        const token =
          (await supabase.auth.getSession()).data.session?.access_token ??
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${demo.path ?? demo.name}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            },
          }
        )
      }

      const data = await res.json()

      if (!res.ok) {
        setResults((prev) => ({
          ...prev,
          [demo.name]: { error: JSON.stringify(data, null, 2) },
        }))
        return
      }

      setResults((prev) => ({ ...prev, [demo.name]: { data } }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [demo.name]: {
          error: err instanceof Error ? err.message : String(err),
        },
      }))
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {demos.map((demo) => {
        const result = results[demo.name]
        return (
          <Card key={demo.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{demo.title}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={demo.type} />
                  <AuthBadge mode={demo.authMode} />
                </div>
              </div>
              <CardDescription>{demo.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <CollapsibleSnippet
                snippet={demo.snippet}
                highlightedHtml={highlightedSnippets?.[demo.name]}
              />

              {result?.loading && (
                <p className="flex items-center text-sm text-muted-foreground">
                  <PulsingDot />
                  Running...
                </p>
              )}

              {result?.error && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Error
                  </span>
                  <pre className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive whitespace-pre-wrap break-all">
                    {result.error}
                  </pre>
                </div>
              )}

              {"data" in (result ?? {}) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Response
                  </span>
                  <pre className="rounded-md border-l-2 border-primary/20 bg-muted p-3 text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto">
                    {JSON.stringify(result!.data, null, 2)}
                  </pre>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => runDemo(demo)}
                disabled={result?.loading}
              >
                Run
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
