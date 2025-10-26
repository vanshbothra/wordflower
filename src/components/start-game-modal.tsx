import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

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
  onResumeGame: (savedGame: SavedGameState) => void
  formatTime: (seconds: number) => string
}

export function StartGameModal({
  isOpen,
  onOpenChange,
  savedGame,
  onStartNewGame,
  onResumeGame,
  formatTime
}: StartGameModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <Button onClick={onStartNewGame} variant="outline" className="flex-1">
                New Game
              </Button>
              <Button onClick={() => onResumeGame(savedGame)} className="flex-1">
                Resume Game
              </Button>
            </>
          ) : (
            <Button onClick={onStartNewGame} size="lg" className="w-full">
              Start Game
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}