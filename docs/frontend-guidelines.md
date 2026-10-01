# Frontend UI Standards & Design System Guidelines

## 1. Design Principles & Aesthetics
The Pharmico Admin Control Center UI is built with **Next.js 15 App Router**, **TailwindCSS**, and **Radix UI Primitives**.
It follows an enterprise medical dashboard aesthetic: clean emerald/teal primary accents, slate neutral backgrounds, crisp typography (Inter / Geist), high data density, and zero generic AI placeholder styling.

---

## 2. Mandatory 4 UI States Rule
Every data-driven view, table, or card MUST handle and test all four UI states:

```
┌───────────────────────────────────────────────────────────┐
│                     1. LOADING STATE                      │
│ Skeleton placeholders with matching layout & shimmer      │
├───────────────────────────────────────────────────────────┤
│                      2. EMPTY STATE                       │
│ Contextual illustration/icon + clear message + CTA button │
├───────────────────────────────────────────────────────────┤
│                      3. ERROR STATE                       │
│ Explanatory error message + visible "Try Again" button    │
├───────────────────────────────────────────────────────────┤
│                     4. SUCCESS STATE                      │
│ High-density data table or view with full interactivity   │
└───────────────────────────────────────────────────────────┘
```

### Component Implementation Example
```tsx
export function BatchList({ productId }: { productId: string }) {
  const { data: batches, isLoading, error, refetch } = useBatches(productId);

  // 1. Loading State
  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  // 2. Error State (With Retry)
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-2 text-sm font-semibold text-red-800">Failed to load batches</h3>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State (With Action)
  if (!batches || batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900">No inventory batches recorded</h3>
        <p className="mt-1 text-xs text-slate-500">Inward the first manufacturer batch to make this product sellable.</p>
        <button
          onClick={() => openInwardBatchModal(productId)}
          className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
        >
          + Inward New Batch
        </button>
      </div>
    );
  }

  // 4. Success State
  return <BatchDataTable data={batches} />;
}
```

---

## 3. Form Validation & UX Standards
- **Client-Side Validation**: Built with React Hook Form + Zod matching the backend schemas.
- **Inline Field Errors**: Rendered immediately below inputs with `role="alert"`.
- **Pending Submission**: The submit button must be disabled with a visible spinner during in-flight network requests to prevent duplicate submissions.
- **Success Feedback**: Trigger a lightweight Toast alert (e.g. Sonner) with auto-dismiss after 3 seconds.

---

## 4. Accessibility (WCAG 2.1 AA) Compliance
- Every form `<input>` must have a programmatic `<label>` with `htmlFor` or `aria-label`.
- All interactive elements must show a distinct focus ring on keyboard tab navigation (`focus-visible:ring-2 focus-visible:ring-emerald-500`).
- Color contrast ratio must meet or exceed **4.5:1** for standard body text.
- Image inspection tools (e.g. Rx Inspector) must include zoom buttons and keyboard shortcut alternatives (`+` / `-` / `R`).
