// autoloan-nextjs-metafullstack/src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
} from '@mui/material';

export default function LandingPage() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState(25000);
  const [loanTerm, setLoanTerm] = useState(48);
  const [apr, setApr] = useState(6.0);

  const calculateMonthlyPayment = () => {
    const monthlyRate = apr / 100 / 12;
    return (
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
      (Math.pow(1 + monthlyRate, loanTerm) - 1)
    );
  };

  const monthlyPayment = calculateMonthlyPayment();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <AppBar position="static" elevation={0} sx={{ background: 'transparent' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Auto Loan
          </Typography>
          <Button
            variant="outlined"
            onClick={() => router.push('/login')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' },
            }}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
        <Box sx={{ textAlign: 'center', color: 'white', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 700, mb: 2, color: 'white' }}
          >
            Get Your Auto Loan in 15 minutes
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, color: 'white' }}>
            Fast online approval with minimal documentation. Drive away in your new car today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/signup')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Apply Now
          </Button>
        </Box>

        <Card sx={{ maxWidth: 500, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Calculate Your Payments
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Loan Amount</Typography>
              <Slider
                value={loanAmount}
                onChange={(_, value) => setLoanAmount(value as number)}
                min={5000}
                max={100000}
                step={1000}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Loan Term (Months)</Typography>
              <Slider
                value={loanTerm}
                onChange={(_, value) => setLoanTerm(value as number)}
                min={12}
                max={84}
                step={12}
                marks
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value} mo`}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Interest Rate (APR)</InputLabel>
              <Select
                value={apr}
                label="Interest Rate (APR)"
                onChange={(e) => setApr(Number(e.target.value))}
              >
                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0].map((rate) => (
                  <MenuItem key={rate} value={rate}>
                    {rate}% APR
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 2,
                borderRadius: 2,
                textAlign: 'center',
                mb: 3,
              }}
            >
              <Typography variant="body2">Your Monthly Payment</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${monthlyPayment.toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => router.push('/signup')}
            >
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
