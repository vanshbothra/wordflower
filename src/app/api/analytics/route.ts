import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// Analytics event interface
interface AnalyticsEvent {
  gameId: string
  eventType: string
  eventData: any
  timestamp: Date
}

// Game session interface
interface GameSession {
  gameId: string
  createdAt: Date
  updatedAt: Date
  events: AnalyticsEvent[]
  gameMetadata?: {
    totalWords?: number
    wordsFound?: number
    totalTime?: number
    gameState?: string
  }
}

// User analytics document interface (new structure)
interface UserAnalytics {
  userId: string
  createdAt: Date
  updatedAt: Date
  gameSessions: GameSession[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gameId, eventType, eventData } = body

    if (!userId || !gameId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId and eventType' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    
    const analyticsEvent: AnalyticsEvent = {
      gameId,
      eventType,
      eventData: eventData || {},
      timestamp: new Date()
    }

    // Try to find existing user analytics document
    const existingUser = await collection.findOne({ userId })

    if (existingUser) {
      // Check if game session already exists for this user
      const existingGameSessionIndex = existingUser.gameSessions?.findIndex(
        (session: GameSession) => session.gameId === gameId
      ) ?? -1

      if (existingGameSessionIndex >= 0) {
        // Update existing game session by adding the new event
        await collection.updateOne(
          { userId },
          {
            $push: { [`gameSessions.${existingGameSessionIndex}.events`]: analyticsEvent } as any,
            $set: { 
              updatedAt: new Date(),
              [`gameSessions.${existingGameSessionIndex}.updatedAt`]: new Date()
            }
          }
        )
      } else {
        // Create new game session for existing user
        const newGameSession: GameSession = {
          gameId,
          createdAt: new Date(),
          updatedAt: new Date(),
          events: [analyticsEvent]
        }
        
        await collection.updateOne(
          { userId },
          {
            $push: { gameSessions: newGameSession } as any,
            $set: { updatedAt: new Date() }
          }
        )
      }
    } else {
      // Create new user analytics document with first game session
      const newGameSession: GameSession = {
        gameId,
        createdAt: new Date(),
        updatedAt: new Date(),
        events: [analyticsEvent]
      }

      const newUserAnalytics: UserAnalytics = {
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        gameSessions: [newGameSession]
      }
      
      await collection.insertOne(newUserAnalytics as any)
    }

    return NextResponse.json({ success: true, eventLogged: analyticsEvent })
  } catch (error) {
    console.error('Analytics logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log analytics event' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameId = searchParams.get('gameId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    const userAnalytics = await collection.findOne({ userId })

    if (!userAnalytics) {
      return NextResponse.json(
        { error: 'User analytics not found' },
        { status: 404 }
      )
    }

    // If gameId is provided, return specific game session
    if (gameId) {
      const gameSession = userAnalytics.gameSessions?.find(
        (session: GameSession) => session.gameId === gameId
      )
      
      if (!gameSession) {
        return NextResponse.json(
          { error: 'Game session not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(gameSession)
    }

    // Return all user analytics
    return NextResponse.json(userAnalytics)
  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

// Update game metadata
export async function PATCH(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    const text = await request.text()
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }

    const body = JSON.parse(text)
    const { userId, gameId, gameMetadata } = body

    if (!userId || !gameId || !gameMetadata) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId and gameMetadata' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    
    // Find the user and update the specific game session's metadata
    const result = await collection.updateOne(
      { 
        userId,
        'gameSessions.gameId': gameId
      },
      {
        $set: { 
          'gameSessions.$.gameMetadata': gameMetadata,
          'gameSessions.$.updatedAt': new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User or game session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics metadata update error:', error)
    return NextResponse.json(
      { error: 'Failed to update game metadata' },
      { status: 500 }
    )
  }
}