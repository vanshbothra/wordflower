"use client"

import { useState, useEffect, useCallback } from "react"
import { Flower } from "@/components/flower"
import { WordDisplay } from "@/components/word-display"
import { HintSystem } from "@/components/hint-system"
import { FoundWordsList } from "@/components/found-words-list"
import { Button } from "@/components/ui/button"
import { GAME_DATA, isValidWord } from "@/lib/word-data"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function WordflowerGame() {
  const [currentWord, setCurrentWord] = useState("")
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [currentHintWordIndex, setCurrentHintWordIndex] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)

  const currentHintWord = GAME_DATA.words[currentHintWordIndex]

  const handleLetterClick = (letter: string) => {
    setCurrentWord((prev) => prev + letter)
    setMessage("")
  }

  const handleClear = () => {
    setCurrentWord("")
    setMessage("")
  }

  const handleBackspace = () => {
    setCurrentWord((prev) => prev.slice(0, -1))
    setMessage("")
  }

  const handleSubmit = useCallback(() => {
    if (currentWord.length < 4) {
      toast.error("Word too short", {
        description: "Words must be at least 4 letters long",
      })
      return
    }

    const upperWord = currentWord.toUpperCase()

    // Check if word is already found
    if (foundWords.includes(upperWord)) {
      toast.error("Word already found", {
        description: `You've already found "${upperWord}"`,
      })
      return
    }

    // Check if word is valid
    if (!isValidWord(upperWord, GAME_DATA.centerLetter, GAME_DATA.outerLetters)) {
      toast.error("Word does not exist", {
        description: "Word must contain the center letter and use only available letters",
      })
      return
    }

    // Check if word is in the word list
    const isInWordList = GAME_DATA.words.some((w) => w.word === upperWord)

    if (isInWordList) {
      setFoundWords((prev) => [...prev, upperWord])
      const encouragements = ["Great job!", "Well done!", "Excellent!", "Amazing!", "Fantastic!"]
      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
      toast.success(`${randomEncouragement} ✓`, {
        description: `You found "${upperWord}"`,
        classNames: {
          toast: "bg-success text-success-foreground",
        },
      })
      setCurrentWord("")
    } else {
      toast.error("Word does not exist", {
        description: `"${upperWord}" is not in our word list`,
      })
    }
  }, [currentWord, foundWords])

  const handleRequestHint = () => {
    if (hintLevel < 4) {
      setHintLevel((prev) => prev + 1)
    }
  }

  const handleSkipWord = () => {
    // Move to next word that hasn't been found
    let nextIndex = (currentHintWordIndex + 1) % GAME_DATA.words.length
    let attempts = 0

    while (foundWords.includes(GAME_DATA.words[nextIndex].word) && attempts < GAME_DATA.words.length) {
      nextIndex = (nextIndex + 1) % GAME_DATA.words.length
      attempts++
    }

    setCurrentHintWordIndex(nextIndex)
    setHintLevel(0)
  }

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const allLetters = [GAME_DATA.centerLetter, ...GAME_DATA.outerLetters]

      if (allLetters.includes(key)) {
        handleLetterClick(key)
      } else if (e.key === "Enter") {
        handleSubmit()
      } else if (e.key === "Backspace") {
        handleBackspace()
      } else if (e.key === "Escape") {
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentWord, foundWords, handleSubmit])

  // Auto-advance hint when word is found
  useEffect(() => {
    if (foundWords.includes(currentHintWord.word)) {
      // Word was just found, user can click "Next Word" to continue
    }
  }, [foundWords, currentHintWord])

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-2">🌻 Wordflower</h1>
          <p className="text-muted-foreground text-lg">
            Create words using the letters. Must include the center letter!
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Game area */}
          <div>
            <WordDisplay currentWord={currentWord} onClear={handleClear} onBackspace={handleBackspace} />

            <Flower
              centerLetter={GAME_DATA.centerLetter}
              outerLetters={GAME_DATA.outerLetters}
              currentWord={currentWord}
              onLetterClick={handleLetterClick}
            />

            <div className="mt-8 text-center">
              <Button onClick={handleSubmit} size="lg" disabled={currentWord.length === 0} className="px-8">
                Submit Word
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to submit
              </p>
            </div>
          </div>

          {/* Right column - Hints and found words */}
          <div>
            <HintSystem
              currentHintWord={currentHintWord}
              hintLevel={hintLevel}
              onRequestHint={handleRequestHint}
              onSkipWord={handleSkipWord}
              foundWords={foundWords}
            />

            <FoundWordsList foundWords={foundWords} totalWords={GAME_DATA.words.length} />
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
