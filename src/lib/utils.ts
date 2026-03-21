import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BREAK_THRESHOLD = 2 * 60
export const BREAK_TIME = 5 * 60

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format timer display - countdown format
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins > 0) {
    if (mins === 1) {
      return `1 minute remaining`
    }
    return `${mins} minutes remaining`
  } else {
    // Show seconds when less than 1 minute remaining
    return `${secs} sec remaining`
  }
}

export const formatBreakTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${secs} sec remaining`
  }
}

// Format elapsed time for saved game display
export const formatElapsedTime = (remainingSeconds: number) => {
  const elapsedSeconds = 30 * 60 - remainingSeconds
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
