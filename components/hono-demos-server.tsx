import { highlightCode } from "@/lib/shiki"
import { honoDemos } from "@/lib/demos"
import { EdgeFunctionDemos } from "@/components/edge-function-demos"

export async function HonoDemosServer() {
  const highlightedSnippets: Record<string, string> = {}

  await Promise.all(
    honoDemos.map(async (demo) => {
      highlightedSnippets[demo.name] = await highlightCode(demo.snippet, "typescript")
    })
  )

  return <EdgeFunctionDemos demos={honoDemos} highlightedSnippets={highlightedSnippets} />
}
