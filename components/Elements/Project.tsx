import Image from 'next/image'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  IconButton,
  CardHeader,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import type { Project as ProjectType } from 'lib/types'
import InfoOutlinedIcon from 'components/Icons/info.svg'
import { formatAmount } from 'lib/format'

interface ProjectProps {
  project: ProjectType
  showStats?: boolean
}

export const Project = ({ project, showStats = true }: ProjectProps) => {
  return (
    <Card>
      <CardHeader
        avatar={<Image width="100px" height="60px" src={project.image} alt={project.name} />}
        action={
          <Link passHref href={`/p/${project.slug}`}>
            <IconButton aria-label="settings">
              <InfoOutlinedIcon />
            </IconButton>
          </Link>
        }
        title={project.name}
        subheader={project.description}
      />
      {project.subscriptions && showStats && (
        <Stack
          alignItems="center"
          justifyContent="space-around"
          direction={['column', 'column', 'row']}
          mt={1}
          pb={1}
        >
          <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
            <Typography variant="h4">Supporters</Typography>
            <Typography fontSize="1.5rem">{project.subscriptions.amount}</Typography>
          </Stack>
          <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
            <Typography variant="h4">Monthly</Typography>
            <Typography fontSize="1.5rem">
              {formatAmount(project.subscriptions.monthly)} ϟ
            </Typography>
          </Stack>
          <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
            <Typography variant="h4">Raised</Typography>
            <Typography fontSize="1.5rem">{formatAmount(project.subscriptions.total)} ϟ</Typography>
          </Stack>
        </Stack>
      )}
    </Card>
  )
}
