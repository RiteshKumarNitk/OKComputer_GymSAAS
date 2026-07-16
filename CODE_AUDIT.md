# CODE AUDIT

## 1. Dead files and unreachable code

| File | Status | Notes |
|---|---|---|
| `src/pages/app/AnalyticsPage.tsx` | Dead, not routed in `App.tsx` | Superseded by `src/pages/app/members/MemberAnalyticsPage.tsx` |
| `src/pages/app/AttendancePage.tsx` | Dead, not routed | Superseded by `src/pages/app/members/MemberAttendancePage.tsx` |
| `src/pages/app/WorkoutsPage.tsx` | Dead, not routed | Superseded by `src/pages/app/members/MemberWorkoutsPage.tsx` |
| `src/pages/app/MembersPage.tsx` | Dead, not routed | Near-duplicate of `src/pages/app/members/MemberDirectoryPage.tsx` |
| `src/pages/admin/SuperAdminPage.tsx` | Dead, not routed | **Functionally more complete** than the routed `pages/admin/superadmin/*` split (has real feature-flag and subscription-assignment mutations the routed pages lack) — see recommendation below |
| `src/features/renewals/RenewalsPage.tsx` | Dead, not routed | Superseded by `src/pages/app/members/MemberRenewalsPage.tsx` |
| `prisma/schema_additions.prisma` | Dead, not read by any Prisma command | Duplicates models already in `schema.prisma` |
| `src/lib/prisma.ts` | Dead, unconfigured second `PrismaClient`, imported nowhere live | `server/config/db.ts` is the real, configured client |
| `server/config/roles.ts` | Dead, never imported | A complete, unused role-hierarchy utility — see `ARCHITECTURE_REVIEW.md` §7 and `SECURITY_REPORT.md` C5 |

**Recommendation:** don't just delete the "duplicate" side reflexively — `pages/admin/SuperAdminPage.tsx` should be reviewed as the *keeper* and the routed `pages/admin/superadmin/*` pages migrated to match its mutations (see `FEATURE_GAP_ANALYSIS.md` for what's missing in the routed versions). For the other five, the routed version is the more complete one and the dead file should simply be deleted.

## 2. Root-level clutter (not part of `src/`, `server/`, or `prisma/`)

