import { BAXUS_HEALTH, BAXUS_SEARCH } from "~config/baxus-api.config"
import type { Asset } from "~models/Asset"

type HealthResponse = {
  status: "ok"
}

type MatchResult = {
  asset: Asset
  confidence: number
  matchDetails: {
    nameMatch: number
    commonWords: string[]
  }
}

// Helper function to normalize strings for comparison
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

// Helper function to tokenize string into words
function tokenize(str: string): string[] {
  return normalizeString(str)
    .split(" ")
    .filter((word) => word.length > 1) // Filter out single characters
}

// Helper function to calculate string similarity
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1)
  const s2 = normalizeString(str2)

  // Exact match
  if (s1 === s2) return 1.0

  // One string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9

  // Get words from both strings
  const words1 = tokenize(str1)
  const words2 = tokenize(str2)

  // Find common words
  const commonWords = words1.filter((word) => words2.includes(word))

  // Calculate similarity based on common words
  const similarity = commonWords.length / Math.max(words1.length, words2.length)

  // Boost score if there are significant common words
  if (commonWords.length >= 3) {
    return Math.min(0.8, similarity + 0.2)
  }

  return similarity
}

// Main matching function
function findBestMatches(
  sourceName: string,
  candidates: Asset[]
): MatchResult[] {
  return candidates
    .map((asset) => {
      // Calculate name similarity
      const nameMatch = calculateStringSimilarity(sourceName, asset.name)

      // Get common words for debugging/display
      const sourceWords = tokenize(sourceName)
      const targetWords = tokenize(asset.name)
      const commonWords = sourceWords.filter((word) =>
        targetWords.includes(word)
      )

      return {
        asset,
        confidence: nameMatch,
        matchDetails: {
          nameMatch,
          commonWords
        }
      }
    })
    .sort((a, b) => b.confidence - a.confidence)
}

export const baxusHealthCheck = async (): Promise<HealthResponse> => {
  return (await fetch(BAXUS_HEALTH)).json()
}

export const baxusBottleSearch = async (
  bottleName: string
): Promise<Asset[]> => {
  const params = new URLSearchParams()
  params.append("query", bottleName)
  const result: Asset[] = await (
    await fetch(BAXUS_SEARCH + "&query=" + bottleName)
  ).json()

  return result
}

export const findMatchingBottles = async (
  bottleName: string
): Promise<MatchResult[]> => {
  // First, get initial candidates using the name
  const candidates = await baxusBottleSearch(bottleName)

  // Then perform detailed matching
  const matches = findBestMatches(bottleName, candidates)

  // Return matches with confidence > 0.3
  return matches
    .filter((match) => match.confidence > 0.3)
    .sort((x) => x.confidence)
}
