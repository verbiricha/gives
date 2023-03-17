import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { updateSubscription, deleteSubscription } from 'lib/db'
import { IncomingMessage } from 'http'

export default async (req: NextApiRequest, res: NextApiResponse<any>) => {
  const { id } = req.query

  const session = await getSession({ req })
  const user = session?.user
  // @ts-ignore
  const authorId = user?.id

  if (!authorId) {
    res.status(401)
    res.end()
    return
  }

  if (req.method === 'POST') {
    const { amount } = req.body
    const updated = await updateSubscription(Number(id), authorId, amount)
    if (updated) {
      res.status(200).json(updated)
    } else {
      res.status(404)
    }
  } else if (req.method === 'DELETE') {
    await deleteSubscription(Number(id), authorId)
    res.status(200)
  } else {
    res.status(405)
  }

  res.end()
}
