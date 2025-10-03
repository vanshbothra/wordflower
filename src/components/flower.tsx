"use client"

import { cn } from "@/lib/utils"

interface FlowerProps {
  centerLetter: string
  outerLetters: string[]
  currentWord: string
  onLetterClick: (letter: string) => void
}

export function Flower({ centerLetter, outerLetters, currentWord, onLetterClick }: FlowerProps) {
  // Calculate positions for 6 petals around center - closer to center
  const petalPositions = [
    { top: "10%", left: "50%", transform: "translate(-50%, -50%)" }, // top
    { top: "30%", left: "78%", transform: "translate(-50%, -50%)" }, // top-right
    { top: "70%", left: "78%", transform: "translate(-50%, -50%)" }, // bottom-right
    { top: "90%", left: "50%", transform: "translate(-50%, -50%)" }, // bottom
    { top: "70%", left: "22%", transform: "translate(-50%, -50%)" }, // bottom-left
    { top: "30%", left: "22%", transform: "translate(-50%, -50%)" }, // top-left
  ]

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Center circle */}
      <button
        onClick={() => onLetterClick(centerLetter)}
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-24 h-24 rounded-full",
          "bg-primary text-primary-foreground",
          "text-4xl font-bold",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-200",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-4 focus:ring-ring",
        )}
      >
        {centerLetter}
      </button>

      {/* Outer petals */}
      {outerLetters.map((letter, index) => (
        <button
          key={index}
          onClick={() => onLetterClick(letter)}
          style={petalPositions[index]}
          className={cn(
            "absolute w-20 h-20 rounded-full",
            "bg-secondary text-secondary-foreground",
            "text-3xl font-bold",
            "shadow-md hover:shadow-lg",
            "transition-all duration-200",
            "hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-ring",
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}
