import { useEffect } from 'react'
import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material'
import { Page, Amount, AccountData, Project } from 'components'
import { getUserByHandle, getSubscriptions } from 'lib/db'
import type { User, Subscription, SubscriptionExecution, Project as ProjectType } from 'lib/types'
import { PageResults, Invoice } from 'lib/strike-api'
import { formatAmount } from 'lib/format'
import { sumAmounts } from 'lib/util'

export interface Data {
  user: User
  subscriptions: Subscription[]
}

const Profile: NextPage<Data> = ({ user, subscriptions }) => {
  const subsTotal = subscriptions.reduce(sumAmounts, 0)
  const projects = subscriptions
    .map((s: Subscription) => s.project)
    .filter((p) => p) as ProjectType[]
  const givenTotal = subscriptions.reduce(
    (acc: number, { executions }) => acc + executions.reduce(sumAmounts, 0),
    0
  )
  return (
    <Page>
      <Head>
        <title>{user.handle}</title>
      </Head>
      <Stack alignItems="center" direction="column" spacing={2}>
        <Avatar sx={{ width: 120, height: 120 }} alt={user.handle} src={user.avatarUrl} />
        <Typography variant="h2">{user.handle}</Typography>
      </Stack>
      <Stack
        mt={4}
        mb={6}
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
      >
        <Amount title="Supporting" amount={subscriptions.length} />
        <Amount title="Monthly" amount={`${subsTotal} ϟ`} />
        <Amount title="Given" amount={`${givenTotal} ϟ`} />
      </Stack>
      <Typography variant="h2" mb={2}>
        Projects
      </Typography>
      {projects.map((project: ProjectType) => (
        <Box mb={2} key={project.id}>
          <Project project={project} />
        </Box>
      ))}
    </Page>
  )
}

export default Profile

// @ts-ignore
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query
  let user
  if (typeof id === 'string') {
    user = await getUserByHandle(id)
  }
  if (!user) {
    return {
      redirect: {
        destination: '/',
      },
    }
  }
  const subscriptions = await getSubscriptions(user.id, { project: true, executions: true })
  return { props: { user, subscriptions } }
}