Debug/one-off scripts sitting at the repository root instead of a `scripts/` directory or deleted after use: `check_db_members.ts`, `check_members.ts`, `check_tables.ts`, `check_tenants.ts`, `create_member_pg.ts`, `create_user.js`, `create_user.ts`, `create_userprofile_pg.ts`, `sync_users.ts`, `sync_users_pg.ts`, `insert_test_user.js`, `insert_test_user.cjs`, `read_errors.js` (hardcodes a path specific to the original author's machine: `c:/Users/RITESH/Downloads/...`). Several of these hardcode the live database password — see `SECURITY_REPORT.md` C1, which is the actionable version of this finding; here it's flagged purely as code hygiene (scripts belong in a `scripts/` folder, read config from env, and shouldn't accumulate at root indefinitely).

Also at root: `output_members.json` (a committed query-result dump with member PII), `"tall git-filter-repo"` (an accidental `git log` redirect artifact with a space in the filename), `server/error.txt`, `server/output.txt` (debug output dumps). None of these belong in version control.

## 3. Large files / components doing too much

| File | Lines | Assessment |
|---|---|---|
| `src/pages/app/members/MemberProfilePage.tsx` | 899 | A single component rendering ~10 tabbed sub-views (memberships, follow-ups, payments, attendance, workouts, diet, health assessment, documents, biometric, report card), each with its own queries/mutations inline. This is the strongest refactor candidate in the codebase — each tab should be its own component file under a `MemberProfile/` folder, both for readability and to avoid every tab's query running/re-rendering together. |
| `src/components/admin/TenantOnboardingWizard.tsx` | 605 | A 5-step wizard in one file/one state object. Reasonable to keep as one flow, but each step's form section (currently inline JSX blocks) would benefit from extraction into `Step1BasicInfo`, `Step2OwnerDetails`, etc. components for testability. |
| `src/features/leads/LeadsPage.tsx` | 755 | Combines list view, filters, Kanban-style status handling, CSV export, and follow-up creation in one file. Split filter/export logic into hooks (`useLeadsFilters`, `useLeadsExport`) to shrink the component itself. |
| `src/layouts/DashboardLayout.tsx` | 633 | Sidebar nav config, role-based filtering, notification integration, and member sub-sidebar all live here. The static nav-item configuration (which routes exist per role) should be extracted to a plain data file/module, separate from the layout component's rendering logic. |
| `server/index.ts` | 355 | Already covered in `ARCHITECTURE_REVIEW.md` §3 — mixes app setup, 19 route mounts, 6 inline route handlers, 25 CRUD factory registrations, and two cron-style `setInterval` jobs in one file. This is the single highest-value structural cleanup target in the backend. |

None of these are "wrong," but all five would benefit from decomposition before the next major feature is added to them — right now, adding anything to `MemberProfilePage.tsx` or `server/index.ts` requires holding the entire file's context in your head.

## 4. Duplication and overlapping features

- **Staff management exists as two separate, non-overlapping entities**: `src/pages/app/StaffPage.tsx` (backed by `usersApi`, i.e. the `UserProfile` model — login-capable staff with roles) and `src/features/front-desk/StaffManagement.tsx` (backed by `frontDeskApi`, a separate `FrontDesk` model). These appear to model genuinely different things (system users vs. front-desk shift staff) but the naming overlap ("Staff" in both) is confusing without reading the code, and it's worth confirming with product intent whether these should actually be merged or are correctly separate.
- **Services & Pricing (`ServicesPage.tsx`) duplicates Membership Packages (`MembershipPackagesPage.tsx`)** — both manage what is functionally plan/pricing data through separate CRUD surfaces (`services` and `memberships` resources respectively). Worth a product decision on whether "Services" is meant to be non-membership add-ons (classes, PT sessions) rather than a true duplicate — if so, rename the page/nav label to make the distinction clear, since right now it reads as redundant.
- **`Member Subscriptions` page hardcodes status** (`MemberSubscriptionsPage.tsx` — "Status" column always shows "Active", "Auto-Renew" always "OFF" regardless of actual data) while a real, correct status field exists on `Member` and is used correctly elsewhere (e.g. `MemberDirectoryPage.tsx`) — this is a straightforward bug/leftover-during-development issue rather than a duplication issue, but sits in the same file family.
- The previously-documented schema/wizard field-name mismatch described in `README.md` (Tenant model missing `ownerEmail`, `businessType`, `gstNumber`, etc.) **has already been fixed** — `prisma/schema.prisma:238-255` now contains all the fields `TenantOnboardingWizard.tsx` submits, and the field names match (`ownerName`, `ownerEmail`, etc., both camelCase, no snake/camel mismatch remaining). Flagging this as **resolved**, not open — the README's embedded bug ticket at the bottom of the file is stale and should be deleted now that the fix has landed.

## 5. Naming consistency

- Prisma models and TypeScript code consistently use `camelCase` — good.
- The Express layer converts between `camelCase` (Prisma) and `snake_case` via `snakeToCamel`/`camelToSnake` helpers in `server/config/db.ts`, described in a comment as being for "Supabase shim compatibility" (a migration leftover, see `MIGRATION_AUDIT.md`). Given Supabase is fully removed, it's worth confirming whether the frontend actually still needs snake_case anywhere, or whether this conversion layer is now pure legacy overhead run on every request/response.
- Route path naming is inconsistent between kebab-case resources (`/api/trainer-slots`, `/api/follow-ups`, `/api/member-workouts`) and snake_case resources (`/api/workout_templates`, `/api/saas_plans`, `/api/saas_subscriptions`, `/api/saas_invoices`) registered via the same `createCrudRoutes`/inline-handler mechanisms — no functional bug, but an inconsistency a new engineer will trip over when guessing an endpoint URL.

## 6. Type safety

- Zod is used for validation in the auth flow (`server/validators/authValidators.ts` + `server/middleware/validate.ts`) — a sound pattern, but it is **not applied to most other routes** (hand-written CRUD routes mostly do manual `if (!field)` checks or no validation at all beyond what Prisma's schema enforces at the DB level). Extending Zod validation to the remaining route files would catch malformed input earlier and produce consistent error shapes.
- Several Express handlers type `req` as `any` (e.g. `req: any` throughout the inline handlers in `server/index.ts:104,122`, widely elsewhere) instead of extending Express's `Request` type with the `userId`/`role`/`tenantId` properties `authenticate` attaches. This defeats TypeScript's usefulness for exactly the request properties most central to the app's security model (role/tenant checks) — a typo like `req.tenandId` would not be caught at compile time today.
- **Recommendation:** define one `AuthenticatedRequest` interface (extending `express.Request` with `userId: string; role: string; tenantId: string`) in a shared types file and use it everywhere instead of `any`, closing an entire class of potential typo-driven bugs in exactly the code responsible for security enforcement.

## 7. Error handling

- `server/middleware/errorMiddleware.ts` exists as a final Express error handler — appropriate pattern.
- However, the overwhelming majority of route handlers wrap their body in `try { ... } catch (err: any) { res.status(500).json({ error: err.message }) }`, which means **raw internal error messages (including potential Prisma/SQL error text) are returned directly to the client** in every failure case, rather than being logged server-side and a generic message returned to the caller. This is both an information-disclosure concern (stack/query details can leak schema info) and an inconsistency with the dedicated `errorMiddleware.ts` that exists specifically to centralize this.
- **Fix:** route caught errors through `next(err)` to let `errorMiddleware.ts` handle client-facing formatting and server-side logging consistently, reserving direct `res.status(500).json(...)` only for truly generic fallbacks.

## 8. Testing

Covered in depth in `FINAL_PROJECT_SCORE.md`, summarized here: `vitest.config.ts` only runs `server/__tests__/**` and only two test files exist (`cors.test.ts`, `health.test.ts`). Despite `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `playwright` all being installed as dependencies, there is no evidence any frontend or end-to-end test was ever written — these are configured-but-unused tooling investments.

## 9. Summary of highest-value cleanups

1. Delete the six dead/duplicate page files (after reconciling `SuperAdminPage.tsx`'s better mutations into the routed super-admin pages).
2. Delete `prisma/schema_additions.prisma`, `src/lib/prisma.ts`, or wire the latter in properly and remove the duplicate from `server/config/db.ts`.
3. Route caught server errors through `errorMiddleware.ts` instead of leaking raw error messages.
4. Introduce an `AuthenticatedRequest` type and remove `req: any` from role/tenant-sensitive handlers.
5. Break up `MemberProfilePage.tsx` and `server/index.ts` before either grows further.
6. Remove the stale embedded bug-ticket text from the bottom of `README.md` now that the underlying issue is fixed.
