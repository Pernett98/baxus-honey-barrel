import type { MatchResult } from "~services/matching.service"

interface MatchInfoProps {
  match: MatchResult
  savings: {
    savings: number
    savingsPercentage: number
  } | null
  onOpenBaxus: (url: string) => void
}

export const MatchInfo = ({ match, savings, onOpenBaxus }: MatchInfoProps) => {
  if (!match.asset) return null

  const formatSavings = (savings: number) => {
    return Math.abs(savings).toFixed(2)
  }

  const formatPercentage = (percentage: number) => {
    return Math.abs(percentage).toFixed(1)
  }

  return (
    <div className="match-info">
      <h3>Best Match on Baxus</h3>
      <div className="product-name">{match.asset._source.name}</div>
      <div className="price">${match.asset._source.price.toFixed(2)}</div>
      <img src={match.asset._source.imageUrl} className="product-image" />
      {savings && savings.savings !== 0 && (
        <div className="savings-info">
          <p
            className={`savings ${
              savings.savings > 0 ? "positive-savings" : "negative-savings"
            }`}>
            {savings.savings > 0 && (
              <>
                <strong>You'll save:</strong> ${formatSavings(savings.savings)}{" "}
                ({formatPercentage(savings.savingsPercentage)}%)
              </>
            )}
          </p>
        </div>
      )}
      <button
        className="primary"
        onClick={() =>
          onOpenBaxus(`https://www.baxus.co/asset/${match.asset._id}`)
        }>
        Get it on Baxus now
      </button>
    </div>
  )
}

interface OtherMatchesProps {
  matches: MatchResult[]
  onOpenBaxus: (url: string) => void
}

export const OtherMatches = ({ matches, onOpenBaxus }: OtherMatchesProps) => {
  if (matches.length <= 1) return null

  return (
    <div className="other-matches">
      <h3>Other Matches</h3>
      {matches.slice(1).map(({ asset }) => (
        <div key={asset._id} className="card">
          <div className="product-name">{asset._source.name}</div>
          <div className="price">${asset._source.price.toFixed(2)}</div>
          <img src={asset._source.imageUrl} className="product-image" />
          <button
            className="primary"
            onClick={() =>
              onOpenBaxus(`https://www.baxus.co/asset/${asset._id}`)
            }>
            Get it on Baxus now
          </button>
        </div>
      ))}
    </div>
  )
}
