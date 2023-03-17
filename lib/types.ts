export interface Project {
  id: number
  slug: string
  image: string
  name: string
  lnurl: string
  description: string | null
  subscriptions?: { amount: number; monthly: number; total: number }
}

export interface User {
  id: string
  handle: string
  avatarUrl: string
  description: string
  token: string
  currency: string
}

export interface Subscription {
  id: number
  amount: number
  author?: User
  authorId: string
  project?: Project
  projectId: number
  executions: SubscriptionExecution[]
}

export interface SubscriptionExecution {
  amount: number
  currency: string
}
