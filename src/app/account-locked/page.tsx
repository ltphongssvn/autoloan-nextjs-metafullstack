// autoloan-nextjs-metafullstack/src/app/account-locked/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Paper, Alert, Button, CircularProgress,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiFetch } from '@/services/api';

export default function AccountLockedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'locked' | 'sending' | 'sent' | 'error'>('locked');
  const [message, setMessage] = useState('');

  const email = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('lockedEmail') || '';
  }, []);

  const handleResendUnlock = async () => {
    if (!email) {
      setStatus('error');
      setMessage('No email address found. Please try logging in again.');
      return;
    }
    setStatus('sending');
    try {
      await apiFetch('/auth/unlock', {
        method: 'POST',
        body: JSON.stringify({ user: { email } }),
      });
      setStatus('sent');
      setMessage('Unlock instructions have been sent to your email.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to send unlock instructions.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {status === 'sent' ? (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>Unlock Email Sent</Typography>
              <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>
              <Button variant="contained" onClick={() => router.push('/login')} sx={{ mt: 3 }}>Back to Login</Button>
            </>
          ) : (
            <>
              <LockIcon color="error" sx={{ fontSize: 60 }} />
              <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>Account Locked</Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Your account has been locked due to too many failed login attempts.
              </Alert>
              {status === 'error' && <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>}
              <Typography sx={{ mt: 3, mb: 2 }}>Click below to receive unlock instructions via email.</Typography>
              <Button variant="contained" color="primary" onClick={handleResendUnlock}
                disabled={status === 'sending'} sx={{ mr: 2 }}>
                {status === 'sending' ? <CircularProgress size={24} color="inherit" /> : 'Send Unlock Instructions'}
              </Button>
              <Button variant="outlined" onClick={() => router.push('/login')}>Back to Login</Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
