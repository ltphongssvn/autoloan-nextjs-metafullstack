// autoloan-nextjs-metafullstack/src/services/staff.ts
import { apiFetch } from './api';
import type { Application, ApiResponse } from '@/types';

export interface ApplicationNote {
  id: number;
  note: string;
  internal: boolean;
  created_at: string;
  user_id: number;
}

// ── Loan Officer ──
export const loanOfficerService = {
  async listApplications(): Promise<Application[]> {
    const { data } = await apiFetch<{ data: Application[] }>('/loan_officer/applications');
    return data.data;
  },

  async getNotes(applicationId: number): Promise<ApplicationNote[]> {
    const { data } = await apiFetch<{ data: ApplicationNote[] }>(
      `/loan_officer/applications/${applicationId}/notes`
    );
    return data.data;
  },

  async addNote(applicationId: number, note: string, internal = true): Promise<void> {
    await apiFetch(`/loan_officer/applications/${applicationId}/add_note`, {
      method: 'POST',
      body: JSON.stringify({ note: { note, internal } }),
    });
  },

  async startVerification(applicationId: number): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(
      `/loan_officer/applications/${applicationId}/start_verification`,
      { method: 'POST' }
    );
    return data.data;
  },

  async forwardToUnderwriter(applicationId: number): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(
      `/loan_officer/applications/${applicationId}/review`,
      { method: 'POST' }
    );
    return data.data;
  },

  async requestDocuments(
    applicationId: number,
    documentRequests: { doc_type: string; note: string }[],
    notes: string
  ): Promise<void> {
    await apiFetch(`/loan_officer/applications/${applicationId}/request_documents`, {
      method: 'POST',
      body: JSON.stringify({ document_requests: documentRequests, notes }),
    });
  },
};

// ── Underwriter ──
export const underwriterService = {
  async listApplications(): Promise<Application[]> {
    const { data } = await apiFetch<{ data: Application[] }>('/underwriter/applications');
    return data.data;
  },

  async getNotes(applicationId: number): Promise<ApplicationNote[]> {
    const { data } = await apiFetch<{ data: ApplicationNote[] }>(
      `/underwriter/applications/${applicationId}/notes`
    );
    return data.data;
  },

  async approve(
    applicationId: number,
    params: {
      loan_term: number;
      interest_rate: number;
      monthly_payment: string;
      decision_notes: string;
      approval_conditions: string;
    }
  ): Promise<void> {
    await apiFetch(`/underwriter/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async reject(
    applicationId: number,
    rejectionReason: string,
    decisionNotes: string
  ): Promise<void> {
    await apiFetch(`/underwriter/applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason, decision_notes: decisionNotes }),
    });
  },

  async requestDocuments(
    applicationId: number,
    documents: string[],
    notes: string
  ): Promise<void> {
    await apiFetch(`/underwriter/applications/${applicationId}/request_documents`, {
      method: 'POST',
      body: JSON.stringify({ documents, notes }),
    });
  },
};
