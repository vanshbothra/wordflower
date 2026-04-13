"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Pre-fill code from query param
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) setUserId(code)
  }, [searchParams])

  // Check if user is already signed in
  useEffect(() => {
    const existingUserId = localStorage.getItem('wordflower_user_id')
    if (existingUserId) {
      router.push('/')
    }
  }, [router])

  // Sync cookie with localStorage
  useEffect(() => {
    const syncCookie = () => {
      const localUserId = localStorage.getItem('wordflower_user_id')
      const localGameType = localStorage.getItem('wordflower_game_type')
      if (localUserId) {
        document.cookie = `wordflower_user_id=${localUserId}; path=/; max-age=31536000`
        document.cookie = `wordflower_game_type=${localGameType}; path=/; max-age=31536000`
      }
    }
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
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim() })
      })

      const result = await response.json()

      if (result.isValid) {
        localStorage.setItem('wordflower_user_id', userId.trim())
        localStorage.setItem('wordflower_game_type', JSON.stringify(result.gameType))
        document.cookie = `wordflower_user_id=${userId.trim()}; path=/; max-age=31536000`

        toast.success("Successfully signed in!")
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Image
              src="/ashoka_logo.png"
              alt="Ashoka University Logo"
              width={300}
              height={300}
              className="rounded-md"
            />
          </div>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="userId" className="block text-sm font-medium">
                  Participant Code
                </label>
                <Tooltip >
                  <TooltipTrigger asChild>
                    <InfoIcon
                      size={16}
                      color="grey"
                    />
                  </TooltipTrigger>
                  <TooltipContent side='right'>
                    <p>Your participant code is sent to the email you registered with</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your participant code"
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
              {isLoading ? "Signing in..." : "Start the Study"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have a participant code?
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/info')}
              className="w-full"
            >
              Register to Participate
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
