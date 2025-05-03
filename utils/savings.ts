export function calculateSavings(
  originalPrice: number,
  baxusPrice: number
): {
  savings: number
  savingsPercentage: number
} {
  // Handle edge cases
  if (originalPrice <= 0) {
    return {
      savings: baxusPrice,
      savingsPercentage: 100 // If original price is 0 or negative, consider it as 100% savings
    }
  }

  const savings = originalPrice - baxusPrice
  const savingsPercentage = (savings / originalPrice) * 100

  return {
    savings,
    savingsPercentage
  }
}
