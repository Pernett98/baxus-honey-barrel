import { useEffect, useState } from "react"

import "./style.css"

import { Loader } from "~components/Loader"
import { MatchInfo, OtherMatches } from "~components/MatchInfo"
import { useBaxusSearch } from "~hooks/useBaxusSearch"
import { usePriceComparison } from "~hooks/usePriceComparison"
import type { AppError } from "~models/Error"

interface ProductInfo {
  name: string
  price: number
  url: string
  error?: AppError
}

function IndexPopup() {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const { state, searchBottle } = useBaxusSearch()
  const savings = usePriceComparison(productInfo, state?.message || null)

  const openNewTab = (url: string) => {
    chrome.tabs.create({ url })
  }

  useEffect(() => {
    const getProductInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })

        if (!tab.id) {
          throw new Error("No active tab found")
        }

        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "getProductInfo"
          })
          console.log(response)
          if (response.error) {
            setError(response.error)
            setLoading(false)
            return
          }

          setProductInfo(response)
          const result = await searchBottle(response.name)

          if (
            result &&
            result.message &&
            result.message.length > 0 &&
            result.message[0].error
          ) {
            setError(result.message[0].error)
          }
        } catch (err) {
          // Check if this is a connection error
          if (err.message?.includes("Could not establish connection")) {
            setError({
              code: "CONNECTION_ERROR",
              message: "Please refresh the page and try again",
              details:
                "The extension needs to be reloaded to communicate with this page"
            })
          } else {
            throw err
          }
        }
      } catch (err) {
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

  return (
    <div className="popup-container">
      {loading && <Loader />}
      {error && (
        <div className="error-message">
          {error.customImagePath && (
            <img
              src={error.customImagePath}
              alt="Error illustration"
              className="error-image"
            />
          )}
          <p>
            <strong>{error.message}</strong>
          </p>
          {error.code === "CONNECTION_ERROR" && (
            <div className="error-actions">
              <button
                className="primary"
                onClick={() => openNewTab("https://www.baxus.co")}>
                Search on Baxus
              </button>
            </div>
          )}
        </div>
      )}
      {productInfo && !error && (
        <div className="card">
          <p className="product-name">
            <strong>Name:</strong> {productInfo.name}
          </p>
          {!!productInfo.price && (
            <p className="price">
              <strong>Price:</strong> ${productInfo.price.toFixed(2)}
            </p>
          )}
          {state?.message?.[0] && !state.message[0].error && (
            <MatchInfo
              match={state.message[0]}
              savings={savings}
              onOpenBaxus={openNewTab}
            />
          )}
        </div>
      )}

      {state?.message &&
        state.message.length > 1 &&
        !state.message[0].error && (
          <OtherMatches matches={state.message} onOpenBaxus={openNewTab} />
        )}

      {(!state?.message || state.message.length === 0) && !error && (
        <div className="card">
          <p>No matches found for this product.</p>
          <button
            className="primary"
            onClick={() => openNewTab("https://www.baxus.co")}>
            Search on Baxus
          </button>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
