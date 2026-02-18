// autoloan-nextjs-metafullstack/src/components/LoadingSpinner.tsx
'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={48} />
      <Typography sx={{ mt: 2 }} color="text.secondary">{message}</Typography>
    </Box>
  );
}
