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
import { PageResults, Invoice } from 'lib/strike-api'

export interface Data {
  user?: any
  projects: PageResults<any>
}

const Project = ({ user, project }) => {
  return (
    <Card>
      <CardHeader title={project.name} />
      <CardContent sx={{ p: 2 }}>{project.description}</CardContent>
      <Stack
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
        mt={4}
      >
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Supporters</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {project.subscriptions.amount}
          </Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Monthly</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {project.subscriptions.monthly} ϟ
          </Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Raised</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {project.subscriptions.total} ϟ
          </Typography>
        </Stack>
      </Stack>
    </Card>
  )
}

const Home: NextPage<Data> = ({ projects }) => {
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signIn() // Force sign in to hopefully resolve error
    }
  }, [session])

  const globalStats = projects.reduce(
    ({ amount, monthly, total }, p) => {
      return {
        amount: amount + p.subscriptions.amount,
        monthly: monthly + p.subscriptions.monthly,
        total: total + p.subscriptions.total,
      }
    },
    { amount: 0, monthly: 0, total: 0 }
  )
  console.log('GLobal', globalStats)

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
      <Stack
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
        mt={4}
      >
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Supporters</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {globalStats.amount}
          </Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Monthly</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {globalStats.monthly} ϟ
          </Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Raised</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {globalStats.total} ϟ
          </Typography>
        </Stack>
      </Stack>
      {projects.map((p) => (
        <Project user={user} project={p} />
      ))}
    </Page>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const projects = await getProjects(context.req)
  return { props: { projects } }
}
