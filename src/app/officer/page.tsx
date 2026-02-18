// autoloan-nextjs-metafullstack/src/app/officer/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, TextField,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Tabs, Tab,
  Pagination, InputAdornment,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { loanOfficerService } from '@/services/staff';
import { ProtectedRoute, LoadingSpinner, StatusChip } from '@/components';
import type { Application } from '@/types';

const ITEMS_PER_PAGE = 10;

function OfficerDashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const apps = await loanOfficerService.listApplications();
      setApplications(apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ } finally { logout(); router.push('/'); }
  };

  const getAppId = (app: Application) => app.application_number || `APP-${app.id.toString().padStart(4, '0')}`;

  const statusFiltered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const dateFiltered = useMemo(() => {
    if (dateFilter === 'all') return statusFiltered;
    const cutoff = new Date();
    const adjusters: Record<string, () => void> = {
      today: () => cutoff.setHours(0, 0, 0, 0),
      week: () => cutoff.setDate(cutoff.getDate() - 7),
      month: () => cutoff.setMonth(cutoff.getMonth() - 1),
    };
    adjusters[dateFilter]?.();
    return statusFiltered.filter((a) => new Date(a.created_at) >= cutoff);
  }, [statusFiltered, dateFilter]);

  const searchFiltered = useMemo(() => {
    if (!searchTerm.trim()) return dateFiltered;
    const term = searchTerm.toLowerCase();
    return dateFiltered.filter((a) => {
      const personal = (a.personal_info as Record<string, string>) || {};
      const fullName = `${personal.first_name || ''} ${personal.last_name || ''}`.toLowerCase();
      return fullName.includes(term) || getAppId(a).toLowerCase().includes(term);
    });
  }, [dateFiltered, searchTerm]);

  const totalPages = Math.ceil(searchFiltered.length / ITEMS_PER_PAGE);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchFiltered.slice(start, start + ITEMS_PER_PAGE);
  }, [searchFiltered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filter, dateFilter, searchTerm]);

  const stats = {
    submitted: applications.filter((a) => a.status === 'submitted').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
  };

  if (loading) return <LoadingSpinner message="Loading applications..." />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Officer Dashboard</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Welcome, {user?.first_name}</Typography>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, bgcolor: '#fff3cd' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.under_review}</Typography>
              <Typography fontWeight={600}>Pending Review</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: '#cfe2ff' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.submitted}</Typography>
              <Typography fontWeight={600}>New Applications</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: '#d1e7dd' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.pending}</Typography>
              <Typography fontWeight={600}>Verifying</Typography>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Tabs value={filter} onChange={(_, v) => setFilter(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All" value="all" />
            <Tab label="New" value="submitted" />
            <Tab label="Verifying" value="pending" />
            <Tab label="Under Review" value="under_review" />
            <Tab label="Pending Docs" value="pending_documents" />
          </Tabs>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select value={dateFilter} label="Date Range" onChange={(e) => setDateFilter(e.target.value)}>
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ flex: 1 }} />
          </Box>
        </Card>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>ID</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApps.map((app) => {
                const loan = (app.loan_details as Record<string, string>) || {};
                const personal = (app.personal_info as Record<string, string>) || {};
                return (
                  <TableRow key={app.id} hover>
                    <TableCell>{getAppId(app)}</TableCell>
                    <TableCell>{personal.first_name} {personal.last_name}</TableCell>
                    <TableCell>${Number(loan.amount || 0).toLocaleString()}</TableCell>
                    <TableCell><StatusChip status={app.status} /></TableCell>
                    <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<VisibilityIcon />}
                        onClick={() => router.push(`/officer/applications/${app.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={currentPage} onChange={(_, p) => setCurrentPage(p)} color="primary" />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default function OfficerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['loan_officer']}>
      <OfficerDashboardContent />
    </ProtectedRoute>
  );
}
