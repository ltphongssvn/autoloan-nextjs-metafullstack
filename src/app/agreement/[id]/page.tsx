// autoloan-nextjs-metafullstack/src/app/agreement/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, Grid,
  Checkbox, FormControlLabel, Divider, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/context/AuthContext';
import { applicationsService } from '@/services/applications';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application } from '@/types';

function AgreementContent({ id }: { id: number }) {
  const router = useRouter();
  const { } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadApp = useCallback(async () => {
    try {
      const app = await applicationsService.get(id);
      setApplication(app);
      if (app.signed_at) setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadApp(); }, [loadApp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = 150;
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, [application]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (signed) return;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signed) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return false;
    }
    return true;
  };

  const handleSign = async () => {
    if (!agreed || isCanvasEmpty()) return;
    setSigning(true);
    try {
      const signatureData = canvasRef.current!.toDataURL('image/png');
      await applicationsService.sign(id, signatureData);
      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading agreement..." />;
  if (error && !application) return <Typography color="error" sx={{ m: 4 }}>{error}</Typography>;
  if (!application) return null;

  const personal = (application.personal_info as Record<string, string>) || {};
  const car = (application.car_details as Record<string, string>) || {};
  const loan = (application.loan_details as Record<string, string>) || {};
  const principal = Number(loan.amount || 0) - Number(loan.down_payment || 0);
  const term = application.loan_term || 48;
  const rate = Number(application.interest_rate || 0);
  const monthlyPayment = Number(application.monthly_payment || 0);
  const totalRepayment = monthlyPayment * term;
  const totalInterest = totalRepayment - principal;
  const getAppId = () => application.application_number || `APP-${application.id.toString().padStart(4, '0')}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: '#1a237e', color: 'white', py: 3, px: 4 }}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={700}>Auto Loan Agreement</Typography>
          <Typography variant="body2">Application {getAppId()}</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')} sx={{ mb: 3 }}>Back to Dashboard</Button>

        {signed && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            This agreement has been signed. Thank you!
          </Alert>
        )}

        {error && application && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        {application.status !== 'approved' && !signed && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This application has not been approved yet. Agreement signing is not available.
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>LOAN AGREEMENT</Typography>
            <Typography variant="body2" gutterBottom>
              This Loan Agreement (&quot;Agreement&quot;) is entered into as of {new Date().toLocaleDateString()}, by and between:
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}><strong>Borrower:</strong> {personal.first_name} {personal.last_name}</Typography>
            <Typography variant="body2"><strong>Lender:</strong> AutoLoan Financial Services</Typography>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>1. LOAN DETAILS</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Principal Amount: <strong>${principal.toLocaleString()}</strong></Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Annual Interest Rate: <strong>{rate}%</strong></Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Loan Term: <strong>{term} months</strong></Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Monthly Payment: <strong>${monthlyPayment.toFixed(2)}</strong></Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Total Interest: <strong>${totalInterest.toFixed(2)}</strong></Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="body2">Total Repayment: <strong>${totalRepayment.toFixed(2)}</strong></Typography></Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>2. VEHICLE INFORMATION</Typography>
            <Typography variant="body2">{car.year} {car.make} {car.model} — Valued at ${Number(car.price || 0).toLocaleString()}</Typography>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>3. TERMS AND CONDITIONS</Typography>
            <Typography variant="body2" paragraph>
              The Borrower agrees to repay the principal amount plus interest in equal monthly installments over the loan term.
              Payments are due on the first of each month. Late payments may incur additional fees.
            </Typography>
            <Typography variant="body2" paragraph>
              The vehicle serves as collateral for this loan. Failure to make timely payments may result in repossession.
              The Borrower must maintain comprehensive insurance coverage on the vehicle for the duration of the loan.
            </Typography>
            <Typography variant="body2" paragraph>
              Early repayment is permitted without penalty. The Borrower may prepay the loan in full or make additional
              payments toward the principal at any time.
            </Typography>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>4. BORROWER ACKNOWLEDGEMENT</Typography>
            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={signed} />}
              label="I have read, understand, and agree to the terms and conditions of this loan agreement."
            />
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>SIGNATURE</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Please sign below using your mouse or touchscreen.
            </Typography>
            <Box sx={{ border: 2, borderColor: signed ? 'success.main' : 'grey.300', borderRadius: 1, bgcolor: 'white', mb: 2 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: 150, cursor: signed ? 'default' : 'crosshair', touchAction: 'none' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
            </Box>
            {!signed && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={clearSignature}>Clear Signature</Button>
                <Button variant="contained" color="primary" onClick={handleSign}
                  disabled={!agreed || signing || application.status !== 'approved'}>
                  {signing ? 'Signing...' : 'Sign Agreement'}
                </Button>
              </Box>
            )}
            {signed && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography color="success.main" fontWeight={600}>Signed on {application.signed_at ? new Date(application.signed_at).toLocaleDateString() : new Date().toLocaleDateString()}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute allowedRoles={['applicant']}>
      <AgreementContent id={Number(id)} />
    </ProtectedRoute>
  );
}
