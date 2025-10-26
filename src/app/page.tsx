"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import { Flower } from "@/components/flower"
import { WordDisplay } from "@/components/word-display"
import { FoundWordsList } from "@/components/found-words-list"
import { StartGameModal } from "@/components/start-game-modal"
import { FeedbackModal } from "@/components/feedback-modal"
import { EndGameModal } from "@/components/end-game-modal"
import { GameControls } from "@/components/game-controls"
import { GameActions } from "@/components/game-actions"
import { isValidWord, WordHints } from "@/lib/word-data"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import FoundWordsAccordion from "@/components/foundWordsAccordion"

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
  // currentHintWordIndex: number
  // hintLevel: number
  timer: number
  gameState: 'not-started' | 'playing' | 'ended'
  currentWord: string
  savedAt: number
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

// Feedback form interface
interface GameFeedback {
  satisfaction: number // 1-5 scale
  mostDifficult: string
  willReturn: boolean
  submittedAt: Date
}

// Generate unique game ID
const generateGameId = () => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate unique user ID
const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create user ID from localStorage
const getUserId = () => {
  if (typeof window === "undefined") return null
  
  let userId = localStorage.getItem('wordflower_user_id')
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem('wordflower_user_id', userId)
  }
  return userId
}

export default function WordflowerGame() {
  const isMobile = useMediaQuery("(max-width: 1025px)")
  const [currentWord, setCurrentWord] = useState("")
  const [foundWords, setFoundWords] = useState<string[]>([])
  // const [hintLevel, setHintLevel] = useState(0)
  // const [currentHintWordIndex, setCurrentHintWordIndex] = useState(0)
  // const [viewedHintsIndex, setViewedHintsIndex] = useState<number[]>([])
  // const [showHint, setShowHint] = useState(false)
  const [allWords, setAllWords] = useState<string[]>([])
  
  const [gameData, setGameData] = useState<GameData | null>(null)
  // const [hintWords, setHintWords] = useState<WordHints[]>([])

  // Game state management
  const [gameState, setGameState] = useState<'not-started' | 'playing' | 'ended'>('not-started')
  const [showStartModal, setShowStartModal] = useState(true)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [timer, setTimer] = useState(0)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    satisfaction: 0,
    mostDifficult: '',
    willReturn: false
  })
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  
  const timerRef = useRef(0);
  const wordsFoundRef = useRef(0);
  const gameStateRef = useRef<'not-started' | 'playing' | 'ended'>('not-started');
  // const currentHintWord = hintWords[currentHintWordIndex] || null

  useEffect(() => {
    timerRef.current = timer
  }, [timer])

  useEffect(() => {
    wordsFoundRef.current = foundWords.length
  }, [foundWords.length])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Initialize user ID on mount
  useEffect(() => {
    const id = getUserId()
    setUserId(id)
  }, [])

  // Analytics logging function
  const logAnalyticsEvent = useCallback(async (eventType: string, eventData: any = {}) => {
    if (!gameData?.gameId || !userId) return

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: gameData.gameId,
          eventType,
          eventData
        })
      })
    } catch (error) {
      console.error('Failed to log analytics event:', error)
    }
  }, [gameData?.gameId, userId])

  // Update game metadata in analytics
  const updateGameMetadata = useCallback(async () => {
    if (!gameData?.gameId || !userId) return    
    try {
      // Use a ref to get current timer value or pass it as parameter      
      await fetch('/api/analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: gameData.gameId,
          gameMetadata: {
            totalWords: gameData.wordCount,
            wordsFound: wordsFoundRef.current,
            totalTime: timerRef.current,
            gameState: gameStateRef.current
          }
        })
      })
    } catch (error) {
      console.error('Failed to update game metadata:', error)
    }
  }, [gameData?.gameId, gameState, userId])

  // Submit feedback to analytics
  const submitFeedback = useCallback(async (feedback: GameFeedback) => {
    if (!gameData?.gameId || !userId) return false

    try {
      const response = await fetch('/api/analytics/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: gameData.gameId,
          feedback
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      return true
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      return false
    }
  }, [gameData?.gameId, userId])

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
      // currentHintWordIndex,
      // hintLevel,
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
  }, [gameData, foundWords, /* currentHintWordIndex, hintLevel, */ timer, gameState, currentWord])

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
  }, [foundWords, /* currentHintWordIndex, hintLevel, */ saveGameToStorage, timer, gameState])

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

  // const fetchHints = async (gameId: string) => {
  //   try {
  //     const res = await fetch("/api/hint", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ gameId }),
  //     })
  //     if (!res.ok) throw new Error("Failed to fetch hints")
  //     return await res.json()
  //   } catch (err) {
  //     console.error(err)
  //     return []
  //   }
  // }

  // useEffect(() => {
  //   if (gameData?.gameId) {
  //     fetchHints(gameData.gameId).then(setHintWords)
  //   }
  // }, [gameData?.gameId])


  // Game control functions
  const startGame = async () => {
    const newGame = await loadNewGame()
    if (!newGame) return

    setGameState('playing')
    setShowStartModal(false)
    setTimer(0)
    setFoundWords([])
    setCurrentWord("")
    // setHintLevel(0)
    // setCurrentHintWordIndex(0)
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

  const endGame = async() => {
    setGameState('ended')
    gameStateRef.current = 'ended'

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    
    updateGameMetadata()
    // Show feedback modal first, then end modal after feedback submission
    setShowFeedbackModal(true)

    logAnalyticsEvent('game_ended', {
      finalWordsFound: foundWords.length,
      finalTime: timer,
      completionRate: gameData ? (foundWords.length / gameData.wordCount) * 100 : 0
    })    

    fetchAllWords()
  }


  const resetGame = () => {
    setGameState('not-started')
    clearSavedGame()
    setShowStartModal(true)
    setShowFeedbackModal(false)
    setShowEndModal(false)
    setCurrentWord("")
    setFoundWords([])
    // setHintLevel(0)
    // setCurrentHintWordIndex(0)
    setTimer(0)
    setGameData(null)
    
    // Reset feedback form
    setFeedbackForm({
      satisfaction: 0,
      mostDifficult: '',
      willReturn: false
    })

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  // Handle feedback form submission
  const handleFeedbackSubmit = async () => {
    if (feedbackForm.satisfaction === 0 || feedbackForm.mostDifficult.trim() === '') {
      toast.error("Please complete all required fields")
      return
    }

    setIsSubmittingFeedback(true)

    const feedback: GameFeedback = {
      satisfaction: feedbackForm.satisfaction,
      mostDifficult: feedbackForm.mostDifficult.trim(),
      willReturn: feedbackForm.willReturn,
      submittedAt: new Date()
    }

    const success = await submitFeedback(feedback)
    
    if (success) {
      toast.success("Thank you for your feedback!")
      setShowFeedbackModal(false)
      setShowEndModal(true)
      clearSavedGame()
    } else {
      toast.error("Failed to submit feedback. Please try again.")
    }

    setIsSubmittingFeedback(false)
  }

  // Check if feedback form is valid
  const isFeedbackFormValid = () => {
    return feedbackForm.satisfaction > 0 && feedbackForm.mostDifficult.trim() !== ''
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
    // setCurrentHintWordIndex(saved.currentHintWordIndex)
    // setHintLevel(saved.hintLevel)
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

  // const handleSkipWord = () => {
  //   if (!hintWords.length) return

  //   const oldWord = currentHintWord?.word || 'unknown'

  //   let nextIndex = (currentHintWordIndex + 1) % hintWords.length
  //   let attempts = 0
  //   while (foundWords.includes(hintWords[nextIndex]?.word.toLowerCase()) && attempts < hintWords.length) {
  //     nextIndex = (nextIndex + 1) % hintWords.length
  //     attempts++
  //   }

  //   setHintLevel(1)
  //   setCurrentHintWordIndex(nextIndex)
  //   setViewedHintsIndex(prev => {
  //     if (!prev.includes(nextIndex)) {
  //       return [...prev, nextIndex];
  //     }
  //     return prev;
  //   });

  //   logAnalyticsEvent('hint_word_skipped', {
  //     skippedWord: oldWord,
  //     previousHintLevel: hintLevel,
  //     newTargetWord: hintWords[nextIndex]?.word || 'unknown',
  //     currentTime: timer,
  //     wordsFoundSoFar: foundWords.length
  //   })
  // }

  // const handlePreviousWord = () => {
  //   if (!hintWords.length || viewedHintsIndex.length === 0) return;

  //   // Only hints user has seen AND not yet found
  //   const eligibleIndices = viewedHintsIndex.filter(
  //     idx => !foundWords.includes(hintWords[idx]?.word.toLowerCase())
  //   );

  //   if (eligibleIndices.length === 0) {
  //     toast.message("No previous unseen hint.");
  //     return;
  //   }

  //   const currentPos = eligibleIndices.indexOf(currentHintWordIndex);
  //   // Move one step backward, wrap using modulo
  //   const prevPos =
  //     currentPos === -1
  //       ? eligibleIndices.length - 1
  //       : (currentPos - 1 + eligibleIndices.length) % eligibleIndices.length;

  //   const prevIndex = eligibleIndices[prevPos];

  //   setCurrentHintWordIndex(prevIndex);
  //   setHintLevel(1);

  //   logAnalyticsEvent("hint_previous_word", {
  //     movedTo: hintWords[prevIndex]?.word || "unknown",
  //     from: hintWords[currentHintWordIndex]?.word || "unknown",
  //     currentTime: timer,
  //     wordsFoundSoFar: foundWords.length,
  //   });
  // };

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

        // if (isMobile && lowerWord === hintWords[currentHintWordIndex].word.toLowerCase()) {
        //   handleSkipWord()
        // }

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

  // const handleRequestHint = () => {
  //   if (hintLevel < 4) {
  //     const newHintLevel = hintLevel + 1
  //     setHintLevel(newHintLevel)
  //     if (!viewedHintsIndex.includes(currentHintWordIndex)) {
  //       setViewedHintsIndex(prev => [...prev, currentHintWordIndex]);
  //     }

  //     logAnalyticsEvent('hint_requested', {
  //       hintLevel: newHintLevel,
  //       targetWord: currentHintWord?.word || 'unknown',
  //       currentTime: timer,
  //       wordsFoundSoFar: foundWords.length
  //     })
  //   }
  // }



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
          <GameControls
            gameState={gameState}
            timer={timer}
            formatTime={formatTime}
            isTabVisible={isTabVisible}
            isMobile={isMobile}
            onEndGame={endGame}
            onShowEndModal={() => setShowEndModal(true)}
          />

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
              <GameActions
                currentWord={currentWord}
                gameState={gameState}
                onSubmit={handleSubmit}
                onShuffle={handleShuffle}
              />
            </div>

            {!isMobile && <div className="flex flex-col gap-4">
              <FoundWordsList foundWords={foundWords} totalWords={gameData.wordCount} />
              {/* <Card className="p-6 mb-6">
                <HintSystem
                  currentHintWord={currentHintWord}
                  hintLevel={hintLevel}
                  onRequestHint={handleRequestHint}
                  onSkipWord={handleSkipWord}
                  foundWords={foundWords}
                  onPreviousWord={handlePreviousWord}
                />
              </Card> */}
            </div>}
          </div>
        )}
      </div>

      {/* Modals */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        feedbackForm={feedbackForm}
        setFeedbackForm={setFeedbackForm}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmittingFeedback}
        isValid={isFeedbackFormValid()}
      />

      <StartGameModal
        isOpen={showStartModal}
        onOpenChange={setShowStartModal}
        savedGame={savedGame}
        onStartNewGame={startGame}
        onResumeGame={resumeGame}
        formatTime={formatTime}
      />

      <EndGameModal
        isOpen={showEndModal}
        onOpenChange={setShowEndModal}
        foundWords={foundWords}
        allWords={allWords}
        gameData={gameData}
        timer={timer}
        formatTime={formatTime}
        onPlayAgain={resetGame}
      />

      <Toaster />
    </div>
  )
}