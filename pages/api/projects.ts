import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import db from 'lib/db'
import { api } from 'lib/api.js'
import { PageResults, Invoice } from 'lib/strike-api'
import { IncomingMessage } from 'http'

export async function getProjects() {
  const projects = await db.project.findMany({
    include: {
      subscriptions: true,
    },
  })
  return projects.map((project) => {
    return {
      ...project,
      subscriptions: {
        amount: project.subscriptions.length,
        total: project.subscriptions.reduce((acc, { amount }) => acc + amount, 0),
      },
    }
  })
}

export default async (req: NextApiRequest, res: NextApiResponse<PageResults<Invoice>>) => {
  const data = await getProjects()
  data ? res.status(200).json(data) : res.status(401)
  res.end()
}
