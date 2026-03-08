import { highlightCode } from "@/lib/shiki"
import { edgeFunctionDemos } from "@/lib/demos"
import { EdgeFunctionDemos } from "@/components/edge-function-demos"

export async function EdgeFunctionDemosServer() {
  const highlightedSnippets: Record<string, string> = {}

  await Promise.all(
    edgeFunctionDemos.map(async (demo) => {
      highlightedSnippets[demo.name] = await highlightCode(demo.snippet, "typescript")
    })
  )

  return <EdgeFunctionDemos highlightedSnippets={highlightedSnippets} />
}
