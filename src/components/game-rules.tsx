import { Card } from "@/components/ui/card"
import { Clock, Shuffle, Target, Star } from "lucide-react"

export function GameRules(experimentType: number[]) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold flex items-center gap-1">
        <Target className="h-5 w-5 text-primary" />
        Game Rules
      </h3>

      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">How to Play:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Play this game <strong>on your own</strong> and do not use any external resources</li>
            <li>Create as many words as possible using the available letters</li>
            <li>Each word must contain the center letter and be at least 4 letters long</li>
            <li>You can <b>repeat letters</b> as needed</li>
            <li>The gameplay session is capped at <strong>30 minutes</strong>. If the timer elapses, the game will save your progress and conclude automatically. However, if you feel you have exhausted your search, you may choose to end the session early by clicking the <strong>"End Game"</strong> button.</li>
            {experimentType?.includes(1) && <li>You will be given a five minute break during the game in which you will have to perform a short task. Please do not worry about your performance during this task, it is only meant to serve as an activity during the break.</li>}
            {experimentType?.includes(2) && <li>You may receive some hints as the game progresses. You can either dismiss the hint or try and find the associated word. Finding any word successfully will automatically dismiss the current hint.</li>}
            {/* <li>Each game has atleast one <strong>pangram</strong> - words that use all the letters!</li> */}
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