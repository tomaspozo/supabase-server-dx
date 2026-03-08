"use client"

import { useState } from "react"
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
import { testRouteDemos, type TestRouteDemo } from "@/lib/demos"

function RouteTypeBadge({ type }: { type: "api" | "page" }) {
  return (
    <span className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {type === "api" ? "API Route" : "Page"}
    </span>
  )
}

export function TestRouteDemos({
  highlightedSnippets,
}: {
  highlightedSnippets?: Record<string, string>
}) {
  const [results, setResults] = useState<
    Record<string, { data?: unknown; error?: string; loading?: boolean }>
  >({})

  async function runDemo(demo: TestRouteDemo) {
    if (demo.routeType === "page") {
      window.open(demo.path, "_blank")
      return
    }

    setResults((prev) => ({ ...prev, [demo.name]: { loading: true } }))

    try {
      const res = await fetch(demo.path)
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
      {testRouteDemos.map((demo) => {
        const result = results[demo.name]
        return (
          <Card key={demo.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{demo.title}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <RouteTypeBadge type={demo.routeType} />
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
                {demo.routeType === "page" ? "Open in new tab" : "Run"}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
