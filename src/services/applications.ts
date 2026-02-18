// autoloan-nextjs-metafullstack/src/services/applications.ts
import { apiFetch } from './api';
import type { Application, LoanDocument, ApiResponse, PaginationMeta } from '@/types';

export const applicationsService = {
  async list(page = 1, perPage = 10): Promise<{ data: Application[]; meta: PaginationMeta }> {
    const { data } = await apiFetch<{ data: Application[]; meta: PaginationMeta }>(
      `/applications?page=${page}&per_page=${perPage}`
    );
    return data;
  },

  async get(id: number): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(`/applications/${id}`);
    return data.data;
  },

  async create(applicationData: Partial<Application>): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>('/applications', {
      method: 'POST',
      body: JSON.stringify({ application: applicationData }),
    });
    return data.data;
  },

  async update(id: number, applicationData: Partial<Application>): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ application: applicationData }),
    });
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiFetch(`/applications/${id}`, { method: 'DELETE' });
  },

  async submit(id: number): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(`/applications/${id}/submit`, {
      method: 'POST',
    });
    return data.data;
  },

  async sign(id: number, signatureData: string): Promise<Application> {
    const { data } = await apiFetch<ApiResponse<Application>>(`/applications/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify({ signature_data: signatureData }),
    });
    return data.data;
  },

  async getAgreementPdf(id: number): Promise<Blob> {
    const response = await fetch(`/api/v1/applications/${id}/agreement_pdf`);
    return response.blob();
  },

  // Documents
  async listDocuments(applicationId: number): Promise<LoanDocument[]> {
    const { data } = await apiFetch<ApiResponse<LoanDocument[]>>(
      `/applications/${applicationId}/documents`
    );
    return data.data;
  },

  async uploadDocument(applicationId: number, file: File, docType: string): Promise<LoanDocument> {
    const formData = new FormData();
    formData.append('document[file]', file);
    formData.append('document[doc_type]', docType);

    const response = await fetch(`/api/v1/applications/${applicationId}/documents`, {
      method: 'POST',
      body: formData,
    });
    const json = await response.json();
    return json.data;
  },

  async deleteDocument(applicationId: number, documentId: number): Promise<void> {
    await apiFetch(`/applications/${applicationId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  },
};
