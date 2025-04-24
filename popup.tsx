import { useCallback, useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

interface ProductInfo {
  name: string
  price: number
  rawPrice: string
  currency: string
  url: string
}

interface ApiResponse {
  available: boolean
  price?: number
  message: string
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
  const [state, setState] = useState()

  const searchBottle = useCallback((query: string) => {
    console.log("sending backgorund")
    return sendToBackground({
      name: "baxus-search",
      body: { query }
    })
      .then(setState)
      .catch((err) => setState(err))
  }, [])

  return { state, searchBottle } as const
}

function IndexPopup() {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const { health } = useBaxusHealth()
  const { state, searchBottle } = useBaxusSearch()
  console.log(state)
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
        searchBottle(response.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    getProductInfo()
  }, [])

  return (
    <div
      style={{
        padding: 16,
        minWidth: 300
      }}>
      <h2>Baxus Honey Barrel</h2>
      {loading && <p>Loading...</p>}
      {error && (
        <div style={{ color: "red" }}>
          <p>Error: {error}</p>
        </div>
      )}
      {productInfo && (
        <div>
          <h3>Product Information</h3>
          <p>
            <strong>Name:</strong> {productInfo.name}
          </p>
          <p>
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
      {apiResponse && (
        <div>
          <h3>Baxus Marketplace</h3>
          <p>{apiResponse.message}</p>
          {apiResponse.available && apiResponse.price && (
            <p>
              <strong>Available at:</strong> ${apiResponse.price.toFixed(2)} USD
            </p>
          )}
        </div>
      )}

      {state && (
        <div>
          {state.message.map(({ asset }) => (
            <div key={asset._id}>
              <div>{asset._source.name}</div>
              <div>{asset._source.price}</div>
              <img src={asset._source.imageUrl} width={200} />
              <button
                onClick={() =>
                  openNewTab(`https://www.baxus.co/asset/${asset._id}`)
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
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
