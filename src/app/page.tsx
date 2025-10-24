"use client"

import { useState, useEffect, useCallback } from "react"
import { Flower } from "@/components/flower"
import { WordDisplay } from "@/components/word-display"
import { HintSystem } from "@/components/hint-system"
import { FoundWordsList } from "@/components/found-words-list"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { isValidWord, WordHints } from "@/lib/word-data"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { LightbulbIcon, ShuffleIcon } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import FoundWordsAccordion from "@/components/foundWordsAccordion"
import { Card } from "@/components/ui/card"

export interface GameData {
  gameId: string
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

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
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

export default function WordflowerGame() {
  const isMobile = useMediaQuery("(max-width: 1025px)")
  const [currentWord, setCurrentWord] = useState("")
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [hintLevel, setHintLevel] = useState(0)
  const [currentHintWordIndex, setCurrentHintWordIndex] = useState(0)
  const [viewedHintsIndex, setViewedHintsIndex] = useState<number[]>([])
  const [showHint, setShowHint] = useState(false)
  const [allWords, setAllWords] = useState<string[]>([])

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [hintWords, setHintWords] = useState<WordHints[]>([])

  // Game state management
  const [gameState, setGameState] = useState<'not-started' | 'playing' | 'ended'>('not-started')
  const [showStartModal, setShowStartModal] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [timer, setTimer] = useState(0)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(null)

  const currentHintWord = hintWords[currentHintWordIndex] || null

  // Analytics logging function
  const logAnalyticsEvent = useCallback(async (eventType: string, eventData: any = {}) => {
    if (!gameData?.gameId) return

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameData.gameId,
          eventType,
          eventData
        })
      })
    } catch (error) {
      console.error('Failed to log analytics event:', error)
    }
  }, [gameData?.gameId])

  // Update game metadata in analytics
  const updateGameMetadata = useCallback(async () => {
    if (!gameData?.gameId) return

    try {
      // Use a ref to get current timer value or pass it as parameter      
      await fetch('/api/analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameData.gameId,
          gameMetadata: {
            totalWords: gameData.wordCount,
            wordsFound: foundWords.length,
            totalTime: timer,
            gameState
          }
        })
      })
    } catch (error) {
      console.error('Failed to update game metadata:', error)
    }
  }, [gameData?.gameId, foundWords.length, timer, gameState])

  // Helper function to update metadata with current timer value
  // const updateGameMetadataWithCurrentTime = useCallback(async () => {
  //   if (!gameId) return

  //   try {
  //     await fetch('/api/analytics', {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         gameId,
  //         gameMetadata: {
  //           totalWords: validWords.length,
  //           wordsFound: foundWords.length,
  //           totalTime: timer,
  //           gameState
  //         }
  //       })
  //     })
  //   } catch (error) {
  //     console.error('Failed to update game metadata:', error)
  //   }
  // }, [gameId, validWords.length, foundWords.length, timer, gameState])

  // localStorage functions
  const saveGameToStorage = useCallback(() => {
    if (typeof window === "undefined" || !gameData || gameState === 'not-started') return

    const saveData: SavedGameState = {
      gameId: gameData.gameId,
      foundWords,
      currentHintWordIndex,
      hintLevel,
      timer,
      gameState,
      currentWord,
      savedAt: Date.now(),
      centerLetter: gameData.centerLetter,
      outerLetters: gameData.outerLetters,
      wordCount: gameData.wordCount,
      pangramCount: gameData.pangramCount
    }

    try {
      localStorage.setItem('wordflower_game', JSON.stringify(saveData))
    } catch (error) {
      console.error('Failed to save game:', error)
    }
  }, [gameData, foundWords, currentHintWordIndex, hintLevel, timer, gameState, currentWord])

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
      const newVisibility = !document.hidden
      setIsTabVisible(newVisibility)

      if (gameState === 'playing') {
        logAnalyticsEvent('tab_visibility_changed', {
          isVisible: newVisibility,
          currentTime: timer,
          wordsFound: foundWords.length
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [gameState, timer, foundWords.length, logAnalyticsEvent])

  // Save game on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameToStorage()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveGameToStorage])

  // Auto-save game state and update metadata on specific events
  useEffect(() => {
    if (gameState === 'playing') {
      saveGameToStorage()
      // updateGameMetadata()
    }
  }, [foundWords, currentHintWordIndex, hintLevel, saveGameToStorage, timer, gameState])

  // Periodic metadata update every 30 seconds during gameplay
  useEffect(() => {
    let metadataIntervalId: NodeJS.Timeout | null = null

    if (gameState === 'playing') {
      metadataIntervalId = setInterval(() => {
        updateGameMetadata()
      }, 30000) // Update every 30 seconds
    }

    return () => {
      if (metadataIntervalId) {
        clearInterval(metadataIntervalId)
      }
    }
  }, [gameState, updateGameMetadata])

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Load new game from server
  const loadNewGame = async () => {
    try {
      const response = await fetch('/api/game', { method: 'POST' })
      const data: GameData = await response.json()
      setGameData(data)
      return data
    } catch (error) {
      console.error('Failed to load game:', error)
      toast.error("Failed to load game")
      return null
    }
  }

  const fetchHints = async (gameId: string) => {
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      })
      if (!res.ok) throw new Error("Failed to fetch hints")
      return await res.json()
    } catch (err) {
      console.error(err)
      return []
    }
  }

  useEffect(() => {
    if (gameData?.gameId) {
      fetchHints(gameData.gameId).then(setHintWords)
    }
  }, [gameData?.gameId])


  // Game control functions
  const startGame = async () => {
    const newGame = await loadNewGame()
    if (!newGame) return

    setGameState('playing')
    setShowStartModal(false)
    setTimer(0)
    setFoundWords([])
    setCurrentWord("")
    setHintLevel(0)
    setCurrentHintWordIndex(0)
    clearSavedGame()

    // Log game start event
    setTimeout(() => {
      logAnalyticsEvent('game_started', {
        centerLetter: newGame.centerLetter,
        outerLetters: newGame.outerLetters,
        totalWordsAvailable: newGame.wordCount
      })
    }, 100)

    toast.success("Game started! Good luck! 🌻")
  }

  const fetchAllWords = async () => {
    try {
      const res = await fetch(`/api/game?gameId=${gameData?.gameId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setAllWords(data)
    } catch (err) {
      console.error(err)
    }
  }

  const endGame = () => {
    setGameState('ended')
    setShowEndModal(true)
    clearSavedGame()

    logAnalyticsEvent('game_ended', {
      finalWordsFound: foundWords.length,
      finalTime: timer,
      completionRate: gameData ? (foundWords.length / gameData.wordCount) * 100 : 0
    })

    // Final metadata update with current time
    updateGameMetadata()

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }

    fetchAllWords()

  }


  const resetGame = () => {
    setGameState('not-started')
    clearSavedGame()
    setShowStartModal(true)
    setShowEndModal(false)
    setCurrentWord("")
    setFoundWords([])
    setHintLevel(0)
    setCurrentHintWordIndex(0)
    setTimer(0)
    setGameData(null)

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  const resumeGame = (saved: SavedGameState) => {
    setGameData({
      gameId: saved.gameId,
      centerLetter: saved.centerLetter,
      outerLetters: saved.outerLetters,
      wordCount: saved.wordCount,
      pangramCount: saved.pangramCount
    })
    setFoundWords(saved.foundWords)
    setCurrentHintWordIndex(saved.currentHintWordIndex)
    setHintLevel(saved.hintLevel)
    setTimer(saved.timer)
    setGameState(saved.gameState)
    setCurrentWord(saved.currentWord)
    setShowStartModal(false)

    if (savedGame) {
      // Log game resume event with a slight delay to ensure gameId is set
      setTimeout(() => {
        logAnalyticsEvent('game_resumed', {
          resumedWordsFound: savedGame.foundWords.length,
          resumedTime: savedGame.timer,
          timeSinceLastSave: Date.now() - savedGame.savedAt
        })
      }, 100)

      if (savedGame.gameState === 'playing') {
        toast.success("Game resumed! 🌻")
      }
    }
  }

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadGameFromStorage()
    if (saved && saved.gameState === 'playing') {
      const hoursSinceLastSave = (Date.now() - saved.savedAt) / (1000 * 60 * 60)
      if (hoursSinceLastSave < 24) {
        setSavedGame(saved)
      } else {
        clearSavedGame()
      }
    }
  }, [])

  const handleLetterClick = (letter: string) => setCurrentWord((prev) => prev + letter)
  const handleClear = () => setCurrentWord("")
  const handleBackspace = () => setCurrentWord((prev) => prev.slice(0, -1))

  const handleShuffle = () => {
    if (!gameData) return
    let currentIndex = gameData.outerLetters.length, randomIndex

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      [gameData.outerLetters[currentIndex], gameData.outerLetters[randomIndex]] =
        [gameData.outerLetters[randomIndex], gameData.outerLetters[currentIndex]]
    }

    setGameData({ ...gameData, outerLetters: [...gameData.outerLetters] }) // trigger re-render
    logAnalyticsEvent('letters_shuffled', {
      newOrder: gameData.outerLetters,
      currentTime: timer,
      wordsFoundSoFar: foundWords.length
    })
  }

  const handleSkipWord = () => {
    if (!hintWords.length) return

    const oldWord = currentHintWord?.word || 'unknown'

    let nextIndex = (currentHintWordIndex + 1) % hintWords.length
    let attempts = 0
    while (foundWords.includes(hintWords[nextIndex]?.word.toLowerCase()) && attempts < hintWords.length) {
      nextIndex = (nextIndex + 1) % hintWords.length
      attempts++
    }

    setHintLevel(1)
    setCurrentHintWordIndex(nextIndex)
    setViewedHintsIndex(prev => {
      if (!prev.includes(nextIndex)) {
        return [...prev, nextIndex];
      }
      return prev;
    });



    logAnalyticsEvent('hint_word_skipped', {
      skippedWord: oldWord,
      previousHintLevel: hintLevel,
      newTargetWord: hintWords[nextIndex]?.word || 'unknown',
      currentTime: timer,
      wordsFoundSoFar: foundWords.length
    })
  }

  const handlePreviousWord = () => {
    if (!hintWords.length || viewedHintsIndex.length === 0) return;

    // Only hints user has seen AND not yet found
    const eligibleIndices = viewedHintsIndex.filter(
      idx => !foundWords.includes(hintWords[idx]?.word.toLowerCase())
    );

    if (eligibleIndices.length === 0) {
      toast.message("No previous unseen hint.");
      return;
    }

    const currentPos = eligibleIndices.indexOf(currentHintWordIndex);
    // Move one step backward, wrap using modulo
    const prevPos =
      currentPos === -1
        ? eligibleIndices.length - 1
        : (currentPos - 1 + eligibleIndices.length) % eligibleIndices.length;

    const prevIndex = eligibleIndices[prevPos];

    setCurrentHintWordIndex(prevIndex);
    setHintLevel(1);

    logAnalyticsEvent("hint_previous_word", {
      movedTo: hintWords[prevIndex]?.word || "unknown",
      from: hintWords[currentHintWordIndex]?.word || "unknown",
      currentTime: timer,
      wordsFoundSoFar: foundWords.length,
    });
  };

  const handleSubmit = useCallback(async () => {
    if (gameState !== 'playing' || !gameData) {
      toast.error("Please start the game first!")
      return
    }

    if (currentWord.length < 4) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'too_short',
        attemptedWord: currentWord,
        wordLength: currentWord.length,
        currentTime: timer
      })
      toast.error("Word too short")
      return
    }

    const lowerWord = currentWord.toLowerCase()

    if (foundWords.includes(lowerWord)) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'already_found',
        attemptedWord: lowerWord,
        currentTime: timer
      })
      toast.error("Word already found")
      setTimeout(() => {
        setCurrentWord("")
      }, 1000)
      return
    }

    if (!isValidWord(lowerWord, gameData.centerLetter, gameData.outerLetters)) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'invalid_composition',
        attemptedWord: lowerWord,
        centerLetter: gameData.centerLetter,
        outerLetters: gameData.outerLetters,
        currentTime: timer
      })
      toast.error("Word does not meet requirements")
      return
    }

    // Validate word with server
    try {
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameData.gameId,
          word: lowerWord
        })
      })

      const result = await response.json()

      if (result.isValid) {
        setFoundWords((prev) => [...prev, lowerWord])

        logAnalyticsEvent('word_found', {
          word: lowerWord,
          wordLength: lowerWord.length,
          isPangram: result.isPangram,
          totalWordsFound: foundWords.length + 1,
          currentTime: timer,
          completionRate: ((foundWords.length + 1) / gameData.wordCount) * 100
        })

        if (isMobile && lowerWord === hintWords[currentHintWordIndex].word.toLowerCase()) {
          handleSkipWord()
        }

        const encouragements = result.isPangram
          ? ["Pangram! Amazing! 🎉", "Incredible pangram! 🌟"]
          : ["Great job!", "Well done!", "Excellent!", "Amazing!", "Fantastic!"]
        toast.success(`${encouragements[Math.floor(Math.random() * encouragements.length)]} ✓`)
        setCurrentWord("")
      } else {
        logAnalyticsEvent('word_submission_failed', {
          reason: 'not_in_wordlist',
          attemptedWord: lowerWord,
          currentTime: timer
        })
        toast.error("Word not in word list")
        setTimeout(() => {
          setCurrentWord("")
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to validate word:', error)
      toast.error("Failed to validate word")
    }
  }, [currentWord, foundWords, gameData, gameState, logAnalyticsEvent])

  const handleRequestHint = () => {
    if (hintLevel < 4) {
      const newHintLevel = hintLevel + 1
      setHintLevel(newHintLevel)
      if (!viewedHintsIndex.includes(currentHintWordIndex)) {
        setViewedHintsIndex(prev => [...prev, currentHintWordIndex]);
      }


      logAnalyticsEvent('hint_requested', {
        hintLevel: newHintLevel,
        targetWord: currentHintWord?.word || 'unknown',
        currentTime: timer,
        wordsFoundSoFar: foundWords.length
      })
    }
  }



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameData) return

      const key = e.key.toUpperCase()
      if (e.key === "Enter") {
        handleSubmit()
      } else if (e.key === "Backspace") {
        handleBackspace()
      }
      else if (e.key === "Escape") {
        handleClear()
      }
      //handle letter click only if key is between A-Z
      else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        handleLetterClick(key)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameData, currentWord, foundWords, handleSubmit])

  if (!gameData && gameState !== 'not-started') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">


            {isMobile ? <h1 className="text-2xl font-bold text-foreground ">🌻 {formatTime(timer)}</h1>
              :
              <div className="flex-1 text-center">
                <h1 className="text-5xl font-bold text-foreground mb-2">🌻 Wordflower</h1>
              </div>}

            <div className="flex-1 flex justify-end items-center gap-4">
              {gameState === 'playing' && (
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">
                    {!isMobile && formatTime(timer)}
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
                <div className="text-center">
                  <Button onClick={() => setShowEndModal(true)} variant="secondary" size="sm">
                    Game Ended - {formatTime(timer)}
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* <p className="text-muted-foreground text-lg">Create words using the letters. Must include the center letter!</p> */}
          {gameData && isMobile && <FoundWordsAccordion foundWords={foundWords} totalWords={gameData?.wordCount} />}
        </header>

        {gameData && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <WordDisplay currentWord={currentWord} onClear={handleClear} onBackspace={handleBackspace} />
              <Flower
                centerLetter={gameData.centerLetter}
                outerLetters={gameData.outerLetters}
                currentWord={currentWord}
                onLetterClick={handleLetterClick}
              />
              <div className="mt-8 text-center flex gap-2 justify-center">
                {isMobile && <Button onClick={() => {
                  if (showHint === false) {
                    setShowHint(true)
                    handleRequestHint()
                    return
                  }
                  setShowHint(false)
                }}>
                  <LightbulbIcon />
                </Button>}
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={currentWord.length === 0 || gameState !== 'playing'}
                >
                  Submit Word
                </Button>
                <Button size="lg"
                  onClick={(e) => {
                    handleShuffle()
                    e.currentTarget.blur()
                  }}
                >
                  <ShuffleIcon />
                </Button>
              </div>
            </div>

            {!isMobile && <div className="flex flex-col gap-4">
              <FoundWordsList foundWords={foundWords} totalWords={gameData.wordCount} />
              <Card className="p-6 mb-6">
                <HintSystem
                  currentHintWord={currentHintWord}
                  hintLevel={hintLevel}
                  onRequestHint={handleRequestHint}
                  onSkipWord={handleSkipWord}
                  foundWords={foundWords}
                  onPreviousWord={handlePreviousWord}
                />
              </Card>
            </div>}
          </div>
        )}
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
                <Button onClick={() => resumeGame(savedGame)} className="flex-1">
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
              <div className="flex flex-col gap-1 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-primary">{foundWords.length}/{gameData?.wordCount}</div>
                <div className="text-sm text-muted-foreground">Words Found</div>
                <Progress value={gameData ? (foundWords.length / gameData.wordCount) * 100 : 0} />
              </div>
              <div className="text-center content-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-primary">{formatTime(timer)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">All Words</h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  {allWords.map((word, index) => {
                    const isFound = foundWords.some(
                      (w) => w.trim().toLowerCase() === word.trim().toLowerCase()
                    )

                    return (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-sm ${isFound
                          ? 'bg-gray-700 text-primary-foreground'
                          : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                          }`}
                      >
                        {word}
                      </span>
                    )
                  })}

                </div>
              </div>
            </div>

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
      <Dialog open={showHint} onOpenChange={setShowHint}>
        <DialogContent className="[&>button]:hidden">
          <HintSystem
            currentHintWord={currentHintWord}
            hintLevel={hintLevel}
            onRequestHint={handleRequestHint}
            onSkipWord={handleSkipWord}
            foundWords={foundWords}
            onPreviousWord={handlePreviousWord}
          />
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}