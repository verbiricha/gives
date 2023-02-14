import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import db from 'lib/db'
import { api } from 'lib/api.js'
import { PageResults, Invoice } from 'lib/strike-api'
import { IncomingMessage } from 'http'

async function updateSubscription(id: number, authorId, amount: number) {
  try {
    const updated = await db.subscription.update({
      where: {
        id,
        authorId,
      },
      data: {
        amount,
      },
    })
    return updated
  } catch (error) {
    console.error(error)
  }
}

async function deleteSubscription(id: number, authorId: string) {
  try {
    const sub = await db.subscription.findUnique({
      where: {
        id,
      },
    })
    if (sub?.authorId === authorId) {
      await db.subscription.delete({
        where: {
          id,
        },
      })
    }
  } catch (error) {
    console.error(error)
  }
}

export default async (req: NextApiRequest, res: NextApiResponse<PageResults<Invoice>>) => {
  const { id } = req.query

  const session = await getSession({ req })
  const user = session?.user
  const authorId = user?.id

  if (!authorId) {
    res.status(401)
    res.end()
    return
  }

  if (req.method === 'POST') {
    const { amount } = req.body
    const updated = await updateSubscription(Number(id), authorId, amount)
    res.status(200).json(updated)
  } else if (req.method === 'DELETE') {
    await deleteSubscription(Number(id), authorId)
    res.status(200)
  } else {
    res.status(405)
  }

  res.end()
}
