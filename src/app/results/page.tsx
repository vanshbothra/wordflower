"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface FeedbackForm {
  satisfaction: number
  mostDifficult: string
  willReturn: boolean
}

interface GameFeedback {
  satisfaction: number // 1-5 scale
  mostDifficult: string
  willReturn: boolean
  submittedAt: Date
}

export default function ResultsPage() {
  const router = useRouter()
  
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [allWords, setAllWords] = useState<string[]>([])
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [timer, setTimer] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    satisfaction: 0,
    mostDifficult: '',
    willReturn: false
  })
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Function to clean up results data and return to main page
  const handleReturnToGame = () => {
    // Clean up results data
    localStorage.removeItem('wordflower_results')
    router.push('/')
  }

  // Initialize data from localStorage
  useEffect(() => {
    const resultsData = localStorage.getItem('wordflower_results')
    if (resultsData) {
      try {
        const data = JSON.parse(resultsData)
        setFoundWords(data.foundWords || [])
        setAllWords(data.allWords || [])
        setGameData(data.gameData)
        setTimer(data.timer || 0)
        setGameId(data.gameId)
        
        // Optional: Clean up old data (older than 1 hour)
        const oneHour = 60 * 60 * 1000
        if (data.timestamp && Date.now() - data.timestamp > oneHour) {
          localStorage.removeItem('wordflower_results')
        }
      } catch (error) {
        console.error('Failed to parse results data:', error)
        // Redirect back to main page if data is corrupted
        handleReturnToGame()
        return
      }
    } else {
      // No results data found, redirect to main page
      handleReturnToGame()
      return
    }

    // Get user ID
    const id = localStorage.getItem('wordflower_user_id')
    setUserId(id)
  }, [])

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
      willReturn: feedbackForm.willReturn,
      submittedAt: new Date()
    }

    const success = await submitFeedback(feedback)
    
    if (success) {
      toast.success("Thank you for your feedback!")
      setFeedbackSubmitted(true)
      // Clear saved game
      localStorage.removeItem('wordflower_game')
    } else {
      toast.error("Failed to submit feedback. Please try again.")
    }

    setIsSubmittingFeedback(false)
  }

  // Check if feedback form is valid
  const isFeedbackFormValid = () => {
    return feedbackForm.satisfaction > 0 && feedbackForm.mostDifficult.trim() !== ''
  }

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Redirect if no game data
  if (!gameId || !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No game data found</h1>
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
          <h2 className="text-2xl font-semibold">Game Results</h2>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Feedback Form - Left Side */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">🌻 Game Feedback</h3>
            
            {!feedbackSubmitted ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Help us improve your experience! Please share your thoughts about this game.
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
                        className={`p-2 rounded-lg transition-colors ${
                          feedbackForm.satisfaction >= rating
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

                {/* Most Difficult Question */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" htmlFor="mostDifficult">
                    What was the most difficult part for you? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="mostDifficult"
                    value={feedbackForm.mostDifficult}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, mostDifficult: e.target.value }))}
                    placeholder="E.g., Finding longer words, understanding the rules, letter combinations..."
                    className="w-full p-3 border rounded-lg resize-none h-20 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    maxLength={200}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {feedbackForm.mostDifficult.length}/200
                  </div>
                </div>

                {/* Will Return Question */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Will you come back to play again?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="willReturn"
                        checked={feedbackForm.willReturn === true}
                        onChange={() => setFeedbackForm(prev => ({ ...prev, willReturn: true }))}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Yes, definitely!</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="willReturn"
                        checked={feedbackForm.willReturn === false}
                        onChange={() => setFeedbackForm(prev => ({ ...prev, willReturn: false }))}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Probably not</span>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleFeedbackSubmit}
                  disabled={!isFeedbackFormValid() || isSubmittingFeedback}
                  className="w-full"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for submitting your feedback and participating in our study!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your responses help us improve the game experience for future players.
                </p>
              </div>
            )}
          </Card>

          {/* Game Results - Right Side */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">🎉 Game Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Congratulations on completing your word-finding adventure!
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{foundWords.length}/{gameData.wordCount}</div>
                  <div className="text-sm text-muted-foreground">Words Found</div>
                  <Progress value={gameData ? (foundWords.length / gameData.wordCount) * 100 : 0} />
                </div>
                <div className="text-center content-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatTime(timer)}</div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">All Words</h4>
                <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
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
          </Card>
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}