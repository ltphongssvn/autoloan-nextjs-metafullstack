# AutoLoan Next.js — Full-Stack Application

Next.js 15 refactor of the AutoLoan Rails+Vite application with Material UI, TypeScript, and comprehensive test coverage.

## Architecture
```
src/
├── app/                    # Next.js App Router pages
│   ├── agreement/[id]/     # Loan agreement signing (canvas signature)
│   ├── api/v1/             # API proxy routes → Rails backend
│   ├── dashboard/          # Applicant dashboard, app detail, status, settings
│   ├── forgot-password/    # Password recovery
│   ├── login/              # Authentication
│   ├── officer/            # Loan officer dashboard & review
│   ├── reset-password/     # Password reset
│   ├── signup/             # Registration
│   └── underwriter/        # Underwriter dashboard & analysis
├── components/             # Shared UI components
│   ├── layout/             # AppHeader, SideDrawer, MainLayout
│   ├── ConfirmDialog.tsx   # Reusable confirmation modal
│   ├── EmptyState.tsx      # Empty state placeholder
│   ├── LoadingSpinner.tsx  # Loading indicator
│   ├── NotificationAlert.tsx # Snackbar notifications
│   ├── ProtectedRoute.tsx  # Role-based route guard
│   └── StatusChip.tsx      # Application status badge
├── context/                # React context (AuthContext)
├── hooks/                  # Custom hooks (useNotification, useCable, useChannel)
├── services/               # API service layer
│   ├── api.ts              # Base fetch wrapper with JWT auth
│   ├── applications.ts     # Application CRUD + documents + signing
│   ├── auth.ts             # Login, signup, logout, password reset
│   ├── cable.ts            # WebSocket (ActionCable) with auto-reconnect
│   └── staff.ts            # Loan officer & underwriter endpoints
├── theme/                  # MUI theme configuration
├── types/                  # TypeScript interfaces
└── middleware.ts           # Auth + role-based route protection
```

## Roles & Workflows

- **Applicant**: Create application → Upload documents → Track status → Sign agreement
- **Loan Officer**: Review applications → Verify → Request documents → Forward to underwriter
- **Underwriter**: Risk analysis (DTI/LTV) → Approve/Reject → Request documents

## Getting Started
```bash
cp env.example .env.local   # Configure API URLs
npm install
npm run dev                 # http://localhost:3001
```

## Testing
```bash
npm test                    # Run all tests
npm run test:coverage       # Coverage report (80% per-file threshold)
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Material UI 6
- **Language**: TypeScript 5
- **Testing**: Vitest + React Testing Library
- **State**: React Context + hooks
- **Real-time**: WebSocket (ActionCable compatible)
- **Backend**: Rails API (proxied via Next.js API routes)
