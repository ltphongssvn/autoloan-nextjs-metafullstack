// autoloan-nextjs-metafullstack/src/components/EmptyState.tsx
'use client';

import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No items found', message = 'There are no items to display.',
  actionLabel, onAction, icon,
}: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box sx={{ mb: 2, color: 'text.secondary' }}>{icon || <InboxIcon sx={{ fontSize: 48 }} />}</Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{message}</Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}
