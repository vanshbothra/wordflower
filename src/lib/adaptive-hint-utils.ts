import type { WordHints } from "@/lib/word-data"

// Configurable inactivity threshold in seconds
export const ADAPTIVE_HINT_INACTIVITY_THRESHOLD = 15

// --- Strategy 2: Three-letter prefix counts ---

/**
 * Builds a map of 3-letter prefixes → list of words starting with that prefix.
 * Only includes prefixes where the word is at least 4 letters long.
 */
export function computeThreeLetterPrefixCounts(words: string[]): Map<string, string[]> {
    const prefixMap = new Map<string, string[]>()
    for (const word of words) {
        const upper = word.toUpperCase()
        if (upper.length < 4) continue
        const prefix = upper.slice(0, 3)
        const existing = prefixMap.get(prefix)
        if (existing) {
            existing.push(upper)
        } else {
            prefixMap.set(prefix, [upper])
        }
    }
    return prefixMap
}

/**
 * Builds a map of 3-letter suffixes → list of words ending with that suffix.
 * Only includes suffixes where the word is at least 4 letters long.
 */
export function computeThreeLetterSuffixCounts(words: string[]): Map<string, string[]> {
    const suffixMap = new Map<string, string[]>()
    for (const word of words) {
        const upper = word.toUpperCase()
        if (upper.length < 4) continue
        const suffix = upper.slice(-3)
        const existing = suffixMap.get(suffix)
        if (existing) {
            existing.push(upper)
        } else {
            suffixMap.set(suffix, [upper])
        }
    }
    return suffixMap
}

// --- Strategy 3: Repeated letter words ---

export interface RepeatedLetterWord {
    word: string   // e.g. "MOOD"
    pattern: string // e.g. "_OO_"
}

/**
 * Finds all words that contain at least one run of consecutive repeated
 * letters (e.g., OO in POOL, FF in COFFEE) and generates a blanked pattern
 * that reveals only those consecutive runs.
 * POOL → _ O O _, COFFEE → _ O _ _ E E
 * Words like PETE (non-adjacent repeated E) are excluded.
 */
export function computeRepeatedLetterWords(words: string[]): RepeatedLetterWord[] {
    const results: RepeatedLetterWord[] = []

    for (const word of words) {
        const upper = word.toUpperCase()
        if (upper.length < 4) continue

        // Find positions that are part of a consecutive run (2+ same letter in a row)
        const consecutivePositions = new Set<number>()
        for (let i = 0; i < upper.length - 1; i++) {
            if (upper[i] === upper[i + 1]) {
                consecutivePositions.add(i)
                consecutivePositions.add(i + 1)
            }
        }

        if (consecutivePositions.size === 0) continue

        // Build blanked pattern: show only consecutive repeated letters, blank the rest
        // Space out characters so individual letters are clearly visible
        const pattern = upper
            .split("")
            .map((ch, idx) => (consecutivePositions.has(idx) ? ch : "_"))
            .join(" ")

        results.push({ word: upper, pattern })
    }

    return results
}

// --- Strategy 4: Word relationships ---

export type RelationshipType = "anagram" | "prefix" | "suffix" | "trimming" | "single_letter_swap"

export interface WordRelationship {
    source: string        // the found word
    target: string        // the unfound word to nudge toward
    type: RelationshipType
}

/**
 * Precomputes pairwise relationships between all words in the game.
 * Returns a list of directed relationships: source → target.
 * Both directions are stored for symmetric relations (anagrams, single-letter swap).
 */
