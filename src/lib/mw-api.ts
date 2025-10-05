import { WordHints } from "./word-data"

const API_THESAURUS_KEY = process.env.NEXT_PUBLIC_MWT_API_KEY
const THESAURUS_URL = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/"

export async function fetchWordHints(word: string): Promise<WordHints | null> {
  const cacheKey = `hint_${word.toLowerCase()}`
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached) as WordHints
      } catch {
        localStorage.removeItem(cacheKey) 
      }
    }
  }

  try {
    const res = await fetch(`${THESAURUS_URL}${word}?key=${API_THESAURUS_KEY}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]

    const definition = entry.shortdef?.[0]
    const synonym = entry.meta?.syns?.[0]?.[0]
    let usageExample = ""
    const def = entry.def?.[0]

    if (def?.sseq) {
      for (const seq of def.sseq) {
        for (const [type, content] of seq) {
          if (type === "sense" && content.dt) {
            for (const [dtType, dtContent] of content.dt) {
              if (dtType === "vis" && Array.isArray(dtContent)) {
                usageExample = dtContent[0]?.t || ""
                break
              }
            }
          }
        }
      }
    }

    if (!definition || !synonym || !usageExample) return null

    const example = usageExample.replace(/\{it\}(.*?)\{\/it\}/g, "______")
    const fillInBlank = word[0] + "_".repeat(word.length - 2) + word[word.length - 1]

    const hint: WordHints = {
      word: word.toUpperCase(),
      relatedWord: definition,
      synonym,
      phrase: example,
      fillInBlank,
      blankLetters: [1, word.length - 2],
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(hint))
    }

    return hint
  } catch (err) {
    return null
  }
}
