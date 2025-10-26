"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export default function SignInPage() {
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const router = useRouter()

  // Check if user is already signed in
  useEffect(() => {
    const existingUserId = localStorage.getItem('wordflower_user_id')
    if (existingUserId) {
      router.push('/')
    }
  }, [router])

  // Set cookie when localStorage changes (for middleware)
  useEffect(() => {
    const syncCookie = () => {
      const localUserId = localStorage.getItem('wordflower_user_id')
      if (localUserId) {
        document.cookie = `wordflower_user_id=${localUserId}; path=/; max-age=31536000` // 1 year
      }
    }
    
    // Sync on mount and when localStorage changes
    syncCookie()
    window.addEventListener('storage', syncCookie)
    
    return () => window.removeEventListener('storage', syncCookie)
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId.trim()) {
      toast.error("Please enter your user ID")
      return
    }

    setIsLoading(true)

    try {
      // Validate user ID against the users collection
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim() })
      })

      const result = await response.json()

      if (result.isValid) {
        // Store user ID in localStorage
        localStorage.setItem('wordflower_user_id', userId.trim())
        
        // Set cookie for middleware
        document.cookie = `wordflower_user_id=${userId.trim()}; path=/; max-age=31536000`
        
        toast.success("Successfully signed in!")
        
        // Redirect to home page
        router.push('/')
      } else {
        toast.error("Invalid user ID. Please check your credentials or request a new user ID.")
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error("Failed to sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAccess = () => {
    setShowRequestModal(false)
    router.push('/signup')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🌻 Wordflower</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium mb-2">
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !userId.trim()}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have a user ID?
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowRequestModal(true)}
              className="w-full"
            >
              Request Access
            </Button>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              To participate in this study, you'll need to provide some basic information. 
              Click below to fill out a short form and request your user ID.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowRequestModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestAccess}
              className="flex-1"
            >
              Continue to Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}