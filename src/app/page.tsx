"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Flower } from "@/components/flower"
import { WordDisplay } from "@/components/word-display"
import { FoundWordsList } from "@/components/found-words-list"
import { StartGameModal } from "@/components/start-game-modal"
import { EndGameConfirmModal } from "@/components/end-game-confirm-modal"
import { GameControls } from "@/components/game-controls"
import { GameActions } from "@/components/game-actions"
import { GameRules } from '@/components/game-rules'
import { hasCentralLetter, isValidWord, WordHints } from "@/lib/word-data"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import FoundWordsAccordion from "@/components/foundWordsAccordion"
import { HintSystem } from "@/components/hint-system"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BREAK_THRESHOLD, BREAK_TIME, formatElapsedTime, formatTime } from "@/lib/utils"
import { BreakModal } from "@/components/break-modal"

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
  foundPangrams?: string[] // Optional for backward compatibility
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

// Get user ID from localStorage (middleware ensures it exists)
const getUserId = () => {
  if (typeof window === "undefined") return null

  const userId = localStorage.getItem('wordflower_user_id')
  if (userId) {
    // Ensure cookie is synced with localStorage
    document.cookie = `wordflower_user_id=${userId}; path=/; max-age=31536000`
  }
  console.log("User ID:", userId)
  return userId
}



