"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface FoundWordsListProps {
  foundWords: string[]
  totalWords: number
}

export function FoundWordsList({ foundWords, totalWords }: FoundWordsListProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Found Words
        </h3>
        <div className="text-sm font-medium text-muted-foreground">
          {foundWords.length} / {totalWords}
        </div>
      </div>

      {foundWords.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No words found yet. Start playing!</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {foundWords.map((word, index) => (
            <div key={index} className="px-3 py-2 bg-success/10 text-success rounded-md text-center font-medium">
              {word}
            </div>
          ))}
        </div>
      )}

      {foundWords.length === totalWords && (
        <div className="mt-4 p-4 bg-success/20 rounded-lg text-center">
          <p className="text-success font-bold text-lg">🎉 Congratulations!</p>
          <p className="text-success-foreground">You found all the words!</p>
        </div>
      )}
    </Card>
  )
}
