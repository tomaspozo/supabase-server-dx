import { highlightCode } from "@/lib/shiki"
import { testRouteDemos } from "@/lib/demos"
import { TestRouteDemos } from "@/components/test-route-demos"

export async function TestRouteDemosServer() {
  const highlightedSnippets: Record<string, string> = {}

  await Promise.all(
    testRouteDemos.map(async (demo) => {
      highlightedSnippets[demo.name] = await highlightCode(demo.snippet, "typescript")
    })
  )

  return <TestRouteDemos highlightedSnippets={highlightedSnippets} />
}
