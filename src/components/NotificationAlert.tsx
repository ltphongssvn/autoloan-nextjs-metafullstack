// autoloan-nextjs-metafullstack/src/components/NotificationAlert.tsx
'use client';


import { Alert, Snackbar } from '@mui/material';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationAlertProps {
  message: string;
  severity?: AlertSeverity;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

export default function NotificationAlert({
  message, severity = 'info', open, onClose, autoHideDuration = 5000,
}: NotificationAlertProps) {
  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
