// autoloan-nextjs-metafullstack/src/components/MfaSettings.tsx
'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Alert, Card, CardContent, CircularProgress, Divider,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiFetch, getAuthToken } from '@/services/api';

interface MfaStatus {
  mfa_enabled: boolean;
  mfa_configured: boolean;
}

interface MfaSetupResponse {
  provisioning_uri: string;
  qr_code_svg: string;
}

export default function MfaSettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: MfaStatus }>('/auth/mfa/status');
      setStatus(response.data.data);
    } catch {
      setError('Failed to fetch MFA status');
    } finally {
      setLoading(false);
    }
  };

  const setupMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/v1/auth/mfa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) { setSetupData(data.data); }
      else { setError(data.error?.message || data.status?.message || 'Failed to setup MFA'); }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const enableMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/v1/auth/mfa/enable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code: verifyCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('MFA enabled successfully!');
        setSetupData(null);
        setBackupCodes(data.data?.backup_codes || null);
        fetchStatus();
      } else {
        setError(data.error?.message || data.status?.message || 'Invalid verification code');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/v1/auth/mfa/disable', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code: verifyCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('MFA disabled successfully');
        setVerifyCode('');
        fetchStatus();
      } else {
        setError(data.error?.message || data.status?.message || 'Failed to disable MFA');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Two-Factor Authentication</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {backupCodes && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography fontWeight={700} gutterBottom>Save your backup codes:</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, fontFamily: 'monospace', fontSize: 14 }}>
              {backupCodes.map((code, i) => <span key={i}>{code}</span>)}
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>Store these safely. Each can only be used once.</Typography>
          </Alert>
        )}

        {!status && (
          <Button variant="contained" onClick={fetchStatus} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : undefined}>
            {loading ? 'Loading...' : 'Check MFA Status'}
          </Button>
        )}

        {status && !status.mfa_enabled && !setupData && (
          <>
            <Typography sx={{ mb: 2 }}>MFA is not enabled. Enable it for extra security.</Typography>
            <Button variant="contained" color="success" onClick={setupMfa} disabled={loading}>
              {loading ? 'Setting up...' : 'Enable MFA'}
            </Button>
          </>
        )}

        {setupData && (
          <>
            <Typography sx={{ mb: 1 }}>Scan this QR code with your authenticator app:</Typography>
            <Box sx={{ mb: 2 }} dangerouslySetInnerHTML={{ __html: setupData.qr_code_svg }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'break-all' }}>
              Manual entry: {setupData.provisioning_uri}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField size="small" label="6-digit code" value={verifyCode} inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} />
              <Button variant="contained" onClick={enableMfa} disabled={loading || verifyCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </Box>
          </>
        )}

        {status?.mfa_enabled && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon color="success" />
              <Typography color="success.main">MFA is enabled</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField size="small" label="6-digit code to disable" value={verifyCode} inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} />
              <Button variant="contained" color="error" onClick={disableMfa} disabled={loading || verifyCode.length !== 6}>
                {loading ? 'Disabling...' : 'Disable MFA'}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
