import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface SavedGameState {
  gameId: string
  foundWords: string[]
  timer: number
  gameState: 'not-started' | 'playing' | 'ended'
  currentWord: string
  savedAt: number
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

interface StartGameModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  savedGame: SavedGameState | null
  onStartNewGame: () => void
  onResumeGame: (savedGame: SavedGameState) => Promise<void>
  formatTime: (seconds: number) => string
  isStartingGame?: boolean
}

export function StartGameModal({
  isOpen,
  onOpenChange,
  savedGame,
  onStartNewGame,
  onResumeGame,
  formatTime,
  isStartingGame = false
}: StartGameModalProps) {
  const [isResuming, setIsResuming] = useState(false)

  const handleResumeGame = async () => {
    if (!savedGame) return
    
    setIsResuming(true)
    try {
      await onResumeGame(savedGame)
    } finally {
      setIsResuming(false)
    }
  }

  // Format elapsed time for saved game display
  const formatElapsedTime = (remainingSeconds: number) => {
    const elapsedSeconds = 30 * 60 - remainingSeconds
    const mins = Math.floor(elapsedSeconds / 60)
    const secs = elapsedSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thank you for participating in our study! 🌻</DialogTitle>          
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold mb-2">How to Play:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create as many words as you can using the available letters</li>
              <li>Each word must contain the center letter and be at least 4 letters long</li>
              <li>You can repeat letters as needed</li>
              <li>Look for pangrams - words that use all the letters!</li>
            </ul>
          </div>
          
          <div className="text-sm">
            <span className="font-semibold">Time Limit:</span> 30 minutes
          </div>
          
          <div className="text-sm text-muted-foreground">
            After completing the game, you'll be asked to provide feedback through a short survey. 
            We'll be happy to share the results with you!
          </div>
          
          {savedGame && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <span className="text-primary font-medium">
                📱 Saved Game Found: {savedGame.foundWords.length} words found, {formatElapsedTime(savedGame.timer)} played
              </span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {savedGame ? (
            <>
              <Button 
                onClick={onStartNewGame} 
                variant="outline" 
                className="flex-1"
                disabled={isStartingGame}
              >
                {isStartingGame ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  "New Game"
                )}
              </Button>
              <Button 
                onClick={handleResumeGame}
                className="flex-1"
                disabled={isStartingGame || isResuming}
              >
                {isResuming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  "Resume Game"
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={onStartNewGame} 
              size="lg" 
              className="w-full"
              disabled={isStartingGame}
            >
              {isStartingGame ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Starting Game...
                </>
              ) : (
                "Start Game"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}