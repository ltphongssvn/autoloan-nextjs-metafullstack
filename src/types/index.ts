// autoloan-nextjs-metafullstack/src/types/index.ts
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'customer' | 'loan_officer' | 'underwriter';
  full_name: string;
  created_at: string;
}

export interface ApplicationLinks {
  self: string;
  documents: string;
  submit?: string;
  sign?: string;
  agreement_pdf?: string;
}

export interface Application {
  id: number;
  user_id: number;
  application_number: string;
  status:
    | 'draft'
    | 'submitted'
    | 'pending'
    | 'under_review'
    | 'pending_documents'
    | 'approved'
    | 'rejected';
  current_step: number;
  personal_info: Record<string, unknown>;
  car_details: Record<string, unknown>;
  loan_details: Record<string, unknown>;
  employment_info: Record<string, unknown>;
  loan_term: number | null;
  interest_rate: string | null;
  monthly_payment: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  signature_data: string | null;
  signed_at: string | null;
  agreement_accepted: boolean | null;
  created_at: string;
  updated_at: string;
  links?: ApplicationLinks;
}

export interface LoanDocument {
  id: number;
  doc_type:
    | 'drivers_license'
    | 'proof_income'
    | 'proof_address'
    | 'bank_statement'
    | 'vehicle_purchase'
    | 'insurance'
    | 'other';
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  content_type: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'requested';
  rejection_note: string | null;
  request_note: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  status: { code: number; message?: string };
  data: T;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}
