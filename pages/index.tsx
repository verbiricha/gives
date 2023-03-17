import { useEffect } from 'react'
import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { Box, Card, CardHeader, CardContent, Stack, Typography } from '@mui/material'
import { Page, Project } from '../components'
import { Amount, AccountData } from '../components'
import { getProjects } from 'lib/db'
import { User, Project as ProjectType } from 'lib/types'
import { Invoice } from 'lib/strike-api'
import { formatAmount } from 'lib/format'

export interface Data {
  user?: User
  projects: ProjectType[]
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
        amount: amount + p.subscriptions!.amount,
        monthly: monthly + p.subscriptions!.monthly,
        total: total + p.subscriptions!.total,
      }
    },
    { amount: 0, monthly: 0, total: 0 }
  )

  return (
    <Page>
      <Head>
        <title>bitcoiner.gives</title>
      </Head>
      <Typography variant="h2">Statistics</Typography>
      <Stack
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
        mt={4}
        mb={6}
      >
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Supporters</Typography>
          <Typography fontSize="1.5rem">{globalStats.amount}</Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Monthly</Typography>
          <Typography fontSize="1.5rem">{formatAmount(globalStats.monthly)} ϟ</Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Raised</Typography>
          <Typography fontSize="1.5rem">{formatAmount(globalStats.total)} ϟ</Typography>
        </Stack>
      </Stack>
      <Typography variant="h3">Projects</Typography>
      {projects.map((p) => (
        <Box mt={4} mb={4} key={p.id}>
          <Project project={p} showStats={false} />
        </Box>
      ))}
    </Page>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const projects = await getProjects()
  return { props: { projects } }
}
