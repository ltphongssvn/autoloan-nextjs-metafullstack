# autoloan-nextjs-metafullstack/SECURITY.md
# Security Best Practices Implementation

## Secret Management Implementation

### 1. Pre-commit Secret Detection Setup

**Installation:**
```bash
pip install pre-commit detect-secrets
```

**Configuration (.pre-commit-config.yaml):**
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: .*\.lock|.*\.log|package-lock\.json
```

**Activation:**
```bash
detect-secrets scan > .secrets.baseline
pre-commit install
```

### 2. Environment Variables Required

Create `.env.local` file (never commit):
```bash
# Database (used by Next.js API routes)
DATABASE_URL=postgresql://user:password@localhost:5432/autoloan_development # pragma: allowlist secret

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600

# Next.js Public Variables (exposed to browser)
NEXT_PUBLIC_APP_NAME=AutoLoan
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email/SMTP (server-side only)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Node Environment
NODE_ENV=development
```

### 3. Security Measures Implemented

| Layer | Tool/Practice | Purpose |
|-------|--------------|---------|
| Secret Detection | detect-secrets + pre-commit | Prevent secrets from entering codebase |
| .env Protection | pre-commit hook `check-env-files` | Block .env files from being committed |
| Dependencies | npm audit | Scan for vulnerable packages |
| HTTP Headers | Next.js `headers()` in next.config.ts | OWASP security headers |
| Rate Limiting | Next.js middleware + API route guards | Prevent brute force / DDoS |
| Input Validation | Zod / runtime validation | Validate all request payloads |
| Authentication | JWT (via API routes) | Stateless token-based auth |
| Authorization | Next.js middleware + role checks | Customer / Loan Officer / Underwriter |
| CORS | Next.js config `headers` | Restrict cross-origin requests |
| SQL Injection | Parameterized queries (ORM layer) | Prevent SQL injection |
| Password Hashing | bcrypt (12 rounds) | Secure password storage |
| MFA | TOTP-based two-factor auth | Two-factor authentication |
| SSR Security | Server Components (no client secrets) | Secrets never reach browser bundle |
| Type Safety | TypeScript strict mode | Catch errors at compile time |

### 4. Next.js-Specific Security Notes

- **Server vs Client:** Never prefix secrets with `NEXT_PUBLIC_` — only public-safe values use that prefix
- **API Routes:** All `/app/api/` route handlers run server-side; safe to use `process.env` secrets
- **Middleware:** `middleware.ts` runs at the edge for auth checks before page rendering
- **Server Components:** Default in App Router — secrets accessed here never reach the client bundle

### 5. Pre-commit Workflow

Every commit now automatically:
1. Scans for secrets using detect-secrets
2. Blocks commit if new secrets found
3. Blocks .env files from being committed
4. Validates JSON and YAML files
5. Fixes line endings and trailing whitespace
6. Runs ESLint for code quality
7. Runs TypeScript type checking

**Pre-push:** Runs full Next.js build verification.

**Manual scan:**
```bash
pre-commit run --all-files
```

### 6. Team Guidelines

- Never commit `.env` or `.env.local` files
- Use environment variables for all credentials
- Run `pre-commit install` after cloning
- Review `.secrets.baseline` changes carefully
- Rotate any accidentally exposed keys immediately
- Run `npm audit` regularly to check for vulnerable dependencies
- Keep all dependencies updated
- Use `NEXT_PUBLIC_` prefix ONLY for browser-safe values

### 7. Dependency Security Audit
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Full report
npm audit --json
```

## Verification
```bash
$ pre-commit run --all-files
Detect secrets...........................................................Passed
Block Large Binary Files.................................................Passed
Block .env Files.........................................................Passed
Fix Line Endings to LF..................................................Passed
Fix End of Files.........................................................Passed
Trim Trailing Whitespace.................................................Passed
Validate JSON Files......................................................Passed
Validate YAML Files......................................................Passed
Check for Large Files....................................................Passed
ESLint Check (CI Mirror).................................................Passed
TypeScript Type Check (CI Mirror)........................................Passed
```

All secrets removed and pre-commit protection active.
