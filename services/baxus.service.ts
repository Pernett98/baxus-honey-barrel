import { BAXUS_HEALTH, BAXUS_SEARCH } from "~config/baxus-api.config"
import type { Asset, AssetDocument } from "~models/Asset"
import { findBestMatches } from "~services/matching.service"
import type { MatchResult } from "~services/matching.service"

type HealthResponse = {
  status: "ok"
}

export const baxusHealthCheck = async (): Promise<HealthResponse> => {
  return (await fetch(BAXUS_HEALTH)).json()
}

export const baxusBottleSearch = async (
  bottleName: string
): Promise<AssetDocument[]> => {
  const result: AssetDocument[] = await (
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
    .sort((a, b) => b.confidence - a.confidence)
}
