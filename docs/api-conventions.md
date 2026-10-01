# API Conventions & Standards: Pharmico Admin API

## 1. Base URL & Routing Conventions
- All administrative API routes are versioned and mounted under:
  `/api/v1/{resource}`
- Resource names use plural lowercase nouns with kebab-case:
  - `/api/v1/admin-users`
  - `/api/v1/prescriptions`
  - `/api/v1/stock-movements`
- Sub-resource actions use standard HTTP verbs or clean action endpoints:
  - `POST /api/v1/prescriptions/:id/approve`
  - `POST /api/v1/prescriptions/:id/reject`
  - `POST /api/v1/batches/:id/quarantine`

---

## 2. Standard Response Envelope

All API endpoints must return a predictable JSON envelope.

### Successful Response Format
```json
{
  "success": true,
  "data": {
    "id": "c3a9f0e1-4567-4890-a123-abcdef012345",
    "batchNumber": "LOT-2026-X9",
    "quantity": 500,
    "expiryDate": "2027-12-31T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-10-01T10:55:00.000Z",
    "requestId": "req_8f1a23bc"
  }
}
```

### Paginated List Response Format
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextCursor": "eyJpZCI6ImMzYTlmMGUx..."
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed schema validation.",
    "details": [
      {
        "field": "expiryDate",
        "issue": "Expiration date must be in the future."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-01T10:55:00.000Z",
    "requestId": "req_8f1a23bc"
  }
}
```

---

## 3. Standard HTTP Status Codes

| Code | Status | Usage Scenario |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH, or action execution. |
| `201` | Created | Successful POST creation of a new entity. |
| `204` | No Content | Successful DELETE with no response body. |
| `400` | Bad Request | Zod schema validation failure or malformed payload. |
| `401` | Unauthorized | Missing or expired JWT access token. |
| `403` | Forbidden | Authenticated user lacks sufficient RBAC permissions. |
| `404` | Not Found | Requested entity ID does not exist. |
| `409` | Conflict | Duplicate unique key (e.g. batch number or staff email). |
| `422` | Unprocessable Entity | Business logic failure (e.g. attempting to approve already rejected Rx). |
| `429` | Too Many Requests | Rate limit exceeded. Contains `Retry-After` header. |
| `500` | Internal Server Error | Uncaught server exception. Scrubbed of stack traces in production. |

---

## 4. Input Validation with Zod at Boundaries
No route handler accepts raw input without Zod validation. Schemas are defined in `<module>.schemas.ts`:

```typescript
import { z } from 'zod';

export const createBatchSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    batchNumber: z.string().min(3).max(50),
    mfgDate: z.string().datetime(),
    expiryDate: z.string().datetime().refine(val => new Date(val) > new Date(), {
      message: 'Expiration date must be in the future',
    }),
    quantity: z.number().int().positive(),
    purchasePricePaise: z.number().int().nonnegative(),
    mrpPaise: z.number().int().positive(),
  }),
});
```

---

## 5. Pagination Standards
List endpoints support both offset-based and cursor-based pagination query parameters:
- `page`: 1-indexed page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `cursor`: Base64 encoded entity ID for high-throughput stream pagination
- `sort`: Field to sort by (e.g., `createdAt`)
- `order`: `asc` or `desc` (default: `desc`)
