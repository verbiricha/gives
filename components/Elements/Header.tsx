import { useEffect } from 'react'

import Link from 'next/link'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { Box, Button, Typography } from '@mui/material'

export function Header() {
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signIn() // Force sign in to hopefully resolve error
    }
  }, [session])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!session && (
        <Button variant="outlined" onClick={() => signIn('strike')}>
          Login with Strike
        </Button>
      )}
      {session && (
        <Box mr={2} sx={{ cursor: 'pointer' }}>
          <Link passHref href={`/subscriptions`}>
            <Typography>Subs</Typography>
          </Link>
        </Box>
      )}
      {session && (
        <>
          <Button variant="outlined" onClick={() => signOut()}>
            Sign out
          </Button>
        </>
      )}
    </Box>
  )
}
