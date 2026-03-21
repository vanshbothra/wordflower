"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const ROUNDS = [
    { id: 1, label: "Round 1", imageA: '/spot-the-difference/1a.png', imageB: '/spot-the-difference/1b.png' },
    { id: 2, label: "Round 2", imageA: '/spot-the-difference/2a.png', imageB: '/spot-the-difference/2b.png' },
    { id: 3, label: "Round 3", imageA: '/spot-the-difference/3a.png', imageB: '/spot-the-difference/3b.png' },
    { id: 4, label: "Round 4", imageA: '/spot-the-difference/4a.png', imageB: '/spot-the-difference/4b.png' },
]

const NUM_DIFFERENCES = 4

interface SpotTheDifferenceProps {
    onComplete?: () => void
    initialIndex?: number
    onIndexChange?: (index: number) => void
    onAnswersChange?: (allAnswers: Record<string, string[]>) => void
    disabled: boolean
}

export function SpotTheDifference({ onComplete, initialIndex = 0, onIndexChange, onAnswersChange, disabled }: SpotTheDifferenceProps) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("wordflower_spot_index")
            if (saved !== null) return parseInt(saved, 10)
        }
        return initialIndex
    })

    const [answers, setAnswers] = useState<string[][]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("wordflower_spot_answers")
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {
                    // Ignore JSON parse error and fallback to default
                }
            }
        }
        return ROUNDS.map(() => Array(NUM_DIFFERENCES).fill(""))
    })

    const currentRound = ROUNDS[currentIndex]
    const currentAnswers = answers[currentIndex]
    const allFilled = currentAnswers.every((a) => a.trim().length > 0)
    const isLast = currentIndex === ROUNDS.length - 1
    const isFirst = currentIndex === 0

    function handleAnswerChange(inputIdx: number, value: string) {
        setAnswers((prev) => {
            const next = prev.map((row) => [...row])
            next[currentIndex][inputIdx] = value

            if (typeof window !== "undefined") {
                localStorage.setItem("wordflower_spot_answers", JSON.stringify(next))
            }

            const payload: Record<string, string[]> = {}
            ROUNDS.forEach((r, idx) => {
                payload[r.label] = next[idx]
            })
            onAnswersChange?.(payload)

            return next
        })
    }

    function handleNext() {
        if (!allFilled) return
        if (isLast) {
            onComplete?.()
        } else {
            const next = currentIndex + 1
            setCurrentIndex(next)
            if (typeof window !== "undefined") {
                localStorage.setItem("wordflower_spot_index", next.toString())
            }
            onIndexChange?.(next)
        }
    }

    function handlePrev() {
        if (!isFirst) {
            const prev = currentIndex - 1
            setCurrentIndex(prev)
            if (typeof window !== "undefined") {
                localStorage.setItem("wordflower_spot_index", prev.toString())
            }
            onIndexChange?.(prev)
        }
    }

    return (
        <div className="w-full flex flex-row gap-4">
            {/* Carousel header */}
            <div className="flex flex-col gap-4 w-[60%]">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={isFirst}
                        className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous round"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>
                    <span className="text-sm font-semibold text-muted-foreground">
                        {currentRound.label} of {ROUNDS.length}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={!allFilled}
                        className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next round"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Image pair */}
                <div className="flex gap-2 w-full">
                    {(['A', 'B'] as const).map((label) => (
                        <div
                            key={label}
                            className="flex gap-4 rounded-lg  flex-col items-center justify-center "
                        >
                            <span className="text-xs font-medium text-muted-foreground mb-1">{label}</span>
                            <img src={currentRound[`image${label}`]} alt="" className="w-[350px] h-[450px]" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Difference inputs */}
            <div className="flex flex-col gap-6 w-[40%]">
                <p className="text-xs font-medium text-muted-foreground">
                    Describe all {NUM_DIFFERENCES} differences:
                </p>
                {Array.from({ length: NUM_DIFFERENCES }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                            {i + 1}.
                        </span>
                        <input
                            type="text"
                            autoFocus={false}
                            value={currentAnswers[i]}
                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                            placeholder={`Difference ${i + 1}…`}
                            className={cn(
                                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm",
                                "shadow-sm transition-colors placeholder:text-muted-foreground",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            )}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>


            {
                allFilled && isLast && (
                    <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
                        🎉 Great job! You spotted them all.
                    </p>
                )
            }
        </div >
    )
}
