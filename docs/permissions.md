# Role-Based Access Control (RBAC) & Permissions Architecture

## 1. Overview
The Pharmico Admin Control Center enforces strict Role-Based Access Control (RBAC) across all administrative APIs and frontend views. The backend is always the single source of truth for authorization. The frontend UI conditionally renders buttons and navigation links based on permissions, but every server endpoint independently enforces access rights.

---

## 2. Core Administrative Roles

| Role Key | Name | Primary Responsibility |
|---|---|---|
| `SUPER_ADMIN` | Executive Super Admin | Full system access, staff invites, role permission assignments, financial audits. |
| `ADMIN` | Operations Admin | Daily operations, catalog management, promotions, stock adjustments, customer support oversight. |
| `PHARMACIST` | Registered Pharmacist | Prescription inspection (zoom/rotate), medical verification, Schedule H1 chem-register compliance. |
| `INVENTORY_MANAGER` | Warehouse & Inventory Lead | Batch intake, quarantine/recalls, FEFO ledger reviews, supplier purchase tracking. |
| `SUPPORT` | Customer Support Rep | Order tracking, customer history, internal order notes, consultation schedules. |
| `MARKETING` | Merchandising & Marketing | Promotional banners, discount coupon codes, campaign reviews. |

---

## 3. Comprehensive Permissions Matrix

| Resource / Module | Action | SUPER_ADMIN | ADMIN | PHARMACIST | INVENTORY_MGR | SUPPORT | MARKETING |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Prescriptions** | `read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| | `verify` (approve/reject) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `schedule_h1_log` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Orders** | `read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| | `update_status` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| | `cancel_or_refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `add_internal_note` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Inventory / Batches** | `read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| | `create_batch` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `adjust_fefo_stock` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `quarantine_batch` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Catalog / Products** | `read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | `create_or_update` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | `delete` (soft) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Customers** | `read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| | `add_customer_note` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Coupons & Banners** | `read` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| | `manage_promotions` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Staff & Roles** | `read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `invite_member` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `change_role` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | `revoke_access` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Store Settings** | `read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | `update_settings` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | `read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Central Authorization Function: `can()`

All authorization checks are consolidated in `apps/admin-api/src/middlewares/auth.ts`:

```typescript
export type Action = 'read' | 'create' | 'update' | 'delete' | 'verify' | 'quarantine' | 'export';
export type Resource = 'prescriptions' | 'orders' | 'inventory' | 'products' | 'customers' | 'staff' | 'settings' | 'audit_logs';

export function can(user: AdminUserWithPermissions, action: Action, resource: Resource): boolean {
  // 1. Super admin has blanket bypass
  if (user.role.name === 'SUPER_ADMIN') {
    return true;
  }

  // 2. Check granular permission key: e.g. "inventory:adjust_fefo_stock" or "prescriptions:verify"
  const requiredPermission = `${resource}:${action}`;
  return user.permissions.includes(requiredPermission) || user.permissions.includes(`${resource}:*`);
}
```

### Route Handler Usage Example
```typescript
router.post(
  '/batches/:id/quarantine',
  authenticateAdmin,
  authorize('quarantine', 'inventory'),
  batchController.quarantineBatch
);
```

---

## 5. Security & Session Revocation
- **JWT Lifespan**: Access token expires in 15 minutes. Refresh token expires in 7 days.
- **Immediate Revocation**: Modifying a staff member's role or calling `/api/v1/staff/:id/revoke` invalidates their session record in `admin_sessions` and clears the 30-second in-memory auth cache, terminating active API access instantly.
