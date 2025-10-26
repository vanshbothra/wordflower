"use client"

import { Button } from "@/components/ui/button"
import { X, Delete } from "lucide-react"
import { cn } from "@/lib/utils"

interface WordDisplayProps {
  currentWord: string
  onClear: () => void
  onBackspace: () => void
}

export function WordDisplay({ currentWord, onClear, onBackspace }: WordDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <Button
        variant="outline"
        size="icon"
        onClick={onClear}
        disabled={currentWord.length === 0}
        className="shrink-0 bg-transparent"
      >
        <X className="h-4 w-4" />
      </Button>

      <div
        className={cn(
          "min-w-[200px] h-16 px-6 rounded-lg",
          "bg-card border-2 border-border",
          "flex items-center justify-center",
          "text-3xl font-bold tracking-wider",
          "text-foreground",
        )}
      >
        {currentWord || <span className="text-muted-foreground text-xl">Type or Click Letters</span>}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onBackspace}
        disabled={currentWord.length === 0}
        className="shrink-0 bg-transparent"
      >
        <Delete className="h-4 w-4" />
      </Button>
    </div>
  )
}
