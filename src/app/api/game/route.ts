import { NextResponse } from 'next/server'
import data from '@/data/WordData.json'

export async function POST(request: Request) {
  try {
    console.log("length", JSON.parse(JSON.stringify(data)).length)
    const randomId = data[Math.floor(Math.random() * data.length)].id

    const gameData = data.find(g => g.id === randomId)
    // // Cleanup games older than 24 hours
    // const now = Date.now()
    // for (const [id] of activeGames) {
    //   const timestamp = parseInt(id.split('_')[1])
    //   if (now - timestamp > 24 * 60 * 60 * 1000) {
    //     activeGames.delete(id)
    //   }
    // }

    return NextResponse.json({
      gameId: gameData?.id.toString(),
      centerLetter: gameData?.central,
      outerLetters: gameData?.letters,
      wordCount: gameData?.wordcount,
      pangramCount: gameData?.pangramcount
    })
  } catch (err) {
    console.error('Failed to start game:', err)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { gameId, word } = body || {}

  if (!gameId || !word) {
    return NextResponse.json({ error: 'Missing gameId or word' }, { status: 400 })
  }

  const game = data.find(g => g.id === +gameId)
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  console.log('game', game)

  const lowerWord = word.toLowerCase()
  const isValid = game.words.map(w => w.toLowerCase()).includes(lowerWord)
  const isPangram = game.pangrams.map(w => w.toLowerCase()).includes(lowerWord)

  return NextResponse.json({ isValid, isPangram })
}

//fetch all words for a game
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  if (!gameId) {
    return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
  }
  
  const idNum = Number(gameId)
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid gameId' }, { status: 400 })
  }
  
  const game = data.find(g => g.id === idNum)

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  console.log('words',game.words)

  return NextResponse.json(game.words)
}