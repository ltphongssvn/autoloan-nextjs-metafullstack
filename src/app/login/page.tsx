// autoloan-nextjs-metafullstack/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await authService.login({ email, password });
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
          <Typography variant="h6" sx={{ mb: 3 }}>
            Welcome back
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 1 }}
            />
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </Link>
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Don&apos;t have an account?{' '}
              <Link component="button" onClick={() => router.push('/signup')}>
                Sign up
              </Link>
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => router.push('/')}
            >
              Back to home
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
