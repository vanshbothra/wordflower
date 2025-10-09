"use client"

import { useState, useEffect, useCallback } from "react"
import { Flower } from "@/components/flower"
import { WordDisplay } from "@/components/word-display"
import { HintSystem } from "@/components/hint-system"
import { FoundWordsList } from "@/components/found-words-list"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { GAME_DATA, isValidWord, getValidWords, WordHints } from "@/lib/word-data"
import { fetchWordHints } from "@/lib/mw-api"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function WordflowerGame() {
  const [currentWord, setCurrentWord] = useState("")
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [hintLevel, setHintLevel] = useState(0)
  const [currentHintWordIndex, setCurrentHintWordIndex] = useState(0)

  const [validWords, setValidWords] = useState<string[]>([])
  const [hintWords, setHintWords] = useState<WordHints[]>([])

  // Game state management
  const [gameState, setGameState] = useState<'not-started' | 'playing' | 'ended'>('not-started')
  const [showStartModal, setShowStartModal] = useState(true)
  const [timer, setTimer] = useState(0) // in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  const currentHintWord = hintWords[currentHintWordIndex] || null

  // Timer functionality
  useEffect(() => {
    if (gameState === 'playing') {
      const id = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      setIntervalId(id)
      return () => clearInterval(id)
    } else if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [gameState])

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Game control functions
  const startGame = () => {
    setGameState('playing')
    setShowStartModal(false)
    setTimer(0)
    toast.success("Game started! Good luck! 🌻")
  }

  const endGame = () => {
    setGameState('ended')
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    toast.info(`Game ended! You found ${foundWords.length} words in ${formatTime(timer)}`)
  }

  const resetGame = () => {
    setGameState('not-started')
    setShowStartModal(true)
    setCurrentWord("")
    setFoundWords([])
    setHintLevel(0)
    setCurrentHintWordIndex(0)
    setTimer(0)
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  useEffect(() => {
    async function loadWords() {
      const res = await fetch("/data/words.json")
      const data: { word: string; count: number }[] = await res.json()

      const words = getValidWords(data, GAME_DATA.centerLetter, GAME_DATA.outerLetters, 60)
      setValidWords(words.map((w) => w.word))

      const cacheKey = "hintWordList"
      let cachedHints: WordHints[] = []

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(cacheKey)
        if (stored) {
          try {
            cachedHints = JSON.parse(stored)
          } catch {
            localStorage.removeItem(cacheKey)
          }
        }
      }

      if (cachedHints.length === 0) {
        const hints: WordHints[] = []
        const sample = [...words].sort(() => Math.random() - 0.5)
        for (const w of sample) {
          if (hints.length >= 10) break
          const hint = await fetchWordHints(w.word)
          if (hint) hints.push(hint)
        }
        setHintWords(hints)

        if (typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(hints))
        }
      } else {
        setHintWords(cachedHints)
      }
    }

    loadWords()
  }, [])

  const handleLetterClick = (letter: string) => setCurrentWord((prev) => prev + letter)
  const handleClear = () => setCurrentWord("")
  const handleBackspace = () => setCurrentWord((prev) => prev.slice(0, -1))

  const handleSubmit = useCallback(() => {
    if (gameState !== 'playing') {
      toast.error("Please start the game first!")
      return
    }

    if (currentWord.length < 4) {
      toast.error("Word too short")
      return
    }

    const upperWord = currentWord.toLowerCase()
    if (foundWords.includes(upperWord)) {
      toast.error("Word already found")
      return
    }
    if (!isValidWord(upperWord, GAME_DATA.centerLetter, GAME_DATA.outerLetters)) {
      toast.error("Word does not exist")
      return
    }

    if (validWords.includes(upperWord)) {
      setFoundWords((prev) => [...prev, upperWord])
      const encouragements = ["Great job!", "Well done!", "Excellent!", "Amazing!", "Fantastic!"]
      toast.success(`${encouragements[Math.floor(Math.random() * encouragements.length)]} ✓`)
      setCurrentWord("")
    } else {
      toast.error("Word not valid")
    }
  }, [currentWord, foundWords, validWords, gameState])

  const handleRequestHint = () => {
    if (hintLevel < 4) setHintLevel((prev) => prev + 1)
  }

  const handleSkipWord = () => {
    if (!hintWords.length) return
    let nextIndex = (currentHintWordIndex + 1) % hintWords.length
    let attempts = 0
    while (foundWords.includes(hintWords[nextIndex]?.word) && attempts < hintWords.length) {
      nextIndex = (nextIndex + 1) % hintWords.length
      attempts++
    }
    setCurrentHintWordIndex(nextIndex)
    setHintLevel(1) 
  }


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const allLetters = [GAME_DATA.centerLetter, ...GAME_DATA.outerLetters]
      if (allLetters.includes(key)) handleLetterClick(key)
      else if (e.key === "Enter") handleSubmit()
      else if (e.key === "Backspace") handleBackspace()
      else if (e.key === "Escape") handleClear()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentWord, foundWords, handleSubmit])

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-5xl font-bold text-foreground mb-2">🌻 Wordflower</h1>
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
              {gameState === 'playing' && (
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-foreground">
                    {formatTime(timer)}
                  </div>
                  <Button onClick={endGame} variant="destructive" size="sm">
                    End Game
                  </Button>
                </div>
              )}
              {gameState === 'ended' && (
                <div className="text-right">
                  <div className="text-lg text-muted-foreground mb-2">
                    Final Time: {formatTime(timer)}
                  </div>
                  <Button onClick={resetGame} size="sm">
                    Play Again
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-lg">Create words using the letters. Must include the center letter!</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <WordDisplay currentWord={currentWord} onClear={handleClear} onBackspace={handleBackspace} />
            <Flower
              centerLetter={GAME_DATA.centerLetter}
              outerLetters={GAME_DATA.outerLetters}
              currentWord={currentWord}
              onLetterClick={handleLetterClick}
            />
            <div className="mt-8 text-center">
              <Button 
                onClick={handleSubmit} 
                size="lg" 
                disabled={currentWord.length === 0 || gameState !== 'playing'}
              >
                Submit Word
              </Button>
            </div>
          </div>

          <div>
            <HintSystem
              currentHintWord={currentHintWord}
              hintLevel={hintLevel}
              onRequestHint={handleRequestHint}
              onSkipWord={handleSkipWord}
              foundWords={foundWords}
            />
            <FoundWordsList foundWords={foundWords} totalWords={validWords.length} />
          </div>
        </div>
      </div>

      {/* Start Game Modal */}
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Wordflower! 🌻</DialogTitle>
            <DialogDescription>
              Create as many words as you can using the available letters. 
              Each word must contain the center letter and be at least 4 letters long.
              Ready to start your word adventure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={startGame} size="lg" className="w-full">
              Start Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
