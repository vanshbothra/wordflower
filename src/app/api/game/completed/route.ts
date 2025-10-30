import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameId = searchParams.get('gameId')

    if (!userId || !gameId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and gameId' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    
    // Check if user exists and has completed this game
    const user = await collection.findOne({ 
      userId,
      completedGameIds: gameId
    })

    const isCompleted = !!user
    
    // If completed, also get the game session data for results
    let gameSessionData = null
    if (isCompleted && user.gameSessions) {
      gameSessionData = user.gameSessions.find(
        (session: any) => session.gameId === gameId
      )
    }

    return NextResponse.json({ 
      isCompleted,
      gameSessionData: gameSessionData || null
    })
  } catch (error) {
    console.error('Check game completion error:', error)
    return NextResponse.json(
      { error: 'Failed to check game completion status' },
      { status: 500 }
    )
  }
}