// autoloan-nextjs-metafullstack/src/app/officer/applications/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, TextField,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Grid, Checkbox,
  FormControlLabel, Divider, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { applicationsService } from '@/services/applications';
import { loanOfficerService } from '@/services/staff';
import type { ApplicationNote } from '@/services/staff';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application, LoanDocument } from '@/types';

interface VerificationState {
  ageVerified: boolean;
  idMatches: boolean;
  residencyConfirmed: boolean;
  employmentVerified: boolean;
  documentsLegible: boolean;
}

const DOC_TYPES = [
  { id: 'bank_statement', label: 'Bank Statements (3 months)' },
  { id: 'other_tax', label: 'Tax Returns' },
  { id: 'proof_income', label: 'Additional Pay Stubs' },
  { id: 'insurance', label: 'Proof of Insurance' },
  { id: 'vehicle_purchase', label: 'Vehicle Purchase Agreement' },
  { id: 'other', label: 'Other' },
];

function ReviewContent({ id }: { id: number }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [verification, setVerification] = useState<VerificationState>({
    ageVerified: false, idMatches: false, residencyConfirmed: false,
    employmentVerified: false, documentsLegible: false,
  });

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

  const loadNotes = useCallback(async () => {
    try {
      const n = await loanOfficerService.getNotes(id);
      setNotes(n);
    } catch { /* ignore */ }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await applicationsService.listDocuments(id);
      setDocuments(docs);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { loadApp(); loadNotes(); loadDocuments(); }, [loadApp, loadNotes, loadDocuments]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ } finally { logout(); router.push('/'); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    await loanOfficerService.addNote(id, note);
    setNote('');
    loadNotes();
  };

  const handleDeleteDocument = async (docId: number) => {
    await applicationsService.deleteDocument(id, docId);
    loadDocuments();
  };

  const handleDecisionSubmit = async () => {
    if (!selectedAction || !application) return;
    if (selectedAction === 'request_docs') { setShowRequestDocs(true); return; }
    if (decisionNotes.trim()) {
      await loanOfficerService.addNote(id, decisionNotes);
    }
    if (selectedAction === 'start_verification') {
      const updated = await loanOfficerService.startVerification(id);
      setApplication(updated);
    } else if (selectedAction === 'review') {
      const updated = await loanOfficerService.forwardToUnderwriter(id);
      setApplication(updated);
    }
    setSelectedAction('');
    setDecisionNotes('');
    loadNotes();
  };

  const handleSendDocRequest = async () => {
    if (selectedDocs.length === 0) return;
    const documentRequests = selectedDocs.map((docType) => ({
      doc_type: docType === 'other_tax' ? 'other' : docType,
      note: docType === 'other' && otherText ? otherText : requestNotes,
    }));
    await loanOfficerService.requestDocuments(id, documentRequests, requestNotes);
    setShowRequestDocs(false);
    setSelectedDocs([]);
    setOtherText('');
    setRequestNotes('');
    loadDocuments();
  };

  const toggleDoc = (docId: string) =>
    setSelectedDocs((prev) => prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]);

  const formatDocType = (docType: string) =>
    docType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' =>
    status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'warning';

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
  const income = Number(employment.income || 0);
  const term = application.loan_term || 48;
  const apr = Number(application.interest_rate || 6.9);
  const monthlyRate = apr / 100 / 12;
  const principal = loanAmount - downPayment;
  const monthlyPayment = application.monthly_payment
    ? Number(application.monthly_payment)
    : principal > 0 && monthlyRate > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, term))) / (Math.pow(1 + monthlyRate, term) - 1)
      : 0;
  const ltv = vehiclePrice > 0 ? ((principal / vehiclePrice) * 100).toFixed(0) : '0';
  const dti = income > 0 ? (((monthlyPayment * 12) / income) * 100).toFixed(0) : '0';
  const getAppId = () => application.application_number || `#APP-${application.id.toString().padStart(4, '0')}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Review Application</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Welcome, {user?.first_name}</Typography>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/officer')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h6">Application {getAppId()}</Typography>
          <Chip label={application.status.replace(/_/g, ' ').toUpperCase()}
            color={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'warning'} />
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Applicant Info</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 4 }}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{personal.first_name} {personal.last_name}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 4 }}><Typography variant="caption" color="text.secondary">DOB</Typography><Typography>{personal.dob || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 4 }}><Typography variant="caption" color="text.secondary">SSN</Typography><Typography>{personal.ssn ? `***-**-${personal.ssn.slice(-4)}` : '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 4 }}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{personal.phone || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 4 }}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{personal.email || '—'}</Typography></Grid>
                  <Grid size={{ xs: 12, md: 4 }}><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{personal.address}, {personal.city}, {personal.state} {personal.zip}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'info.main' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Vehicle Info</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Make</Typography><Typography>{car.make || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Model</Typography><Typography>{car.model || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Year</Typography><Typography>{car.year || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Value</Typography><Typography>${vehiclePrice.toLocaleString()}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Loan Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography>${loanAmount.toLocaleString()}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">Down</Typography><Typography>${downPayment.toLocaleString()}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">Term</Typography><Typography>{term} mo</Typography></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">APR</Typography><Typography>{apr}%</Typography></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">Monthly</Typography><Typography>${monthlyPayment.toFixed(2)}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 2 }}><Typography variant="caption" color="text.secondary">LTV</Typography><Typography>{ltv}%</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Employment & Financial</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Employer</Typography><Typography>{employment.employer || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Title</Typography><Typography>{employment.job_title || '—'}</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">Income</Typography><Typography>${income.toLocaleString()}/yr</Typography></Grid>
                  <Grid size={{ xs: 6, md: 3 }}><Typography variant="caption" color="text.secondary">DTI</Typography><Typography>{dti}%</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Documents</Typography>
                {documents.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Document</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{formatDocType(doc.doc_type)}</TableCell>
                            <TableCell><Chip label={doc.status} color={getStatusColor(doc.status)} size="small" /></TableCell>
                            <TableCell>
                              {doc.file_url && <IconButton size="small" href={doc.file_url} target="_blank"><VisibilityIcon fontSize="small" /></IconButton>}
                              <IconButton size="small" color="error" onClick={() => handleDeleteDocument(doc.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography color="text.secondary">No documents uploaded yet.</Typography>}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Verification Checklist</Typography>
                {(['ageVerified', 'idMatches', 'residencyConfirmed', 'employmentVerified', 'documentsLegible'] as const).map((key) => (
                  <FormControlLabel key={key} sx={{ display: 'block' }}
                    control={<Checkbox size="small" checked={verification[key]} onChange={(e) => setVerification({ ...verification, [key]: e.target.checked })} />}
                    label={key === 'ageVerified' ? 'Applicant 18+' : key === 'idMatches' ? 'ID matches' : key === 'residencyConfirmed' ? 'Residency confirmed' : key === 'employmentVerified' ? 'Employment verified' : 'Documents legible'} />
                ))}
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Internal Notes</Typography>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Add note..." value={note} onChange={(e) => setNote(e.target.value)} sx={{ mb: 1 }} />
                <Button size="small" variant="outlined" onClick={handleAddNote}>Add Note</Button>
                {notes.length > 0 && <Divider sx={{ my: 2 }} />}
                {notes.map((n) => (
                  <Box key={n.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">{n.note}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleDateString()}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#fef3c7' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Decision Center</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Action</InputLabel>
                  <Select value={selectedAction} label="Action" onChange={(e) => setSelectedAction(e.target.value)}>
                    <MenuItem value="">-- Select --</MenuItem>
                    {application.status === 'submitted' && <MenuItem value="start_verification">Start Verification</MenuItem>}
                    <MenuItem value="request_docs">Request Documents</MenuItem>
                    {(application.status === 'submitted' || application.status === 'pending') && <MenuItem value="review">Forward to Underwriter</MenuItem>}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" multiline rows={2} placeholder="Notes..." value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} sx={{ mb: 2 }} />
                <Button variant="contained" fullWidth disabled={!selectedAction} onClick={handleDecisionSubmit}>Submit Decision</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={showRequestDocs} onClose={() => setShowRequestDocs(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Additional Documents</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>Application {getAppId()}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Select documents to request:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {DOC_TYPES.map((doc) => (
              <Box key={doc.id}>
                <FormControlLabel control={<Checkbox size="small" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />} label={doc.label} />
                {doc.id === 'other' && selectedDocs.includes('other') && (
                  <TextField size="small" fullWidth placeholder="Specify document type..." value={otherText} onChange={(e) => setOtherText(e.target.value)} sx={{ ml: 4, mt: 0.5 }} />
                )}
              </Box>
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Notes to applicant:</Typography>
          <TextField fullWidth multiline rows={3} placeholder="Please provide bank statements..." value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDocs(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendDocRequest}>Send Request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function OfficerApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute allowedRoles={['loan_officer']}>
      <ReviewContent id={Number(id)} />
    </ProtectedRoute>
  );
}
