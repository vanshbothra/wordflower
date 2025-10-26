import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required and must be a string' },
        { status: 400 }
      )
    }

    const collection = await getCollection('users')
    
    // Check if user exists in the users collection
    const user = await collection.findOne({ user: userId.trim() })

    if (user) {
      return NextResponse.json({ 
        isValid: true, 
        message: 'User ID is valid',
        userId: user.user
      })
    } else {
      return NextResponse.json({ 
        isValid: false, 
        message: 'User ID not found' 
      })
    }
  } catch (error) {
    console.error('User validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate user ID' },
      { status: 500 }
    )
  }
}