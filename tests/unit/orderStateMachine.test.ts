import { describe, it, expect } from "vitest";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURNED: [],
  CANCELLED: [],
};

function canTransition(current: string, next: string, hasApprovedRx: boolean, isRxRequired: boolean) {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) return false;
  if (next === "CONFIRMED" && isRxRequired && !hasApprovedRx) {
    return false;
  }
  return true;
}

describe("Order State Machine & Rx Regulatory Transitions", () => {
  it("blocks transition to CONFIRMED if required prescription is not approved", () => {
    const valid = canTransition("PLACED", "CONFIRMED", false, true);
    expect(valid).toBe(false);
  });

  it("permits CONFIRMED once prescription is verified and approved", () => {
    const valid = canTransition("PLACED", "CONFIRMED", true, true);
    expect(valid).toBe(true);
  });

  it("blocks invalid backward transitions like SHIPPED to PLACED", () => {
    const valid = canTransition("SHIPPED", "PLACED", true, false);
    expect(valid).toBe(false);
  });
});
