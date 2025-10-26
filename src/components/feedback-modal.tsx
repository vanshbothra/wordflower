import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Star } from "lucide-react"

interface FeedbackForm {
  satisfaction: number
  mostDifficult: string
  willReturn: boolean
}

interface FeedbackModalProps {
  isOpen: boolean
  feedbackForm: FeedbackForm
  setFeedbackForm: React.Dispatch<React.SetStateAction<FeedbackForm>>
  onSubmit: () => void
  isSubmitting: boolean
  isValid: boolean
}

export function FeedbackModal({
  isOpen,
  feedbackForm,
  setFeedbackForm,
  onSubmit,
  isSubmitting,
  isValid
}: FeedbackModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🌻 Game Feedback</DialogTitle>
          <DialogDescription>
            Help us improve your experience! Please share your thoughts about this game.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Satisfaction Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              How satisfied are you with your performance? <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFeedbackForm(prev => ({ ...prev, satisfaction: rating }))}
                  className={`p-2 rounded-lg transition-colors ${
                    feedbackForm.satisfaction >= rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star 
                    size={28} 
                    fill={feedbackForm.satisfaction >= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {feedbackForm.satisfaction === 1 && "Very Dissatisfied"}
              {feedbackForm.satisfaction === 2 && "Dissatisfied"}
              {feedbackForm.satisfaction === 3 && "Neutral"}
              {feedbackForm.satisfaction === 4 && "Satisfied"}
              {feedbackForm.satisfaction === 5 && "Very Satisfied"}
            </div>
          </div>

          {/* Most Difficult Question */}
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="mostDifficult">
              What was the most difficult part for you? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mostDifficult"
              value={feedbackForm.mostDifficult}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, mostDifficult: e.target.value }))}
              placeholder="E.g., Finding longer words, understanding the rules, letter combinations..."
              className="w-full p-3 border rounded-lg resize-none h-20 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {feedbackForm.mostDifficult.length}/200
            </div>
          </div>

          {/* Will Return Question */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Will you come back to play again?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="willReturn"
                  checked={feedbackForm.willReturn === true}
                  onChange={() => setFeedbackForm(prev => ({ ...prev, willReturn: true }))}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">Yes, definitely!</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="willReturn"
                  checked={feedbackForm.willReturn === false}
                  onChange={() => setFeedbackForm(prev => ({ ...prev, willReturn: false }))}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">Probably not</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit & View Results"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}