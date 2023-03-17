import { NextApiRequest, NextApiResponse } from 'next'
import { createClient, getLnQuote, payLnQuote, refreshAccessToken } from 'lib/api'
import type { User, Subscription, Project } from 'lib/types'
import { storeUser, getPendingSubscriptions, getInvoice, createSubscriptionExecution } from 'lib/db'

interface SubParams {
  user: User
  sub: Subscription
  project: Project
}

async function runSubscription(params: SubParams) {
  const { sub, user, project } = params
  try {
    const newToken = await refreshAccessToken(user.token)
    if (!newToken) {
      console.error(`Couldn't refresh user token for ${user.handle}`)
      return
    }
    await storeUser(user.id, newToken.refreshToken)
    const client = createClient(process.env.STRIKE_API_URI, newToken.accessToken)
    const lnInvoice = await getInvoice(project.id, sub.amount)
    const quote = await getLnQuote(client, lnInvoice, user.currency)
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
        user: sub.author,
        project: sub.project,
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
