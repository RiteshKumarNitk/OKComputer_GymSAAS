# ARCHITECTURE REVIEW

## 1. System topology

```
Browser (React SPA, Vite build, react-router-dom)
        │  fetch() via src/api/apiClient.ts, Bearer JWT + x-tenant-id header
        ▼
Vercel serverless function  (api/index.ts → server/index.ts, a single Express app)
        │  Prisma Client (@prisma/adapter-pg)
        ▼
PostgreSQL (Neon, inferred from a leaked connection string — see SECURITY_REPORT.md)

Side integrations from the server: Cloudinary (uploads), Firebase Admin (push),
WhatsApp Cloud API + Twilio (messaging), Redis (OTP storage), Razorpay (payments),
Playwright/Google Places (lead scraping).
```

There is no Next.js layer, no server components, no route handlers in the App Router sense, and no NextAuth session layer. All "backend" logic is one Express app.

## 2. Frontend architecture (`src/`)

- **Routing**: `src/App.tsx` defines routes with `react-router-dom`. Public marketing/auth routes are separate; a `/member/*` subtree uses `MemberLayout`; **everything else is a single catch-all route wrapped in one `<ProtectedRoute>` with no `requiredRoles`.** `ProtectedRoute.tsx` exports role-specific wrappers (`SuperAdminRoute`, `GymOwnerRoute`, etc.) that exist in code but **are never used** in `App.tsx`. Role gating is therefore cosmetic (sidebar-only, in `DashboardLayout.tsx`), not enforced at the routing layer — any authenticated user can navigate directly to any URL regardless of role. This is a real authorization gap, detailed further in `SECURITY_REPORT.md`.
- **State/data**: TanStack Query for server state (no evidence of a separate client-state library like Zustand actually wired into feature code, despite being a dependency), React Hook Form + Zod for forms.
- **API layer**: a single `src/api/apiClient.ts` wraps `fetch`, attaches `Authorization: Bearer <jwt>` and an `x-tenant-id` header from `localStorage`. The server never reads `x-tenant-id` (tenant scoping comes from the JWT payload instead) — this header is dead weight, not a vulnerability, but it's misleading code that suggests a security control that isn't actually there.
- **Component organization**: `components/ui` (shadcn primitives), `components/common` (shared DataTable/Pagination/StatCard/etc — a genuinely reusable layer, well factored), `features/*` (domain modules), `pages/app`, `pages/admin`. The convention is reasonable, but is not followed consistently — see "duplicate/dead pages" below and in `CODE_AUDIT.md`.
- **Duplicate & unreachable pages**: several page files exist that are never imported by `App.tsx` and sit alongside a routed, near-duplicate version of the same feature: `pages/app/AnalyticsPage.tsx`, `pages/app/AttendancePage.tsx`, `pages/app/WorkoutsPage.tsx`, `pages/app/MembersPage.tsx`, `pages/admin/SuperAdminPage.tsx`, `features/renewals/RenewalsPage.tsx`. Notably `pages/admin/SuperAdminPage.tsx` is functionally *more complete* (real feature-flag/subscription mutations) than the routed `pages/admin/superadmin/*` split it was presumably refactored out of — this looks like an in-progress refactor that was abandoned halfway, leaving the better implementation orphaned. This is a "read every file" trap: a naive audit of only routed pages would have missed the more capable implementation entirely.
- **No Server Components / Suspense / streaming**: not applicable — this is a client-rendered Vite SPA, not Next.js. There is no code-splitting evidence (no `React.lazy`/`import()` found in routing), meaning the entire route tree ships in one bundle. See `PERFORMANCE_REPORT.md`.

## 3. Backend architecture (`server/`)

`server/index.ts` (356 lines) is the architectural weak point of the backend. It mixes four different patterns in one file:

1. App/middleware setup (CORS, JSON body parsing, Firebase/Cloudinary init).
2. Mounted route modules (`app.use("/api/members", memberRoutes)`, etc. — 19 modules).
3. **Six inline route handlers written directly in `index.ts`** (member-workout-today, member-workout-update, and full CRUD for `workout_templates`) that duplicate the pattern used everywhere else instead of living in a route/controller file — inconsistent, and these are exactly the handlers found to be missing tenant scoping on update/delete (see `SECURITY_REPORT.md` and `DATABASE_REVIEW.md`).
4. **A generic CRUD factory** (`createCrudRoutes`, from `server/config/crudHelper.ts`) registered 25 times for simple resources (members, memberships, trainers, leads, invoices, etc.), each call configuring `searchFields`/`filterFields`/`include`/per-verb `roles`. This is a good abstraction in principle (consistent pagination, consistent role-gating) and is the **one place role checks are applied consistently** — but it coexists with hand-written routes (`memberRoutes.ts`, etc.) that re-implement the same resources with their own ad hoc auth checks, so a developer has to know which of two systems governs any given endpoint.

