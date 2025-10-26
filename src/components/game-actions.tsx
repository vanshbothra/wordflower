import { Button } from "@/components/ui/button"
import { ShuffleIcon } from "lucide-react"

interface GameActionsProps {
  currentWord: string
  gameState: 'not-started' | 'playing' | 'ended'
  onSubmit: () => void
  onShuffle: () => void
}

export function GameActions({
  currentWord,
  gameState,
  onSubmit,
  onShuffle
}: GameActionsProps) {
  return (
    <div className="mt-8 text-center flex gap-2 justify-center">
      <Button
        onClick={onSubmit}
        size="lg"
        disabled={currentWord.length === 0 || gameState !== 'playing'}
      >
        Submit Word
      </Button>
      <Button 
        size="lg"
        onClick={(e) => {
          onShuffle()
          e.currentTarget.blur()
        }}
      >
        <ShuffleIcon />
      </Button>
    </div>
  )
}