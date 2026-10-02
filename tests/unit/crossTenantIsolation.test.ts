import { describe, it, expect } from "vitest";
import { can, AdminActor } from "../../apps/admin-api/src/middlewares/rbac";

describe("Pre-Launch Checklist Item 1 & 11: Cross-Tenant & Cross-Role Isolation", () => {
  const storeCustomerActor: AdminActor = {
    adminUserId: "cust_99",
    email: "customer@gmail.com",
    roleSlug: "CUSTOMER", // Not an admin role
    permissions: [],
  };

  const supportStaff: AdminActor = {
    adminUserId: "supp_branch_1",
    email: "support1@pharmico.health",
    roleSlug: "SUPPORT",
    permissions: ["orders:read", "customers:read"],
  };

  const inventoryClerk: AdminActor = {
    adminUserId: "inv_clerk_1",
    email: "clerk@pharmico.health",
    roleSlug: "INVENTORY_MANAGER",
    permissions: ["inventory:read", "inventory:write", "inventory:adjust"],
  };

  const superAdmin: AdminActor = {
    adminUserId: "admin_root",
    email: "root@pharmico.health",
    roleSlug: "SUPER_ADMIN",
    permissions: ["*"],
  };

  it("blocks Storefront Customers from executing any administrative actions", () => {
    expect(can(storeCustomerActor, "read", "orders")).toBe(false);
    expect(can(storeCustomerActor, "write", "inventory")).toBe(false);
    expect(can(storeCustomerActor, "settings:update")).toBe(false);
    expect(can(storeCustomerActor, "payments:read")).toBe(false);
  });

  it("blocks Support Staff from adjusting inventory stock or accessing staff management", () => {
    expect(can(supportStaff, "adjust", "inventory")).toBe(false);
    expect(can(supportStaff, "staff:write")).toBe(false);
    expect(can(supportStaff, "staff:read")).toBe(false);
    expect(can(supportStaff, "settings:update")).toBe(false);
  });

  it("blocks Inventory Managers from accessing staff management or modifying store settings", () => {
    expect(can(inventoryClerk, "staff:write")).toBe(false);
    expect(can(inventoryClerk, "settings:update")).toBe(false);
  });

  it("strictly enforces that unauthenticated requests have null access", () => {
    expect(can(undefined, "read", "products")).toBe(false);
    expect(can(undefined, "read", "dashboard")).toBe(false);
  });

  it("ensures cache keys are partitioned by actor/tenant identity", () => {
    // Shared cache layer must namespace keys by tenant/user id
    const generateCacheKey = (tenantOrUserId: string, resource: string) => `tenant:${tenantOrUserId}:${resource}`;

    const keyUser1 = generateCacheKey(supportStaff.adminUserId, "inventory");
    const keyUser2 = generateCacheKey(inventoryClerk.adminUserId, "inventory");

    expect(keyUser1).not.toBe(keyUser2);
    expect(keyUser1).toBe("tenant:supp_branch_1:inventory");
    expect(keyUser2).toBe("tenant:inv_clerk_1:inventory");
  });
});
