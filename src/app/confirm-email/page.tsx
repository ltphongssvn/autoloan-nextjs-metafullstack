// autoloan-nextjs-metafullstack/src/app/confirm-email/page.tsx
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Paper, CircularProgress, Alert, Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { apiFetch } from '@/services/api';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirmToken = searchParams.get('confirmation_token');
  const hasAttemptedRef = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    confirmToken ? 'loading' : 'error'
  );
  const [message, setMessage] = useState(() =>
    confirmToken ? '' : 'Invalid confirmation link. Please check your email for the correct link.'
  );

  useEffect(() => {
    if (hasAttemptedRef.current || !confirmToken) return;
    hasAttemptedRef.current = true;

    const confirmEmail = async () => {
      try {
        await apiFetch(`/auth/confirmation?confirmation_token=${confirmToken}`, { method: 'GET' });
        setStatus('success');
        setMessage('Your email has been confirmed successfully! You can now log in.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Email confirmation failed. The link may have expired.');
      }
    };

    confirmEmail();
  }, [confirmToken]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h5">Confirming your email...</Typography>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>Email Confirmed!</Typography>
              <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>
              <Button variant="contained" onClick={() => router.push('/login')} sx={{ mt: 3 }}>Go to Login</Button>
            </>
          )}
          {status === 'error' && (
            <>
              <ErrorIcon color="error" sx={{ fontSize: 60 }} />
              <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>Confirmation Failed</Typography>
              <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>
              <Button variant="contained" onClick={() => router.push('/login')} sx={{ mt: 3 }}>Go to Login</Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
