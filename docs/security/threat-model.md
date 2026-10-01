# Threat Model & Security Architecture (OWASP Top 10)

## 1. Asset Registry & Sensitivity Classification

| Asset | Classification | Storage Location | Protection Mechanisms |
|---|---|---|---|
| **Patient Prescriptions** | **PHI / Sensitive Medical Data** | Private Cloudflare R2 / S3 | Short-lived signed URLs (15 min), RBAC check via `can()`, zero public bucket access. |
| **Admin Credentials** | **Confidential** | PostgreSQL (`admin_users`) | Bcrypt hashing (cost 12), brute-force account lockout (5 attempts -> 15 min lock), optional TOTP 2FA. |
| **Schedule H / H1 Logs** | **Statutory Regulatory Data** | PostgreSQL (`admin_audit_logs`) | Append-only immutable table, pharmacist license verification stamp. |
| **Catalog & Pricing** | **Internal Operational** | PostgreSQL (`Product`, `Batch`) | Integer minor units (paise), atomic transactions on price updates. |
| **Session Tokens** | **Secret Authentication** | Secure HTTP-Only Cookies | `SameSite=Lax`, `Secure=true`, `HttpOnly=true`, short 15-minute access token lifespan. |

---

## 2. Threat Analysis & Mitigations (OWASP Top 10)

### A01: Broken Access Control (BOLA / IDOR)
- **Threat**: An attacker changes `:id` in an API call (e.g. `/api/v1/prescriptions/:id`) to inspect prescriptions belonging to another customer or store without authorization.
- **Mitigation**:
  - Centralized authorization middleware `authorize(action, resource)` called on every protected route.
  - Pharmacists and support staff cannot query raw IDs without role-based filters.
  - Audit logging records every document inspection attempt with staff ID and IP.

### A02: Cryptographic Failures
- **Threat**: Exposure of passwords, API keys, or session tokens in transit or at rest.
- **Mitigation**:
  - Enforce TLS 1.3 in production with HSTS (`Strict-Transport-Security`).
  - No plaintext credentials or secrets in source code or git history.
  - JWT tokens signed with high-entropy 256-bit secrets (`HS256`).

### A03: Injection (SQL / NoSQL)
- **Threat**: SQL injection via search filters, category slugs, or sort parameters.
- **Mitigation**:
  - 100% of database interactions are executed via Prisma ORM using parameterized queries.
  - Raw SQL (`$queryRaw`) is prohibited unless reviewed by security lead and parameterized.

### A04: Insecure Design & Rate Limiting
- **Threat**: Credential stuffing or brute-force attacks against administrative login endpoints.
- **Mitigation**:
  - Distributed Redis-backed rate limiting:
    - **Login & 2FA Verification**: Max 5 attempts per 15 minutes per IP.
    - **Prescription Upload / Inspection**: Max 60 requests per minute per staff user.
    - **General API**: Max 300 requests per minute per IP.
  - Returns `429 Too Many Requests` with a standard `Retry-After` header.

### A05: Security Misconfiguration
- **Threat**: Verbose error stack traces leaked to client browsers exposing server file paths or database versions.
- **Mitigation**:
  - Global error handler (`errorHandler.ts`) strips stack traces in production.
  - Uniform error envelope `{ success: false, error: { code, message } }`.
  - HTTP security headers applied via Helmet (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

### A06: Vulnerable and Outdated Components
- **Threat**: Exploitable vulnerabilities in npm packages.
- **Mitigation**:
  - Automated dependency audits via `npm audit` in GitHub Actions CI.
  - Automated PR updates for security patches.

### A07: Identification and Authentication Failures
- **Threat**: Session hijacking or replay attacks.
- **Mitigation**:
  - Access tokens expire after 15 minutes.
  - Refresh tokens stored in HTTP-only, Secure cookies with automatic rotation.
  - Immediate session invalidation on staff termination or password change.

### A08: Software and Data Integrity Failures
- **Threat**: Tampering with order status or batch inventory without an audit record.
- **Mitigation**:
  - All status transitions verified by state machine rules (`orderStateMachine.ts`).
  - Every batch modification writes a non-destructive ledger entry (`admin_stock_movements`).

### A09: Security Logging and Monitoring Failures
- **Threat**: Undetected malicious actions by compromised admin accounts.
- **Mitigation**:
  - Immutable audit logs (`admin_audit_logs`) capture actor ID, email, role, action, target entity, before/after values, and IP address.
  - Automatic redaction of passwords, tokens, and credit card numbers from all log outputs.

### A10: Server-Side Request Forgery (SSRF)
- **Threat**: Admin API coerced into making HTTP requests to internal cloud metadata services (e.g. AWS 169.254.169.254).
- **Mitigation**:
  - Webhooks and revalidation endpoints strictly validate destination URLs against an allowlist (`MAIN_SITE_URL`).
  - Outgoing HTTP client blocks requests targeting private IP ranges (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.1`, `169.254.169.254`).
