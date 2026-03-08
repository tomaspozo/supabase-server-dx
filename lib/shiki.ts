import { codeToHtml } from "shiki"
import { unstable_cache } from "next/cache"

export const highlightCode = unstable_cache(
  async (code: string, lang: string = "typescript") => {
    try {
      return await codeToHtml(code, {
        lang,
        themes: {
          light: "one-light",
          dark: "one-dark-pro",
        },
      })
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return `<pre><code>${code}</code></pre>`
      }
      throw e
    }
  },
  ["shiki-highlight"],
  { revalidate: false }
)
