// autoloan-nextjs-metafullstack/src/services/applications.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  apiFetch: vi.fn(),
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { applicationsService } from './applications';
import { apiFetch } from './api';

const mockApiFetch = vi.mocked(apiFetch);

describe('Applications Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches paginated applications', async () => {
      const mockData = { data: [{ id: 1 }], meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 } };
      mockApiFetch.mockResolvedValueOnce({ data: mockData, headers: new Headers() });

      const result = await applicationsService.list(1, 10);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications?page=1&per_page=10');
      expect(result).toEqual(mockData);
    });

    it('uses default pagination', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: [], meta: {} }, headers: new Headers() });

      await applicationsService.list();

      expect(mockApiFetch).toHaveBeenCalledWith('/applications?page=1&per_page=10');
    });
  });

  describe('get', () => {
    it('fetches single application', async () => {
      const mockApp = { id: 1, status: 'draft' };
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockApp }, headers: new Headers() });

      const result = await applicationsService.get(1);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1');
      expect(result).toEqual(mockApp);
    });
  });

  describe('create', () => {
    it('creates application with POST', async () => {
      const mockApp = { id: 1, status: 'draft' };
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockApp }, headers: new Headers() });

      const result = await applicationsService.create({ current_step: 1 });

      expect(mockApiFetch).toHaveBeenCalledWith('/applications', {
        method: 'POST',
        body: JSON.stringify({ application: { current_step: 1 } }),
      });
      expect(result).toEqual(mockApp);
    });
  });

  describe('update', () => {
    it('updates application with PATCH', async () => {
      const mockApp = { id: 1, status: 'draft', current_step: 2 };
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockApp }, headers: new Headers() });

      const result = await applicationsService.update(1, { current_step: 2 });

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1', {
        method: 'PATCH',
        body: JSON.stringify({ application: { current_step: 2 } }),
      });
      expect(result).toEqual(mockApp);
    });
  });

  describe('delete', () => {
    it('deletes application', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await applicationsService.delete(1);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1', { method: 'DELETE' });
    });
  });

  describe('submit', () => {
    it('submits application', async () => {
      const mockApp = { id: 1, status: 'submitted' };
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockApp }, headers: new Headers() });

      const result = await applicationsService.submit(1);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1/submit', { method: 'POST' });
      expect(result).toEqual(mockApp);
    });
  });

  describe('sign', () => {
    it('signs application with signature data', async () => {
      const mockApp = { id: 1, status: 'approved' };
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockApp }, headers: new Headers() });

      const result = await applicationsService.sign(1, 'sig-base64');

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1/sign', {
        method: 'POST',
        body: JSON.stringify({ signature_data: 'sig-base64' }),
      });
      expect(result).toEqual(mockApp);
    });
  });

  describe('getAgreementPdf', () => {
    it('fetches PDF blob', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({ blob: () => Promise.resolve(mockBlob) });

      const result = await applicationsService.getAgreementPdf(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/applications/1/agreement_pdf');
      expect(result).toEqual(mockBlob);
    });
  });

  describe('listDocuments', () => {
    it('fetches documents for application', async () => {
      const mockDocs = [{ id: 1, doc_type: 'drivers_license' }];
      mockApiFetch.mockResolvedValueOnce({ data: { data: mockDocs }, headers: new Headers() });

      const result = await applicationsService.listDocuments(1);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1/documents');
      expect(result).toEqual(mockDocs);
    });
  });

  describe('uploadDocument', () => {
    it('uploads file with FormData', async () => {
      const mockDoc = { id: 1, doc_type: 'drivers_license' };
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ data: mockDoc }) });

      const file = new File(['content'], 'license.pdf', { type: 'application/pdf' });
      const result = await applicationsService.uploadDocument(1, file, 'drivers_license');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/applications/1/documents', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(mockDoc);
    });
  });

  describe('deleteDocument', () => {
    it('deletes document', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await applicationsService.deleteDocument(1, 5);

      expect(mockApiFetch).toHaveBeenCalledWith('/applications/1/documents/5', { method: 'DELETE' });
    });
  });
});
