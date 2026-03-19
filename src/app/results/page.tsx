"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

interface GameData {
  gameId: string
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

interface GameResults {
  foundWords: string[]
  allWords?: string[]
  timer: number
  gameData: any
  timestamp: Date
}

interface FeedbackForm {
  satisfaction: number
  mostDifficult: string
  improvementSuggestion?: string
  breakHelpful?: string
  stuckStrategy?: string
}

interface GameFeedback {
  satisfaction: number // 1-5 scale
  mostDifficult: string
  improvementSuggestion?: string
  breakHelpful?: string
  stuckStrategy?: string
  submittedAt: Date
}

function ResultsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State management
  const [userId, setUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Feedback state
  const [existingFeedback, setExistingFeedback] = useState<GameFeedback | null>(null)
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    satisfaction: 0,
    mostDifficult: '',
    improvementSuggestion: '',
    breakHelpful: '',
    stuckStrategy: ''
  })
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Results state
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)

  // Function to return to main page
  const handleReturnToGame = () => {
    router.push('/')
  }

  // Initialize data and check feedback status
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Get game ID from URL params
        const gameIdParam = searchParams.get('gameid')
        if (!gameIdParam) {
          setError('No game ID provided')
          setLoading(false)
          return
        }

        // Get user ID from localStorage
        const userIdFromStorage = localStorage.getItem('wordflower_user_id')
        if (!userIdFromStorage) {
          setError('User ID not found')
          setLoading(false)
          return
        }

        setGameId(gameIdParam)
        setUserId(userIdFromStorage)

        // Check if feedback already exists for this game
        await checkExistingFeedback(userIdFromStorage, gameIdParam)

      } catch (error) {
        console.error('Initialization error:', error)
        setError('Failed to initialize page')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [searchParams])

  // Check if feedback exists for this game
  const checkExistingFeedback = async (userId: string, gameId: string) => {
    try {
      const response = await fetch(`/api/analytics/feedback?userId=${userId}&gameId=${gameId}`)

      if (response.ok) {
        const data = await response.json()
        if (data.feedback) {
          setExistingFeedback(data.feedback)
          setFeedbackSubmitted(true)
          // If feedback exists, fetch the results
          await fetchGameResults(userId, gameId)
        }
      } else if (response.status === 404) {
        // No feedback found - this is expected for new games
        setExistingFeedback(null)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Error checking feedback:', error)
      // Don't set error state here as missing feedback is expected
    }
  }

  // Fetch game results from database (with retry for timing issues)
  const fetchGameResults = async (userId: string, gameId: string, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Add a small delay before retrying to allow the results POST to commit
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt))
        }

        const response = await fetch(`/api/analytics/results?userId=${userId}&gameId=${gameId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const results = await response.json()
          setGameResults(results)
          setResultsError(null)
          return
        } else if (response.status === 404 && attempt < retries - 1) {
          // Results not stored yet, retry
          console.warn(`Results not found (attempt ${attempt + 1}), retrying...`)
          continue
        } else {
          console.error('Failed to fetch results:', response.status)
          setResultsError('Results could not be loaded. Your game data has been saved.')
          return
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        if (attempt === retries - 1) {
          setResultsError('Results could not be loaded. Your game data has been saved.')
        }
      }
    }
  }

  // Submit feedback to analytics
  const submitFeedback = async (feedback: GameFeedback) => {
    if (!gameId || !userId) return false

    try {
      const response = await fetch('/api/analytics/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId,
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
      improvementSuggestion: feedbackForm.improvementSuggestion?.trim(),
      breakHelpful: feedbackForm.breakHelpful?.trim(),
      stuckStrategy: feedbackForm.stuckStrategy?.trim(),
      submittedAt: new Date()
    }

    const success = await submitFeedback(feedback)

    if (success) {
      toast.success("Thank you for your feedback!")
      setFeedbackSubmitted(true)
      setExistingFeedback(feedback)

      // Now fetch the results since feedback is submitted
      if (userId && gameId) {
        await fetchGameResults(userId, gameId)
      }

      // Clear saved game
      localStorage.removeItem('wordflower_game')
    } else {
      toast.error("Failed to submit feedback. Please try again.")
    }

    setIsSubmittingFeedback(false)
  }

  // Check if feedback form is valid
  const isFeedbackFormValid = () => {
    return (
      feedbackForm.satisfaction > 0 &&
      feedbackForm.mostDifficult.trim() !== '' &&
      feedbackForm.improvementSuggestion?.trim() !== '' &&
      feedbackForm.breakHelpful?.trim() !== '' &&
      feedbackForm.stuckStrategy?.trim() !== ''
    )
  }

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !gameId || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Invalid game session"}</h1>
          <Button onClick={handleReturnToGame}>Return to Game</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🌻 Wordflower</h1>
          <h2 className="text-2xl font-semibold">
            {feedbackSubmitted ? "Game Results" : "Game Feedback"}
          </h2>
        </header>

        {!feedbackSubmitted ? (
          // Show feedback form if no feedback exists
          <Card className="p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-center">🌻 Please Share Your Feedback</h3>
            <div className="space-y-6">
              <p className="text-muted-foreground text-center">
                Before viewing your results, please help us improve your experience by sharing your thoughts about this game.
              </p>

              {/* Satisfaction Rating */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  How satisfied are you with your performance? <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackForm(prev => ({ ...prev, satisfaction: rating }))}
                      className={`p-2 rounded-lg transition-colors ${feedbackForm.satisfaction >= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                        }`}
                    >
                      <Star
                        size={28}
                        fill={feedbackForm.satisfaction >= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {feedbackForm.satisfaction === 1 && "Very Dissatisfied"}
                  {feedbackForm.satisfaction === 2 && "Dissatisfied"}
                  {feedbackForm.satisfaction === 3 && "Neutral"}
                  {feedbackForm.satisfaction === 4 && "Satisfied"}
                  {feedbackForm.satisfaction === 5 && "Very Satisfied"}
                </div>
              </div>

              {/* Thinking Process Question */}
              <div className="space-y-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor="thinkingProcess">
                  Could you walk us through what was happening in your head while you were trying to find words? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="thinkingProcess"
                  value={feedbackForm.mostDifficult}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, mostDifficult: e.target.value }))}
                  placeholder="Describe your thought process, strategies, and what went through your mind while playing..."
                  className="w-full p-3 border rounded-lg resize-none h-24 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={400}
                />
              </div>

              {/* Break Helpful Question */}
              <div className="space-y-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor="breakHelpful">
                  Do you feel like the break helped your gameplay? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="breakHelpful"
                  value={feedbackForm.breakHelpful || ''}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, breakHelpful: e.target.value }))}
                  placeholder="Let us know how you felt about the break"
                  className="w-full p-3 border rounded-lg resize-none h-20 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={300}
                />
              </div>

              {/* Stuck Strategy Question */}
              <div className="space-y-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor="stuckStrategy">
                  What do you typically do when you feel stuck? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="stuckStrategy"
                  value={feedbackForm.stuckStrategy || ''}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, stuckStrategy: e.target.value }))}
                  placeholder="Tell us what helps you when you hit a wall"
                  className="w-full p-3 border rounded-lg resize-none h-20 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={300}
                />
              </div>

              {/* Improvement Suggestion */}
              <div className="space-y-3 flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor="improvementSuggestion">
                  If you could change one thing about the game to make it more fun or less annoying for you personally, what would you change first? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="improvementSuggestion"
                  value={feedbackForm.improvementSuggestion || ''}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, improvementSuggestion: e.target.value }))}
                  placeholder="What would make this game more enjoyable for you?"
                  className="w-full p-3 border rounded-lg resize-none h-20 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={300}
                />
              </div>

              <Button
                onClick={handleFeedbackSubmit}
                disabled={!isFeedbackFormValid() || isSubmittingFeedback}
                className="w-full"
                size="lg"
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback & View Results"}
              </Button>
            </div>
          </Card>
        ) : gameResults ? (
          // Show results after feedback is submitted
          <div className="grid lg:grid-cols-1 gap-8">
            {/* Thank You Message - Left Side */}
            {/* <Card className="p-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for submitting your feedback and participating in our study!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your responses help us improve the game experience for future players.
                </p>
                <div className="pt-4">
                  <Button onClick={handleReturnToGame} size="lg">
                    Play Again
                  </Button>
                </div>
              </div>
            </Card> */}

            {/* Game Results - Right Side */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">🎉 Game Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Congratulations on completing your word-finding adventure!
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {gameResults.foundWords.length}/{gameResults.gameData?.wordCount || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Words Found</div>
                    <Progress value={gameResults.gameData?.wordCount ? (gameResults.foundWords.length / gameResults.gameData.wordCount) * 100 : 0} />
                  </div>
                  <div className="text-center content-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatTime(gameResults.timer)}</div>
                    <div className="text-sm text-muted-foreground">Total Time</div>
                  </div>
                </div>

                {gameResults.allWords && (
                  <div>
                    <h4 className="font-semibold mb-3">All Words</h4>
                    <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {gameResults.allWords.map((word: string, index: number) => {
                          const isFound = gameResults.foundWords.some(
                            (w: string) => w.trim().toLowerCase() === word.trim().toLowerCase()
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
                )}

                {/* <div className="pt-4 text-center">
                  <Button onClick={handleReturnToGame} size="lg" className="w-full">
                    Play Again
                  </Button>
                </div> */}
              </div>
            </Card>
          </div>
        ) : resultsError ? (
          // Results fetch failed
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-semibold">Thank you for your feedback!</h3>
              <p className="text-muted-foreground">{resultsError}</p>
            </div>
          </Card>
        ) : (
          // Loading results state
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Loading your results...</h3>
              <p className="text-muted-foreground">
                Please wait while we prepare your game results.
              </p>
            </div>
          </Card>
        )}
      </div>

      <Toaster />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}