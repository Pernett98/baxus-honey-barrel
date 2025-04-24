import { BAXUS_HEALTH, BAXUS_SEARCH } from "~config/baxus-api.config"
import type { Asset, AssetDocument } from "~models/Asset"
import {
  createApiError,
  createNoResultsError,
  createSearchError
} from "~models/Error"
import { findBestMatches } from "~services/matching.service"
import type { MatchResult } from "~services/matching.service"

type HealthResponse = {
  status: "ok"
}

export const baxusHealthCheck = async (): Promise<HealthResponse> => {
  try {
    return await (await fetch(BAXUS_HEALTH)).json()
  } catch (error) {
    throw createApiError(undefined, BAXUS_HEALTH)
  }
}

export const baxusBottleSearch = async (
  bottleName: string
): Promise<AssetDocument[]> => {
  try {
    const result: AssetDocument[] = await (
      await fetch(BAXUS_SEARCH + "&query=" + bottleName)
    ).json()
    return result
  } catch (error) {
    throw createSearchError(bottleName)
  }
}

export const findMatchingBottles = async (
  bottleName: string
): Promise<MatchResult[]> => {
  try {
    // First, get initial candidates using the name
    const candidates = await baxusBottleSearch(bottleName)

    // Check if any candidates were found
    if (!candidates || candidates.length === 0) {
      return [
        {
          error: createNoResultsError(bottleName),
          confidence: 0,
          matchDetails: {
            nameMatch: 0,
            commonWords: [],
            numberMatch: false
          }
        } as unknown as MatchResult
      ]
    }

    // Then perform detailed matching
    const matches = findBestMatches(bottleName, candidates)

    // Check if any matches were found after filtering
    if (matches.length === 0) {
      return [
        {
          error: createNoResultsError(bottleName, 0.3),
          confidence: 0,
          matchDetails: {
            nameMatch: 0,
            commonWords: [],
            numberMatch: false
          }
        } as unknown as MatchResult
      ]
    }

    // Return matches with confidence > 0.3
    return matches
      .filter((match) => match.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    // If it's already a structured error, return it
    if (error && typeof error === "object" && "code" in error) {
      return [
        {
          error,
          confidence: 0,
          matchDetails: {
            nameMatch: 0,
            commonWords: [],
            numberMatch: false
          }
        } as unknown as MatchResult
      ]
    }

    // Otherwise, create a generic search error
    return [
      {
        error: createSearchError(bottleName),
        confidence: 0,
        matchDetails: {
          nameMatch: 0,
          commonWords: [],
          numberMatch: false
        }
      } as unknown as MatchResult
    ]
  }
}
