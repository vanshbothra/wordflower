/**
 * Script to pre-fetch hints for games from Merriam-Webster Thesaurus API
 * Usage: npx tsx scripts/generate-hints.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Manually load environment variables from .env.local or .env
function loadEnv(): Record<string, string> {
    const envVars: Record<string, string> = {}
    const envFiles = ['.env.local', '.env']
    for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile)
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8')
            for (const line of content.split('\n')) {
                const trimmed = line.trim()
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=')
                    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                    envVars[key.trim()] = value
                    console.log(`📦 Loaded environment variable ${key.trim()}=${value.slice(0, 10)}...`)
                }
            }
            console.log(`📦 Loaded environment from ${envFile}`)
            break
        }
    }
    return envVars
}

const env = loadEnv()
const API_THESAURUS_KEY = env.NEXT_PUBLIC_MWT_API_KEY
const THESAURUS_URL = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/"

interface WordHints {
    word: string
    relatedWord?: string
    synonym?: string
    phrase?: string
    fillInBlank?: string
    blankLetters?: [number, number]
}

interface GameData {
    id: number
    letters: string[]
    central: string
    words: string[]
    pangrams: string[]
    wordcount: number
    pangramcount: number
}

interface HintData {
    [gameId: string]: WordHints[]
}

async function fetchWordHint(word: string): Promise<WordHints | null> {
    try {
        const res = await fetch(`${THESAURUS_URL}${word.toLowerCase()}?key=${API_THESAURUS_KEY}`)
        const data = await res.json()

        if (!Array.isArray(data) || data.length === 0) return null

        const entry = data[0]
        if (typeof entry === 'string') {
            // API returns string suggestions when word not found
            return null
        }

        const definition = entry.shortdef?.[0]
        const synonym = entry.meta?.syns?.[0]?.[0]
        let usageExample = ""
        const def = entry.def?.[0]

        if (def?.sseq) {
            for (const seq of def.sseq) {
                for (const [type, content] of seq) {
                    if (type === "sense" && content.dt) {
                        for (const [dtType, dtContent] of content.dt) {
                            if (dtType === "vis" && Array.isArray(dtContent)) {
                                usageExample = dtContent[0]?.t || ""
                                break
                            }
                        }
                    }
                }
            }
        }

        if (!definition || !synonym || !usageExample) return null

        const example = usageExample.replace(/\{it\}(.*?)\{\/it\}/g, "______")
        const fillInBlank = word[0] + "_".repeat(word.length - 2) + word[word.length - 1]

        return {
            word: word.toUpperCase(),
            relatedWord: definition,
            synonym,
            phrase: example,
            fillInBlank,
            blankLetters: [1, word.length - 2],
        }
    } catch (err) {
        console.error(`  ❌ Error fetching "${word}":`, err)
        return null
    }
}

async function generateHintsForGames(maxGames: number = 10, specificGameId?: number) {
    if (!API_THESAURUS_KEY) {
        console.error('❌ NEXT_PUBLIC_MWT_API_KEY not found in environment variables!')
        console.error('   Make sure you have a .env file with the API key.')
        process.exit(1)
    }

    // Read word data
    const wordDataPath = path.join(process.cwd(), 'src/data/wordData.json')
    const wordData: GameData[] = JSON.parse(fs.readFileSync(wordDataPath, 'utf-8'))

    // Load existing hint data if it exists
    const hintDataPath = path.join(process.cwd(), 'src/data/hintData.json')
    let hintData: HintData = {}

    if (fs.existsSync(hintDataPath)) {
        try {
            hintData = JSON.parse(fs.readFileSync(hintDataPath, 'utf-8'))
            console.log(`📂 Loaded existing hintData.json with ${Object.keys(hintData).length} games`)
        } catch (err) {
            console.log('📂 Starting with fresh hintData.json')
        }
    }

    let gamesToProcess = wordData.slice(0, maxGames)
    
    if (specificGameId !== undefined) {
        const found = wordData.find(g => g.id === specificGameId)
        if (found) {
            gamesToProcess = [found]
            console.log(`\n🎮 Specifically processing game ID ${specificGameId}...\n`)
        } else {
            console.error(`\n❌ Game ID ${specificGameId} not found in wordData.json\n`)
            process.exit(1)
        }
    } else {
        console.log(`\n🎮 Processing first ${gamesToProcess.length} games...\n`)
    }

    for (const game of gamesToProcess) {
        const gameId = String(game.id)

        // Skip if we already have hints for this game
        if (hintData[gameId] && hintData[gameId].length > 0) {
            console.log(`⏭️  Game ${gameId}: Already has ${hintData[gameId].length} hints, skipping...`)
            continue
        }

        console.log(`🎯 Game ${gameId}: Processing ${game.words.length} words...`)
        const hints: WordHints[] = []

        for (let i = 0; i < game.words.length; i++) {
            const word = game.words[i]
            process.stdout.write(`   [${i + 1}/${game.words.length}] ${word}... `)

            const hint = await fetchWordHint(word)

            if (hint) {
                hints.push(hint)
                console.log('✅')
            } else {
                console.log('⚠️ no hint data')
            }
        }

        hintData[gameId] = hints
        console.log(`   ✨ Game ${gameId}: Got ${hints.length}/${game.words.length} hints\n`)

        // Save after each game (in case script is interrupted)
        fs.writeFileSync(hintDataPath, JSON.stringify(hintData, null, 2))
    }

    console.log(`\n🎉 Done! Saved hints to ${hintDataPath}`)
    console.log(`   Total games with hints: ${Object.keys(hintData).length}`)

    const totalHints = Object.values(hintData).reduce((sum, hints) => sum + hints.length, 0)
    console.log(`   Total hints generated: ${totalHints}`)
}

// Run the script
const args = process.argv.slice(2);
const gameIdArg = args.find(arg => arg.startsWith('--gameId='));
const specificGameId = gameIdArg ? parseInt(gameIdArg.split('=')[1]) : undefined;

generateHintsForGames(100, specificGameId)
