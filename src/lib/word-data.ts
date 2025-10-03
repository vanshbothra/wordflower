// Word list with hints for the game
export interface WordHints {
  word: string
  relatedWord: string
  synonym: string
  phrase: string
  fillInBlank: string
  blankLetters: [number, number] // indices of letters to show
}

// Sample word list for LOGICAL letters
export const GAME_DATA = {
  centerLetter: "G",
  outerLetters: ["L", "O", "I", "C", "A", "E"],
  words: [
    {
      word: "LEGAL",
      relatedWord: "lawyer",
      synonym: "lawful",
      phrase: "It is legal to park here on weekends",
      fillInBlank: "L_G_L",
      blankLetters: [0, 2] as [number, number],
    },
    {
      word: "LOGIC",
      relatedWord: "reasoning",
      synonym: "rationale",
      phrase: "Your logic makes perfect sense",
      fillInBlank: "L_G_C",
      blankLetters: [0, 2] as [number, number],
    },
    {
      word: "LOGICAL",
      relatedWord: "rational",
      synonym: "reasonable",
      phrase: "That is a logical conclusion",
      fillInBlank: "L_GIC_L",
      blankLetters: [0, 4] as [number, number],
    },
    {
      word: "GALE",
      relatedWord: "storm",
      synonym: "windstorm",
      phrase: "The gale knocked down several trees",
      fillInBlank: "G_L_",
      blankLetters: [0, 2] as [number, number],
    },
    {
      word: "GOAL",
      relatedWord: "target",
      synonym: "objective",
      phrase: "My goal is to finish by Friday",
      fillInBlank: "G__L",
      blankLetters: [0, 3] as [number, number],
    },
    {
      word: "CAGE",
      relatedWord: "enclosure",
      synonym: "pen",
      phrase: "The bird flew out of its cage",
      fillInBlank: "C_G_",
      blankLetters: [0, 2] as [number, number],
    },
    {
      word: "AGILE",
      relatedWord: "nimble",
      synonym: "quick",
      phrase: "The cat is very agile",
      fillInBlank: "_GIL_",
      blankLetters: [1, 4] as [number, number],
    },
    {
      word: "ALGAE",
      relatedWord: "seaweed",
      synonym: "pond scum",
      phrase: "Green algae covered the pond",
      fillInBlank: "_LG__",
      blankLetters: [1, 2] as [number, number],
    },
  ] as WordHints[],
}

// Validate if a word can be formed from available letters
export function isValidWord(word: string, centerLetter: string, outerLetters: string[]): boolean {
  const upperWord = word.toUpperCase()
  const allLetters = [centerLetter, ...outerLetters]

  // Must contain center letter
  if (!upperWord.includes(centerLetter)) {
    return false
  }

  // All letters must be from available letters
  for (const letter of upperWord) {
    if (!allLetters.includes(letter)) {
      return false
    }
  }

  return true
}
