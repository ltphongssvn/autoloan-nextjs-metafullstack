// autoloan-nextjs-metafullstack/src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, TextField, Button, Link, Alert } from '@mui/material';
import { authService } from '@/services/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess('Password reset instructions sent to your email');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
            Auto Loan
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email and we&apos;ll send you instructions to reset your password.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ mb: 2 }}>
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
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