export default function WordflowerGame() {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1025px)")
  const [currentWord, setCurrentWord] = useState("")
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [foundPangrams, setFoundPangrams] = useState<string[]>([])
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
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false)
  const [timer, setTimer] = useState(30 * 60) // 30 minutes in seconds
  const [timeSinceWord, setTimeSinceWord] = useState(BREAK_THRESHOLD)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [savedGame, setSavedGame] = useState<SavedGameState | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [showBreakModal, setShowBreakModal] = useState(false)
  const [breakTimer, setBreakTimer] = useState(BREAK_TIME)
  const [spotRoundIndex, setSpotRoundIndex] = useState(0)

  // Loading states
  const [isSubmittingWord, setIsSubmittingWord] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [isEndingGame, setIsEndingGame] = useState(false)

  // Helper to calculate elapsed time
  const getElapsedTime = () => 30 * 60 - timer

  const timerRef = useRef(30 * 60);
  const wordsFoundRef = useRef(0);
  const foundWordsRef = useRef<string[]>([]);
  const gameStateRef = useRef<'not-started' | 'playing' | 'ended'>('not-started');
  const breakEndTimeRef = useRef<number | null>(null);
  const currentHintWord = hintWords[currentHintWordIndex] || null

  useEffect(() => {
    timerRef.current = timer
  }, [timer])

  useEffect(() => {
    wordsFoundRef.current = foundWords.length
    foundWordsRef.current = foundWords
  }, [foundWords])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Initialize user ID on mount
  useEffect(() => {
    const id = getUserId()
    setUserId(id)

    // Sync localStorage with cookies for middleware
    const syncCookie = () => {
      const localUserId = localStorage.getItem('wordflower_user_id')
      if (localUserId) {
        document.cookie = `wordflower_user_id=${localUserId}; path=/; max-age=31536000`
      }
    }

    syncCookie()
    window.addEventListener('storage', syncCookie)

    return () => window.removeEventListener('storage', syncCookie)
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
            foundWords: foundWordsRef.current, // Store actual found words array using ref
            totalTime: 30 * 60 - timerRef.current, // Elapsed time
            gameState: gameStateRef.current
          }
        })
      })
    } catch (error) {
      console.error('Failed to update game metadata:', error)
    }
  }, [gameData?.gameId, gameState, userId, foundWords])

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

  // localStorage functions
  const saveGameToStorage = useCallback(() => {
    if (typeof window === "undefined" || !gameData || gameState === 'not-started') return

    const saveData: SavedGameState = {
      gameId: gameData.gameId,
      foundWords,
      foundPangrams: foundPangrams,
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
  }, [gameData, foundWords, foundPangrams, currentHintWordIndex, hintLevel, timer, gameState, currentWord])

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

  // Timer functionality with tab visibility support (pauses during break)
  useEffect(() => {
    if (gameState === 'playing' && !showBreakModal) {
      const id = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Timer reached zero, end game automatically
            setTimeout(() => endGame(), 0) // Use setTimeout to avoid circular dependency
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setIntervalId(id)
      return () => clearInterval(id)
    } else if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [gameState, isTabVisible, showBreakModal])

  // Countdown timeSinceWord during gameplay (not during break)
  useEffect(() => {
    if (gameState !== 'playing' || showBreakModal) return

    const id = setInterval(() => {
      setTimeSinceWord((prev) => {
        if (prev <= 1) {
          // 2 minutes since last word found — trigger auto-break
          // Only trigger if not already showing the modal
          setShowBreakModal((current) => {
            if (!current) {
              const endTime = Date.now() + BREAK_TIME * 1000
              breakEndTimeRef.current = endTime
              setBreakTimer(BREAK_TIME)

              logAnalyticsEvent('auto_break_triggered', {
                currentTime: getElapsedTime(),
                wordsFound: foundWords.length
              })
              return true
            }
            return current
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [gameState, showBreakModal])

  // Break timer countdown while break modal is open
  useEffect(() => {
    if (!showBreakModal || !breakEndTimeRef.current) return

    const id = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((breakEndTimeRef.current! - now) / 1000))
      setBreakTimer(remaining)

      if (remaining <= 0) {
        clearInterval(id)
      }
    }, 500) // Update more frequently for smoothness

    return () => clearInterval(id)
  }, [showBreakModal])

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const newVisibility = !document.hidden
      setIsTabVisible(newVisibility)

      if (gameState === 'playing') {
        logAnalyticsEvent('tab_visibility_changed', {
          isVisible: newVisibility,
          currentTime: getElapsedTime(),
          wordsFound: foundWords.length
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [gameState, foundWords.length, logAnalyticsEvent, getElapsedTime])

  // Save game on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameToStorage()
      updateGameMetadata()
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
    setIsStartingGame(true)
    try {
      const newGame = await loadNewGame()
      if (!newGame) return

      // Check if this game is already completed by the user
      if (userId) {
        const completionResponse = await fetch(`/api/game/completed?userId=${userId}&gameId=${newGame.gameId}`)
        if (completionResponse.ok) {
          const { isCompleted, gameSessionData } = await completionResponse.json()

          if (isCompleted) {
            // Game already completed, redirect to results
            toast.info("You've already completed this game! Redirecting to results...")

            // GET request to fetch results from MongoDB
            // const resultsResponse = await fetch(`/api/analytics/results?gameId=${newGame.gameId}`)

            // Store the completed game data in localStorage for results page
            // const resultsData = {
            //   gameId: newGame.gameId,
            //   foundWords: gameSessionData?.gameMetadata?.foundWords || [],
            //   allWords: [], // We'll fetch this if needed
            //   timer: gameSessionData?.gameMetadata?.totalTime || 0,
            //   gameData: newGame,
            //   timestamp: Date.now(),
            //   isAlreadyCompleted: true // Mark as already completed
            // }
            // localStorage.setItem('wordflower_results', JSON.stringify(resultsData))

            router.push('/results?gameid=' + newGame.gameId)
            return
          }
        }
      }

      setGameState('playing')
      setShowStartModal(false)
      setTimer(30 * 60) // Reset to 30 minutes
      setTimeSinceWord(BREAK_THRESHOLD) // Reset time since last word
      setFoundWords([])
      setFoundPangrams([])
      setCurrentWord("")
      setHintLevel(0)
      setCurrentHintWordIndex(0)
      clearSavedGame()

      // Log game start event
      setTimeout(async () => {
        console.log('game started')
        if (userId && newGame.gameId) {
          try {
            await fetch('/api/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                gameId: newGame.gameId,
                eventType: 'game_started',
                eventData: {
                  centerLetter: newGame.centerLetter,
                  outerLetters: newGame.outerLetters,
                  totalWordsAvailable: newGame.wordCount
                }
              })
            })
          } catch (error) {
            console.error('Failed to log game_started event:', error)
          }
        } else {
          console.error('Missing userId or gameId for game_started event:', { userId, gameId: newGame.gameId })
        }
      }, 100)

      toast.success("Game started! Good luck! 🌻")
    } finally {
      setIsStartingGame(false)
    }
  }

  const fetchAllWords = async () => {
    try {
      const res = await fetch(`/api/game?gameId=${gameData?.gameId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setAllWords(data)
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const endGame = async () => {
    setIsEndingGame(true)
    try {
      setGameState('ended')
      gameStateRef.current = 'ended'

      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }

      updateGameMetadata()

      const currentFoundWords = foundWordsRef.current
      const currentElapsedTime = 30 * 60 - timerRef.current

      logAnalyticsEvent('game_ended', {
        finalWordsFound: currentFoundWords.length,
        finalTime: currentElapsedTime,
        completionRate: gameData ? (currentFoundWords.length / gameData.wordCount) * 100 : 0
      })

      const fetchedAllWords = await fetchAllWords()

      // Mark game as completed for this user
      if (userId && gameData) {
        try {
          await fetch('/api/analytics', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              gameId: gameData.gameId
            })
          })
        } catch (error) {
          console.error('Failed to mark game as completed:', error)
        }
      }

      // Store the results to MongoDB using refs to ensure we capture the current state
      if (userId && gameData) {
        try {
          const currentFoundWords = foundWordsRef.current
          const currentElapsedTime = 30 * 60 - timerRef.current

          const res = await fetch('/api/analytics/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              gameId: gameData.gameId,
              results: {
                foundWords: currentFoundWords,
                allWords: fetchedAllWords,
                timer: currentElapsedTime,
                gameData,
                timestamp: Date.now()
              }
            })
          })

          if (!res.ok) {
            console.error('Failed to store game results with status:', res.status)
          }
        } catch (error) {
          console.error('Failed to store game results:', error)
        }
      }

      // Simple redirect to results page
      router.push('/results?gameid=' + gameData?.gameId)
    } finally {
      setIsEndingGame(false)
    }
  }

  // Handle manual end game with confirmation
  const handleEndGameRequest = () => {
    setShowEndConfirmModal(true)
  }

  const handleEndGameConfirm = () => {
    setShowEndConfirmModal(false)
    endGame()
  }

  const handleEndGameCancel = () => {
    setShowEndConfirmModal(false)
  }


  const resetGame = () => {
    setGameState('not-started')
    clearSavedGame()
    setShowStartModal(true)
    setShowEndConfirmModal(false)
    setCurrentWord("")
    setFoundWords([])
    setFoundPangrams([])
    setHintLevel(0)
    setCurrentHintWordIndex(0)
    setTimer(30 * 60) // Reset to 30 minutes
    setGameData(null)

    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  const resumeGame = async (saved: SavedGameState) => {
    // Check if this game is already completed by the user
    if (userId) {
      try {
        const completionResponse = await fetch(`/api/game/completed?userId=${userId}&gameId=${saved.gameId}`)
        if (completionResponse.ok) {
          const { isCompleted, gameSessionData } = await completionResponse.json()

          if (isCompleted) {
            // Game already completed, redirect to results
            toast.info("This game was already completed! Redirecting to results...")

            // Store the completed game data in localStorage for results page
            const resultsData = {
              gameId: saved.gameId,
              foundWords: gameSessionData?.gameMetadata?.foundWords || [],
              allWords: [], // We'll fetch this if needed
              timer: gameSessionData?.gameMetadata?.totalTime || 0,
              gameData: {
                gameId: saved.gameId,
                centerLetter: saved.centerLetter,
                outerLetters: saved.outerLetters,
                wordCount: saved.wordCount,
                pangramCount: saved.pangramCount
              },
              timestamp: Date.now(),
              isAlreadyCompleted: true // Mark as already completed
            }
            localStorage.setItem('wordflower_results', JSON.stringify(resultsData))

            router.push('/results?completed=true')
            return
          }
        }
      } catch (error) {
        console.error('Failed to check game completion:', error)
        // Continue with resume if check fails
      }
    }

    setGameData({
      gameId: saved.gameId,
      centerLetter: saved.centerLetter,
      outerLetters: saved.outerLetters,
      wordCount: saved.wordCount,
      pangramCount: saved.pangramCount
    })
    setFoundWords(saved.foundWords)
    setFoundPangrams(saved.foundPangrams || []) // Handle backward compatibility
    setCurrentHintWordIndex(saved.currentHintWordIndex)
    setHintLevel(saved.hintLevel)
    setTimer(saved.timer)
    setGameState(saved.gameState)
    setCurrentWord(saved.currentWord)
    setShowStartModal(false)

    if (savedGame) {
      // Log game resume event
      setTimeout(async () => {
        console.log('game resumed')
        if (userId && savedGame.gameId) {
          try {
            await fetch('/api/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                gameId: savedGame.gameId,
                eventType: 'game_resumed',
                eventData: {
                  centerLetter: savedGame.centerLetter,
                  outerLetters: savedGame.outerLetters,
                  totalWordsAvailable: savedGame.wordCount
                }
              })
            })
          } catch (error) {
            console.error('Failed to log game_resumed event:', error)
          }
        } else {
          console.error('Missing userId or gameId for game_resumed event:', { userId, gameId: savedGame.gameId })
        }
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
      currentTime: getElapsedTime(),
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
      currentTime: getElapsedTime(),
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
      currentTime: getElapsedTime(),
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
        currentTime: getElapsedTime()
      })
      toast.error("Words must be at least 4 letters long")
      return
    }

    const lowerWord = currentWord.toLowerCase()

    if (foundWords.includes(lowerWord)) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'already_found',
        attemptedWord: lowerWord,
        currentTime: getElapsedTime()
      })
      toast.error("You've already found this word!")
      setTimeout(() => {
        setCurrentWord("")
      }, 1000)
      return
    }

    if (!hasCentralLetter(lowerWord, gameData.centerLetter)) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'missing_central_letter',
        attemptedWord: lowerWord,
        centerLetter: gameData.centerLetter,
        currentTime: getElapsedTime()
      })
      setTimeout(() => {
        setCurrentWord("")
      }, 1000)
      toast.error(`Word must include the central letter "${gameData.centerLetter.toUpperCase()}"`)
      return
    }

    if (!isValidWord(lowerWord, gameData.centerLetter, gameData.outerLetters)) {
      logAnalyticsEvent('word_submission_failed', {
        reason: 'invalid_composition',
        attemptedWord: lowerWord,
        centerLetter: gameData.centerLetter,
        outerLetters: gameData.outerLetters,
        currentTime: getElapsedTime()
      })
      setTimeout(() => {
        setCurrentWord("")
      }, 1000)
      toast.error("Word contains letters not in the puzzle")
      return
    }

    // Validate word with server
    setIsSubmittingWord(true)
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
        setCurrentWord("")
        setFoundWords((prev) => [...prev, lowerWord])
        setTimeSinceWord(BREAK_THRESHOLD)

        // Track pangrams separately
        if (result.isPangram) {
          console.log('pangram found:', lowerWord)
          setFoundPangrams(prev => [...prev, lowerWord])
          console.log(foundPangrams)
        }

        logAnalyticsEvent('word_found', {
          word: lowerWord,
          wordLength: lowerWord.length,
          isPangram: result.isPangram,
          totalWordsFound: foundWords.length + 1,
          currentTime: getElapsedTime(),
          completionRate: ((foundWords.length + 1) / gameData.wordCount) * 100
        })

        if (isMobile && lowerWord === hintWords[currentHintWordIndex].word.toLowerCase()) {
          handleSkipWord()
        }

        const encouragements = result.isPangram
          ? ["🎉 Pangram! Amazing!", "🌟 Incredible pangram!", "✨ Perfect pangram!"]
          : ["✅ Great job!", "🌻 Well done!", "⭐ Excellent!", "🎯 Amazing!", "🏆 Fantastic!"]
        toast.success(`${encouragements[Math.floor(Math.random() * encouragements.length)]}`)
      } else {
        logAnalyticsEvent('word_submission_failed', {
          reason: 'not_in_wordlist',
          attemptedWord: lowerWord,
          currentTime: getElapsedTime()
        })
        toast.error("Word not found in dictionary")
        setTimeout(() => {
          setCurrentWord("")
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to validate word:', error)
      toast.error("Failed to validate word")
    } finally {
      setIsSubmittingWord(false)
    }
  }, [currentWord, foundWords, foundPangrams, gameData, gameState, logAnalyticsEvent, getElapsedTime])

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
        currentTime: getElapsedTime(),
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
      else if (key.length === 1 && key >= 'A' && key <= 'Z' && !showBreakModal) {
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
            isTabVisible={isTabVisible}
            isMobile={isMobile}
            onEndGame={handleEndGameRequest}
            isEndingGame={isEndingGame}
          />

          {gameData && isMobile &&
            <FoundWordsAccordion
              foundWords={foundWords}
              totalWords={gameData?.wordCount}
              pangrams={foundPangrams}
            />}
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
                isSubmittingWord={isSubmittingWord}
              />
            </div>

            {!isMobile && <div className="flex flex-col gap-4">
              <FoundWordsList
                foundWords={foundWords}
                totalWords={gameData.wordCount}
                pangrams={foundPangrams}
              />
              <GameRules />
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

      {/* Modals */}
      <EndGameConfirmModal
        isOpen={showEndConfirmModal}
        onConfirm={handleEndGameConfirm}
        onCancel={handleEndGameCancel}
        timer={timer}
      />

      <StartGameModal
        isOpen={showStartModal}
        onOpenChange={setShowStartModal}
        savedGame={savedGame}
        onStartNewGame={startGame}
        onResumeGame={resumeGame}
        isStartingGame={isStartingGame}
      />

      <BreakModal
        isOpen={showBreakModal}
        setIsOpen={setShowBreakModal}
        breakTimer={breakTimer}
        setTimeSinceWord={setTimeSinceWord}
        spotRoundIndex={spotRoundIndex}
        onSpotRoundIndexChange={setSpotRoundIndex}
        onResume={(answers) => {
          if (Object.keys(answers).length > 0) {
            logAnalyticsEvent('break_spot_difference_input', { answers })
          }
        }}
      />
      <Toaster />
    </div>
  )
}