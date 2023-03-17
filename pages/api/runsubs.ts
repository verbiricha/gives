import { NextApiRequest, NextApiResponse } from 'next'
import { createClient, getLnQuote, payLnQuote } from 'lib/api'
import type { Subscription, Project } from 'lib/types'
import { getPendingSubscriptions, getInvoice, createSubscriptionExecution } from 'lib/db'

interface SubParams {
  sub: Subscription
  project: Project
  token: string
  currency: string
}

async function runSubscription(params: SubParams) {
  const { sub, token, project, currency } = params
  const client = createClient(process.env.STRIKE_API_URI, token)
  try {
    const lnInvoice = await getInvoice(project.id, sub.amount)
    const quote = await getLnQuote(client, lnInvoice, currency)
    if (quote?.paymentId) {
      const pay = await payLnQuote(client, quote.paymentQuoteId)
      await createSubscriptionExecution(
        sub.id,
        Number(sub.amount),
        Number(pay.totalAmount.amount),
        pay.totalAmount.currency,
        project.id
      )
    } else {
      console.error(`Couldn't get quote for sub: ${sub.id}`)
    }
  } catch (error) {
    console.error(error)
  }
}

export default async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const pending = await getPendingSubscriptions()
    for (const sub of pending) {
      await runSubscription({
        sub: sub as Subscription,
        project: sub.project,
        token: sub.author.token,
        currency: sub.author.currency,
      })
    }
    res.status(200)
  } catch (error) {
    console.error(error)
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500)
    }
  } finally {
    res.end()
  }
}