export function computeWordRelationships(words: string[]): WordRelationship[] {
    const upperWords = words.map((w) => w.toUpperCase())
    const relationships: WordRelationship[] = []

    for (let i = 0; i < upperWords.length; i++) {
        for (let j = 0; j < upperWords.length; j++) {
            if (i === j) continue
            const a = upperWords[i]
            const b = upperWords[j]

            // Anagram: same sorted letters, different word
            if (a.length === b.length && a !== b) {
                const sortedA = a.split("").sort().join("")
                const sortedB = b.split("").sort().join("")
                if (sortedA === sortedB) {
                    relationships.push({ source: a, target: b, type: "anagram" })
                    continue // skip other checks for this pair
                }
            }

            // Prefix: a is a prefix of b (e.g., BUILD → BUILDING)
            if (b.length > a.length && b.startsWith(a) && a.length >= 4) {
                relationships.push({ source: a, target: b, type: "prefix" })
                continue
            }

            // Suffix: a is a suffix of b (e.g., DING → BIDDING)
            if (b.length > a.length && b.endsWith(a) && a.length >= 4) {
                relationships.push({ source: a, target: b, type: "suffix" })
                continue
            }

            // Trimming: b is a sub-string of a from trimming front/back (e.g., EIGHTH → EIGHT)
            if (a.length > b.length && b.length >= 4 && (a.startsWith(b) || a.endsWith(b))) {
                relationships.push({ source: a, target: b, type: "trimming" })
                continue
            }

            // Single letter swap: same length, differ by exactly 1 letter
            if (a.length === b.length && a.length >= 4) {
                let diffCount = 0
                for (let k = 0; k < a.length; k++) {
                    if (a[k] !== b[k]) diffCount++
                    if (diffCount > 1) break
                }
                if (diffCount === 1) {
                    relationships.push({ source: a, target: b, type: "single_letter_swap" })
                }
            }
        }
    }

    return relationships
}

// --- Hint result type ---

export interface AdaptiveHintResult {
    strategy: 1 | 2 | 3 | 4
    message: string
    /** A short label for the hint type (for analytics) */
    strategyName: "definition" | "prefix_count" | "suffix_count" | "repeated_letters" | "word_relationship"
    /** The word this hint is about (if applicable) */
    targetWord?: string
}

// --- Main hint picker ---

/**
 * Picks an adaptive hint using one of the four strategies.
 * Cycles through strategies in order: 1 → 2 → 3 → 4 → 1 → ...
 * Falls back to the next strategy if the current one has no candidates.
 *
 * Returns null if no hint can be generated (e.g., all words found).
 */
export function pickAdaptiveHint(
    allWords: string[],
    foundWords: string[],
    hintData: WordHints[],
    prefixMap: Map<string, string[]>,
    suffixMap: Map<string, string[]>,
    repeatedLetterWords: RepeatedLetterWord[],
    lastStrategyUsed: number,
    wordRelationships: WordRelationship[] = []
): AdaptiveHintResult | null {
    const foundSet = new Set(foundWords.map((w) => w.toUpperCase()))
    const unfoundWords = allWords.filter((w) => !foundSet.has(w.toUpperCase()))

    if (unfoundWords.length === 0) return null

    // Try strategies in round-robin order starting from the next one
    const strategies = [1, 2, 3, 4] as const
    for (let i = 0; i < strategies.length; i++) {
        const strategyIndex = (lastStrategyUsed + i) % strategies.length
        const strategy = strategies[strategyIndex]

        const result = tryStrategy(strategy, unfoundWords, foundSet, hintData, prefixMap, suffixMap, repeatedLetterWords, wordRelationships)
        if (result) return result
    }

    return null
}

function tryStrategy(
    strategy: 1 | 2 | 3 | 4,
    unfoundWords: string[],
    foundSet: Set<string>,
    hintData: WordHints[],
    prefixMap: Map<string, string[]>,
    suffixMap: Map<string, string[]>,
    repeatedLetterWords: RepeatedLetterWord[],
    wordRelationships: WordRelationship[]
): AdaptiveHintResult | null {
    switch (strategy) {
        case 1:
            return tryDefinitionHint(unfoundWords, hintData)
        case 2:
            // Strategy 2 now randomly picks between prefix and suffix hints
            if (Math.random() < 0.5) {
                return tryPrefixCountHint(unfoundWords, foundSet, prefixMap) || trySuffixCountHint(unfoundWords, foundSet, suffixMap)
            } else {
                return trySuffixCountHint(unfoundWords, foundSet, suffixMap) || tryPrefixCountHint(unfoundWords, foundSet, prefixMap)
            }
        case 3:
            return tryRepeatedLetterHint(unfoundWords, repeatedLetterWords)
        case 4:
            return tryWordRelationshipHint(foundSet, wordRelationships)
    }
}

// --- Strategy 1: Definition hint ---

