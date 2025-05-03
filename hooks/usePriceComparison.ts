import { useEffect, useState } from "react"

import type { MatchResult } from "~services/matching.service"
import { calculateSavings } from "~utils/savings"

interface ProductInfo {
  name: string
  price: number
  url: string
  error?: any
}

export const usePriceComparison = (
  productInfo: ProductInfo | null,
  matches: MatchResult[] | null
) => {
  const [savings, setSavings] = useState<{
    savings: number
    savingsPercentage: number
  } | null>(null)

  useEffect(() => {
    if (!productInfo?.price) {
      setSavings(null)
      return
    }

    if (!matches || matches.length === 0) {
      setSavings(null)
      return
    }

    const firstMatch = matches[0]
    if (!firstMatch || !firstMatch?.asset?._source?.price) {
      setSavings(null)
      return
    }

    const savingsInfo = calculateSavings(
      productInfo.price,
      firstMatch.asset._source.price
    )
    setSavings(savingsInfo)
  }, [productInfo, matches])

  return savings
}
