import { useCallback, useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

// Import the global CSS
import "./style.css"

import type { AssetDocument } from "~models/Asset"
import type { AppError } from "~models/Error"
import type { MatchResult } from "~services/matching.service"

// Define colors directly in the file to fix the linter error
const TEAL_COLOR = "#4CAF50"

// Default shipping cost in USD
const DEFAULT_SHIPPING_COST = 15.0

interface ProductInfo {
  name: string
  price: number
  rawPrice: string
  currency: string
  url: string
  error?: AppError
}

interface ApiResponse {
  available: boolean
  price?: number
  message: string
}

interface SearchState {
  message: MatchResult[]
}

// Function to convert price to USD
function convertToUSD(price: number, fromCurrency: string): number {
  const CURRENCY_RATES: { [key: string]: number } = {
    USD: 1,
    EUR: 1.08,
    GBP: 1.26,
    CAD: 0.73,
    AUD: 0.65,
    JPY: 0.0066
  }
  const rate = CURRENCY_RATES[fromCurrency] || 1
  return price * rate
}

// Function to calculate potential savings
function calculateSavings(
  originalPrice: number,
  baxusPrice: number,
  shippingCost: number = DEFAULT_SHIPPING_COST
): {
  savings: number
  savingsPercentage: number
  totalCost: number
} {
  const totalCost = baxusPrice + shippingCost
  const savings = originalPrice - totalCost
  const savingsPercentage = (savings / originalPrice) * 100

  return {
    savings,
    savingsPercentage,
    totalCost
  }
}

const useBaxusHealth = () => {
  const [health, setHealth] = useState<boolean>()

  useEffect(() => {
    sendToBackground({
      name: "baxus-health"
    })
      .then(setHealth)
      .catch((e) => setHealth(e))
  }, [])

  return { health } as const
}

const useBaxusSearch = () => {
  const [state, setState] = useState<SearchState | null>(null)

  const searchBottle = useCallback((query: string) => {
    return sendToBackground({
      name: "baxus-search",
      body: { query }
    })
      .then((result) => {
        setState(result)
        return result
      })
      .catch((err) => {
        setState(err)
        return err
      })
  }, [])

  return { state, searchBottle } as const
}

function IndexPopup() {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [shippingCost, setShippingCost] = useState(DEFAULT_SHIPPING_COST)
  // const { health } = useBaxusHealth()
  const { state, searchBottle } = useBaxusSearch()

  const openNewTab = (url: string) => {
    chrome.tabs.create({ url })
  }

  useEffect(() => {
    // Get the active tab and extract product information
    const getProductInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })

        if (!tab.id) {
          throw new Error("No active tab found")
        }

        // Send message to content script to get product info
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getProductInfo"
        })

        // Check if the response contains an error
        if (response.error) {
          setError(response.error)
          setLoading(false)
          return
        }

        setProductInfo(response)

        // Make API call to check product availability and price
        // Replace with your actual API endpoint
        /* const apiResponse = await fetch("YOUR_API_ENDPOINT", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(response)
        })
        
        const data = await apiResponse.json()
        setApiResponse(data) */
        const result = await searchBottle(response.name)

        // Check if the result contains an error
        if (
          result &&
          result.message &&
          result.message.length > 0 &&
          result.message[0].error
        ) {
          setError(result.message[0].error)
        } else {
          setApiResponse(result)
        }
      } catch (err) {
        // Create a generic error if it's not already an AppError
        if (err && typeof err === "object" && "code" in err) {
          setError(err as AppError)
        } else {
          setError({
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred",
            details: err instanceof Error ? err.message : String(err)
          })
        }
      } finally {
        setLoading(false)
      }
    }

    getProductInfo()
  }, [])

  // Calculate savings if we have both product info and API response
  const savingsInfo =
    productInfo && apiResponse?.price
      ? calculateSavings(
          convertToUSD(productInfo.price, productInfo.currency),
          apiResponse.price,
          shippingCost
        )
      : null
  return (
    <div
      style={{
        padding: 16,
        minWidth: 300
      }}>
      <h2>Baxus Honey Barrel</h2>
      {loading && <p>Loading...</p>}
      {error && (
        <div className="error-message">
          {error.customImagePath && (
            <img
              src={error.customImagePath}
              alt="Error illustration"
              style={{
                width: "100%",
                maxWidth: "200px",
                marginBottom: "16px",
                display: "block",
                margin: "0 auto"
              }}
            />
          )}
          <p>
            <strong>{error.message}</strong>
          </p>
          {error.details && <p>{error.details}</p>}
        </div>
      )}
      {productInfo && !error && (
        <div className="card">
          <h3>Product Information</h3>
          <p className="product-name">
            <strong>Name:</strong> {productInfo.name}
          </p>
          <p className="price">
            <strong>Price:</strong> {productInfo.price.toFixed(2)}{" "}
            {productInfo.currency}
            {productInfo.currency !== "USD" && (
              <span style={{ marginLeft: 8, color: "#666" }}>
                {/*productInfo.rawPrice*/}
                (≈ $
                {convertToUSD(productInfo.price, productInfo.currency).toFixed(
                  2
                )}{" "}
                USD)
              </span>
            )}
          </p>
        </div>
      )}
      {/* {apiResponse && !error && (
        <div className="card">
          <h3>Baxus Marketplace</h3>
          <p>{apiResponse.message}</p>
          {apiResponse.available && apiResponse.price && (
            <>
              <p className="price">
                <strong>Available at:</strong> ${apiResponse.price.toFixed(2)}{" "}
                USD
              </p>

              <div className="shipping-cost">
                <label htmlFor="shipping-cost">Shipping Cost: $</label>
                <input
                  id="shipping-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) =>
                    setShippingCost(parseFloat(e.target.value) || 0)
                  }
                  style={{ width: "60px", marginLeft: "8px" }}
                />
              </div>

              {savingsInfo && (
                <div className="savings-info">
                  <p className="total-cost">
                    <strong>Total Cost:</strong> $
                    {savingsInfo.totalCost.toFixed(2)} USD
                  </p>
                  <p
                    className="savings"
                    style={{
                      color: savingsInfo.savings > 0 ? "green" : "red"
                    }}>
                    <strong>Potential Savings:</strong> $
                    {savingsInfo.savings.toFixed(2)} USD (
                    {savingsInfo.savingsPercentage.toFixed(1)}%)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )} */}
      {state &&
        state.message &&
        state.message.length > 0 &&
        !state.message[0].error && (
          <div>
            {state.message.map(({ asset }) => (
              <div key={asset._id} className="card">
                <div className="product-name">{asset._source.name}</div>
                <div className="price">${asset._source.price.toFixed(2)}</div>
                <img src={asset._source.imageUrl} width={200} />
                <button
                  className="primary"
                  onClick={() =>
                    openNewTab(`https://www.baxus.co/asset/${asset._id}`)
                  }>
                  Open in New Tab
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default IndexPopup
