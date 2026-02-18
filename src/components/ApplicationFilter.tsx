// autoloan-nextjs-metafullstack/src/components/ApplicationFilter.tsx
'use client';

import { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface FilterProps {
  onFilterChange: (filter: string) => void;
  onOrderChange: (order: string) => void;
}

export default function ApplicationFilter({ onFilterChange, onOrderChange }: FilterProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [orderBy, setOrderBy] = useState('created_at desc');

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange(value ? `status eq '${value}'` : '');
  };

  const handleOrderChange = (value: string) => {
    setOrderBy(value);
    onOrderChange(value);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Status</InputLabel>
        <Select value={statusFilter} label="Status" onChange={(e) => handleStatusChange(e.target.value)}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="submitted">Submitted</MenuItem>
          <MenuItem value="under_review">Under Review</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
          <MenuItem value="signed">Signed</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Sort By</InputLabel>
        <Select value={orderBy} label="Sort By" onChange={(e) => handleOrderChange(e.target.value)}>
          <MenuItem value="created_at desc">Newest First</MenuItem>
          <MenuItem value="created_at asc">Oldest First</MenuItem>
          <MenuItem value="updated_at desc">Recently Updated</MenuItem>
          <MenuItem value="status asc">Status (A-Z)</MenuItem>
          <MenuItem value="status desc">Status (Z-A)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
