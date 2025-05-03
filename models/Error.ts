// Custom error types for the application

// Base error interface
export interface AppError {
  code: string
  message: string
  details?: string
  customImagePath?: string
}

// Product extraction errors
export interface ProductExtractionError extends AppError {
  code: "PRODUCT_EXTRACTION_ERROR"
  missingFields?: string[]
}

// Search errors
export interface SearchError extends AppError {
  code: "SEARCH_ERROR"
  query?: string
}

// No results errors
export interface NoResultsError extends AppError {
  code: "NO_RESULTS_ERROR"
  query?: string
  confidence?: number
}

// API errors
export interface ApiError extends AppError {
  code: "API_ERROR"
  status?: number
  endpoint?: string
}

// Network errors
export interface NetworkError extends AppError {
  code: "NETWORK_ERROR"
  url?: string
}

// Error factory functions
export const createProductExtractionError = (
  missingFields?: string[]
): ProductExtractionError => {
  return {
    code: "PRODUCT_EXTRACTION_ERROR",
    message: "Could not extract product information from this page",
    customImagePath: "404.png",
    details: missingFields?.length
      ? `Missing fields: ${missingFields.join(", ")}`
      : "Please make sure you are on a product page",
    missingFields
  }
}

export const createSearchError = (query?: string): SearchError => {
  return {
    code: "SEARCH_ERROR",
    message: "Error searching for products",
    details: query
      ? `Failed to search for: ${query}`
      : "Search operation failed",
    query
  }
}

export const createNoResultsError = (
  query?: string,
  confidence?: number
): NoResultsError => {
  return {
    code: "NO_RESULTS_ERROR",
    message: "No matching products found in the marketplace",
    details: query
      ? `No results found for: ${query}${confidence ? ` (confidence threshold: ${confidence})` : ""}`
      : "No matching products found in the marketplace",
    query,
    confidence,
    customImagePath: "/assets/images/404.png"
  }
}

export const createApiError = (
  status?: number,
  endpoint?: string
): ApiError => {
  return {
    code: "API_ERROR",
    message: "API request failed",
    details: endpoint
      ? `Failed to connect to ${endpoint}${status ? ` (Status: ${status})` : ""}`
      : "API request failed",
    status,
    endpoint
  }
}

export const createNetworkError = (url?: string): NetworkError => {
  return {
    code: "NETWORK_ERROR",
    message: "Network connection error",
    details: url ? `Failed to connect to ${url}` : "Network connection failed",
    url
  }
}
