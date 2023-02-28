import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { createClient, getLnQuote, payLnQuote } from 'lib/api.js'
import { PageResults, Invoice } from 'lib/strike-api'
import { IncomingMessage } from 'http'
import db from 'lib/db'
import ky from 'ky'

export async function getInvoice(id: number, amount: number) {
  const project = await db.project.findUnique({
    where: {
      id,
    },
  })
  const { callback } = await ky.get(project.lnurl).json()
  const { pr } = await ky.get(`${callback}?amount=${amount * 1000}`).json()
  return pr
}

export async function getSubscriptions(authorId: string, include) {
  if (include) {
    const subs = await db.subscription.findMany({
      where: {
        authorId,
      },
      include,
    })
    subs.forEach((s) => {
      s.executions.forEach((e) => {
        e.amountFiat = e.amountFiat.toNumber()
        e.timestamp = e.timestamp.getTime()
      })
    })
    return subs
  } else {
    return db.subscription.findMany({
      where: {
        authorId,
      },
    })
  }
}

async function createSubscription(authorId: string, amount: number, projectId: number) {
  try {
    const created = await db.subscription.create({
      data: {
        authorId,
        projectId,
        amount,
      },
    })
    return created
  } catch (error) {
    console.error(error)
  }
}

async function createSubscriptionExecution(
  subId: number,
  amount: number,
  amountFiat: number,
  currency: string,
  projectId: number
) {
  try {
    const created = await db.subscriptionExecution.create({
      data: {
        subId,
        projectId,
        amount,
        timestamp: new Date(),
        amountFiat,
        currency,
      },
    })
    return created
  } catch (error) {
    console.error(error)
  }
}

export default async (req: NextApiRequest, res: NextApiResponse<PageResults<Invoice>>) => {
  const session = await getSession({ req })
  console.log('sess', session)
  const user = session?.user
  const authorId = user?.id
  if (!authorId) {
    res.status(401)
    res.end()
    return
  }

  if (req.method === 'GET') {
    const subs = await getSubscriptions(authorId)
    res.status(200).json(subs)
    res.end()
  } else if (req.method === 'POST') {
    const { amount, project } = req.body
    // todo: do this during auth
    const currency = 'USD'
    await db.user.upsert({
      where: { id: authorId },
      create: { ...user, token: session.accessToken, currency },
      update: { token: session.accessToken },
    })
    try {
      const usr = await db.user.findUnique({ where: { id: user.id } })
      const client = createClient(process.env.STRIKE_API_URI, session.accessToken)
      const lnInvoice = await getInvoice(project, amount)
      const quote = await getLnQuote(client, lnInvoice, usr.currency)
      const sub = await createSubscription(authorId, amount, project)
      if (process.env.ENV === 'prod') {
        const pay = await payLnQuote(client, quote.paymentQuoteId)
        const subExec = await createSubscriptionExecution(
          sub.id,
          amount,
          Number(pay.totalAmount.amount),
          pay.totalAmount.currency,
          project.id
        )
      }
      if (quote) {
        res.status(200).json(sub)
      } else {
        res.status(404)
      }
    } catch (error) {
      console.error(error)
      res.status(500)
    }
  } else {
    res.status(405)
  }
  res.end()
}
