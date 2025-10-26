import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// Feedback interface
interface GameFeedback {
  satisfaction: number
  mostDifficult: string
  willReturn: boolean
  submittedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gameId, feedback } = body

    if (!userId || !gameId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId and feedback' },
        { status: 400 }
      )
    }

    // Validate feedback structure
    if (
      typeof feedback.satisfaction !== 'number' ||
      feedback.satisfaction < 1 ||
      feedback.satisfaction > 5 ||
      typeof feedback.mostDifficult !== 'string' ||
      feedback.mostDifficult.trim() === '' ||
      typeof feedback.willReturn !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid feedback data structure' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')
    
    const feedbackData: GameFeedback = {
      satisfaction: feedback.satisfaction,
      mostDifficult: feedback.mostDifficult.trim(),
      willReturn: feedback.willReturn,
      submittedAt: new Date()
    }

    // Update the specific game session with feedback
    const result = await collection.updateOne(
      { 
        userId,
        'gameSessions.gameId': gameId
      },
      {
        $set: { 
          'gameSessions.$.feedback': feedbackData,
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

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedback: feedbackData
    })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
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

    // If gameId is provided, return specific game feedback
    if (gameId) {
      const gameSession = userAnalytics.gameSessions?.find(
        (session: any) => session.gameId === gameId
      )
      
      if (!gameSession) {
        return NextResponse.json(
          { error: 'Game session not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        gameId: gameSession.gameId,
        feedback: gameSession.feedback || null
      })
    }

    // Return all feedback from all game sessions
    const allFeedback = userAnalytics.gameSessions
      ?.filter((session: any) => session.feedback)
      .map((session: any) => ({
        gameId: session.gameId,
        createdAt: session.createdAt,
        feedback: session.feedback
      })) || []

    return NextResponse.json({
      userId,
      totalFeedbackSubmissions: allFeedback.length,
      feedback: allFeedback
    })
  } catch (error) {
    console.error('Feedback retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    )
  }
}