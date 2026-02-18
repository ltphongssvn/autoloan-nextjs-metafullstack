// autoloan-nextjs-metafullstack/src/app/dashboard/applications/[id]/status/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent,
  Stepper, Step, StepLabel, Alert, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { applicationsService } from '@/services/applications';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application, LoanDocument } from '@/types';

const STATUS_STEPS = ['Draft', 'Submitted', 'Pending', 'Under Review', 'Decision'];
const STATUS_TO_STEP: Record<string, number> = {
  draft: 0, submitted: 1, pending: 2, pending_documents: 2, under_review: 3, approved: 4, rejected: 4,
};
const DOC_TYPES = [
  { key: 'drivers_license', label: "Driver's License" },
  { key: 'proof_income', label: 'Proof of Income' },
  { key: 'proof_address', label: 'Proof of Residence' },
];

type DocWithMeta = LoanDocument & { file_attached?: boolean; download_url?: string; file_name?: string };

function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'pending_documents' || status === 'pending') return 'warning';
  if (status === 'submitted') return 'info';
  if (status === 'under_review') return 'secondary';
  return 'default';
}

function getStatusDescription(status: string): string {
  const map: Record<string, string> = {
    submitted: 'Your application has been submitted and is waiting to be processed.',
    pending: 'Intake started. Staff is verifying your initial documents.',
    pending_documents: 'Additional documents are required to continue processing.',
    under_review: 'Your application is under full underwriting review.',
    approved: 'Congratulations! Your loan has been approved.',
    rejected: 'Unfortunately, your application was not approved.',
  };
  return map[status] || '';
}

function ApplicationStatusContent({ id }: { id: number }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const app = await applicationsService.get(id);
        setApplication(app);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!application) return;
    const loadDocs = async () => {
      try {
        const docs = await applicationsService.listDocuments(application.id);
        setDocuments(docs as DocWithMeta[]);
      } catch {
        // ignore doc load errors
      } finally {
        setDocsLoading(false);
      }
    };
    loadDocs();
  }, [application]);

  const handleUploadClick = (docType: string) => {
    setUploadingDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocType || !application) return;
    setUploading(true);
    try {
      await applicationsService.uploadDocument(application.id, file, uploadingDocType);
      const docs = await applicationsService.listDocuments(application.id);
      setDocuments(docs as DocWithMeta[]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      setUploadingDocType(null);
      e.target.value = '';
    }
  };

  const getDocForType = (docType: string) => {
    const docsOfType = documents
      .filter((d) => d.doc_type === docType && d.status !== 'requested')
      .sort((a, b) => b.id - a.id);
    return docsOfType.find((d) => d.file_attached) || docsOfType[0];
  };

  if (loading) return <LoadingSpinner message="Loading application..." />;
  if (error && !application) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!application) return null;

  const car = (application.car_details as Record<string, string>) || {};
  const loan = (application.loan_details as Record<string, string>) || {};
  const loanAmount = Number(loan.amount || 0);
  const term = application.loan_term || 48;
  const monthly = application.monthly_payment || 0;
  const lastUpdated = application.updated_at || application.created_at;
  const currentStepIndex = STATUS_TO_STEP[application.status] ?? 0;
  const requestedDocs = documents.filter((d) => d.status === 'requested');
  const getAppId = () => application.application_number || `#APP-${application.id.toString().padStart(4, '0')}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Typography variant="h5" fontWeight={700}>Application Status</Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" gutterBottom>Application {getAppId()}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={currentStepIndex} alternativeLabel>
              {STATUS_STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Current Status</Typography>
                <Chip label={application.status.replace(/_/g, ' ').toUpperCase()} color={getStatusColor(application.status)} sx={{ mt: 0.5 }} />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1">{new Date(lastUpdated).toLocaleDateString()}</Typography>
              </Box>
            </Box>
            {getStatusDescription(application.status) && (
              <Alert severity="info" sx={{ mt: 2 }}>{getStatusDescription(application.status)}</Alert>
            )}
          </CardContent>
        </Card>

        {application.status === 'pending_documents' && requestedDocs.length > 0 && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            <Typography fontWeight={600}>Action Required</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Additional documents have been requested.</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {requestedDocs.map((doc) => (
                <Button key={doc.id} size="small" variant="outlined" startIcon={<UploadFileIcon />}
                  onClick={() => handleUploadClick(doc.doc_type)} disabled={uploading}>
                  {uploading && uploadingDocType === doc.doc_type ? 'Uploading...' : `Upload ${doc.doc_type.replace(/_/g, ' ')}`}
                </Button>
              ))}
            </Box>
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Status History</Typography>
            <List dense>
              {application.submitted_at && (
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Submitted" secondary={new Date(application.submitted_at).toLocaleDateString()} />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary="Draft Created" secondary={new Date(application.created_at).toLocaleDateString()} />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Application Details</Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Vehicle</Typography>
                <Typography>{car.year} {car.make} {car.model}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Loan Amount</Typography>
                <Typography>${loanAmount.toLocaleString()}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Term</Typography>
                <Typography>{term} months</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Monthly Payment</Typography>
                <Typography fontWeight={600}>${Number(monthly).toFixed(2)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Documents</Typography>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
            {docsLoading ? <LinearProgress /> : (
              <List dense>
                {DOC_TYPES.map((dt) => {
                  const doc = getDocForType(dt.key);
                  const isUploaded = !!doc;
                  return (
                    <ListItem key={dt.key} secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {isUploaded && doc?.file_attached && (
                          <Button size="small" startIcon={<RefreshIcon />} onClick={() => handleUploadClick(dt.key)} disabled={uploading}>
                            {uploading && uploadingDocType === dt.key ? '...' : 'Replace'}
                          </Button>
                        )}
                      </Box>
                    }>
                      <ListItemIcon>
                        {isUploaded ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon color="disabled" />}
                      </ListItemIcon>
                      <ListItemText primary={dt.label} secondary={isUploaded ? doc?.file_name : undefined} />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    </Box>
  );
}

export default function ApplicationStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ApplicationStatusContent id={Number(id)} />
    </ProtectedRoute>
  );
}
