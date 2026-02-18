// autoloan-nextjs-metafullstack/src/app/apply/page.tsx
'use client';

import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, TextField,
  Select, MenuItem, FormControl, InputLabel, Stepper, Step, StepLabel,
  Grid, Alert, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/context/AuthContext';
import { applicationsService } from '@/services/applications';
import { ProtectedRoute } from '@/components';

const STEPS = ['Personal Information', 'Employment Details', 'Vehicle Information', 'Loan Details', 'Review & Submit'];

interface FormData {
  first_name: string; last_name: string; email: string; phone: string; dob: string;
  address: string; city: string; state: string; zip: string;
  employer: string; job_title: string; income: string; years_employed: string; employment_type: string;
  make: string; model: string; year: string; price: string; mileage: string; vin: string;
  amount: string; down_payment: string; preferred_term: string;
}

const INITIAL: FormData = {
  first_name: '', last_name: '', email: '', phone: '', dob: '',
  address: '', city: '', state: '', zip: '',
  employer: '', job_title: '', income: '', years_employed: '', employment_type: 'full_time',
  make: '', model: '', year: '', price: '', mileage: '', vin: '',
  amount: '', down_payment: '', preferred_term: '48',
};

function ApplyContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => ({
    ...INITIAL,
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateStep = useCallback((): boolean => {
    if (step === 0) {
      if (!form.first_name || !form.last_name || !form.dob) { setError('Please fill in required fields: name and date of birth.'); return false; }
    } else if (step === 1) {
      if (!form.employer || !form.income) { setError('Please fill in employer and income.'); return false; }
    } else if (step === 2) {
      if (!form.make || !form.model || !form.year || !form.price) { setError('Please fill in vehicle details.'); return false; }
    } else if (step === 3) {
      if (!form.amount || !form.down_payment) { setError('Please fill in loan amount and down payment.'); return false; }
      if (Number(form.down_payment) >= Number(form.amount)) { setError('Down payment must be less than loan amount.'); return false; }
    }
    setError('');
    return true;
  }, [step, form]);

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };
  const handleBack = () => { setError(''); setStep((s) => s - 1); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const app = await applicationsService.create({
        personal_info: { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, dob: form.dob, address: form.address, city: form.city, state: form.state, zip: form.zip },
        employment_info: { employer: form.employer, job_title: form.job_title, income: form.income, years: form.years_employed, employment_type: form.employment_type },
        car_details: { make: form.make, model: form.model, year: form.year, price: form.price, mileage: form.mileage, vin: form.vin },
        loan_details: { amount: form.amount, down_payment: form.down_payment },
      } as never);
      router.push(`/dashboard/applications/${app.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const app = await applicationsService.create({
        personal_info: { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, dob: form.dob, address: form.address, city: form.city, state: form.state, zip: form.zip },
        employment_info: { employer: form.employer, job_title: form.job_title, income: form.income, years: form.years_employed, employment_type: form.employment_type },
        car_details: { make: form.make, model: form.model, year: form.year, price: form.price, mileage: form.mileage, vin: form.vin },
        loan_details: { amount: form.amount, down_payment: form.down_payment },
      } as never);
      await applicationsService.submit(app.id);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 5) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
        <Typography variant="h4" sx={{ mt: 2 }}>Application Submitted!</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Your application has been submitted for review.</Typography>
        <Button variant="contained" onClick={() => router.push('/dashboard')} sx={{ mt: 3 }}>Go to Dashboard</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: '#1a237e', color: 'white', py: 3, px: 4 }}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={700}>Apply for Auto Loan</Typography>
        </Container>
      </Box>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')} sx={{ mb: 3 }}>Back to Dashboard</Button>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent sx={{ p: 3 }}>
            {step === 0 && (
              <>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="First Name" value={form.first_name} onChange={update('first_name')} required /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Last Name" value={form.last_name} onChange={update('last_name')} required /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={update('email')} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone" value={form.phone} onChange={update('phone')} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={update('dob')} required slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Address" value={form.address} onChange={update('address')} /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="City" value={form.city} onChange={update('city')} /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="State" value={form.state} onChange={update('state')} /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="ZIP" value={form.zip} onChange={update('zip')} /></Grid>
                </Grid>
              </>
            )}
            {step === 1 && (
              <>
                <Typography variant="h6" gutterBottom>Employment Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Employer" value={form.employer} onChange={update('employer')} required /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Job Title" value={form.job_title} onChange={update('job_title')} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Annual Income" type="number" value={form.income} onChange={update('income')} required /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Years Employed" type="number" value={form.years_employed} onChange={update('years_employed')} /></Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Employment Type</InputLabel>
                      <Select value={form.employment_type} label="Employment Type" onChange={(e) => setForm((p) => ({ ...p, employment_type: e.target.value }))}>
                        <MenuItem value="full_time">Full Time</MenuItem>
                        <MenuItem value="part_time">Part Time</MenuItem>
                        <MenuItem value="self_employed">Self Employed</MenuItem>
                        <MenuItem value="retired">Retired</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}
            {step === 2 && (
              <>
                <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Make" value={form.make} onChange={update('make')} required /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Model" value={form.model} onChange={update('model')} required /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Year" type="number" value={form.year} onChange={update('year')} required /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Price" type="number" value={form.price} onChange={update('price')} required /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Mileage" type="number" value={form.mileage} onChange={update('mileage')} /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="VIN" value={form.vin} onChange={update('vin')} /></Grid>
                </Grid>
              </>
            )}
            {step === 3 && (
              <>
                <Typography variant="h6" gutterBottom>Loan Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Loan Amount" type="number" value={form.amount} onChange={update('amount')} required /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Down Payment" type="number" value={form.down_payment} onChange={update('down_payment')} required /></Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Preferred Term</InputLabel>
                      <Select value={form.preferred_term} label="Preferred Term" onChange={(e) => setForm((p) => ({ ...p, preferred_term: e.target.value }))}>
                        <MenuItem value="36">36 months</MenuItem>
                        <MenuItem value="48">48 months</MenuItem>
                        <MenuItem value="60">60 months</MenuItem>
                        <MenuItem value="72">72 months</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}
            {step === 4 && (
              <>
                <Typography variant="h6" gutterBottom>Review Your Application</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700}>Personal</Typography>
                <Typography variant="body2">{form.first_name} {form.last_name} — {form.email}</Typography>
                <Typography variant="body2">DOB: {form.dob} | Phone: {form.phone || '—'}</Typography>
                <Typography variant="body2">{form.address} {form.city} {form.state} {form.zip}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700}>Employment</Typography>
                <Typography variant="body2">{form.employer} — {form.job_title || '—'}</Typography>
                <Typography variant="body2">Income: ${Number(form.income).toLocaleString()} | Years: {form.years_employed || '—'}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700}>Vehicle</Typography>
                <Typography variant="body2">{form.year} {form.make} {form.model} — ${Number(form.price).toLocaleString()}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700}>Loan</Typography>
                <Typography variant="body2">Amount: ${Number(form.amount).toLocaleString()} | Down Payment: ${Number(form.down_payment).toLocaleString()}</Typography>
                <Typography variant="body2">Preferred Term: {form.preferred_term} months</Typography>
              </>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack} disabled={step === 0}>Back</Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {step < 4 && (
              <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>Save Draft</Button>
            )}
            {step < 4 ? (
              <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext}>Next</Button>
            ) : (
              <Button variant="contained" color="success" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function ApplyPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <ApplyContent />
    </ProtectedRoute>
  );
}
