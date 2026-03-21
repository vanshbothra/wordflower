import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface GameControlsProps {
  gameState: 'not-started' | 'playing' | 'ended'
  timer: number
  isTabVisible: boolean
  isMobile: boolean
  onEndGame: () => void
  isEndingGame?: boolean
}

export function GameControls({
  gameState,
  timer,
  isTabVisible,
  isMobile,
  onEndGame,
  isEndingGame = false
}: GameControlsProps) {
  return (
    <div className="flex justify-between items-center mb-4">

      <div className={`flex-1 w-full flex ${isMobile ? 'justify-center' : 'justify-end'} items-center gap-4`}>
        {gameState === 'playing' && (
          <div className="flex flex-row justify-end gap-4 text-center items-center">
            <div className={`text-lg font-mono font-bold ${timer <= 60 ? 'text-red-500' : 'text-foreground'}`}>
              {formatTime(timer)}
              {!isTabVisible && (
                <span className="text-sm text-orange-500 block">⏸️ Paused</span>
              )}
            </div>
            <Button
              onClick={onEndGame}
              variant="secondaryDestructive"
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
      </div>
    </div>
  )
}