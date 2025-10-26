import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface GameControlsProps {
  gameState: 'not-started' | 'playing' | 'ended'
  timer: number
  formatTime: (seconds: number) => string
  isTabVisible: boolean
  isMobile: boolean
  onEndGame: () => void
  onShowEndModal: () => void
  isEndingGame?: boolean
}

export function GameControls({
  gameState,
  timer,
  formatTime,
  isTabVisible,
  isMobile,
  onEndGame,
  onShowEndModal,
  isEndingGame = false
}: GameControlsProps) {
  if (isMobile) {
    return (
      <h1 className="text-2xl font-bold text-foreground">
        🌻 {formatTime(timer)}
      </h1>
    )
  }

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex-1 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-2">🌻 Wordflower</h1>
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        {gameState === 'playing' && (
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(timer)}
              {!isTabVisible && (
                <span className="text-sm text-orange-500 block">⏸️ Paused</span>
              )}
            </div>
            <Button 
              onClick={onEndGame} 
              variant="destructive" 
              size="sm"
              disabled={isEndingGame}
            >
              {isEndingGame ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Ending...
                </>
              ) : (
                "End Game"
              )}
            </Button>
          </div>
        )}
        {gameState === 'ended' && (
          <div className="text-center">
            <Button onClick={onShowEndModal} variant="secondary" size="sm">
              Game Ended - {formatTime(timer)}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}