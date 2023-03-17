import { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/Head'
import Image from 'next/image'
import type { NextPage, GetServerSideProps } from 'next'
import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material'
import { Page, Amount, AccountData, Project } from 'components'
import { getProjectBySlug, getSupporters } from 'lib/db'
import type { User, Project as ProjectType } from 'lib/types'
import { formatAmount } from 'lib/format'

export interface Data {
  project: ProjectType
  supporters: User[]
}

const ProjectProfile: NextPage<Data> = ({ project, supporters }) => {
  return (
    <Page>
      <Head>
        <title>{project.name}</title>
      </Head>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" mb={2}>
          {project.name}
        </Typography>
        <Image width="100px" height="60px" src={project.image} alt={project.name} />
      </Box>
      <Typography>{project.description}</Typography>
      {project.subscriptions && (
        <Stack
          alignItems="center"
          mt={4}
          justifyContent="space-around"
          direction={['column', 'column', 'row']}
        >
          <Amount title="Subscriptions" amount={project.subscriptions.amount} />
          <Amount title="Monthly" amount={`${project.subscriptions.monthly} ϟ`} />
          <Amount title="Given" amount={`${project.subscriptions.total} ϟ`} />
        </Stack>
      )}
      {supporters?.length > 0 && (
        <>
          <Typography variant="h3" mb={2}>
            Supporters
          </Typography>
          <Stack mt={4} direction="column">
            {supporters.map((u) => {
              return (
                <Link passHref key={u.id} href={`/h/${u.handle}`}>
                  <Stack direction="row" alignItems="center">
                    <Box mr={2}>
                      <Avatar src={u.avatarUrl} />
                    </Box>
                    <Typography variant="h4">{u.handle}</Typography>
                  </Stack>
                </Link>
              )
            })}
          </Stack>
        </>
      )}
    </Page>
  )
}

export default ProjectProfile

// @ts-ignore
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query
  if (typeof id !== 'string') {
    return {
      redirect: {
        destination: '/',
      },
    }
  }
  const project = await getProjectBySlug(id)
  if (project) {
    const supporters = await getSupporters(project.id)
    return { props: { project, supporters } }
  }
  return {
    redirect: {
      destination: '/',
    },
  }
}
