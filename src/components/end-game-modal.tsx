import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface GameData {
  gameId: string
  centerLetter: string
  outerLetters: string[]
  wordCount: number
  pangramCount: number
}

interface EndGameModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  foundWords: string[]
  allWords: string[]
  gameData: GameData | null
  timer: number
  formatTime: (seconds: number) => string
  onPlayAgain: () => void
}

export function EndGameModal({
  isOpen,
  onOpenChange,
  foundWords,
  allWords,
  gameData,
  timer,
  formatTime,
  onPlayAgain
}: EndGameModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
          <Button onClick={onPlayAgain} size="lg">
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}