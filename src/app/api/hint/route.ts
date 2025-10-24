import { NextResponse } from "next/server"
import { fetchWordHints } from "@/lib/mw-api"
import { activeGames } from "@/lib/gameData" 
import data from '@/data/WordData.json'

export async function POST(request: Request) {
  try {

    const { gameId } = await request.json()
    console.log(gameId)
    console.log('data', data[0])

    if (!gameId) return NextResponse.json({ error: "Missing gameId" }, { status: 400 })

    const game = data.find(g => g.id === +gameId)
    console.log(game)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })

    const allWords = Array.from(game.words)
    const shuffled = allWords.sort(() => 0.5 - Math.random())
    const selectedWords = shuffled.slice(0, 10) // pick 10 words

    const hintPromises = selectedWords.map((w) => fetchWordHints(w))
    const hints = await Promise.all(hintPromises)
    const filteredHints = hints.filter((h) => h !== null) // remove nulls

    return NextResponse.json(filteredHints)
  } catch (err) {
    console.error("Failed to fetch hints:", err)
    return NextResponse.json({ error: "Failed to fetch hints" }, { status: 500 })
  }
}
