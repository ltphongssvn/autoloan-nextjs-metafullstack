// autoloan-nextjs-metafullstack/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '@/context/AuthContext';
import { applicationsService } from '@/services/applications';
import { authService } from '@/services/auth';
import { ProtectedRoute, StatusChip, LoadingSpinner } from '@/components';
import type { Application } from '@/types';

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await applicationsService.list();
      setApplications(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleCreateApplication = async () => {
    try {
      const newApp = await applicationsService.create({ current_step: 1 });
      router.push(`/dashboard/applications/${newApp.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this application?')) return;
    try {
      await applicationsService.delete(id);
      setApplications(applications.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      logout();
      router.push('/');
    }
  };

  const getAppId = (app: Application) =>
    app.application_number || `#APP-${app.id.toString().padStart(4, '0')}`;

  const getVehicleInfo = (app: Application) => {
    const car = (app.car_details as Record<string, string>) || {};
    return car.make && car.model && car.year
      ? `${car.make} ${car.model} ${car.year}`
      : null;
  };

  const getLoanInfo = (app: Application) => {
    const loan = (app.loan_details as Record<string, string>) || {};
    return loan.amount
      ? `$${Number(loan.amount).toLocaleString()} | ${app.loan_term || 48} months`
      : null;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            Customer Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => router.push('/dashboard/settings')}
            >
              Settings
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Welcome back, {user?.first_name || 'User'}!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              My Applications
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateApplication}>
              New Application
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <LoadingSpinner message="Loading applications..." />
        ) : applications.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                No applications found
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Start your first loan application today!
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateApplication}>
                Create Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {applications.map((app) => {
              const isDraft = app.status === 'draft';
              return (
                <Grid size={{ xs: 12, md: 6 }} key={app.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {getAppId(app)}
                        </Typography>
                        <StatusChip status={app.status} />
                      </Box>
                      {getVehicleInfo(app) && (
                        <Typography variant="body2" color="text.secondary">
                          {getVehicleInfo(app)}
                        </Typography>
                      )}
                      {getLoanInfo(app) && (
                        <Typography variant="body2" color="text.secondary">
                          {getLoanInfo(app)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {isDraft
                          ? `Last saved: ${new Date(app.updated_at).toLocaleDateString()}`
                          : `Created: ${new Date(app.created_at).toLocaleDateString()}`}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      {isDraft && (
                        <IconButton color="error" size="small" onClick={() => handleDelete(app.id)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                      >
                        View
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
