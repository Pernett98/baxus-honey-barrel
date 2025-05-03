import { useCallback, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import type { MatchResult } from "~services/matching.service"

export const useBaxusSearch = () => {
  const [state, setState] = useState<{
    message: MatchResult[]
  } | null>(null)

  const searchBottle = useCallback(async (query: string) => {
    try {
      const response = await sendToBackground({
        name: "baxus-search",
        body: {
          query
        }
      })

      setState(response)
      return response
    } catch (error) {
      console.error("Error searching for bottle:", error)
      return null
    }
  }, [])

  return { state, searchBottle } as const
}
