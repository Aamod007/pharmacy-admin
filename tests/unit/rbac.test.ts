import { describe, it, expect } from "vitest";
import { can, AdminActor } from "../../apps/admin-api/src/middlewares/rbac";

describe("Layer 4 Auth: Central can() Authorization", () => {
  const superAdmin: AdminActor = {
    adminUserId: "usr_1",
    email: "owner@pharmico.health",
    roleSlug: "SUPER_ADMIN",
    permissions: [],
  };

  const pharmacist: AdminActor = {
    adminUserId: "usr_2",
    email: "rx@pharmico.health",
    roleSlug: "PHARMACIST",
    permissions: ["prescriptions:read", "prescriptions:approve", "inventory:read"],
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

  it("allows PHARMACIST to approve prescriptions but denies deleting products", () => {
    expect(can(pharmacist, "approve", "prescriptions")).toBe(true);
    expect(can(pharmacist, "read", "inventory")).toBe(true);
    expect(can(pharmacist, "delete", "products")).toBe(false);
    expect(can(pharmacist, "settings:update")).toBe(false);
  });

  it("allows INVENTORY_MANAGER to adjust stock but denies prescription approval", () => {
    expect(can(inventoryManager, "adjust", "inventory")).toBe(true);
    expect(can(inventoryManager, "approve", "prescriptions")).toBe(false);
  });

  it("denies access when actor is undefined (unauthenticated)", () => {
    expect(can(undefined, "read", "products")).toBe(false);
  });
});
