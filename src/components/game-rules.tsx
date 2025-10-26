import { Card } from "@/components/ui/card"
import { Clock, Shuffle, Target, Star } from "lucide-react"

export function GameRules() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Game Rules
      </h3>
      
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">How to Play:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Create words using the available letters</li>
            <li>Each word must contain the center letter and be at least 4 letters long</li>
            <li>You can repeat letters as needed</li>
            <li>Look for pangrams - words that use all the letters!</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Game Features:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Timer shows time remaining (30 minutes total)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shuffle className="h-4 w-4 text-green-500" />
              <span>Use the shuffle button to rearrange letters</span>
            </div>            
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <strong>Tip:</strong> Use keyboard shortcuts - Enter to submit, Escape to clear, Backspace to delete
        </div>
      </div>
    </Card>
  )
}