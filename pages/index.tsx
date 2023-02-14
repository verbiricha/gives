import { useEffect } from 'react'
import type { NextPage, GetServerSideProps } from 'next'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Stack,
  Typography,
} from '@mui/material'
import { Page } from '../components'
import { AccountData } from '../components'
import { getProjects } from './api/projects'
import { getSubscriptions } from './api/subscriptions'
import { PageResults, Invoice } from 'lib/strike-api'

export interface Data {
  user?: any
  subscriptions: any[]
  projects: PageResults<any>
}

const Project = ({ user, subscriptions, project }) => {
  const isSubscribed = subscriptions.map((s) => s.projectId).includes(project.id)
  const subscription = subscriptions.find((s) => s.projectId === project.id)
  function createSubscription(amount: number, project: number) {
    try {
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, project }),
      })
    } catch (error) {
      console.error(error)
    }
  }
  function updateSubscription(id: number, amount: number) {
    try {
      fetch(`/api/subscriptions/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })
    } catch (error) {
      console.error(error)
    }
  }
  function deleteSubscription(id: number) {
    try {
      fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <Card>
      <CardHeader title={project.name} />
      <CardContent sx={{ p: 2 }}>
        {project.description}
        {user && !isSubscribed && (
          <Button variant="outlined" onClick={() => createSubscription(12345, project.id)}>
            Donate
          </Button>
        )}
        {user && isSubscribed && subscription && (
          <>
            <h3>You are contributing:</h3>
            <p>{subscription.amount} sats/month</p>
            <Button onClick={() => deleteSubscription(subscription.id)}>Unsubscribe</Button>
          </>
        )}
        <Box>
          <h2>Susbscriptions</h2>
          <p>{project.subscriptions.amount} subscriptions</p>
          <h2>Sats</h2>
          <p>{project.subscriptions.total} sats/month</p>
        </Box>
      </CardContent>
    </Card>
  )
}

const Home: NextPage<Data> = ({ projects, subscriptions }) => {
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signIn() // Force sign in to hopefully resolve error
    }
  }, [session])

  return (
    <Page>
      <nav>
        {!session && (
          <Button variant="outlined" onClick={() => signIn('strike')}>
            Login with Strike
          </Button>
        )}
        {session && (
          <>
            <Typography sx={{ mb: 3 }}>{session.user?.name ?? session.user?.email}</Typography>
            <Button variant="outlined" onClick={() => signOut()}>
              Sign out
            </Button>
          </>
        )}
      </nav>
      {projects.map((p) => (
        <Project user={user} project={p} subscriptions={subscriptions} />
      ))}
    </Page>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  const user = session?.user
  const authorId = user?.id
  let subscriptions = []
  if (authorId) {
    subscriptions = await getSubscriptions(authorId)
  }
  const projects = await getProjects(context.req)
  return { props: { projects, subscriptions } }
}
