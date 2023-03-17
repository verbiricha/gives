import { Box, Typography } from '@mui/material'
import { StrikeLogo } from 'components/Icons'

export const Footer = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ m: 4, color: 'text.disabled' }}
    >
      <Typography variant="body2" align="center" mr={0.5}>
        Powered by
      </Typography>
      <StrikeLogo />
    </Box>
  )
}
