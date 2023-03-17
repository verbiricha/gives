import Image from 'next/image'
import Head from 'next/head'
import { useState, useEffect, useMemo } from 'react'
import type { NextPage, GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Box,
  Slider,
  Button,
  Input,
  Stack,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  NativeSelect,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
} from '@mui/material'
import { Page } from 'components'
import { User, Subscription, Project } from 'lib/types'
import { getProjects, getSubscriptions, getUser } from 'lib/db'
import { formatAmount } from 'lib/format'

export interface Data {
  user?: User
  projects: Project[]
  subscriptions: Subscription[]
}

function createSubscription(amount: number, project: number, isPublic: boolean) {
  try {
    return fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: Number(amount), project, isPublic }),
    }).then((r) => r.json())
  } catch (error) {
    console.error(error)
  }
}
function updateSubscription(id: number, amount: number) {
  try {
    return fetch(`/api/subscriptions/${id}`, {
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
    return fetch(`/api/subscriptions/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error(error)
  }
}

const Executions = ({ executions }: { executions: any[] }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="right">Date</TableCell>
            <TableCell align="right">Sats</TableCell>
            <TableCell align="right">Fiat</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {executions.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {typeof row.timestamp === 'string'
                  ? new Intl.DateTimeFormat('en-US').format(new Date(row.timestamp))
                  : new Intl.DateTimeFormat('en-US').format(row.timestamp)}
              </TableCell>
              <TableCell align="right">{row.amount}</TableCell>
              <TableCell align="right">
                {row.amountFiat} {row.currency}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const Subscription = ({ s, setSubscriptions }: { s: Subscription; setSubscriptions: any }) => {
  const executions = s.executions
  const totalSats = useMemo(
    () => executions.reduce((acc: number, e: any) => acc + e.amount, 0),
    [executions]
  )
  const totalFiat = useMemo(
    () => executions.reduce((acc: number, e: any) => acc + e.amountFiat, 0),
    [executions]
  )

  async function unsub() {
    try {
      await deleteSubscription(s.id)
      // @ts-ignore
      setSubscriptions((subscriptions) => subscriptions.filter((sub) => sub.id !== s.id))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Paper style={{ padding: '12px' }}>
      {s.project && (
        <>
          <Typography variant="h3">
            <Image width="50px" height="30px" src={s.project.image} alt={s.project.name} />

            {s.project.name}
          </Typography>
          <Typography>{s.project.description}</Typography>
        </>
      )}
      <Stack
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
        mt={4}
      >
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Monthly</Typography>
          <Typography fontSize="1.5rem">{formatAmount(s.amount)} ϟ</Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Total</Typography>
          <Typography fontSize="1.5rem">{formatAmount(totalSats)} ϟ</Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography variant="h4">Fiat</Typography>
          <Typography fontSize="1.5rem">
            {totalFiat} {s.executions[0]?.currency || 'USD'}
          </Typography>
        </Stack>
      </Stack>
      <Executions {...s} />
      <Button color="error" onClick={unsub}>
        Unsubscribe
      </Button>
    </Paper>
  )
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

function NewSubscription({
  projects,
  ...props
}: {
  projects: Project[]
  subscriptions: Subscription[]
  setSubscriptions: any
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { subscriptions, setSubscriptions } = props
  const [lnurl, setLnurl] = useState()
  const [isPublic, setIsPublic] = useState(true)
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const subProjectIds = subscriptions.map((s) => s.projectId)
  const options = projects.filter((p) => !subProjectIds.includes(p.id))
  const [value, setValue] = useState(options[0]?.id)
  const [sats, setSats] = useState(1000)

  useEffect(() => {
    if (value) {
      const project = projects.find((p) => p.id === value)
      if (project) {
        fetch(project.lnurl)
          .then((r) => r.json())
          .then((srv) => {
            setLnurl(srv)
            setSats(Math.max(srv.minSendable / 1000, 1000))
          })
          .catch(console.error)
      }
    }
  }, [value, projects])

  async function subscribe() {
    try {
      setIsLoading(true)
      const sub = await createSubscription(sats, value, isPublic)
      setIsLoading(false)
      setSubscriptions(subscriptions.concat([sub]))
      setOpen(false)
      setSats(1000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box mb={2}>
      <Button disabled={projects.length === subscriptions.length} onClick={handleOpen}>
        New
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <FormControl fullWidth>
            <InputLabel variant="standard" htmlFor="uncontrolled-native">
              Project
            </InputLabel>
            <NativeSelect
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              inputProps={{
                name: 'project',
                id: 'uncontrolled-native',
              }}
            >
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
            <Typography variant="h4" mt={2} mb={2}>
              Amount
            </Typography>
            {lnurl && (
              <>
                <Slider
                  aria-label="Sats"
                  defaultValue={1000}
                  onChange={(e) => {
                    // @ts-ignore
                    if (e.target.value >= 1000) setSats(e.target.value)
                  }}
                  value={sats}
                  step={1000}
                  min={1000}
                  // @ts-ignore
                  max={Math.min(lnurl.maxSendable / 1000, 100000)}
                />
                <Input
                  value={sats}
                  size="small"
                  onChange={(e) => {
                    setSats(Number(e.target.value))
                  }}
                  inputProps={{
                    step: 100,
                    min: 1000,
                    // @ts-ignore
                    max: Math.min(lnurl.maxSendable / 1000, 100000),
                    type: 'number',
                    'aria-labelledby': 'input-slider',
                  }}
                />
              </>
            )}
            <Box mt={2}>
              <Typography variant="h4" textAlign="center" style={{ fontFeatureSettings: '"tnum"' }}>
                {formatAmount(sats)}
              </Typography>
              <Typography textAlign="center">sats/month</Typography>
            </Box>
          </FormControl>
          <Box mt={2}>
            <LoadingButton loading={isLoading} onClick={subscribe}>
              Subscribe
            </LoadingButton>
            <Button color="error" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

const Susbscriptions: NextPage<Data> = ({ user, projects, ...props }) => {
  const [subscriptions, setSubscriptions] = useState(props.subscriptions)

  return (
    <>
      <Head>
        <title>Subscriptions {user && `- ${user.handle}`}</title>
      </Head>
      <Page>
        <main>
          <Stack>
            <Typography variant="h2">{user?.handle}</Typography>
          </Stack>
          <NewSubscription
            projects={projects}
            subscriptions={subscriptions}
            setSubscriptions={setSubscriptions}
          />
          {subscriptions.map((s) => (
            <Box mb={4} key={s.id}>
              <Subscription s={s} setSubscriptions={setSubscriptions} />
            </Box>
          ))}
        </main>
      </Page>
    </>
  )
}

export default Susbscriptions

// @ts-ignore
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  // @ts-ignore
  const authorId = session?.user?.id
  let user = undefined
  let subscriptions = []
  if (authorId) {
    user = await getUser(authorId)
    subscriptions = await getSubscriptions(authorId, { project: true, executions: true })
  } else {
    return {
      redirect: {
        destination: '/',
      },
    }
  }
  const projects = await getProjects()
  return { props: { user, projects, subscriptions } }
}
