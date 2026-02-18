// autoloan-nextjs-metafullstack/src/app/underwriter/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Pagination,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { underwriterService } from '@/services/staff';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application } from '@/types';

const ITEMS_PER_PAGE = 10;

interface AppWithMetrics extends Application {
  dti: number;
  ltv: number;
  risk: 'low' | 'medium' | 'high';
  loanAmount: number;
}

function UnderwriterDashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const apps = await underwriterService.listApplications();
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

  const appsWithMetrics: AppWithMetrics[] = useMemo(() => {
    return applications.map((app) => {
      const loan = (app.loan_details as Record<string, string>) || {};
      const car = (app.car_details as Record<string, string>) || {};
      const emp = (app.employment_info as Record<string, string>) || {};
      const loanAmount = Number(loan.amount || 0);
      const downPayment = Number(loan.down_payment || 0);
      const vehiclePrice = Number(car.price || 0);
      const income = Number(emp.income || 0);
      const term = app.loan_term || 48;
      const apr = Number(app.interest_rate || 6.9);
      const monthlyRate = apr / 100 / 12;
      const principal = loanAmount - downPayment;
      const monthlyPayment = principal > 0 && monthlyRate > 0
        ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, term))) / (Math.pow(1 + monthlyRate, term) - 1)
        : 0;
      const dti = income > 0 ? Math.round(((monthlyPayment * 12) / income) * 100) : 0;
      const ltv = vehiclePrice > 0 ? Math.round((principal / vehiclePrice) * 100) : 0;
      let risk: 'low' | 'medium' | 'high' = 'low';
      if (dti > 40 || ltv > 90) risk = 'high';
      else if (dti > 30 || ltv > 80) risk = 'medium';
      return { ...app, dti, ltv, risk, loanAmount };
    });
  }, [applications]);

  const filteredApps = useMemo(() => {
    let result = appsWithMetrics;
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    if (riskFilter !== 'all') result = result.filter((a) => a.risk === riskFilter);
    if (amountFilter === 'under25k') result = result.filter((a) => a.loanAmount < 25000);
    else if (amountFilter === '25k-50k') result = result.filter((a) => a.loanAmount >= 25000 && a.loanAmount <= 50000);
    else if (amountFilter === 'over50k') result = result.filter((a) => a.loanAmount > 50000);
    return result;
  }, [appsWithMetrics, statusFilter, riskFilter, amountFilter]);

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApps.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApps, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, riskFilter, amountFilter]);

  const stats = {
    under_review: applications.filter((a) => a.status === 'under_review').length,
    pending: applications.filter((a) => a.status === 'pending_documents').length,
    completed: applications.filter((a) => {
      if (a.status !== 'approved' && a.status !== 'rejected') return false;
      if (!a.decided_at) return false;
      const d = new Date(a.decided_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const getRiskColor = (risk: string) =>
    risk === 'low' ? 'success.main' : risk === 'medium' ? 'warning.main' : 'error.main';

  if (loading) return <LoadingSpinner message="Loading applications..." />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Underwriter Dashboard</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Welcome, {user?.first_name}</Typography>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, bgcolor: '#e0e7ff' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.under_review}</Typography>
              <Typography fontWeight={600}>Under Review</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: '#fef3c7' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.pending}</Typography>
              <Typography fontWeight={600}>Pending Docs</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: '#d1fae5' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{stats.completed}</Typography>
              <Typography fontWeight={600}>Completed This Month</Typography>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="pending_documents">Pending Docs</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Risk</InputLabel>
              <Select value={riskFilter} label="Risk" onChange={(e) => setRiskFilter(e.target.value)}>
                <MenuItem value="all">All Risk</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="medium">Medium Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Amount</InputLabel>
              <Select value={amountFilter} label="Amount" onChange={(e) => setAmountFilter(e.target.value)}>
                <MenuItem value="all">All Amounts</MenuItem>
                <MenuItem value="under25k">Under $25k</MenuItem>
                <MenuItem value="25k-50k">$25k - $50k</MenuItem>
                <MenuItem value="over50k">Over $50k</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>ID</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>DTI</TableCell>
                <TableCell>LTV</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApps.map((app) => {
                const personal = (app.personal_info as Record<string, string>) || {};
                return (
                  <TableRow key={app.id} hover>
                    <TableCell>{getAppId(app)}</TableCell>
                    <TableCell>{personal.first_name} {personal.last_name}</TableCell>
                    <TableCell>${app.loanAmount.toLocaleString()}</TableCell>
                    <TableCell>{app.dti}%</TableCell>
                    <TableCell>{app.ltv}%</TableCell>
                    <TableCell><FiberManualRecordIcon sx={{ color: getRiskColor(app.risk), fontSize: 16 }} /></TableCell>
                    <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<AnalyticsIcon />}
                        onClick={() => router.push(`/underwriter/applications/${app.id}`)}>
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography variant="body2">Risk:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><FiberManualRecordIcon sx={{ color: '#10b981', fontSize: 14 }} /><Typography variant="body2">Low</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><FiberManualRecordIcon sx={{ color: '#f59e0b', fontSize: 14 }} /><Typography variant="body2">Medium</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><FiberManualRecordIcon sx={{ color: '#ef4444', fontSize: 14 }} /><Typography variant="body2">High</Typography></Box>
        </Box>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={currentPage} onChange={(_, p) => setCurrentPage(p)} color="primary" />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default function UnderwriterDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['underwriter']}>
      <UnderwriterDashboardContent />
    </ProtectedRoute>
  );
}
