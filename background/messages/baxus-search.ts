import type { PlasmoMessaging } from "@plasmohq/messaging"

import { findMatchingBottles } from "~services/baxus.service"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("from message")
  try {
    const { query } = req.body
    const message = await findMatchingBottles(query)
    console.log(message)
    res.send({
      message
    })
  } catch (error) {
    console.log(error)
    res.send({ error })
  }
}

export default handler
