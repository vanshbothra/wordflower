"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, SkipBack, SkipForward } from "lucide-react"
import type { WordHints } from "@/lib/word-data"
import { cn } from "@/lib/utils"

interface HintSystemProps {
  currentHintWord: WordHints | null
  hintLevel: number
  onRequestHint: () => void
  onSkipWord: () => void
  foundWords: string[]
  onPreviousWord: () => void
}

export function HintSystem({ currentHintWord, hintLevel, onRequestHint, onSkipWord, foundWords, onPreviousWord }: HintSystemProps) {
  const [expandedHintLevel, setExpandedHintLevel] = useState<number | null>(0)

  // Sync expanded card with current hint level
  useEffect(() => {
    if (hintLevel > 0) {
      setExpandedHintLevel(hintLevel)
    } else {
      setExpandedHintLevel(null)
    }
  }, [hintLevel, currentHintWord])

  if (!currentHintWord) {
    return (
      <Card className="p-6 mb-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground animate-pulse">Loading hint system…</p>
        </div>
      </Card>
    )
  }


  const isWordFound = currentHintWord
    ? foundWords.some((w) => w.trim().toLowerCase() === currentHintWord.word.trim().toLowerCase())
    : false

  const hints = [
    { level: 1, label: "Definition", content: currentHintWord.relatedWord },
    { level: 2, label: "Synonym", content: currentHintWord.synonym },
    { level: 3, label: "Phrase", content: `"${currentHintWord.phrase}"`, isItalic: true },
    { level: 4, label: "Blanks", content: currentHintWord.fillInBlank, isMono: true },
  ].filter((h) => h.level <= hintLevel)

  const handleHintClick = (level: number) => {
    setExpandedHintLevel(level)
  }
  const currentExpandedHint = expandedHintLevel
    ? hints.find((h) => h.level === expandedHintLevel)
    : hints[hints.length - 1]

  const previousHints = hints.filter((h) => h.level !== currentExpandedHint?.level)

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
          <p className="text-success font-semibold text-lg mb-2">Hint Word Found!</p>
          <p className="text-muted-foreground">Click "Next Word" for the next hint</p>
        </div>
      ) : hintLevel === 0 ? (
        <div className="text-center py-8 mb-4">
          <p className="text-muted-foreground">Click "Get Hint" to start</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-4 min-h-[200px]">
          {/* Previous hints */}
          {/* Hint selector row (includes all revealed hints) */}
          {hints.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hints.map((hint) => {
                const isActive = hint.level === expandedHintLevel
                return (
                  <Card
                    key={hint.level}
                    className={cn(
                      "p-2 border cursor-pointer transition-colors",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "bg-muted/50 hover:bg-muted/70 border-muted"
                    )}
                    onClick={() => handleHintClick(hint.level)}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-medium mb-1",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {hint.label}
                    </p>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Expanded / current hint */}
          {currentExpandedHint && (
            <Card className="flex-1 p-6 border-2 border-primary bg-primary/5 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                Level {currentExpandedHint.level}: {currentExpandedHint.label}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold text-foreground text-center",
                  currentExpandedHint.isItalic && "italic text-xl",
                  currentExpandedHint.isMono && "font-mono text-3xl tracking-widest"
                )}
              >
                {currentExpandedHint.content}
              </p>
            </Card>
          )}

        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onPreviousWord} variant="outline" className="flex-1 bg-transparent">
          <SkipBack className="h-4 w-4 mr-2" />
        </Button>
        <Button onClick={onRequestHint} disabled={hintLevel >= 4 || isWordFound} className="flex-1" variant="default">
          <Lightbulb className="h-4 w-4 mr-2" />
          {hintLevel === 0 ? "Get Hint" : "Next Hint"}
        </Button>
        <Button onClick={onSkipWord} variant="outline" className="flex-1 bg-transparent">
          <SkipForward className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </Card>
  )
}
