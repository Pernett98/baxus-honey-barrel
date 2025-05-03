import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

export const useBaxusHealth = () => {
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
