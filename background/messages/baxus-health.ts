import type { PlasmoMessaging } from "@plasmohq/messaging"

import { baxusHealthCheck } from "~services/baxus.service"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { status } = await baxusHealthCheck()

    res.send({
      isBaxusHealthy: status === "ok"
    })
  } catch (error) {
    res.send({
      isBaxusHealthy: false
    })
  }
}

export default handler
