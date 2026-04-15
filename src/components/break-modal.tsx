import { BREAK_THRESHOLD, formatTime } from "@/lib/utils"
import { SpotTheDifference } from "./spot-the-difference"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type BreakModalProps = {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    breakTimer: number
    setTimeSinceWord: (timer: number) => void
    spotRoundIndex: number
    onSpotRoundIndexChange: (index: number) => void
    onResume: (answers: Record<string, string[]>) => void
}

export function BreakModal({ isOpen, setIsOpen, breakTimer, setTimeSinceWord, spotRoundIndex, onSpotRoundIndexChange, onResume }: BreakModalProps) {
    const answersRef = useRef<Record<string, string[]>>({})
    const [isSpotGameComplete, setIsSpotGameComplete] = useState(false)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && breakTimer === 0) {
            setIsOpen(false)
            setTimeSinceWord(isSpotGameComplete ? -1 : BREAK_THRESHOLD)
            onResume(answersRef.current)
            toast.info("Please continue playing!")
        }
    }, [breakTimer, isOpen, setIsOpen, setTimeSinceWord, onResume, isSpotGameComplete])

    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

                {/* Modal container */}
                <div
                    className="bg-background rounded-lg shadow-lg
      min-h-[600px] w-[95vw] max-w-[1200px]
      max-h-[90vh] overflow-auto p-6"
                >
                    <div className="mb-5 gap-1 flex flex-row justify-between items-center">
                        <div>
                            <h1 className="text-xl font-semibold">Take a break</h1>
                            <h2 className="text-sm ">Please don't worry about your performance here. If you are done with a round, you can move on to the next one!</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatTime(breakTimer)}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">

                        {/* Spot the difference game */}
                        <SpotTheDifference
                            initialIndex={spotRoundIndex}
                            onIndexChange={onSpotRoundIndexChange}
                            onAnswersChange={(answers) => {
                                answersRef.current = answers
                            }}
                            onCompleteStatusChange={setIsSpotGameComplete}
                            disabled={breakTimer === 0}
                        />

                        {/* Resume button */}
                        <button
                            disabled={breakTimer > 0 && !isSpotGameComplete}
                            onClick={() => {
                                setIsOpen(false)
                                setTimeSinceWord(isSpotGameComplete ? -1 : BREAK_THRESHOLD)
                                onResume(answersRef.current)
                            }}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium
          bg-primary text-primary-foreground hover:bg-primary/90
          h-10 px-6 w-full disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {breakTimer > 0 && !isSpotGameComplete ? "Please wait..." : "Resume Game"}
                        </button>

                    </div>
                </div>
            </div>
        )
    )
}