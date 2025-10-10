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

// Game persistence interface
interface SavedGameState {
  gameId: string
  foundWords: string[]
  currentHintWordIndex: number
  hintLevel: number
  timer: number
  gameState: 'not-started' | 'playing' | 'ended'
  currentWord: string
  savedAt: number
}

// Generate unique game ID
const generateGameId = () => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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
  const [showEndModal, setShowEndModal] = useState(false)
  const [timer, setTimer] = useState(0) // in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [gameId, setGameId] = useState<string>("")
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(null)

  const currentHintWord = hintWords[currentHintWordIndex] || null

  // localStorage functions
  const saveGameToStorage = useCallback(() => {
    if (typeof window === "undefined" || !gameId || gameState === 'not-started') return
    
    const gameData: SavedGameState = {
      gameId,
      foundWords,
      currentHintWordIndex,
      hintLevel,
      timer,
      gameState,
      currentWord,
      savedAt: Date.now()
    }
    
    try {
      localStorage.setItem('wordflower_game', JSON.stringify(gameData))
    } catch (error) {
      console.error('Failed to save game:', error)
    }
  }, [gameId, foundWords, currentHintWordIndex, hintLevel, timer, gameState, currentWord])

  const loadGameFromStorage = useCallback((): SavedGameState | null => {
    if (typeof window === "undefined") return null
    
    try {
      const saved = localStorage.getItem('wordflower_game')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load game:', error)
      localStorage.removeItem('wordflower_game')
    }
    return null
  }, [])

  const clearSavedGame = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem('wordflower_game')
    }
  }, [])

  // Timer functionality with tab visibility support
  useEffect(() => {
    if (gameState === 'playing' && isTabVisible) {
      const id = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      setIntervalId(id)
      return () => clearInterval(id)
    } else if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [gameState, isTabVisible])

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Save game on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameToStorage()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveGameToStorage])

  // Auto-save game state periodically and on state changes
  useEffect(() => {
    if (gameState === 'playing') {
      saveGameToStorage()
    }
  }, [foundWords, currentHintWordIndex, hintLevel, timer, saveGameToStorage, gameState])

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Game control functions
  const startGame = () => {
    const newGameId = generateGameId()
    setGameId(newGameId)
    setGameState('playing')
    setShowStartModal(false)
    setTimer(0)
    clearSavedGame() // Clear any previous saved game
    toast.success("Game started! Good luck! 🌻")
  }

  const endGame = () => {
    setGameState('ended')
    setShowEndModal(true)
    clearSavedGame() // Clear saved game when officially ended
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  const resetGame = () => {
    setGameState('not-started')
    setShowStartModal(true)
    setShowEndModal(false)
    setCurrentWord("")
    setFoundWords([])
    setHintLevel(0)
    setCurrentHintWordIndex(0)
    setTimer(0)
    setGameId("")
    clearSavedGame()
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  const resumeGame = (savedGame: SavedGameState) => {
    setGameId(savedGame.gameId)
    setFoundWords(savedGame.foundWords)
    setCurrentHintWordIndex(savedGame.currentHintWordIndex)
    setHintLevel(savedGame.hintLevel)
    setTimer(savedGame.timer)
    setGameState(savedGame.gameState)
    setCurrentWord(savedGame.currentWord)
    setShowStartModal(false)
    
    if (savedGame.gameState === 'playing') {
      toast.success("Game resumed! 🌻")
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

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadGameFromStorage()
    if (saved && saved.gameState === 'playing') {
      // Check if saved game is not too old (e.g., within 24 hours)
      const hoursSinceLastSave = (Date.now() - saved.savedAt) / (1000 * 60 * 60)
      if (hoursSinceLastSave < 24) {
        setSavedGame(saved)
      } else {
        clearSavedGame() // Clear old saved games
      }
    }
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
                    {!isTabVisible && (
                      <span className="text-sm text-orange-500 block">⏸️ Paused</span>
                    )}
                  </div>
                  <Button onClick={endGame} variant="destructive" size="sm">
                    End Game
                  </Button>
                </div>
              )}
              {gameState === 'ended' && (
                <div className="text-right">
                  <div className="text-lg text-muted-foreground">
                    Game Ended - {formatTime(timer)}
                  </div>
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
              {savedGame && (
                <span className="block mt-2 text-primary font-medium">
                  Found a saved game with {savedGame.foundWords.length} words and {formatTime(savedGame.timer)} played!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {savedGame ? (
              <>
                <Button onClick={startGame} variant="outline" className="flex-1">
                  New Game
                </Button>
                <Button onClick={() => resumeGame(savedGame)} size="lg" className="flex-1">
                  Resume Game
                </Button>
              </>
            ) : (
              <Button onClick={startGame} size="lg" className="w-full">
                Start Game
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Game Modal */}
      <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Game Complete!</DialogTitle>
            <DialogDescription>
              Congratulations on completing your word-finding adventure!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-primary">{foundWords.length}</div>
                <div className="text-sm text-muted-foreground">Words Found</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-primary">{formatTime(timer)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {validWords.length > 0 ? Math.round((foundWords.length / validWords.length) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">
                Completion Rate ({foundWords.length} of {validWords.length} words)
              </div>
            </div>

            {foundWords.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Words You Found:</h4>
                <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {foundWords.map((word, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button onClick={() => setShowEndModal(false)} variant="outline">
              Close
            </Button>
            <Button onClick={resetGame} size="lg">
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
