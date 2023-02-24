import { useState, useEffect, useMemo } from 'react'
import type { NextPage, GetServerSideProps } from 'next'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import {
  Box,
  Slider,
  Button,
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
import { Page } from '../components'
import { Amount, AccountData } from '../components'
import { getProjects } from './api/projects'
import { getSubscriptions } from './api/subscriptions'
import { PageResults, Invoice } from 'lib/strike-api'

export interface Data {
  user?: any
  subscriptions: any[]
}

const intl = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatAmount(n: number) {
  if (n < 2e3) {
    return n
  } else if (n < 1e6) {
    return `${intl.format(n / 1e3)}K`
  } else {
    return `${intl.format(n / 1e6)}M`
  }
}

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

const Executions = ({ executions }) => {
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
                {row.timestamp}
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

const Subscription = (s) => {
  const executions = s.executions
  const totalSats = useMemo(() => executions.reduce((acc, e) => acc + e.amount, 0), [executions])
  const totalFiat = useMemo(
    () => executions.reduce((acc, e) => acc + e.amountFiat, 0),
    [executions]
  )

  async function unsub() {
    try {
      await deleteSubscription(s.id)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Paper style={{ padding: '12px' }}>
      <Typography variant="h3">{s.project.name}</Typography>
      <Typography variant="p">{s.project.description}</Typography>
      <Stack
        alignItems="center"
        justifyContent="space-around"
        direction={['column', 'column', 'row']}
        mt={4}
      >
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Monthly</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {s.amount} ϟ
          </Typography>
        </Stack>
        <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
          <Typography variant="h4">Total</Typography>
          <Typography variant="p" fontSize="1.5rem">
            {totalSats} ϟ
          </Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography variant="h4">Fiat</Typography>
          <Typography variant="p" fontSize="1.5rem">
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

function NewSubscription({ projects, subscriptions }) {
  const [lnurl, setLnurl] = useState()
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const subProjectIds = subscriptions.map((s) => s.projectId)
  const options = projects.filter((p) => !subProjectIds.includes(p.id))
  const [value, setValue] = useState(options[0]?.id)
  const [sats, setSats] = useState(0)

  useEffect(() => {
    if (value) {
      const project = projects.find((p) => p.id === value)
      fetch(project.lnurl)
        .then((r) => r.json())
        .then((srv) => {
          setLnurl(srv)
          setSats(srv.minSendable / 1000)
        })
        .catch(console.error)
    }
  }, [value])

  async function subscribe() {
    try {
      await createSubscription(sats, value)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Button onClick={handleOpen}>New</Button>
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
              onChange={(e) => setValue(e.target.value)}
              inputProps={{
                name: 'project',
                id: 'uncontrolled-native',
              }}
            >
              {options.map((p) => (
                <option value={p.id}>{p.name}</option>
              ))}
            </NativeSelect>
            <Typography variant="h4" mt={2} mb={2}>
              Amount
            </Typography>
            {lnurl && (
              <>
                <Slider
                  aria-label="Sats"
                  value={sats}
                  getAriaValueText={formatAmount}
                  onChange={(e) => setSats(e.target.value)}
                  valueLabelDisplay="auto"
                  step={1000}
                  min={lnurl.minSendable / 1000}
                  max={lnurl.maxSendable / 1000}
                />
              </>
            )}
            <Typography
              fontSize="3rem"
              textAlign="center"
              style={{ fontFeatureSettings: '"tnum"' }}
              variant="p"
            >
              {formatAmount(sats)}
            </Typography>
            <Typography textAlign="center" variant="p">
              sats/month
            </Typography>
          </FormControl>
          <Button onClick={subscribe}>Subscribe</Button>
        </Box>
      </Modal>
    </>
  )
}

const Susbscriptions: NextPage<Data> = ({ projects, subscriptions }) => {
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
      <main>
        {subscriptions.map((s) => (
          <Subscription {...s} />
        ))}
        <NewSubscription projects={projects} subscriptions={subscriptions} />
      </main>
    </Page>
  )
}

export default Susbscriptions

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  const user = session?.user
  const authorId = user?.id
  let subscriptions = []
  if (authorId) {
    subscriptions = await getSubscriptions(authorId, { project: true, executions: true })
  } else {
    return {
      redirect: {
        destination: '/',
      },
    }
  }
  const projects = await getProjects()
  return { props: { projects, subscriptions } }
}
