"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, SkipForward } from "lucide-react"
import type { WordHints } from "@/lib/word-data"
import { cn } from "@/lib/utils"

interface HintSystemProps {
  currentHintWord: WordHints | null
  hintLevel: number
  onRequestHint: () => void
  onSkipWord: () => void
  foundWords: string[]
}

export function HintSystem({ currentHintWord, hintLevel, onRequestHint, onSkipWord, foundWords }: HintSystemProps) {
  if (!currentHintWord) {
    return null
  }

  // Check if current hint word is already found
  const isWordFound = foundWords.includes(currentHintWord.word)

  const getPreviousHints = () => {
    const hints = []

    if (hintLevel >= 2) {
      hints.push({
        level: 1,
        label: "Related",
        content: currentHintWord.relatedWord,
      })
    }
    if (hintLevel >= 3) {
      hints.push({
        level: 2,
        label: "Synonym",
        content: currentHintWord.synonym,
      })
    }
    if (hintLevel >= 4) {
      hints.push({
        level: 3,
        label: "Phrase",
        content: `"${currentHintWord.phrase}"`,
        isItalic: true,
      })
    }

    return hints
  }

  const getCurrentHint = () => {
    if (hintLevel === 1) {
      return {
        level: 1,
        label: "Related Word",
        content: currentHintWord.relatedWord,
      }
    }
    if (hintLevel === 2) {
      return {
        level: 2,
        label: "Synonym",
        content: currentHintWord.synonym,
      }
    }
    if (hintLevel === 3) {
      return {
        level: 3,
        label: "Phrase",
        content: `"${currentHintWord.phrase}"`,
        isItalic: true,
      }
    }
    if (hintLevel === 4) {
      return {
        level: 4,
        label: "Fill in the blank",
        content: currentHintWord.fillInBlank,
        isMono: true,
      }
    }
    return null
  }

  const previousHints = getPreviousHints()
  const currentHint = getCurrentHint()

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Hint System
        </h3>
        <div className="text-sm text-muted-foreground">Level {Math.min(hintLevel, 4)}/4</div>
      </div>

      {isWordFound ? (
        <div className="text-center py-8 mb-4">
          <p className="text-success font-semibold text-lg mb-2">✓ Word Found!</p>
          <p className="text-muted-foreground">Click "Next Word" for the next hint</p>
        </div>
      ) : hintLevel === 0 ? (
        <div className="text-center py-8 mb-4">
          <p className="text-muted-foreground">Click "Get Hint" to start</p>
        </div>
      ) : (
        <div className="flex gap-4 mb-4 min-h-[200px]">
          {/* Previous hints - small cards stacked vertically on the left */}
          {previousHints.length > 0 && (
            <div className="flex flex-col gap-2 w-32">
              {previousHints.map((hint) => (
                <Card key={hint.level} className="p-2 border bg-muted/50">
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">{hint.label}</p>
                  <p className={cn("text-xs font-medium text-foreground line-clamp-2", hint.isItalic && "italic")}>
                    {hint.content}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Current hint - large and centered */}
          {currentHint && (
            <Card className="flex-1 p-6 border-2 border-primary bg-primary/5 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                Level {currentHint.level}: {currentHint.label}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold text-foreground text-center",
                  currentHint.isItalic && "italic text-xl",
                  currentHint.isMono && "font-mono text-3xl tracking-widest",
                )}
              >
                {currentHint.content}
              </p>
            </Card>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onRequestHint} disabled={hintLevel >= 4 || isWordFound} className="flex-1" variant="default">
          <Lightbulb className="h-4 w-4 mr-2" />
          {hintLevel === 0 ? "Get Hint" : "Next Hint"}
        </Button>
        <Button onClick={onSkipWord} variant="outline" className="flex-1 bg-transparent">
          <SkipForward className="h-4 w-4 mr-2" />
          Next Word
        </Button>
      </div>
    </Card>
  )
}
