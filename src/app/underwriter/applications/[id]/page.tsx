// autoloan-nextjs-metafullstack/src/app/underwriter/applications/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Radio, RadioGroup,
  FormControlLabel, Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { applicationsService } from '@/services/applications';
import { underwriterService } from '@/services/staff';
import type { ApplicationNote } from '@/services/staff';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application } from '@/types';

const REJECTION_REASONS = [
  'Debt-to-income ratio too high',
  'Insufficient income',
  'Loan-to-value ratio too high',
  'Employment history insufficient',
  'Unable to verify information',
  'Other',
];
const DOCUMENT_TYPES = [
  { id: 'proof_of_income', label: 'Proof of Income (Pay Stubs)' },
  { id: 'bank_statements', label: 'Bank Statements (Last 3 months)' },
  { id: 'tax_returns', label: 'Tax Returns (Last 2 years)' },
  { id: 'employment_verification', label: 'Employment Verification Letter' },
  { id: 'id_verification', label: 'Government ID' },
  { id: 'proof_of_residence', label: 'Proof of Residence' },
  { id: 'vehicle_info', label: 'Vehicle Purchase Agreement' },
  { id: 'insurance', label: 'Proof of Insurance' },
];

function AnalysisContent({ id }: { id: number }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [loanTerm, setLoanTerm] = useState('48');
  const [interestRate, setInterestRate] = useState('6.9');
  const [rejectReason, setRejectReason] = useState('');
  const [additionalExplanation, setAdditionalExplanation] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [approvalConditions, setApprovalConditions] = useState('Standard terms apply');
  const [officerNotes, setOfficerNotes] = useState<ApplicationNote[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [docsNotes, setDocsNotes] = useState('');

  const loadApp = useCallback(async () => {
    try {
      const app = await applicationsService.get(id);
      setApplication(app);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadOfficerNotes = useCallback(async () => {
    try {
      const notes = await underwriterService.getNotes(id);
      setOfficerNotes(notes);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { loadApp(); loadOfficerNotes(); }, [loadApp, loadOfficerNotes]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ } finally { logout(); router.push('/'); }
  };

  if (loading) return <LoadingSpinner message="Loading application..." />;
  if (error && !application) return <Typography color="error" sx={{ m: 4 }}>{error}</Typography>;
  if (!application) return null;

  const personal = (application.personal_info as Record<string, string>) || {};
  const car = (application.car_details as Record<string, string>) || {};
  const loan = (application.loan_details as Record<string, string>) || {};
  const employment = (application.employment_info as Record<string, string>) || {};
  const loanAmount = Number(loan.amount || 0);
  const downPayment = Number(loan.down_payment || 0);
  const vehiclePrice = Number(car.price || 0);
  const annualIncome = Number(employment.income || 0);
  const principal = loanAmount - downPayment;
  const term = Number(loanTerm);
  const rate = Number(interestRate);
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = principal > 0 && monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
    : 0;
  const totalRepayment = monthlyPayment * term;
  const totalInterest = totalRepayment - principal;
  const dtiRatio = annualIncome > 0 ? Math.round(((monthlyPayment * 12) / annualIncome) * 100) : 0;
  const ltvRatio = vehiclePrice > 0 ? Math.round((principal / vehiclePrice) * 100) : 0;
  const employmentYears = Number(employment.years || 0);
  const dtiPass = dtiRatio < 43;
  const ltvPass = ltvRatio < 90;
  const employmentPass = employmentYears >= 2;
  const incomePass = annualIncome > 0;
  const dob = personal.dob ? new Date(personal.dob) : null;
  const age = dob && !isNaN(dob.getTime()) ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '—';
  const getAppId = () => application.application_number || `#APP-${application.id.toString().padStart(4, '0')}`;

  const handleApprove = async () => {
    await underwriterService.approve(id, {
      loan_term: term, interest_rate: rate, monthly_payment: monthlyPayment.toFixed(2),
      decision_notes: decisionNotes, approval_conditions: approvalConditions,
    });
    setShowApproveModal(false);
    router.push('/underwriter');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const fullReason = additionalExplanation ? `${rejectReason}: ${additionalExplanation}` : rejectReason;
    await underwriterService.reject(id, fullReason, decisionNotes);
    setShowRejectModal(false);
    router.push('/underwriter');
  };

  const handleRequestDocs = async () => {
    if (selectedDocs.length === 0) return;
    await underwriterService.requestDocuments(id, selectedDocs, docsNotes || 'Additional documents required');
    setShowDocsModal(false);
    setSelectedDocs([]);
    setDocsNotes('');
    loadOfficerNotes();
  };

  const handleDocToggle = (docId: string) =>
    setSelectedDocs((prev) => prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]);

  const RiskItem = ({ label, value, target, pass, showBar, percent }: {
    label: string; value: string; target: string; pass: boolean; showBar?: boolean; percent?: number;
  }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{value}</Typography>
          {pass ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} /> : <CancelIcon sx={{ color: 'error.main', fontSize: 18 }} />}
        </Box>
      </Box>
      {showBar && (
        <LinearProgress variant="determinate" value={Math.min(percent || 0, 100)}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: pass ? 'success.main' : 'error.main' } }} />
      )}
      <Typography variant="caption" color="text.secondary">{target}</Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Financial Analysis</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Welcome, {user?.first_name}</Typography>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
          </Box>
        </Box>
      </Box>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/underwriter')} sx={{ mb: 2 }}>Back to Dashboard</Button>
        <Typography variant="h6" gutterBottom>Application {getAppId()} - {application.status.replace(/_/g, ' ').toUpperCase()}</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>RISK ASSESSMENT</Typography>
                <RiskItem label="Debt-to-Income Ratio" value={`${dtiRatio}%`} target="Target: < 43%" pass={dtiPass} showBar percent={dtiRatio} />
                <RiskItem label="Loan-to-Value Ratio" value={`${ltvRatio}%`} target="Target: < 90%" pass={ltvPass} showBar percent={ltvRatio} />
                <RiskItem label="Employment Stability" value={`${employmentYears} years`} target="Target: > 2 years" pass={employmentPass} />
                <RiskItem label="Income Verification" value={`$${annualIncome.toLocaleString()}/yr`} target="Verified" pass={incomePass} />
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>APPLICANT SUMMARY</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography><strong>Name:</strong> {personal.first_name} {personal.last_name}</Typography>
                    <Typography><strong>Age:</strong> {age}</Typography>
                    <Typography><strong>Income:</strong> ${annualIncome.toLocaleString()}/yr</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography><strong>Vehicle:</strong> {car.year} {car.make} {car.model}</Typography>
                    <Typography><strong>Value:</strong> ${vehiclePrice.toLocaleString()}</Typography>
                    <Typography><strong>Down:</strong> ${downPayment.toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            {officerNotes.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>OFFICER NOTES</Typography>
                  {officerNotes.map((n) => (
                    <Box key={n.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2"><em>{new Date(n.created_at).toLocaleDateString()}</em> - {n.note}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ mb: 2, bgcolor: '#e0f2fe' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>LOAN CALCULATION</Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {[
                    ['Principal:', `$${principal.toLocaleString()}`],
                    ['Interest Rate:', `${rate}% APR`],
                    ['Term:', `${term} months`],
                    ['Monthly Payment:', `$${monthlyPayment.toFixed(2)}`],
                    ['Total Interest:', `$${totalInterest.toFixed(2)}`],
                    ['Total Repayment:', `$${totalRepayment.toFixed(2)}`],
                  ].map(([label, val]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: '#fef3c7' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>UNDERWRITER DECISION</Typography>
                <TextField fullWidth size="small" multiline rows={3} label="Decision Notes" value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)} sx={{ mb: 2, bgcolor: 'white' }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => setShowDocsModal(true)} sx={{ flex: 1 }}>Docs</Button>
                  <Button variant="contained" color="error" onClick={() => setShowRejectModal(true)} sx={{ flex: 1 }}>Reject</Button>
                  <Button variant="contained" color="success" onClick={() => setShowApproveModal(true)} sx={{ flex: 1 }}>Approve</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>Application:</strong> {getAppId()}</Typography>
          <Typography gutterBottom><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</Typography>
          <Typography gutterBottom><strong>Loan:</strong> ${principal.toLocaleString()}</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Term</InputLabel>
                <Select value={loanTerm} label="Term" onChange={(e) => setLoanTerm(e.target.value)}>
                  <MenuItem value="36">36 months</MenuItem>
                  <MenuItem value="48">48 months</MenuItem>
                  <MenuItem value="60">60 months</MenuItem>
                  <MenuItem value="72">72 months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="APR %" type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </Grid>
          </Grid>
          <TextField fullWidth size="small" label="Conditions" value={approvalConditions} onChange={(e) => setApprovalConditions(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApproveModal(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove}>Confirm Approval</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>Application:</strong> {getAppId()}</Typography>
          <Typography gutterBottom><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Rejection Reason (required):</Typography>
          <RadioGroup value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
            {REJECTION_REASONS.map((r) => <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={r} />)}
          </RadioGroup>
          <TextField fullWidth size="small" multiline rows={3} label="Additional Explanation" value={additionalExplanation}
            onChange={(e) => setAdditionalExplanation(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>Confirm Rejection</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDocsModal} onClose={() => setShowDocsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Documents</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>Application:</strong> {getAppId()}</Typography>
          <Typography gutterBottom><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Select Documents to Request:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {DOCUMENT_TYPES.map((doc) => (
              <FormControlLabel key={doc.id} control={<Checkbox size="small" checked={selectedDocs.includes(doc.id)} onChange={() => handleDocToggle(doc.id)} />} label={doc.label} />
            ))}
          </Box>
          <TextField fullWidth size="small" multiline rows={2} label="Notes for Applicant" value={docsNotes}
            onChange={(e) => setDocsNotes(e.target.value)} sx={{ mt: 2 }} placeholder="Please provide the requested documents..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDocsModal(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleRequestDocs} disabled={selectedDocs.length === 0}>Request Documents</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function UnderwriterAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute allowedRoles={['underwriter']}>
      <AnalysisContent id={Number(id)} />
    </ProtectedRoute>
  );
}
