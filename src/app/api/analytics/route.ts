import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// Analytics event interface
interface AnalyticsEvent {
  gameId: string
  eventType: string
  eventData: any
  timestamp: Date
}

// Game analytics document interface
interface GameAnalytics {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId, eventType, eventData } = body

    if (!gameId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId and eventType' },
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

    // Try to find existing game analytics document
    const existingGame = await collection.findOne({ gameId })

    if (existingGame) {
      // Update existing document by adding the new event
      await collection.updateOne(
        { gameId },
        {
          $push: { events: analyticsEvent } as any,
          $set: { updatedAt: new Date() }
        }
      )
    } else {
      // Create new game analytics document
      const newGameAnalytics: GameAnalytics = {
        gameId,
        createdAt: new Date(),
        updatedAt: new Date(),
        events: [analyticsEvent]
      }
      await collection.insertOne(newGameAnalytics as any)
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
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing gameId parameter' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    const gameAnalytics = await collection.findOne({ gameId })

    if (!gameAnalytics) {
      return NextResponse.json(
        { error: 'Game analytics not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(gameAnalytics)
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
    const body = await request.json()
    const { gameId, gameMetadata } = body

    if (!gameId || !gameMetadata) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId and gameMetadata' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    
    await collection.updateOne(
      { gameId },
      {
        $set: { 
          gameMetadata,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics metadata update error:', error)
    return NextResponse.json(
      { error: 'Failed to update game metadata' },
      { status: 500 }
    )
  }
}