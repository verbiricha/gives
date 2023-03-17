import { PrismaClient } from '@prisma/client'
import { createClient, getProfile } from 'lib/api'
import type { Project, Subscription, User } from 'lib/types'
import ky from 'ky'

const db = new PrismaClient({
  rejectOnNotFound: false,
})

export async function getUser(id: string) {
  return await db.user.findUnique({
    where: {
      id,
    },
  })
}

export async function getUserByHandle(handle: string) {
  return await db.user.findFirst({
    where: {
      handle,
    },
  })
}

export async function getProject(id: number) {
  const project = await db.project.findUnique({
    where: {
      id,
    },
    include: {
      subscriptions: true,
      executions: true,
    },
  })
  if (project) {
    return {
      ...project,
      subscriptions: {
        amount: project.subscriptions.length,
        monthly: project.subscriptions.reduce((acc, { amount }) => acc + amount, 0),
        total: project.executions.reduce((acc, { amount }) => acc + amount, 0),
      },
      executions: project.executions.map((ex) => {
        return {
          ...ex,
          amountFiat: ex.amountFiat.toNumber(),
          timestamp: ex.timestamp.getTime(),
        }
      }),
    }
  }
}

export async function getProjectBySlug(slug: string) {
  const project = await db.project.findFirst({
    where: {
      slug,
    },
    include: {
      subscriptions: true,
      executions: true,
    },
  })
  if (project) {
    return {
      ...project,
      subscriptions: {
        amount: project.subscriptions.length,
        monthly: project.subscriptions.reduce((acc, { amount }) => acc + amount, 0),
        total: project.executions.reduce((acc, { amount }) => acc + amount, 0),
      },
      executions: project.executions.map((ex) => {
        return {
          ...ex,
          amountFiat: ex.amountFiat.toNumber(),
          timestamp: ex.timestamp.getTime(),
        }
      }),
    }
  }
}

export async function getSupporters(projectId: number) {
  const subs = await db.subscription.findMany({
    where: {
      projectId,
      isPublic: true,
    },
    include: {
      author: true,
    },
  })
  if (subs) {
    return subs.map((s) => s.author)
  }
}

export async function getProjects() {
  const projects = await db.project.findMany({
    include: {
      subscriptions: true,
      executions: true,
    },
  })
  return projects.map((project) => {
    return {
      ...project,
      subscriptions: {
        amount: project.subscriptions.length,
        monthly: project.subscriptions.reduce((acc, { amount }) => acc + amount, 0),
        total: project.executions.reduce((acc, { amount }) => acc + amount, 0),
      },
      executions: project.executions.map((ex) => {
        return {
          ...ex,
          amountFiat: ex.amountFiat.toNumber(),
          timestamp: ex.timestamp.getTime(),
        }
      }),
    }
  })
}

export async function getSubscriptions(authorId: string, include?: any) {
  let subs
  if (include) {
    subs = await db.subscription.findMany({
      where: {
        authorId,
      },
      include,
    })
    subs.forEach((s) => {
      // @ts-ignore
      s.executions.forEach((e) => {
        e.amountFiat = e.amountFiat.toNumber()
        e.timestamp = e.timestamp.getTime()
      })
    })
    return subs
  } else {
    subs = db.subscription.findMany({
      where: {
        authorId,
      },
    })
    // @ts-ignore
    subs.forEach((s) => {
      // @ts-ignore
      s.executions.forEach((e) => {
        e.amountFiat = e.amountFiat.toNumber()
        e.timestamp = e.timestamp.getTime()
      })
    })
    return subs
  }
}

function oneMonthAgo() {
  const now = Date.now()
  return new Date(now - 1000 * 60 * 60 * 24 * 30)
}

export async function getPendingSubscriptions() {
  const subs = await db.subscription.findMany({
    include: {
      executions: true,
      project: true,
      author: true,
    },
    where: {
      executions: {
        some: {
          timestamp: {
            lt: oneMonthAgo(),
          },
        },
      },
    },
  })
  subs.forEach((s) => {
    // @ts-ignore
    s.executions.forEach((e) => {
      // @ts-ignore
      e.amountFiat = e.amountFiat.toNumber()
      // @ts-ignore
      e.timestamp = e.timestamp.getTime()
    })
  })
  return subs
}

export async function createSubscription(
  authorId: string,
  amount: number,
  projectId: number,
  isPublic: boolean
) {
  try {
    const created = await db.subscription.create({
      data: {
        authorId,
        projectId,
        amount,
        isPublic,
      },
    })
    return created
  } catch (error) {
    console.error(error)
  }
}

export async function createSubscriptionExecution(
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

export async function updateSubscription(id: number, authorId: number, amount: number) {
  try {
    const updated = await db.subscription.update({
      where: {
        id,
        // @ts-ignore
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

export async function deleteSubscription(id: number, authorId: string) {
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

export async function storeUser(authorId: string, token: string) {
  const apiClient = createClient(process.env.STRIKE_API_URI, process.env.STRIKE_API_KEY)
  try {
    const { description, currencies, handle, avatarUrl } = await getProfile(apiClient, authorId)
    const currency = currencies.find((c: any) => c.isDefaultCurrency)?.currency ?? 'USD'
    const create = {
      id: authorId,
      token,
      currency,
      handle,
      avatarUrl,
      description,
    }
    const update = { token, handle, avatarUrl, description, currency }
    await db.user.upsert({
      where: { id: authorId },
      create,
      update,
    })
    return await db.user.findUnique({ where: { id: authorId } })
  } catch (error) {
    console.error(error)
  }
}

export async function getInvoice(id: number, amount: number) {
  const project = await db.project.findUnique({
    where: {
      id,
    },
  })
  // @ts-ignore
  const { callback } = await ky.get(project.lnurl).json()
  // @ts-ignore
  const { pr } = await ky.get(`${callback}?amount=${amount * 1000}`).json()
  return pr
}
