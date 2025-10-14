# Phase 8 Billing Restructuring Plan

## Objectives
- Deliver the Billing service UI in the `frontend` workspace using the Phase 8 scope (billing dashboard, project/task billing, invoices, rates) while preserving all legacy behaviours.
- Reduce cognitive complexity from the 27-28 kB monoliths (`components/billing/*.tsx`, `EnhancedBillingManagement.tsx`) to SonarQube-compliant modules (<250 lines per file, functions <75 lines, complexity <15).
- Align page composition, hooks, and schemas with the reference blueprint in `frontendRestructure` so Phase 9+ teams inherit a consistent structure.

## Current State Snapshot
- Legacy billing UI lives under `frontend/src/components/billing/` and `frontend/src/components/EnhancedBillingManagement.tsx`; each mixes data fetching, filtering, forms, and tables in single components.
- Billing logic depends on `BillingService.ts` and ad-hoc state; forms still use local `useState` instead of the shared Zod + `react-hook-form` stack.
- `billing.schema.ts` already exists but is only partially applied; validation errors are surfaced manually.

## Target Architecture
- Pages directory: `frontend/src/pages/billing/`
  - `BillingDashboardPage.tsx`
  - `ProjectBillingPage.tsx`
  - `TaskBillingPage.tsx`
  - `InvoiceManagementPage.tsx`
  - `RateManagementPage.tsx`
  - `pages/billing/components/` for shared visual elements: `BillingCard.tsx`, `BillingTable.tsx`, `BillingFilters.tsx`, `InvoiceForm.tsx`, `RateForm.tsx`, `ExportOptions.tsx`, `BillingSummary.tsx`.
- Hooks: `frontend/src/hooks/useBillingData.ts` (data loading + cache), `useBillingFilters.ts`, `useInvoiceActions.ts`, aligning naming with existing `frontend/src/hooks`.
- Context: extend `store/contexts` with `BillingContext.tsx` for cross-page state (selected project/task, active billing period).
- Schemas: split `billing.schema.ts` into focused exports (`billingDashboardSchema`, `invoiceSchema`, `rateSchema`) and reuse through the new forms.
- Styling: use utility-first Tailwind classes, replicating patterns from `frontendRestructure/src/components`.

## Routing & Access
- Add nested routes under `/dashboard/billing` in `App.tsx` (Phase 2.3 outcome) using `ProtectedRoute`:
  - `/dashboard/billing` (Super Admin, Management)
  - `/dashboard/billing/projects/:projectId` (Management, Manager)
  - `/dashboard/billing/tasks/:taskId` (Manager, Lead)
  - `/dashboard/billing/invoices` (Super Admin, Management)
  - `/dashboard/billing/rates` (Super Admin)
- Sidebar integration follows the role-aware menu pattern in `AppLayout` (`frontend/src/layouts/AppLayout.tsx`) with feature flags wired from RBAC constants.

## Migration Steps
1. **Scaffold** the `pages/billing` directory from the `frontendRestructure` reference (copy layout patterns, not logic).
2. **Extract shared UI**: move tables/charts/cards into `pages/billing/components`, add index barrel for exports, ensure each component stays <200 lines.
3. **Adopt hooks & contexts**: implement `useBillingData` to wrap `BillingService` calls with loading/error handling and audit logging triggers; update TODO Phase 8.1 entries once scaffolding lands.
4. **Refactor forms**: rebuild invoice and rate modals as pages/forms using `FormField`, `FormActions`, and the Zod resolvers; retire inline state.
5. **Wire routing**: register routes, connect breadcrumbs, and update sidebar groups; confirm deep-link navigation within BrowserRouter.
6. **Parity testing**: replicate current flows (project selection, overrides, invoice export) with Vitest component tests and a Playwright smoke suite; ensure audit logs still fire via backend instrumentation.
7. **Cleanup**: after verification, delete obsolete billing components and shrink `EnhancedBillingManagement.tsx` to a thin redirect wrapper or remove entirely.

## Compliance & Quality Gates
- Run `npm run lint` and `npm run test` (root) plus targeted `npm --prefix frontend run test:e2e -- --grep Billing`.
- Enforce Sonar metrics locally by checking file sizes and function complexity (use VS Code SonarLint or `yarn sonar` if available).
- Capture screenshots for Super Admin, Management, and Manager views to attach to the Phase 8 PR.

## Risks & Mitigations
- **Role drift**: lock routes behind explicit role arrays; add unit tests for `useRoleAccess` guard behaviours.
- **Data coupling**: shared state between billing and timesheets might regress; validate via regression script in `test-frontend.cjs`.
- **Timeline**: coordinate with TODO.md to avoid overlap with Phase 7 clean-up; mark Phase 8 tasks "in_progress" sequentially to keep visibility.
