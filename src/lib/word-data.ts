export interface WordHints {
  word: string
  relatedWord?: string
  synonym?: string
  phrase?: string
  fillInBlank?: string
  blankLetters?: [number, number]
  count?: number
}

export const GAME_DATA = {
  centerLetter: "G",
  outerLetters: ["L", "O", "I", "C", "A", "E"],
  words: [] as WordHints[],
}

export function isValidWord(word: string, centerLetter: string, outerLetters: string[]): boolean {
  const upperWord = word.toUpperCase()
  const allLetters = [centerLetter, ...outerLetters].map((l) => l.toUpperCase())

  if (!upperWord.includes(centerLetter.toUpperCase())) return false

  for (const letter of upperWord) {
    if (!allLetters.includes(letter)) return false
  }

  return true
}

export function getValidWords(
  wordList: { word: string; count: number }[],
  centerLetter: string,
  outerLetters: string[],
  limit: number = 50
) {
  const letterSet = new Set([centerLetter, ...outerLetters].map((l) => l.toUpperCase()))

  return wordList
    .filter(({ word }) => {
      const w = word.toUpperCase()
      if (w.length < 4) return false
      if (!w.includes(centerLetter.toUpperCase())) return false
      for (const ch of w) {
        if (!letterSet.has(ch)) return false
      }
      return true
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
