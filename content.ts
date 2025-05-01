// Currency conversion rates (you might want to fetch these from an API in production)
const CURRENCY_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.26,
  CAD: 0.73,
  AUD: 0.65,
  JPY: 0.0066
  // Add more currencies as needed
}

// Function to detect currency from price string
function detectCurrency(priceString: string): string {
  const currencySymbols: { [key: string]: string } = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
    C$: "CAD",
    A$: "AUD"
  }

  // Try to find currency symbol in the price string
  for (const [symbol, currency] of Object.entries(currencySymbols)) {
    if (priceString.includes(symbol)) {
      return currency
    }
  }

  // Default to USD if no currency symbol is found
  return "USD"
}

// Function to convert price to USD
function convertToUSD(price: number, fromCurrency: string): number {
  const rate = CURRENCY_RATES[fromCurrency] || 1
  return price * rate
}

// Function to extract product information from the current page
function extractProductInfo() {
  // Common selectors for product information
  const selectors = {
    name: [
      "h1.product-title",
      'h1[itemprop="name"]',
      ".product-name",
      "h1",
      '[data-testid="product-title"]'
    ],
    price: [
      // Generic price selectors
      '[class*="price"]', // Matches any class containing "price"
      '[class*="Price"]',
      'strong[class*="price"]',
      'span[class*="price"]',
      'div[class*="price"]',
      // Specific price selectors
      ".product-price",
      '[itemprop="price"]',
      ".price",
      '[data-testid="product-price"]',
      ".current-price",
      ".wb--shop-links-panel--price",
      // Price meta tags
      'meta[itemprop="price"]',
      'meta[property="product:price:amount"]',
      // Common e-commerce price classes
      ".product__price",
      ".product-price",
      ".price-box",
      ".price-container",
      ".price-wrapper",
      ".price-value",
      ".price-amount",
      ".price-current",
      ".price-final",
      ".price-sale",
      ".price-regular",
      ".price-special"
    ]
  }

  let productName = ""
  let productPrice = ""

  // Try to find product name
  for (const selector of selectors.name) {
    const element = document.querySelector(selector)
    if (element) {
      productName = element.textContent?.trim() || ""
      break
    }
  }

  // Try to find product price with improved detection
  for (const selector of selectors.price) {
    const elements = document.querySelectorAll(selector)
    for (const element of elements) {
      // Skip hidden elements
      const htmlElement = element as HTMLElement
      if (!htmlElement.offsetParent) continue

      // Get price content
      let priceText = ""

      // Handle meta tags differently
      if (element.tagName.toLowerCase() === "meta") {
        priceText = element.getAttribute("content") || ""
      } else {
        priceText = element.textContent?.trim() || ""
      }

      // Skip if empty
      if (!priceText) continue

      // Check if the text looks like a price (contains numbers and currency symbols)
      if (/[\d.,]/.test(priceText) && /[$€£¥]/.test(priceText)) {
        productPrice = priceText
        break
      }
    }
    if (productPrice) break
  }

  // If no price found with selectors, try finding any text that looks like a price
  if (!productPrice) {
    const priceRegex = /[$€£¥]\s*\d+([.,]\d{2})?|\d+([.,]\d{2})?\s*[$€£¥]/g
    const textNodes = document.evaluate(
      "//text()[contains(., '$') or contains(., '€') or contains(., '£') or contains(., '¥')]",
      document.body,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )

    for (let i = 0; i < textNodes.snapshotLength; i++) {
      const node = textNodes.snapshotItem(i)
      if (node && node.textContent) {
        const matches = node.textContent.match(priceRegex)
        if (matches && matches.length > 0) {
          productPrice = matches[0].trim()
          break
        }
      }
    }
  }

  // Clean up price string (remove currency symbols and convert to number)
  const cleanPrice = productPrice.replace(/[^0-9.,]/g, "").replace(",", ".")
  const price = parseFloat(cleanPrice) || 0
  const currency = detectCurrency(productPrice)

  // Check if we have valid product information
  const missingFields: string[] = []
  if (!productName) missingFields.push("name")
  // if (price === 0) missingFields.push("price")

  if (missingFields.length > 0) {
    return {
      error: {
        code: "PRODUCT_EXTRACTION_ERROR",
        message: "Could not extract product information from this page",
        details: `Missing fields: ${missingFields.join(", ")}`,
        customImagePath: "/assets/images/404.png",
        missingFields
      }
    }
  }

  return {
    name: productName,
    price,
    currency,
    url: window.location.href,
    rawPrice: productPrice
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProductInfo") {
    const productInfo = extractProductInfo()
    sendResponse(productInfo)
  }
  return true
})
