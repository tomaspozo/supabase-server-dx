"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { edgeFunctionDemos, type Demo } from "@/lib/demos"

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className={`inline-block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CollapsibleSnippet({
  snippet,
  highlightedHtml,
}: {
  snippet: string
  highlightedHtml?: string
}) {
  const [open, setOpen] = useState(false)
  const codeRef = useRef<HTMLDivElement & HTMLPreElement>(null)
  const [needsCollapse, setNeedsCollapse] = useState(false)

  useEffect(() => {
    if (codeRef.current) {
      setNeedsCollapse(codeRef.current.scrollHeight > 144)
    }
  }, [snippet, highlightedHtml])

  return (
    <div className="relative">
      {highlightedHtml ? (
        <div
          ref={codeRef}
          className={`shiki-wrapper text-xs leading-relaxed overflow-x-auto transition-[max-height] duration-300 ease-in-out ${
            !open && needsCollapse ? "max-h-36 overflow-hidden" : "max-h-112 overflow-auto"
          }`}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre
          ref={codeRef}
          className={`rounded-md border bg-muted/40 p-4 text-xs leading-relaxed font-mono text-muted-foreground overflow-x-auto transition-[max-height] duration-300 ease-in-out ${
            !open && needsCollapse ? "max-h-36 overflow-hidden" : "max-h-112 overflow-auto"
          }`}
        >
          <code>{snippet}</code>
        </pre>
      )}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 ${
            !open
              ? "absolute inset-x-0 bottom-0 flex items-end justify-center bg-linear-to-t from-white from-15% dark:from-card dark:from-15% to-transparent pt-16 pb-2"
              : "mt-1.5 w-full justify-center"
          }`}
        >
          <ChevronIcon open={open} />
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

export function AuthBadge({ mode }: { mode: string }) {
  const colorClass = (() => {
    switch (mode) {
      case "always":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "secret":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  })()

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {mode}
    </span>
  )
}

export function PulsingDot() {
  return (
    <span className="relative mr-2 inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground/40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
    </span>
  )
}

export function EdgeFunctionDemos({
  highlightedSnippets,
}: {
  highlightedSnippets?: Record<string, string>
}) {
  const [results, setResults] = useState<Record<string, { data?: unknown; error?: string; loading?: boolean }>>({})

  async function runDemo(demo: Demo) {
    setResults((prev) => ({ ...prev, [demo.name]: { loading: true } }))

    try {
      let data: unknown

      if (demo.useProxy) {
        const res = await fetch("/api/demo-secret-admin")
        data = await res.json()
        if (!res.ok) {
          setResults((prev) => ({
            ...prev,
            [demo.name]: { error: JSON.stringify(data, null, 2) },
          }))
          return
        }
      } else {
        const supabase = createClient()
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${demo.path ?? demo.name}`,
          {
            headers: {
              "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}`,
              "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            },
          }
        )
        data = await res.json()
        if (!res.ok) {
          setResults((prev) => ({
            ...prev,
            [demo.name]: { error: JSON.stringify(data, null, 2) },
          }))
          return
        }
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
    <div className="grid gap-6 sm:grid-cols-2">
      {edgeFunctionDemos.map((demo) => {
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
