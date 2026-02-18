// autoloan-nextjs-metafullstack/src/theme/theme.ts
'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      dark: '#5a67d8',
      light: '#818cf8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      dark: '#5b3a7d',
      light: '#9061c2',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      dark: '#059669',
      light: '#34d399',
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
      light: '#f87171',
    },
    warning: {
      main: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24',
    },
    info: {
      main: '#3b82f6',
      dark: '#2563eb',
      light: '#60a5fa',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '2rem', fontWeight: 700, color: '#1f2937' },
    h2: { fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' },
    h3: { fontSize: '1.25rem', fontWeight: 600, color: '#374151' },
    h4: { fontSize: '1.1rem', fontWeight: 600, color: '#374151' },
    body1: { fontSize: '1rem', color: '#374151' },
    body2: { fontSize: '0.875rem', color: '#6b7280' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '0.75rem 1.5rem' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
      },
    },
    MuiTextField: {
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 20 } } },
  },
});

export default theme;
