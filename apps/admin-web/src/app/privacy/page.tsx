import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Pharmico Admin Control Center",
  description: "Privacy policy, data retention, and medical record confidentiality protocols.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Pharmico Admin Control Center</h1>
              <p className="text-xs text-slate-500">Data Governance & PHI Protection</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Privacy Policy & Health Data Governance</h2>
          <p className="mt-1 text-xs text-slate-500">Last updated: October 1, 2026 • Compliance Edition</p>

          <hr className="my-6 border-slate-200" />

          <section className="space-y-6 text-sm leading-relaxed text-slate-700">
            <div>
              <h3 className="text-base font-semibold text-slate-900">1. Protected Health Information (PHI) Handling</h3>
              <p className="mt-1">
                Customer medical records, lab reports, doctor teleconsultation notes, and digital prescriptions are
                classified as sensitive health data. They are stored in private, encrypted object storage buckets and
                can only be accessed by authorized clinical pharmacists and medical support agents via short-lived,
                cryptographically signed URLs.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">2. Staff Credential & Session Security</h3>
              <p className="mt-1">
                Staff passwords are encrypted at rest using industry-standard bcrypt hashing with a salt cost factor of 12.
                Administrative sessions utilize secure, HTTP-only, SameSite cookies with automated token rotation and
                short 15-minute access token lifetimes.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">3. Log Redaction & Data Minimization</h3>
              <p className="mt-1">
                All server logs and telemetry streams automatically scrub sensitive parameters, including authentication
                tokens, passwords, customer phone numbers, Aadhaar/national ID numbers, and credit card credentials
                prior to transmission to log analyzers or error trackers.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">4. Retention Schedules & Archival</h3>
              <p className="mt-1">
                In compliance with retail pharmacy regulations, prescription review records and Chemist Register
                entries are maintained for a mandatory statutory period (min. 2 years). Database write-ahead logs
                (WAL) and daily encrypted backups are retained for 30 days before automated migration to deep cold
                storage.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">5. Data Subject Rights & Deletion</h3>
              <p className="mt-1">
                Customers requesting account erasure via storefront privacy channels have their non-statutory data
                anonymized, while regulatory purchase transaction records remain archived in an immutable, pseudonymized
                format required by taxation and medical dispensing statutes.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
