import type { AssetDocument } from "~models/Asset"

export type MatchResult = {
  asset?: AssetDocument
  confidence: number
  matchDetails: {
    nameMatch: number
    commonWords: string[]
    numberMatch: boolean
  }
  error?: string
}

// Helper function to normalize strings for comparison
function normalizeString(str: string): string {
  return str.toLowerCase().trim()
}

// Helper function to extract numbers from a string
function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g)
  return matches ? matches.map(Number) : []
}

// Helper function to tokenize string into words
function tokenize(str: string): string[] {
  return normalizeString(str)
    .split(" ")
    .filter((word) => word.length > 1) // Filter out single characters
}

// Helper function to calculate string similarity
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1)
  const s2 = normalizeString(str2)

  if (s1 === s2) return 1.0

  if (s1.includes(s2) || s2.includes(s1)) return 0.9

  const words1 = tokenize(str1)
  const words2 = tokenize(str2)

  const commonWords = words1.filter((word) => words2.includes(word))

  const similarity = commonWords.length / Math.max(words1.length, words2.length)

  if (commonWords.length >= 3) {
    return Math.min(0.8, similarity + 0.2)
  }

  return similarity
}

// Helper function to check if numbers match
function checkNumberMatch(str1: string, str2: string): boolean {
  const numbers1 = extractNumbers(str1)
  const numbers2 = extractNumbers(str2)

  if (numbers1.length === 0 || numbers2.length === 0) return true

  return numbers1.some((num1) => numbers2.includes(num1))
}

// Main matching function
export function findBestMatches(
  sourceName: string,
  candidates: AssetDocument[]
): MatchResult[] {
  return candidates
    .map((asset) => {
      // Calculate name similarity
      const nameMatch = calculateStringSimilarity(
        sourceName,
        asset._source.name
      )

      // Get common words for debugging/display
      const sourceWords = tokenize(sourceName)
      const targetWords = tokenize(asset._source.name)
      const commonWords = sourceWords.filter((word) =>
        targetWords.includes(word)
      )

      // Check if numbers match
      const numberMatch = checkNumberMatch(sourceName, asset._source.name)

      // Adjust confidence based on number match
      let confidence = nameMatch
      if (!numberMatch) {
        // If numbers don't match, significantly reduce confidence
        confidence = Math.max(0.1, nameMatch * 0.5)
      }

      return {
        asset,
        confidence,
        matchDetails: {
          nameMatch,
          commonWords,
          numberMatch
        }
      }
    })
    .sort((a, b) => {
      // For high confidence matches (0.7-1.0), prioritize price
      if (a.confidence >= 0.7 && b.confidence >= 0.7) {
        return a.asset._source.price - b.asset._source.price
      }

      // For medium confidence matches (0.3-0.7), prioritize confidence
      if (a.confidence < 0.7 && b.confidence < 0.7) {
        return b.confidence - a.confidence
      }

      // If one is high confidence and one is medium, prioritize the high confidence one
      return b.confidence - a.confidence
    })
}
