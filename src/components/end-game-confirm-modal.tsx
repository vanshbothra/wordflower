import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatTime } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface EndGameConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  timer: number
}

export function EndGameConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  timer
}: EndGameConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            End Game Confirmation
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to end the game early?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="text-sm">
              <div className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                You have <strong>{formatTime(timer)}</strong>
              </div>
              <div className="text-orange-700 dark:text-orange-300">
                You still have time left to find more words. Are you sure you want to finish now?
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={onConfirm} variant="secondaryDestructive">
            End Game
          </Button>
          <Button onClick={onCancel}>
            Continue Playing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}