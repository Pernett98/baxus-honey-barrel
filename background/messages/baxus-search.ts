import type { PlasmoMessaging } from "@plasmohq/messaging"

import { baxusBottleSearch } from "~services/baxus.service"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { query } = req.body
  console.log(query)
  const message = await baxusBottleSearch(query)

  res.send({
    message
  })
}

export default handler
