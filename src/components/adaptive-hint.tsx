"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { WordHints } from "@/lib/word-data"
import type { GameData } from "@/app/page"
import { Lightbulb, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
    ADAPTIVE_HINT_INACTIVITY_THRESHOLD,
    pickAdaptiveHint,
    type RepeatedLetterWord,
    type AdaptiveHintResult,
    type WordRelationship,
} from "@/lib/adaptive-hint-utils"

interface AdaptiveHintProps {
    gameState: "not-started" | "playing" | "ended"
    foundWords: string[]
    allWords: string[]
    hintData: WordHints[]
    gameData: GameData | null
    prefixMap: Map<string, string[]>
    suffixMap: Map<string, string[]>
    repeatedLetterWords: RepeatedLetterWord[]
    wordRelationships: WordRelationship[]
    onAdaptiveHintShown?: (hint: AdaptiveHintResult) => void
}

/**
 * Inline component that tracks player inactivity and shows adaptive hints
 * below the flower. The hint stays visible until the user finds a correct
 * word or manually dismisses it.
 */
export function AdaptiveHint({
    gameState,
    foundWords,
    allWords,
    hintData,
    gameData,
    prefixMap,
    suffixMap,
    repeatedLetterWords,
    wordRelationships,
    onAdaptiveHintShown,
}: AdaptiveHintProps) {
    const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const secondsSinceLastFind = useRef(0)
    const lastStrategyRef = useRef(0)
    const prevFoundWordsCount = useRef(foundWords.length)

    const [currentHint, setCurrentHint] = useState<AdaptiveHintResult | null>(null)

    // Use refs to always have the latest values inside the interval callback
    const latestPropsRef = useRef({
        allWords,
        foundWords,
        hintData,
        gameData,
        prefixMap,
        suffixMap,
        repeatedLetterWords,
        wordRelationships,
        onAdaptiveHintShown,
    })

    useEffect(() => {
        latestPropsRef.current = {
            allWords,
            foundWords,
            hintData,
            gameData,
            prefixMap,
            suffixMap,
            repeatedLetterWords,
            wordRelationships,
            onAdaptiveHintShown,
        }
    })

    // Dismiss the current hint and reset timer
    const dismissHint = useCallback(() => {
        setCurrentHint(null)
        secondsSinceLastFind.current = 0
    }, [])

    // When the user finds a new correct word, dismiss the hint and reset timer
    useEffect(() => {
        if (foundWords.length > prevFoundWordsCount.current) {
            dismissHint()
        }
        prevFoundWordsCount.current = foundWords.length
    }, [foundWords.length, dismissHint])

    // Show a hint
    const showHint = useCallback(() => {
        const {
            allWords: words,
            foundWords: found,
            hintData: hints,
            gameData: game,
            prefixMap: prefixes,
            suffixMap: suffixes,
            repeatedLetterWords: repeated,
            wordRelationships: relationships,
            onAdaptiveHintShown: onShown,
        } = latestPropsRef.current

        if (!game || words.length === 0) return
        if (currentHint !== null) return // already showing one

        const hint = pickAdaptiveHint(
            words,
            found,
            hints,
            prefixes,
            suffixes,
            repeated,
            lastStrategyRef.current,
            relationships
        )

        if (!hint) return

        lastStrategyRef.current = hint.strategy
        setCurrentHint(hint)
        onShown?.(hint)
    }, [dismissHint, currentHint])

    // Main inactivity timer — stable dependencies
    useEffect(() => {
        if (gameState !== "playing") {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current)
                inactivityTimerRef.current = null
            }
            return
        }

        inactivityTimerRef.current = setInterval(() => {
            const { allWords: words, gameData: game } = latestPropsRef.current

            if (!game || words.length === 0) return
            // Don't increment if a hint is already showing
            if (secondsSinceLastFind.current >= ADAPTIVE_HINT_INACTIVITY_THRESHOLD) return

            secondsSinceLastFind.current += 1

            if (secondsSinceLastFind.current >= ADAPTIVE_HINT_INACTIVITY_THRESHOLD) {
                showHint()
            }
        }, 1000)

        return () => {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current)
                inactivityTimerRef.current = null
            }
        }
    }, [gameState, showHint])

    // Cleanup on game end
    useEffect(() => {
        if (gameState === "ended" || gameState === "not-started") {
            dismissHint()
            secondsSinceLastFind.current = 0
            lastStrategyRef.current = 0
        }
    }, [gameState, dismissHint])

    // Render inline hint card below the flower
    if (!currentHint) return null

    return (
        <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700 relative animate-in fade-in slide-in-from-top-2 duration-300">
            <button
                onClick={dismissHint}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                aria-label="Dismiss hint"
            >
                <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </button>

            <div className="flex items-start gap-3 pr-6">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 uppercase tracking-wide">
                        Adaptive Hint
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-100 font-medium leading-relaxed">
                        {currentHint.message}
                    </p>
                </div>
            </div>
        </Card>
    )
}
