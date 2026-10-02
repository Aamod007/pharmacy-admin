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

function canTransition(current: string, next: string) {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

describe("Order State Machine Validations", () => {
  it("permits standard forward transition PLACED to CONFIRMED", () => {
    expect(canTransition("PLACED", "CONFIRMED")).toBe(true);
  });

  it("permits transitions CONFIRMED to PACKED and PACKED to SHIPPED", () => {
    expect(canTransition("CONFIRMED", "PACKED")).toBe(true);
    expect(canTransition("PACKED", "SHIPPED")).toBe(true);
  });

  it("blocks invalid backward transitions like SHIPPED to PLACED", () => {
    expect(canTransition("SHIPPED", "PLACED")).toBe(false);
  });
});
