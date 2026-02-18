// autoloan-nextjs-metafullstack/src/app/dashboard/settings/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ProtectedRoute } from '@/components';

function SettingsContent() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Account Settings
          </Typography>
        </Box>
      </Box>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-factor authentication and security options will be available here.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
