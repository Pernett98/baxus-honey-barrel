import "./Loader.css"

export const Loader = () => {
  return (
    <div className="loader-container">
      <svg
        className="loader"
        width="50"
        height="50"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg">
        <circle
          className="loader-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <p>Searching for matches...</p>
    </div>
  )
}
