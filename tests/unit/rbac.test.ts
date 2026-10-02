import { describe, it, expect } from "vitest";
import { can, AdminActor } from "../../apps/admin-api/src/middlewares/rbac";

describe("Layer 4 Auth: Central can() Authorization", () => {
  const superAdmin: AdminActor = {
    adminUserId: "usr_1",
    email: "owner@pharmico.health",
    roleSlug: "SUPER_ADMIN",
    permissions: [],
  };

  const orderClerk: AdminActor = {
    adminUserId: "usr_2",
    email: "clerk@pharmico.health",
    roleSlug: "ORDER_CLERK",
    permissions: ["orders:read", "orders:update", "inventory:read"],
  };

  const inventoryManager: AdminActor = {
    adminUserId: "usr_3",
    email: "inventory@pharmico.health",
    roleSlug: "INVENTORY_MANAGER",
    permissions: ["inventory:read", "inventory:write", "inventory:adjust"],
  };

  it("allows SUPER_ADMIN to perform any action on any resource", () => {
    expect(can(superAdmin, "delete", "products")).toBe(true);
    expect(can(superAdmin, "settings:update")).toBe(true);
    expect(can(superAdmin, "any_wildcard_permission")).toBe(true);
  });

  it("allows ORDER_CLERK to update orders but denies deleting products or changing settings", () => {
    expect(can(orderClerk, "update", "orders")).toBe(true);
    expect(can(orderClerk, "read", "inventory")).toBe(true);
    expect(can(orderClerk, "delete", "products")).toBe(false);
    expect(can(orderClerk, "settings:update")).toBe(false);
  });

  it("allows INVENTORY_MANAGER to adjust stock but denies modifying settings", () => {
    expect(can(inventoryManager, "adjust", "inventory")).toBe(true);
    expect(can(inventoryManager, "settings:update")).toBe(false);
  });

  it("allows ADMIN to perform any action on any resource", () => {
    const adminUser: AdminActor = {
      adminUserId: "usr_admin",
      email: "admin@pharmico.health",
      roleSlug: "ADMIN",
      permissions: ["*"],
    };
    expect(can(adminUser, "delete", "products")).toBe(true);
    expect(can(adminUser, "settings:update")).toBe(true);
    expect(can(adminUser, "staff:invite")).toBe(true);
  });

  it("denies access when actor is undefined (unauthenticated)", () => {
    expect(can(undefined, "read", "products")).toBe(false);
  });
});
