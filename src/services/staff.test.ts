// autoloan-nextjs-metafullstack/src/services/staff.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  apiFetch: vi.fn(),
}));

import { loanOfficerService, underwriterService } from './staff';
import { apiFetch } from './api';

const mockApiFetch = vi.mocked(apiFetch);

beforeEach(() => vi.resetAllMocks());

describe('loanOfficerService', () => {
  it('listApplications', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: [{ id: 1 }] }, headers: new Headers() });
    const result = await loanOfficerService.listApplications();
    expect(result).toEqual([{ id: 1 }]);
    expect(mockApiFetch).toHaveBeenCalledWith('/loan_officer/applications');
  });

  it('getNotes', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: [{ id: 1, note: 'test' }] }, headers: new Headers() });
    const result = await loanOfficerService.getNotes(5);
    expect(result).toEqual([{ id: 1, note: 'test' }]);
    expect(mockApiFetch).toHaveBeenCalledWith('/loan_officer/applications/5/notes');
  });

  it('addNote with default internal=true', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await loanOfficerService.addNote(5, 'hello');
    expect(mockApiFetch).toHaveBeenCalledWith('/loan_officer/applications/5/add_note', {
      method: 'POST',
      body: JSON.stringify({ note: { note: 'hello', internal: true } }),
    });
  });

  it('addNote with internal=false', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await loanOfficerService.addNote(5, 'hello', false);
    expect(mockApiFetch).toHaveBeenCalledWith('/loan_officer/applications/5/add_note', {
      method: 'POST',
      body: JSON.stringify({ note: { note: 'hello', internal: false } }),
    });
  });

  it('startVerification', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { id: 5, status: 'pending' } }, headers: new Headers() });
    const result = await loanOfficerService.startVerification(5);
    expect(result).toEqual({ id: 5, status: 'pending' });
  });

  it('forwardToUnderwriter', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { id: 5, status: 'under_review' } }, headers: new Headers() });
    const result = await loanOfficerService.forwardToUnderwriter(5);
    expect(result).toEqual({ id: 5, status: 'under_review' });
  });

  it('requestDocuments', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await loanOfficerService.requestDocuments(5, [{ doc_type: 'bank_statement', note: 'need it' }], 'please');
    expect(mockApiFetch).toHaveBeenCalledWith('/loan_officer/applications/5/request_documents', {
      method: 'POST',
      body: JSON.stringify({ document_requests: [{ doc_type: 'bank_statement', note: 'need it' }], notes: 'please' }),
    });
  });
});

describe('underwriterService', () => {
  it('listApplications', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: [{ id: 2 }] }, headers: new Headers() });
    const result = await underwriterService.listApplications();
    expect(result).toEqual([{ id: 2 }]);
    expect(mockApiFetch).toHaveBeenCalledWith('/underwriter/applications');
  });

  it('getNotes', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: [{ id: 1, note: 'uw note' }] }, headers: new Headers() });
    const result = await underwriterService.getNotes(3);
    expect(result).toEqual([{ id: 1, note: 'uw note' }]);
  });

  it('approve', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await underwriterService.approve(3, {
      loan_term: 48, interest_rate: 6.9, monthly_payment: '500.00',
      decision_notes: 'ok', approval_conditions: 'standard',
    });
    expect(mockApiFetch).toHaveBeenCalledWith('/underwriter/applications/3/approve', expect.objectContaining({ method: 'POST' }));
  });

  it('reject', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await underwriterService.reject(3, 'DTI too high', 'declined');
    expect(mockApiFetch).toHaveBeenCalledWith('/underwriter/applications/3/reject', {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: 'DTI too high', decision_notes: 'declined' }),
    });
  });

  it('requestDocuments', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });
    await underwriterService.requestDocuments(3, ['proof_of_income'], 'need docs');
    expect(mockApiFetch).toHaveBeenCalledWith('/underwriter/applications/3/request_documents', {
      method: 'POST',
      body: JSON.stringify({ documents: ['proof_of_income'], notes: 'need docs' }),
    });
  });
});
