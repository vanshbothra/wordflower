import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /signin, /signup)
  const { pathname } = request.nextUrl

  // Define protected routes (routes that require authentication)
  const protectedRoutes = ['/']
  const authRoutes = ['/signin', '/signup']
  const consentRequiredRoutes = ['/signup']

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)
  const isConsentRequiredRoute = consentRequiredRoutes.includes(pathname)

  // Check for consent first (required for all main routes except /info)
  if (isConsentRequiredRoute) {
    const consentGiven = request.cookies.get('wordflower_consent')?.value
    
    if (!consentGiven) {
      // Redirect to info page if no consent found
      return NextResponse.redirect(new URL('/info', request.url))
    }
  }

  // For protected routes, check if user_id exists in localStorage
  // Since middleware runs on the server, we can't access localStorage directly
  // We'll use a cookie or check for a custom header from the client
  
  if (isProtectedRoute) {
    // Check for user_id in cookies (we'll set this from localStorage on client)
    const userId = request.cookies.get('wordflower_user_id')?.value
    
    if (!userId) {
      // Redirect to signin if no user_id found
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // If user is authenticated and tries to access auth routes, redirect to home
  if (isAuthRoute) {
    const userId = request.cookies.get('wordflower_user_id')?.value
    
    if (userId) {
      // Redirect to home if user is already authenticated
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}