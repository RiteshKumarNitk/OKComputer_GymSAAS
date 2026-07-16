# PERFORMANCE REPORT

## 1. Bundle size / code splitting

**Finding:** Zero uses of `React.lazy`, `Suspense`, or dynamic `import()` found anywhere in `src/` (repo-wide grep returned no matches). `src/App.tsx` statically imports every page component — marketing pages, all ~70 admin pages, all 5 super-admin pages, the member portal, and every feature module — into a single route tree.
**Impact:** the entire application (including super-admin screens a `member` role will never see, and marketing pages an authenticated user will never revisit) ships in one JS bundle on first load. `TenantOnboardingWizard.tsx` (605 lines) and `MemberProfilePage.tsx` (899 lines) alone are non-trivial chunks being downloaded by every user regardless of whether they'll ever touch them.
**Fix:** convert route-level imports in `App.tsx` to `React.lazy(() => import(...))` wrapped in a top-level `<Suspense>` with a loading fallback. This is a mechanical, low-risk change with an outsized first-load-time payoff, especially for the `member` role who only needs the `/member/*` subtree.
**Severity:** High. **Effort:** 1 day (route conversion + verifying Suspense fallback UX).

## 2. Memoization discipline

**Finding:** `useMemo`/`useCallback`/`React.memo` appear only 16 times across 7 files in the entire `src/` tree (out of 127 files). Given the app is dominated by data tables, charts (Recharts), and forms with derived/filtered lists (`LeadsPage.tsx`, `MemberDirectoryPage.tsx`, `FollowUpsPage.tsx`, etc.), this suggests most filter/derived-data computations and callback props re-run/re-allocate on every render rather than being memoized.
**Impact:** on pages with larger datasets (leads, members, invoices), typing in a search box or toggling a filter likely triggers full list re-computation and re-render of every row/chart on each keystroke, since there's little evidence of memoized derived values or `React.memo`-wrapped row components.
**Fix:** this isn't worth blanket-applying — premature memoization has its own costs. Targeted priority: (1) memoize the filtered/sorted list computations in `DataTable`-consuming pages, (2) wrap the shared `components/common/DataTable.tsx` row renderer in `React.memo` if it isn't already, since it's reused across ~20+ pages and any improvement compounds.
**Severity:** Medium. **Effort:** 1-2 days for the shared `DataTable`/`StatCard` layer; ongoing per-page after that.

## 3. Server-side aggregate computation done client-side

**Finding:** `DashboardPage.tsx` and `pages/admin/superadmin/Dashboard.tsx` extrapolate monthly trend charts from a single `totalRevenue` number returned by `dashboardApi.getStats()`, computed in the browser on every dashboard visit.
**Impact:** beyond the data-integrity issue already flagged in `FEATURE_GAP_ANALYSIS.md` (the numbers are fabricated), this is also wasted client CPU recomputing the same derived shape every load instead of the backend returning real precomputed time-series data once.
**Fix:** move real aggregation to the backend (a scheduled rollup job or a grouped Prisma query with `groupBy`), return actual time-series data, and remove the client-side fabrication entirely — this is both a correctness fix and a performance one.
**Severity:** Medium (performance angle); High (correctness angle, tracked in `FEATURE_GAP_ANALYSIS.md`). **Effort:** 2-3 days.

## 4. List/report endpoints returning unbounded data (backend, cross-referenced)

Covered in full in `DATABASE_REVIEW.md` D5: `attendanceRoutes.ts`, `reportRoutes.ts` (revenue/attendance/member-growth), and `billingRoutes.ts` (invoices) return all matching rows with no pagination, unlike the `crudHelper.ts`-backed resources which correctly cap at 100/page. This directly affects frontend performance on the pages that call these endpoints (`ReportsPage.tsx`, `SalesReportPage.tsx`, `features/attendance/AttendanceHistory.tsx`) as data volume grows — large payloads mean slow JSON parse, slow render, and slow network transfer, compounding with the memoization gap in §2.
**Severity:** Medium-High as data grows. **Effort:** see `DATABASE_REVIEW.md` D5 (4-6 hours).

## 5. Image handling

**Finding:** File uploads go through Cloudinary (`server/routes/uploadRoutes.ts`) with no size limit (see `SECURITY_REPORT.md` H5) and no transformation/resizing parameters applied on upload (`cloudinary.uploader.upload(fileStr, { folder: "gym_saas_uploads" })` — no `width`/`height`/`quality`/`format` options). Cloudinary is capable of on-the-fly and upload-time optimization, but the app isn't requesting it.
**Impact:** full-resolution, unoptimized images (member photos, gym logos, uploaded documents) are stored and presumably served as-is, increasing page weight anywhere they're displayed (member directory avatars, profile photos) without any evidence of responsive/optimized delivery (no `f_auto,q_auto`-style Cloudinary URL transforms found in the frontend image rendering code checked).
**Fix:** add Cloudinary upload-time transformations (max dimensions, `quality: auto`, `fetch_format: auto`) and/or apply delivery-time transformation parameters in `<img>` src URLs.
**Severity:** Medium. **Effort:** 0.5-1 day.

## 6. Serverless-specific performance/reliability risk (cross-referenced from Architecture)

The two `setInterval`-based background jobs in `server/index.ts` (renewal reminders/follow-ups every 6 hours, expiry alerts daily) run inside a Vercel serverless function whose instances are short-lived and spun up per-request. Beyond the correctness concern already raised in `ARCHITECTURE_REVIEW.md` (the jobs likely don't fire reliably at all), any invocation that *does* happen to trigger them adds unpredictable, unbounded latency to whatever unlucky request's cold-start it piggybacks on — a request handling a member's dashboard load could incidentally trigger a full renewal-scan job in the same execution context, if the process happens to have been alive long enough. This an architecture-level performance/reliability issue as much as a features-not-running one.
**Severity:** High. **Effort:** see `ARCHITECTURE_REVIEW.md` §4 recommendation (move to Vercel Cron / external scheduler).

## 7. React Query configuration

Not independently verified at the line level for cache-time/stale-time tuning across all ~40+ query hooks used app-wide (out of scope to read every call site at this effort level); flagged as a follow-up area — if most queries use TanStack Query's defaults without tuning `staleTime`, pages the user revisits frequently (dashboard, member directory) may refetch more often than necessary. Worth a follow-up pass specifically auditing `useQuery` call sites for stale-time configuration once the higher-severity items above are addressed.

## 8. What's fine as-is

- TanStack Query is used as the data-fetching layer throughout (not raw `useEffect` + `fetch` scattered everywhere), which is the right foundation for caching/dedup even where stale-time tuning hasn't been done.
- The generic `DataTable`/`Pagination`/`usePagination` components (`src/components/common/`) provide one consistent, reasonably efficient list-rendering pattern reused across most pages rather than each page reinventing table rendering.
- Backend pagination via `crudHelper.ts` (capped at 100/page) is correctly implemented for the 25 resources routed through it — the gaps are confined to the hand-written routes noted in §4.

## Summary

| ID | Finding | Severity |
|---|---|---|
| P1 | No code-splitting — entire app ships as one bundle | High |
| P2 | Serverless cron jobs unreliable, latency-unpredictable | High |
| P3 | Minimal memoization on data-heavy pages | Medium |
| P4 | Client-side fabrication of chart data (also a correctness bug) | Medium |
| P5 | Unbounded report/list endpoints | Medium-High (grows with data) |
| P6 | Unoptimized image uploads/delivery | Medium |
| P7 | React Query stale-time tuning unverified | Follow-up |
