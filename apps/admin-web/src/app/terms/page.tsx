import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Pharmico Admin Control Center",
  description: "Terms of Service and administrative platform usage guidelines.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Pharmico Admin Control Center</h1>
              <p className="text-xs text-slate-500">Internal Administration Governance</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Terms of Service & Staff Usage Policy</h2>
          <p className="mt-1 text-xs text-slate-500">Last updated: October 1, 2026 • Version 1.0</p>

          <hr className="my-6 border-slate-200" />

          <section className="space-y-6 text-sm leading-relaxed text-slate-700">
            <div>
              <h3 className="text-base font-semibold text-slate-900">1. Authorized Access & Role Separation</h3>
              <p className="mt-1">
                Access to the Pharmico Admin Control Center is strictly restricted to authenticated and authorized
                administrative personnel, registered pharmacists, inventory managers, customer support agents, and
                system executives. Credentials and 2FA tokens must not be shared or transferred under any circumstances.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">2. Medical Prescription & Clinical Compliance</h3>
              <p className="mt-1">
                Registered Pharmacists reviewing prescriptions through the Rx Inspector must adhere strictly to the
                Drugs and Cosmetics Act (1940 & Rules 1945) and Schedule H / H1 dispensing guidelines. Approving a
                prescription digitally certifies that patient diagnosis, doctor credentials, and dosage safety have
                been verified.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">3. FEFO Inventory & Batch Integrity</h3>
              <p className="mt-1">
                Inventory personnel must accurately inward manufacturer batch numbers, expiry dates, and unit quantities.
                Manual overrides to the automated First-Expiry-First-Out (FEFO) allocation engine are recorded
                non-destructively in the audit ledger and subject to supervisory review.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">4. Immutable Audit Trails & Non-Repudiation</h3>
              <p className="mt-1">
                All administrative actions—including customer record views, prescription validations, stock movements,
                pricing changes, and role assignments—are logged with IP address, user agent, and timestamps.
                Tampering with audit logs is technically prevented via database constraints.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">5. Termination & Access Revocation</h3>
              <p className="mt-1">
                The organization reserves the right to immediately revoke system access, terminate active sessions,
                and suspend privileges upon detected credential misuse or policy violations.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