function tryDefinitionHint(
    unfoundWords: string[],
    hintData: WordHints[]
): AdaptiveHintResult | null {
    const unfoundSet = new Set(unfoundWords.map((w) => w.toUpperCase()))

    // Find hint data entries for unfound words
    const candidates = hintData.filter((h) => unfoundSet.has(h.word.toUpperCase()) && h.relatedWord)

    if (candidates.length === 0) return null

    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    const firstLetter = pick.word[0].toUpperCase()
    const wordLength = pick.word.length

    return {
        strategy: 1,
        strategyName: "definition",
        targetWord: pick.word,
        message: `Try a word that begins with "${firstLetter}", means "${pick.relatedWord}", and is ${wordLength} letters long.`,
    }
}

// --- Strategy 2: Prefix count hint ---

function tryPrefixCountHint(
    unfoundWords: string[],
    foundSet: Set<string>,
    prefixMap: Map<string, string[]>
): AdaptiveHintResult | null {
    // For each prefix, count how many words are still unfound
    let bestPrefix: string | null = null
    let bestCount = 0

    for (const [prefix, words] of prefixMap) {
        const remaining = words.filter((w) => !foundSet.has(w.toUpperCase()))
        // Only consider prefixes with >= 2 remaining words
        if (remaining.length >= 2 && remaining.length > bestCount) {
            bestPrefix = prefix
            bestCount = remaining.length
        }
    }

    if (!bestPrefix) return null

    return {
        strategy: 2,
        strategyName: "prefix_count",
        message: `There are ${bestCount} words remaining that start with "${bestPrefix}".`,
    }
}

function trySuffixCountHint(
    unfoundWords: string[],
    foundSet: Set<string>,
    suffixMap: Map<string, string[]>
): AdaptiveHintResult | null {
    // For each suffix, count how many words are still unfound
    let bestSuffix: string | null = null
    let bestCount = 0

    for (const [suffix, words] of suffixMap) {
        const remaining = words.filter((w) => !foundSet.has(w.toUpperCase()))
        // Only consider suffixes with >= 2 remaining words
        if (remaining.length >= 2 && remaining.length > bestCount) {
            bestSuffix = suffix
            bestCount = remaining.length
        }
    }

    if (!bestSuffix) return null

    return {
        strategy: 2,
        strategyName: "suffix_count",
        message: `There are ${bestCount} words remaining that end with "${bestSuffix}".`,
    }
}

// --- Strategy 3: Repeated letter blanks hint ---

function tryRepeatedLetterHint(
    unfoundWords: string[],
    repeatedLetterWords: RepeatedLetterWord[]
): AdaptiveHintResult | null {
    const unfoundSet = new Set(unfoundWords.map((w) => w.toUpperCase()))

    const candidates = repeatedLetterWords.filter((r) => unfoundSet.has(r.word))

    if (candidates.length === 0) return null

    const pick = candidates[Math.floor(Math.random() * candidates.length)]

    return {
        strategy: 3,
        strategyName: "repeated_letters",
        targetWord: pick.word,
        message: `This word has repeated letters: ${pick.pattern}. Remember, you can reuse letters!`,
    }
}

// --- Strategy 4: Word relationship hint ---

const RELATIONSHIP_MESSAGES: Record<RelationshipType, string> = {
    anagram:
        "Look at your found words — one of them can be rearranged to spell a completely new word!",
    prefix:
        "Look at your found words — one of them is the beginning of a longer word. Try adding letters to the end!",
    suffix:
        "Look at your found words — one of them appears at the end of a longer word. Try adding letters to the beginning!",
    trimming:
        "Look at your found words — removing some letters from the front or back of one of them reveals a hidden word!",
    single_letter_swap:
        "Look at your found words — swapping just one letter in one of them creates an entirely new word!",
}

function tryWordRelationshipHint(
    foundSet: Set<string>,
    wordRelationships: WordRelationship[]
): AdaptiveHintResult | null {
    // Find relationships where source is found but target is not
    const candidates = wordRelationships.filter(
        (r) => foundSet.has(r.source) && !foundSet.has(r.target)
    )

    if (candidates.length === 0) return null

    const pick = candidates[Math.floor(Math.random() * candidates.length)]

    return {
        strategy: 4,
        strategyName: "word_relationship",
        targetWord: pick.target,
        message: RELATIONSHIP_MESSAGES[pick.type],
    }
}
