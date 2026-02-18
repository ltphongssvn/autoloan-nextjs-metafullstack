// autoloan-nextjs-metafullstack/src/app/dashboard/applications/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Card, CardContent, TextField,
  Select, MenuItem, FormControl, InputLabel, Stepper, Step, StepLabel,
  Grid, Radio, RadioGroup, FormControlLabel, Checkbox, Alert, Divider, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import { applicationsService } from '@/services/applications';
import { ProtectedRoute, LoadingSpinner } from '@/components';
import type { Application } from '@/types';
import type { ChangeEvent } from 'react';

const LOAN_TERMS = [
  { months: 36, apr: 6.5 },
  { months: 48, apr: 6.9 },
  { months: 60, apr: 7.2 },
];
const VEHICLE_MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen'];
const VEHICLE_YEARS = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function ApplicationStepperContent({ id }: { id: number }) {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<Record<string, string>>({});
  const [carDetails, setCarDetails] = useState<Record<string, string>>({});
  const [loanDetails, setLoanDetails] = useState<Record<string, string>>({});
  const [employmentInfo, setEmploymentInfo] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(48);
  const [documents, setDocuments] = useState({ drivers_license: false, proof_income: false, proof_residence: false });

  useEffect(() => {
    const load = async () => {
      try {
        const app = await applicationsService.get(id);
        setApplication(app);
        setStep(app.current_step || 1);
        setPersonalInfo((app.personal_info as Record<string, string>) || {});
        setCarDetails((app.car_details as Record<string, string>) || {});
        setLoanDetails((app.loan_details as Record<string, string>) || {});
        setEmploymentInfo((app.employment_info as Record<string, string>) || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const steps = ['Personal Info', 'Car Details', 'Loan Details', 'Employment', 'Review'];
  const vehicleValue = Number(carDetails.price || 0);
  const loanAmount = Number(loanDetails.amount || 0);
  const downPayment = Number(loanDetails.down_payment || 0);
  const principal = loanAmount - downPayment;
  const ltv = vehicleValue > 0 ? Math.round((principal / vehicleValue) * 100) : 0;
  const totalIncome = Number(employmentInfo.income || 0) + Number(employmentInfo.other_income || 0);

  const calculatePayment = (term: number, apr: number) => {
    if (principal <= 0) return 0;
    const monthlyRate = apr / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  };

  const selectedTermData = LOAN_TERMS.find((t) => t.months === selectedTerm) || LOAN_TERMS[1];
  const monthlyPayment = calculatePayment(selectedTerm, selectedTermData.apr);
  const dti = totalIncome > 0 ? Math.round((monthlyPayment / totalIncome) * 100) : 0;

  const handleSave = async () => {
    if (!application) return;
    setSaving(true);
    try {
      const updated = await applicationsService.update(application.id, {
        current_step: step, personal_info: personalInfo,
        car_details: carDetails, loan_details: loanDetails, employment_info: employmentInfo,
      });
      setApplication(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    if (step < 5) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) { setError('Please accept terms'); return; }
    if (!application) return;
    await handleSave();
    try {
      await applicationsService.submit(application.id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
      setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

  if (loading) return <LoadingSpinner message="Loading application..." />;
  if (error && !application) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, px: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')}>Back</Button>
          <Typography variant="h5" fontWeight={700}>Application</Typography>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {step === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="First Name" name="first_name" value={personalInfo.first_name || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Last Name" name="last_name" value={personalInfo.last_name || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Date of Birth" name="dob" type="date" InputLabelProps={{ shrink: true }} value={personalInfo.dob || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="SSN" name="ssn" type="password" value={personalInfo.ssn || ''} onChange={handleChange(setPersonalInfo)} placeholder="XXX-XX-XXXX" /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Street Address" name="address" value={personalInfo.address || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 5 }}><TextField fullWidth label="City" name="city" value={personalInfo.city || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth><InputLabel>State</InputLabel>
                      <Select name="state" value={personalInfo.state || ''} label="State" onChange={(e) => setPersonalInfo((p) => ({ ...p, state: e.target.value }))}>
                        {US_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="ZIP" name="zip" value={personalInfo.zip || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Phone" name="phone" value={personalInfo.phone || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Email" name="email" type="email" value={personalInfo.email || ''} onChange={handleChange(setPersonalInfo)} /></Grid>
                </Grid>
              </Box>
            )}
            {step === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth><InputLabel>Make</InputLabel>
                      <Select name="make" value={carDetails.make || ''} label="Make" onChange={(e) => setCarDetails((p) => ({ ...p, make: e.target.value }))}>
                        {VEHICLE_MAKES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Trim Level" name="trim" value={carDetails.trim || ''} onChange={handleChange(setCarDetails)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth><InputLabel>Year</InputLabel>
                      <Select name="year" value={carDetails.year || ''} label="Year" onChange={(e) => setCarDetails((p) => ({ ...p, year: e.target.value }))}>
                        {VEHICLE_YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mileage" name="mileage" type="number" value={carDetails.mileage || ''} onChange={handleChange(setCarDetails)} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="VIN" name="vin" value={carDetails.vin || ''} onChange={handleChange(setCarDetails)} placeholder="17-character VIN" /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Condition</Typography>
                    <RadioGroup row name="condition" value={carDetails.condition || ''} onChange={handleChange(setCarDetails)}>
                      <FormControlLabel value="new" control={<Radio />} label="New" />
                      <FormControlLabel value="used_certified" control={<Radio />} label="Certified Used" />
                      <FormControlLabel value="used" control={<Radio />} label="Used" />
                    </RadioGroup>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Vehicle Value" name="price" type="number" value={carDetails.price || ''} onChange={handleChange(setCarDetails)} InputProps={{ startAdornment: '$' }} /></Grid>
                </Grid>
              </Box>
            )}
            {step === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Loan Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Loan Amount" name="amount" type="number" value={loanDetails.amount || ''} onChange={handleChange(setLoanDetails)} InputProps={{ startAdornment: '$' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Down Payment" name="down_payment" type="number" value={loanDetails.down_payment || ''} onChange={handleChange(setLoanDetails)} InputProps={{ startAdornment: '$' }} /></Grid>
                </Grid>
                <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Loan Summary</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography>Vehicle Value:</Typography><Typography fontWeight={500}>${vehicleValue.toLocaleString()}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography>Down Payment:</Typography><Typography fontWeight={500}>${downPayment.toLocaleString()}</Typography></Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography>Loan Amount:</Typography><Typography fontWeight={600}>${principal.toLocaleString()}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography>Loan-to-Value:</Typography><Typography fontWeight={500} color={ltv > 100 ? 'error.main' : 'success.main'}>{ltv}%</Typography></Box>
                </Paper>
              </Box>
            )}
            {step === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom>Employment & Financial Info</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Employer" name="employer" value={employmentInfo.employer || ''} onChange={handleChange(setEmploymentInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Job Title" name="job_title" value={employmentInfo.job_title || ''} onChange={handleChange(setEmploymentInfo)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Annual Income" name="income" type="number" value={employmentInfo.income || ''} onChange={handleChange(setEmploymentInfo)} InputProps={{ startAdornment: '$' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Monthly Expenses" name="expenses" type="number" value={employmentInfo.expenses || ''} onChange={handleChange(setEmploymentInfo)} InputProps={{ startAdornment: '$' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Other Income" name="other_income" type="number" value={employmentInfo.other_income || ''} onChange={handleChange(setEmploymentInfo)} InputProps={{ startAdornment: '$' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Credit Score" name="credit_score" type="number" value={employmentInfo.credit_score || ''} onChange={handleChange(setEmploymentInfo)} placeholder="300-850" /></Grid>
                </Grid>
                <Alert severity={dti < 43 ? 'success' : 'warning'} sx={{ mt: 2 }}>
                  Debt-to-Income Ratio: {dti}% {dti < 43 ? '(Good)' : '(High)'}
                </Alert>
              </Box>
            )}
            {step === 5 && (
              <Box>
                <Typography variant="h6" gutterBottom>Select Terms & Review</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {LOAN_TERMS.map((term) => {
                    const payment = calculatePayment(term.months, term.apr);
                    return (
                      <Grid size={{ xs: 12, sm: 4 }} key={term.months}>
                        <Card variant={selectedTerm === term.months ? 'elevation' : 'outlined'}
                          sx={{ cursor: 'pointer', border: selectedTerm === term.months ? 2 : 1, borderColor: selectedTerm === term.months ? 'primary.main' : 'divider' }}
                          onClick={() => setSelectedTerm(term.months)}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">{term.months} months</Typography>
                            <Typography variant="h4" color="primary">${payment.toFixed(0)}</Typography>
                            <Typography variant="body2" color="text.secondary">{term.apr}% APR</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Application Summary</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography><strong>Personal:</strong> {personalInfo.first_name} {personalInfo.last_name}</Typography>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setStep(1)}>Edit</Button>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography><strong>Vehicle:</strong> {carDetails.year} {carDetails.make}</Typography>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setStep(2)}>Edit</Button>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography><strong>Loan:</strong> ${principal.toLocaleString()} @ {selectedTermData.apr}% for {selectedTerm} mo</Typography>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setStep(3)}>Edit</Button>
                  </Box>
                  <Divider />
                  <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1, mt: 2, textAlign: 'center' }}>
                    <Typography variant="h5">${monthlyPayment.toFixed(2)}/month</Typography>
                  </Box>
                </Paper>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Required Documents:</Typography>
                  <FormControlLabel control={<Checkbox checked={documents.drivers_license} onChange={(e) => setDocuments((d) => ({ ...d, drivers_license: e.target.checked }))} />} label="Driver's License" />
                  <FormControlLabel control={<Checkbox checked={documents.proof_income} onChange={(e) => setDocuments((d) => ({ ...d, proof_income: e.target.checked }))} />} label="Proof of Income" />
                  <FormControlLabel control={<Checkbox checked={documents.proof_residence} onChange={(e) => setDocuments((d) => ({ ...d, proof_residence: e.target.checked }))} />} label="Proof of Residence" />
                </Box>
                <Alert severity="info" icon={false}>
                  <FormControlLabel control={<Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />} label="I agree to the Terms and Conditions" />
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {step > 1 && <Button variant="outlined" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button variant="outlined" color="warning" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          {step < 5 ? (
            <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext}>Next</Button>
          ) : (
            <Button variant="contained" color="success" endIcon={<SendIcon />} onClick={handleSubmit}>Submit</Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ApplicationStepperContent id={Number(id)} />
    </ProtectedRoute>
  );
}
