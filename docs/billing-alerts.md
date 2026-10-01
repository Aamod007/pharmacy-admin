# Infrastructure & Third-Party Service Billing Alerts

## 1. Overview
To prevent budget overrun and ensure uninterrupted clinical operations, automated billing alerts and hard/soft spending thresholds are configured across all third-party cloud infrastructure providers powering the Pharmico Admin Control Center.

---

## 2. Provider Thresholds & Alert Configuration Matrix

| Provider | Service / Resource | Monthly Baseline | Soft Alert Threshold (Warning) | Hard Alert Threshold (Critical) | Notification Channel |
|---|---|---|---|---|---|
| **AWS** | S3 (Prescriptions, PDFs) + Glacier Archive | $25.00 | $15.00 (60% budget) | $22.50 (90% budget) | AWS SNS -> Slack `#ops-finance` & Ops Email |
| **Neon / Supabase** | Managed PostgreSQL (`medico_db`) | $45.00 | 75% compute hours / 8 GB storage | 90% compute / 10 GB storage | Supabase Dashboard Alerts + Email |
| **Upstash** | Serverless Redis (SSE, BullMQ, Cache) | $15.00 | 50,000 commands/day (70%) | 80,000 commands/day (90%) | Upstash Console Webhook -> Slack |
| **Vercel** | Frontend Edge Hosting (`admin-web`) | $20.00 | $15.00 spend / 80GB bandwidth | $20.00 spend cap | Vercel Spend Management Alerts |
| **Railway / VPS** | Node.js API Service Container | $20.00 | $15.00 (75% plan usage) | $18.50 (92% plan usage) | Railway Usage Alerts |
| **Cloudinary** | Product Images & Prescription Scans | $10.00 | 70% transformation quota | 90% transformation quota | Cloudinary Notification Email |
| **Razorpay** | Payment Gateway & Merchant Account | Fee per txn | Account balance < ₹25,000 | Account balance < ₹10,000 | Razorpay Merchant Dashboard SMS + Email |
| **Resend / SMTP** | Transactional Clinical Emails | $20.00 | 80% daily quota | 95% daily quota | Resend Webhook Alert |

---

## 3. Automated Runbook on Billing Alert Trigger

1. **Acknowledge Alert within SLA**:
   - Soft Warning (< 75% spend): Review in next business standup.
   - Critical Alert (> 90% spend): Response SLA < 30 minutes.
2. **Identify Anomaly Driver**:
   - Check AWS CloudWatch / Vercel Analytics for unexpected spike in egress bandwidth.
   - Inspect Redis command rate for runaway caching loops or unhandled polling.
   - Review S3 bucket growth for orphaned temporary uploads.
3. **Remediation Actions**:
   - Purge stale image caches from CDN.
   - Scale down test/staging container resources if development billing spiked.
   - Temporarily throttle non-essential background report generation jobs.
