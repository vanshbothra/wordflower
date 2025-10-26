import { Button } from "@/components/ui/button"
import { ShuffleIcon, Loader2 } from "lucide-react"

interface GameActionsProps {
  currentWord: string
  gameState: 'not-started' | 'playing' | 'ended'
  onSubmit: () => void
  onShuffle: () => void
  isSubmittingWord?: boolean
}

export function GameActions({
  currentWord,
  gameState,
  onSubmit,
  onShuffle,
  isSubmittingWord = false
}: GameActionsProps) {
  return (
    <div className="mt-8 text-center flex gap-2 justify-center">
      <Button
        onClick={onSubmit}
        size="lg"
        disabled={currentWord.length === 0 || gameState !== 'playing' || isSubmittingWord}
      >
        {isSubmittingWord ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          "Submit Word"
        )}
      </Button>
      <Button 
        size="lg"
        onClick={(e) => {
          onShuffle()
          e.currentTarget.blur()
        }}
        disabled={gameState !== 'playing'}
      >
        <ShuffleIcon />
      </Button>
    </div>
  )
}