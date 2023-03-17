import { Stack, Typography } from '@mui/material'

export function Amount({ title, amount }) {
  return (
    <Stack alignItems="center" mr={[0, 0, 12]} mb={[2, 2, 0]}>
      <Typography variant="h4">{title}</Typography>
      <Typography variant="p" fontSize="1.5rem">
        {amount}
      </Typography>
    </Stack>
  )
}