There is no `requireRole`/`authorize()` shared middleware used by the hand-written route files (a `server/config/roles.ts` with role-hierarchy helpers exists but is **never imported anywhere**) — every hand-written route inlines its own `if (req.role !== 'x')` check, which is how the unauthenticated/under-authenticated routes documented in `SECURITY_REPORT.md` happened.

## 4. Deployment model and a structural bug it causes

`api/index.ts` is a one-line Vercel serverless function wrapper around the Express app (`export default app`), and `server/index.ts:347-350` only calls `app.listen()` when `NODE_ENV !== "production"` — confirming the production deployment target is genuinely serverless (Vercel functions), not a long-running Node process.

This directly conflicts with code in the same file:

- `server/index.ts:291,317` — `setInterval(runPhase1Jobs, 6 * 60 * 60 * 1000)` (renewal reminders, auto follow-ups, missed-follow-up detection).
- `server/index.ts:320-342` — a second `setInterval` "legacy alert cron" running daily.

**On Vercel, serverless functions are spun up per-request and torn down; `setInterval` timers do not persist between invocations and are not guaranteed to run at all in production.** This means the renewal-reminder, follow-up-automation, and expiry-alert jobs described in the code likely **do not run reliably (or at all) in the deployed environment**, despite the code appearing to implement them. This is a critical, easy-to-miss architectural defect — the feature looks implemented when read in isolation, but the deployment model silently disables it. Treated as Critical in `DEVELOPMENT_ROADMAP.md`; the fix is a real scheduler (Vercel Cron, a queue, or an external scheduler hitting a route handler) rather than in-process timers.

## 5. Testing & CI architecture

- `vitest.config.ts` only includes `server/__tests__/**/*.test.ts`. Only two test files exist (`cors.test.ts`, `health.test.ts`) — CORS config and a health check. **There is no test coverage for auth, tenant isolation, CRUD routes, payment flows, or any frontend code**, despite `@testing-library/react` being installed as a dependency (implying frontend testing was intended but never built out).
- `.github/workflows/deploy.yml` runs `npm test` and `npm run build` on push/PR to `main`, then deploys to Vercel via `amondnet/vercel-action`. The pipeline structure is sound, but because the test suite is nearly empty, "tests passing" provides almost no real confidence gate before deploy.
- The CI workflow deploys `--prod` on **every push to `main`**, including on `pull_request` triggers with no separate preview/staging gate visible in this file (Vercel's own PR-preview behavior may cover this outside the workflow, but it isn't explicit here).

## 6. What's genuinely well-structured

To be fair and specific, not just critical:

- `server/config/crudHelper.ts`'s generic CRUD factory is a solid abstraction: it centralizes pagination (capped at 100/page), tenant scoping via `req.tenantId` (never trusting client-supplied tenant IDs), search/filter fields, and per-verb role arrays in one place. Most of the 25 resources registered through it are correctly tenant-scoped and role-gated by construction.
- `src/components/common/*` (DataTable, Pagination, StatCard, FormDialog, ConfirmDialog, EmptyState, PageWithTabs, `usePagination` hook) is a genuinely reusable shared UI layer used consistently across most feature pages — this is good frontend architecture and avoids the duplication you'd otherwise expect from ~70 page components.
- Prisma model coverage is broad and relationally sensible (see `DATABASE_REVIEW.md` for the gaps).
- The OTP/phone-login service correctly hashes OTPs with bcrypt before storing them in Redis and enforces a max-attempt counter (implementation details/caveats in `SECURITY_REPORT.md`).

## 7. Architectural recommendations (summary — full effort estimates in `DEVELOPMENT_ROADMAP.md`)

1. Replace the two `setInterval`-based cron jobs with a scheduler compatible with serverless (Vercel Cron Jobs hitting a dedicated route, or an external scheduler).
2. Consolidate authorization into one mechanism — either extend `createCrudRoutes`'s role system to cover the hand-written routes, or build a shared `requireRole()` middleware (the unused `server/config/roles.ts` is already most of the way there) and apply it everywhere.
3. Delete the six inline route handlers from `server/index.ts` into proper route/controller files, consistent with the rest of the codebase.
4. Resolve the duplicate/orphaned page problem: pick one implementation per feature (in most cases the routed one; for Super Admin, the *unrouted* `SuperAdminPage.tsx` is the better implementation) and delete the other.
5. Introduce code-splitting (`React.lazy` + route-based `import()`) — currently the whole app ships as one bundle.
