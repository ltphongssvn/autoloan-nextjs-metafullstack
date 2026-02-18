// autoloan-nextjs-metafullstack/src/app/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Card, CardContent, Typography, TextField, Button, Link, Alert } from '@mui/material';
import { authService } from '@/services/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password, passwordConfirmation);
      setSuccess('Password has been reset successfully');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
            Auto Loan
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>Reset Password</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your new password below.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="New Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Confirm Password" type="password" value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)} required sx={{ mb: 3 }} />
            <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ mb: 2 }}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Link component="button" variant="body2" onClick={() => router.push('/login')}>
              Back to login
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
