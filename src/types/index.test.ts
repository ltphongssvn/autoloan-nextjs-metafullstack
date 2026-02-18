// autoloan-nextjs-metafullstack/src/types/index.test.ts
import { describe, it, expect } from 'vitest';
import type {
  User,
  Application,
  LoanDocument,
  ApiResponse,
  AuthCredentials,
  SignupData,
  PaginationMeta,
  ApplicationLinks,
} from './index';

describe('TypeScript Type Definitions', () => {
  it('User type enforces correct shape', () => {
    const user: User = {
      id: 1,
      email: 'test@test.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-1234',
      role: 'customer',
      full_name: 'John Doe',
      created_at: '2025-01-01T00:00:00Z',
    };
    expect(user.role).toBe('customer');
    expect(user.phone).toBe('555-1234');
  });

  it('User phone can be null', () => {
    const user: User = {
      id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B',
      phone: null, role: 'loan_officer', full_name: 'A B', created_at: '',
    };
    expect(user.phone).toBeNull();
  });

  it('Application type enforces correct status values', () => {
    const app: Application = {
      id: 1, user_id: 1, application_number: 'APP-001', status: 'draft',
      current_step: 1, personal_info: {}, car_details: {}, loan_details: {},
      employment_info: {}, loan_term: null, interest_rate: null,
      monthly_payment: null, submitted_at: null, decided_at: null,
      signature_data: null, signed_at: null, agreement_accepted: null,
      created_at: '', updated_at: '',
    };
    expect(app.status).toBe('draft');
  });

  it('Application supports optional links', () => {
    const links: ApplicationLinks = {
      self: '/api/v1/applications/1',
      documents: '/api/v1/applications/1/documents',
      submit: '/api/v1/applications/1/submit',
    };
    expect(links.self).toContain('applications');
    expect(links.sign).toBeUndefined();
  });

  it('LoanDocument type enforces doc_type values', () => {
    const doc: LoanDocument = {
      id: 1, doc_type: 'drivers_license', file_name: 'license.pdf',
      file_url: null, file_size: null, content_type: null,
      status: 'pending', rejection_note: null, request_note: null,
      uploaded_at: null, verified_at: null, created_at: '',
    };
    expect(doc.doc_type).toBe('drivers_license');
  });

  it('ApiResponse wraps data with status', () => {
    const res: ApiResponse<string> = {
      status: { code: 200, message: 'OK' },
      data: 'hello',
    };
    expect(res.status.code).toBe(200);
    expect(res.data).toBe('hello');
  });

  it('AuthCredentials has email and password', () => {
    const creds: AuthCredentials = { email: 'a@b.com', password: 'x' }; // pragma: allowlist secret
    expect(creds.email).toBe('a@b.com');
  });

  it('SignupData extends AuthCredentials', () => {
    const data: SignupData = {
      email: 'a@b.com', password: 'x', // pragma: allowlist secret
      password_confirmation: 'x', first_name: 'A', last_name: 'B',
    };
    expect(data.first_name).toBe('A');
    expect(data.role).toBeUndefined();
  });

  it('PaginationMeta has page info', () => {
    const meta: PaginationMeta = {
      current_page: 1, total_pages: 5, total_count: 50, per_page: 10,
    };
    expect(meta.total_pages).toBe(5);
  });
});
