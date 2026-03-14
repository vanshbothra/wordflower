import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gameId, categorizations } = body

    if (!userId || !gameId || !categorizations) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameId and categorizations' },
        { status: 400 }
      )
    }

    const collection = await getCollection('wordflower_collection')

    // Find the user and update the specific game session's word categorizations
    const result = await collection.updateOne(
      {
        userId,
        'gameSessions.gameId': gameId
      },
      {
        $set: {
          'gameSessions.$.wordCategorizations': categorizations,
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

    return NextResponse.json({ success: true, message: 'Categorizations saved successfully' })
  } catch (error) {
    console.error('Word categorization logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log word categorizations' },
      { status: 500 }
    )
  }
}
