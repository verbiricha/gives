import Link from 'next/link'
import { Box, Typography } from '@mui/material'
import { Header as HeaderComponent } from 'components/Elements/Header'

export const Header = () => {
  return (
    <Box sx={{ display: 'flex', m: 4, justifyContent: 'space-between' }}>
      <Link passHref href="/">
        <Typography sx={{ cursor: 'pointer' }} variant="h3">
          bitcoiner.gives
        </Typography>
      </Link>
      <HeaderComponent />
    </Box>
  )
}
