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
      // Money-specific selectors
      '[class*="money"]',
      '[class*="Money"]',
      '[class*="currency"]',
      '[class*="Currency"]',
      '[class*="price"]',
      '[class*="Price"]',
      // Price meta tags
      'meta[itemprop="price"]',
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
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
      ".price-special",
      // Money-specific classes
      ".money",
      ".currency",
      ".amount",
      ".value",
      // Data attributes
      "[data-price]",
      "[data-amount]",
      "[data-value]",
      "[data-currency]",
      // Specific e-commerce platforms
      ".woocommerce-Price-amount",
      ".shopify-money",
      ".shopify-Price-amount",
      ".amazon-price",
      ".ebay-price"
    ]
  }

  let productName = ""
  let productPrice = ""
  let priceElement = null

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
    console.log(`Trying selector: ${selector}`)
    const elements = document.querySelectorAll(selector)
    console.log(`Found ${elements.length} elements for selector ${selector}`)

    for (const element of elements) {
      // Skip script tags and other non-visible elements
      if (
        element.tagName.toLowerCase() === "script" ||
        element.tagName.toLowerCase() === "style" ||
        element.tagName.toLowerCase() === "noscript" ||
        element.tagName.toLowerCase() === "template"
      ) {
        console.log(`Skipping non-visible element: ${element.tagName}`)
        continue
      }

      // Skip hidden elements
      const htmlElement = element as HTMLElement
      if (!htmlElement.offsetParent) {
        console.log(`Skipping hidden element: ${element.tagName}`)
        continue
      }

      // Skip elements with display: none or visibility: hidden
      const style = window.getComputedStyle(htmlElement)
      if (style.display === "none" || style.visibility === "hidden") {
        console.log(
          `Skipping element with display:none or visibility:hidden: ${element.tagName}`
        )
        continue
      }

      // Get price content
      let priceText = ""

      // Handle meta tags differently
      if (element.tagName.toLowerCase() === "meta") {
        priceText = element.getAttribute("content") || ""
        console.log(`Found meta tag price: ${priceText}`)
      } else {
        // Check for data attributes first
        const dataPrice = element.getAttribute("data-price")
        const dataAmount = element.getAttribute("data-amount")
        const dataValue = element.getAttribute("data-value")

        if (dataPrice) {
          priceText = dataPrice
          console.log(`Found data-price: ${priceText}`)
        } else if (dataAmount) {
          priceText = dataAmount
          console.log(`Found data-amount: ${priceText}`)
        } else if (dataValue) {
          priceText = dataValue
          console.log(`Found data-value: ${priceText}`)
        } else {
          priceText = element.textContent?.trim() || ""
          console.log(`Found text content: ${priceText}`)
        }
      }

      // Skip if empty
      if (!priceText) {
        console.log(`Skipping empty price text`)
        continue
      }

      // Check if the text looks like a price (contains numbers and currency symbols)
      if (/[\d.,]/.test(priceText) && /[$€£¥]/.test(priceText)) {
        console.log(`Found valid price: ${priceText}`)
        productPrice = priceText
        priceElement = element
        break
      } else {
        console.log(`Text does not match price pattern: ${priceText}`)
      }
    }
    if (productPrice) break
  }

  // If no price found with selectors, try finding any text that looks like a price
  if (!productPrice) {
    const priceRegex = /[$€£¥]\s*\d+([.,]\d{2})?/g
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
        const parentElement = node.parentElement
        // Skip if parent is a script, style, or other non-visible element
        if (
          parentElement &&
          (parentElement.tagName.toLowerCase() === "script" ||
            parentElement.tagName.toLowerCase() === "style" ||
            parentElement.tagName.toLowerCase() === "noscript" ||
            parentElement.tagName.toLowerCase() === "template")
        ) {
          continue
        }

        // Skip if parent is hidden
        if (parentElement) {
          const style = window.getComputedStyle(parentElement)
          if (style.display === "none" || style.visibility === "hidden")
            continue
        }

        const matches = node.textContent.match(priceRegex)
        if (matches && matches.length > 0) {
          productPrice = matches[0].trim()
          priceElement = parentElement
          break
        }
      }
    }
  }

  // Clean up price string (remove non-numeric characters and convert to number)
  const cleanPrice = productPrice.replace(/[^0-9.,]/g, "").replace(",", ".")
  const price = parseFloat(cleanPrice) || 0

  // Check if we have valid product information
  const missingFields: string[] = []
  if (!productName) missingFields.push("name")

  if (missingFields.length > 0) {
    return {
      error: {
        code: "PRODUCT_EXTRACTION_ERROR",
        message:
          "We couldn't find the product details on this page. Try searching on Baxus directly.",
        customImagePath: "/assets/images/404.png"
      }
    }
  }
  console.log(priceElement)
  return {
    name: productName,
    price,
    url: window.location.href,
    debug: {
      priceElement: priceElement
        ? {
            tagName: priceElement.tagName,
            className: priceElement.className,
            id: priceElement.id,
            textContent: priceElement.textContent,
            selector: getSelector(priceElement)
          }
        : null
    }
  }
}

// Helper function to get a unique selector for an element
function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`
  }

  const path = []
  let current = element

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      selector += `#${current.id}`
    } else if (current.className) {
      selector += `.${current.className.split(" ").join(".")}`
    }

    path.unshift(selector)
    current = current.parentElement
  }

  return path.join(" > ")
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProductInfo") {
    const productInfo = extractProductInfo()
    sendResponse(productInfo)
  }
  return true
})
