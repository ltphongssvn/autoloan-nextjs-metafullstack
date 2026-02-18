// autoloan-nextjs-metafullstack/src/components/StatusChip.tsx
'use client';

import { Chip } from '@mui/material';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  submitted: 'info',
  pending: 'warning',
  under_review: 'secondary',
  pending_documents: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending: 'Pending',
  under_review: 'Under Review',
  pending_documents: 'Pending Documents',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={statusLabels[status] || status}
      color={statusColors[status] || 'default'}
      size="small"
    />
  );
}
