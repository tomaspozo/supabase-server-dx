import { highlightCode } from "@/lib/shiki"
import { caseDemos } from "@/lib/cases"
import { CaseDemos } from "@/components/case-demos"

export async function CaseDemosServer() {
  const highlightedSnippets: Record<string, string> = {}

  await Promise.all(
    caseDemos.map(async (demo) => {
      highlightedSnippets[demo.name] = await highlightCode(demo.snippet, "typescript")
    })
  )

  return <CaseDemos demos={caseDemos} highlightedSnippets={highlightedSnippets} />
}
