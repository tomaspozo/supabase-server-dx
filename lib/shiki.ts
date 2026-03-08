import { codeToHtml } from "shiki"
import { unstable_cache } from "next/cache"

export const highlightCode = unstable_cache(
  async (code: string, lang: string = "typescript") => {
    return codeToHtml(code, {
      lang,
      themes: {
        light: "one-light",
        dark: "one-dark-pro",
      },
    })
  },
  ["shiki-highlight"],
  { revalidate: false }
)
