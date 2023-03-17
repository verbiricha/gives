import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { getProfile, createClient, getLnQuote, payLnQuote } from 'lib/api.js'
import { IncomingMessage } from 'http'
import {
  getInvoice,
  storeUser,
  getProject,
  createSubscription,
  createSubscriptionExecution,
  getSubscriptions,
} from 'lib/db'
import ky from 'ky'

export default async (req: NextApiRequest, res: NextApiResponse<any>) => {
  const session = await getSession({ req })
  const user = session?.user
  // @ts-ignore
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
    const { amount, project, isPublic } = req.body
    const usr = await storeUser(authorId, session!.refreshToken as string)
    const client = createClient(process.env.STRIKE_API_URI, session!.accessToken)
    try {
      const proj = await getProject(project)
      const lnInvoice = await getInvoice(project, amount)
      const sub = await createSubscription(authorId, amount, project, isPublic)
      if (!sub) {
        res.status(500)
        res.end()
        return
      }

      let quote, pay, subExec
      if (process.env.ENV === 'prod') {
        quote = await getLnQuote(client, lnInvoice, usr!.currency)
        pay = await payLnQuote(client, quote.paymentQuoteId)
        subExec = await createSubscriptionExecution(
          sub.id,
          Number(amount),
          Number(pay.totalAmount.amount),
          pay.totalAmount.currency,
          project
        )
        // @ts-ignore
        sub.project = proj
        // @ts-ignore
        sub.executions = [subExec]
      } else {
        let fakeInvoice =
          'lntb10u1pjq7j6dpp53ly5ajq73vrar9u3tueg8dghuagl3sks96zxvq90dcs7tjmavvpqdqqcqzpgxqyz5vqsp5gqy2rvz0j0ehc6xydsknanla6mxes8pugqg8fr25tgl6cvzfqkls9qyyssqt6gv6vv0qlgl60thhuvphj637gvxf73a4mld2pdez8errar7mh3xag06rh9mvsrw6g2e7rg8q8hxzvp3s3062m793fjm7qu7uzcfpjspswht4k'
        quote = await getLnQuote(client, fakeInvoice, usr!.currency)
        pay = await payLnQuote(client, quote.paymentQuoteId)
        subExec = await createSubscriptionExecution(
          sub.id,
          Number(amount),
          Number(pay.totalAmount.amount),
          pay.totalAmount.currency,
          project
        )
        // @ts-ignore
        sub.project = proj
        // @ts-ignore
        sub.executions = [subExec]
      }
      if (sub) {
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
