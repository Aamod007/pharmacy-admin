# Observability, Structured Logging & Error Tracking

## 1. Overview
The Pharmico Admin Control Center adopts an end-to-end observability strategy:
1. **Correlation IDs (`x-request-id`)**: Every incoming HTTP request is assigned a unique UUID to trace logs across frontend, API, and background workers.
2. **Structured JSON Logging**: All application events are logged as machine-parseable JSON lines with standardized severity levels (`debug`, `info`, `warn`, `error`).
3. **Automated Error Tracking**: Uncaught runtime exceptions and promise rejections report directly to Sentry with stack traces and sanitized context.

---

## 2. Structured JSON Log Schema

All logs conform to the standard schema:

```json
{
  "timestamp": "2026-10-01T11:00:23.412Z",
  "level": "info",
  "message": "Prescription approved by pharmacist",
  "context": {
    "requestId": "req_7a8b9c0d",
    "userId": "usr_91234567-89ab-cdef-0123-456789abcdef",
    "userRole": "PHARMACIST",
    "prescriptionId": "rx_550e8400-e29b-41d4-a716-446655440000",
    "orderId": "ord_123e4567-e89b-12d3-a456-426614174000",
    "durationMs": 34.2
  }
}
```

---

## 3. Mandatory PII & Secret Redaction
Before any log statement or error payload is dispatched, sensitive data fields are automatically redacted by the logging middleware:
- **Redacted Field Keys**:
  - `password`, `passwordHash`, `currentPassword`, `newPassword`
  - `twoFactorSecret`, `token`, `accessToken`, `refreshToken`
  - `creditCardNumber`, `cvv`, `cardNumber`
  - `patientAadhaar`, `nationalId`
- Any matching key is transformed to `"[REDACTED]"` prior to serialization.

---

## 4. Sentry Integration Setup

### Backend API Configuration (`apps/admin-api/src/lib/sentry.ts`)
```typescript
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // Sample 10% of transactions for performance tracing
    beforeSend(event) {
      // Scrub sensitive headers & query params
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}
```
