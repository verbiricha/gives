import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { getProjects } from 'lib/db'
import { PageResults } from 'lib/strike-api'
import { IncomingMessage } from 'http'

export default async (req: NextApiRequest, res: NextApiResponse<PageResults<any>>) => {
  const data = await getProjects()
  // @ts-ignore
  data ? res.status(200).json(data) : res.status(401)
  res.end()
}
