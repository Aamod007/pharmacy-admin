import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { paymentsService } from "../../apps/admin-api/src/modules/payments/payments.service";

describe("Pre-Launch Checklist Item 4: Verified Idempotent Webhooks", () => {
  const secret = "test_webhook_secret_key_12345";
  // Temporarily set webhook secret for test
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  it("successfully validates valid HMAC SHA-256 signature", () => {
    const rawBody = JSON.stringify({
      event: "payment.captured",
      event_id: "evt_test_1001",
      payload: { payment: { entity: { id: "pay_123", amount: 49900 } } },
    });

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const isValid = paymentsService.verifyWebhookSignature(rawBody, expectedSignature);
    expect(isValid).toBe(true);
  });

  it("rejects forged or tampered webhook payload signature", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", event_id: "evt_test_1001" });
    const forgedSignature = "forged_signature_000000000000000000000000000000000000000000000000";

    const isValid = paymentsService.verifyWebhookSignature(rawBody, forgedSignature);
    expect(isValid).toBe(false);
  });

  it("rejects empty or missing signature", () => {
    const rawBody = JSON.stringify({ event: "order.paid" });
    expect(paymentsService.verifyWebhookSignature(rawBody, "")).toBe(false);
  });
});
