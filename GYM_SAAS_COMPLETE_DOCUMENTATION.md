# GYM SAAS — COMPLETE PRODUCT & ENGINEERING DOCUMENTATION

**Prepared as:** a CTO-level walkthrough for a new engineering team and for investors.
**Date:** 2026-07-16. **Branch:** `dev1`.
**Basis:** every claim in this document is traceable to a specific file in this repository — read directly, not inferred — and to three verified rounds of fixes applied earlier in this engagement (referenced throughout as **Batch 1**, **Batch 2**, **Batch 3**).

> **On screenshots:** this document was produced without a running instance of the app in front of me, so I have not included screenshots and have not fabricated placeholder images. Everywhere a screenshot would help, I've instead given the exact route, the exact component file, and a description of what renders there — accurate enough for someone to open the page and see it, but not a substitute for actually capturing it. That's a follow-up task for whoever owns this doc next: run `npm run dev`, walk each route below, and drop real screenshots in.

---

# 1. PROJECT OVERVIEW

## What are we building?

A multi-tenant SaaS platform for running a gym or fitness business end-to-end: member management, attendance, memberships/billing, staff and payroll, a CRM for sales leads, a point-of-sale for retail, workout/diet programming, and owner-facing analytics — plus a "platform admin" layer so the company selling this software (you) can manage every gym (tenant) running on it, bill them, and impersonate their accounts for support.

It ships as one full-stack codebase: a React single-page app (the app gym staff and members use) talking to an Express API (deployed as a single Vercel serverless function), backed by a Postgres database via Prisma. There's also a separate Flutter mobile app (`gymowl_app/`) in the same repo, out of scope for this document.

**Correction worth stating up front:** if you've seen a brief describing this as a Next.js / NextAuth / Stripe / Neon stack, that brief was wrong. The real stack (verified against `package.json`, `prisma.config.ts`, and the actual route files) is **Vite + React 18 + react-router-dom + Express 5 + Prisma 7 + Postgres + hand-rolled JWT/OTP auth + Razorpay**. It was originally built on Supabase and migrated off it once already (see §9 and §10). It has never used Next.js, NextAuth, or Stripe — those don't exist anywhere in this codebase.

## What problem does it solve?

Independent gyms in India (the product's evident target market — Razorpay for payments, INR/paise as the currency unit throughout the schema, WhatsApp as the primary communication channel) run on a mix of a paper register, a WhatsApp group, and maybe a spreadsheet. That means:
- No reliable way to know who's paid, who's about to lapse, or who hasn't shown up in two weeks.
- No automated renewal reminders, so members silently churn.
- No structured lead pipeline for walk-in enquiries — leads get lost.
- No POS for the protein/supplement/water sales that make up 20–30% of a gym's real revenue (a number this project's own `MASTER_PLAN.md` cites as the reason POS was prioritized).
- No visibility for the owner into revenue, attendance trends, or staff performance without manually compiling it.

This product centralizes all of that in one system, with role-appropriate views for the owner, managers, trainers, front-desk staff, and the members themselves.

## Who are the customers?

Two distinct customer types, because this is a two-sided SaaS:
1. **Gym owners** (the actual paying tenants) — small-to-mid-size independent gyms, the `gym_owner` role. They sign up (or are onboarded by you), get a branded instance, and manage their own staff/members/billing within it.
2. **You, the platform operator** — the `super_admin` role, who manages the roster of gym-owner tenants, their subscription plans, their billing to *you*, and provides support (including a working tenant-impersonation feature — see §4).

## Why would someone buy this software?

Because the alternative is a paper register and a WhatsApp group, and the switching cost is low: onboarding is a single wizard (`TenantOnboardingWizard.tsx`), and the day-one value (member directory, attendance, WhatsApp renewal reminders) is real and working today (see §2 and §3 for exactly what's real vs. not). The differentiated pieces — WhatsApp/SMS automation with real provider integrations, a working POS with live inventory deduction, and an unusual B2B lead-scraping tool (see §16) — are further along than many competitors' entry tiers.

## Business model

Classic B2B SaaS: gyms pay a recurring subscription to use the platform. The schema (`SaasPlan`, `SaasSubscription`, `SaasInvoice` — see §6) models this directly: plans have a name, a price in paise, a duration in days, and a JSON feature list; subscriptions link a tenant to a plan with a start/end date and status; invoices are generated per tenant with a status (`paid`/`pending`/`failed`/`overdue`).

## SaaS pricing model

**What's real vs. what's a mockup, stated plainly:** the data model for tiered plans is real and correctly structured. What's *not* real yet is the operator-facing UI to manage those plans — `pages/admin/superadmin/Subscriptions.tsx` fetches plans from the API but then renders three **hardcoded** pricing tiers (Lite/Pro/Enterprise) in JSX regardless of what's actually in the database, and none of its "Edit Plan Settings" buttons are wired to anything. So today, plan pricing can only be set by inserting rows directly into `SaasPlan` — there's no working admin screen for it. This is one of the highest-priority gaps in §12.

## Revenue model

Recurring subscription revenue from gym-owner tenants (via `SaasSubscription`/`SaasInvoice`, billed by you), plus — inside each tenant — the gym owner's own revenue from members (`Membership`/`Payment`/`Invoice`) and retail (`Product`/POS). The platform doesn't currently take a cut of in-tenant transactions (no marketplace/commission model in the schema); it's a flat subscription-fee SaaS.

## Product vision

Per the project's own internal roadmap doc (`MASTER_PLAN.md`, written by a previous contributor and still in the repo, reproduced here because it accurately describes what was being aimed for): move beyond basic CRUD into "intelligent, revenue-generating, engagement-focused" territory — real business intelligence instead of stat cards, an automated lead pipeline, hardware-integrated access control, a member-facing PWA, and full accounting. Some of that vision is built (POS, WhatsApp campaigns, lead management); a lot of it is still aspirational (see §12 and §15).

---

# 2. CURRENT PROJECT STATUS

## Overall completion: ~60–62%

(Up a few points from the ~58% recorded in `FINAL_PROJECT_SCORE.md` at the start of this engagement, after Batches 1–3 closed the worst tenant-isolation and authentication gaps. Feature completeness didn't change — those batches were entirely about making existing features *safe*, not adding new ones.)

## What is production-ready

- Member CRUD, directory, search/filter/export (`MemberDirectoryPage.tsx`, backed by `/api/members`).
- Attendance (manual check-in and QR-kiosk check-in), both wired to real endpoints (`/api/attendance`, `/api/qr/checkin`).
- Membership plan CRUD and renewals with WhatsApp deep-link reminders.
- POS with real inventory deduction on checkout (`features/pos/POSPage.tsx`).
- Lead/CRM management with follow-up automation.
- WhatsApp Cloud API and Twilio SMS integrations (real provider calls, not stubs).
- Core auth (JWT + bcrypt + Redis-backed OTP), now with the Batch 2 authentication gaps closed.
- Tenant data isolation, now backed by a structural safety net (Batch 3), not just per-query discipline.

## What is partially completed

- Owner/super-admin dashboards — real current-state numbers, but trend charts are fabricated (see below).
- Sales reports — real data, but several filter controls are decorative.
- SaaS billing pages — real invoice fetch and PDF generation, but plan-tier text is hardcoded.
- Front-desk vs. system-user staff — two separate, overlapping data models (`FrontDesk` vs. `StaffProfile`/`UserProfile`) that were never reconciled.

## What is missing

- A working super-admin plan/subscription management screen (see §1's pricing note).
- Real backend analytics/aggregation — every "trend" chart in the app is either extrapolated client-side from one number or a literal `MOCK_*` array.
- Recurring/auto-charge billing — Razorpay integration only does one-off order capture, not subscriptions.
- Audit logging of sensitive actions (the `AuditLog` table exists in the schema but nothing writes to it from any route reviewed).
- Class/session capacity limits and waitlists.
- Two-factor authentication (explicitly disabled in the UI with a "Coming Soon" label).

## What is fake/demo

- **Super Admin → Subscriptions** (`pages/admin/superadmin/Subscriptions.tsx`): fetches real data, displays hardcoded tiers instead.
- **Super Admin → Settings** (`pages/admin/superadmin/Settings.tsx`): zero state, zero API calls, zero working buttons — a pure static mockup.
- **Super Admin → Dashboard** growth charts: literal `MOCK_REVENUE_DATA`/`MOCK_GROWTH_DATA` constants.
- **Member Subscriptions view**: "Status" column hardcoded to "Active" regardless of actual member status.
- **Follow-Ups table**: several columns fall back to hardcoded literal names ("ARUN KUMAR", "sonu verma") when data is missing.
- **Contact page** (marketing site): the form has no submit handler at all — it's decorative.

## What is fully working (verified against real backend calls, not just UI presence)

Member directory & profile, attendance (manual + QR), membership CRUD & renewals, POS with inventory deduction, leads/CRM, follow-up automation, WhatsApp/SMS campaigns and message templates, notifications (real unread-count polling), workout/diet template CRUD and assignment, lockers, branches, services, scheduling (CRUD, no capacity logic), billing/expenses/invoices (list + PDF), feedback management, visitor/complaint operations log, tenant CRUD and impersonation (super admin), auth (email/password and phone/OTP).

## What should not be released as-is

1. **The migration file from Batch 1 has not been applied to the database yet.** `prisma/migrations/20260716120000_add_tenant_indexes_and_health_fk/migration.sql` exists but `npx prisma migrate deploy` has not successfully run (this sandbox has no network path to the configured Neon database — confirmed directly, error `P1001`). Someone with real DB access needs to run it before the tenant-index/FK improvements take effect.
2. **Two live credentials are still sitting in git history**: a Neon database password (hardcoded in ~10 root-level debug scripts) and a WhatsApp Cloud API token (in `.env.example`). Both need rotating; see `SECURITY_REPORT.md` C1/C2 — this was flagged, not fixed, since it requires action on external dashboards this session has no access to.
3. Anything in the "fake/demo" list above, if presented to a customer as functional.

---

# 3. COMPLETE FEATURE LIST

Status legend: **Complete** (real, working, API-backed) · **Partial** (real + some fabricated/decorative parts) · **Placeholder** (UI shell, not functional) · **Missing** (not built).

| Category | Feature | Purpose | Status | Completion % | Missing pieces | Future improvement |
|---|---|---|---|---|---|---|
| **Member Mgmt** | Member directory, profile, CRUD | Central member record | Complete | 90% | — | Bulk import/export |
| **Attendance** | Manual + QR check-in, history | Track visits | Complete | 80% | Hardware turnstile integration ("Setup Hardware" is decorative by design) | Biometric integration |
| **Memberships** | Plan CRUD, renewals, WhatsApp reminders | Recurring revenue | Complete/Partial | 85% | Subscriptions view has a hardcoded status bug | Auto-charge on renewal |
| **Workout** | Templates, per-member assignment, daily plans | Programming | Complete | 75% | N+1 query pattern on multi-day assignment (perf, not correctness) | Exercise video/GIF library |
| **Diet** | Plan CRUD, meal builder, assignment | Nutrition programming | Complete | 75% | — | Calorie/macro calculator |
| **POS** | Product catalog, cart, checkout, stock deduction | Retail revenue | Complete | 85% | Payment + stock deduction not atomic (two chained calls) | Barcode scanning |
| **CRM / Leads** | Enquiry capture, Kanban-style status, follow-ups | Sales pipeline | Complete | 85% | "Book a Trial" panel data is captured but never submitted | Deal-value tracking |
| **Lead scraping** | Google Places API + JustDial Playwright fallback | B2B prospect sourcing for the gym owner | Complete (functionally) | 80% | Legal/ToS risk on the scraping fallback — see §16 | Replace scraping with licensed data source |
| **Inventory** | Product stock via POS | Retail stock tracking | Partial | 60% | No dedicated inventory/reorder module beyond POS's product list | Low-stock alerts |
| **Expenses** | Expense CRUD by category | Cost tracking | Complete | 75% | No budget/forecast layer | — |
| **Payroll** | `SalarySlip`, `StaffAttendance` models exist | Staff pay | **Missing (backend logic)** | 20% | Schema exists; no computation logic found in any reviewed route | Build payroll calc from attendance |
| **QR Attendance** | QR-code check-in kiosk | Fast check-in | Complete | 85% | — | Member-side QR display polish |
| **Notifications** | In-app unread-count, mark-read | User alerts | Complete | 75% | No delivery-failure visibility to admin | Push notification analytics |
| **Campaigns** | WhatsApp campaign builder, audience targeting | Marketing | Complete | 80% | — | A/B testing |
| **WhatsApp** | Meta Cloud API integration (`whatsappService.ts`) | Messaging | Complete | 85% | — | Template pre-approval workflow |
| **SMS** | Twilio integration (`smsService.ts`) | Messaging fallback | Complete | 80% | — | — |
| **Reports** | Member reports, sales reports | Ops visibility | Complete/Partial | 70% | Several sales-report filters are decorative | Scheduled email reports |
| **Analytics** | Dashboard stat cards + charts | BI | **Partial (mostly fake)** | 25% | Every trend chart is fabricated or hardcoded — see §2 | Real backend aggregation pipeline |
| **Branches** | Multi-location CRUD | Multi-branch gyms | Complete | 80% | No branch-level reporting split | — |
| **Staff** | `StaffPage` (system users) + `StaffManagement` (front desk) | HR | Partial | 65% | Two overlapping, unreconciled staff models | Merge or clearly separate the two |
| **Visitors** | Visitor log CRUD | Front-desk ops | Complete | 80% | — | — |
| **Complaints** | Ticket CRUD | Member service | Complete | 80% | — | SLA tracking |
| **Lockers** | Assign/release with expiry | Facility ops | Complete | 85% | — | — |
| **Lead Management** | See CRM above | — | — | — | — | — |
| **Billing (in-tenant)** | Expenses, payments, invoices, printable invoice | Gym's own finance | Complete | 80% | Invoice "view" is a plain `alert()` | Real invoice viewer |
| **Subscriptions (SaaS)** | Platform-to-tenant billing | Your revenue | **Placeholder (admin UI)** | 40% | See §1 pricing note | Build real plan-management screen |
| **Payments** | Razorpay order/verify, cash | Payment capture | Partial | 60% | No recurring/auto-charge; no server-side webhook confirmation found | Add Razorpay subscriptions/webhooks |
| **Marketing (site)** | Landing/Pricing/Blog/Contact | Top-of-funnel | Partial | 50% | Contact form has no submit handler; Blog is 3 hardcoded cards | CMS backend |
| **Super Admin** | Tenant CRUD, impersonation, dashboard, billing view | Platform ops | Partial | 55% | Subscriptions & Settings sub-pages are non-functional mockups | Build them out |
| **Settings** | Tenant/business/branding settings | Configuration | Complete | 80% | 2FA explicitly disabled | — |
| **Tenant Mgmt** | Onboarding wizard, CRUD, feature flags | Multi-tenancy | Complete | 85% | — | Self-serve signup flow (currently super-admin-only, by design per Batch 2) |

---

# 4. ROLE MATRIX

Six roles, defined once in `server/config/roles.ts` (`ROLES` constant) and mirrored in the Prisma `UserRole` enum: `super_admin`, `gym_owner`, `manager`, `trainer`, `frontdesk`, `member`. Hierarchy (highest to lowest privilege), also from `roles.ts`:

```
super_admin > gym_owner > manager > trainer > frontdesk > member
```

**Important nuance uncovered during this engagement:** frontend navigation visibility (below, from `DashboardLayout.tsx`) and backend authorization are two *separate* mechanisms that aren't fully reconciled. As of Batch 2, the frontend router blocks `member` from the entire CRM tree and gates `/super-admin/*` to `super_admin` only — that's enforced. Per-page role arrays beyond that (e.g. whether a `trainer` can see "Reports") are sidebar-only cosmetics; the real enforcement is on the backend, route by route, and it's inconsistent (`SECURITY_REPORT.md` C5) — some routes match the sidebar exactly, some are more permissive, some less. Treat the table below as "what the UI shows this role," not "what the backend guarantees this role can't do."

### Super Admin
- **Dashboard:** `/super-admin` (`SuperAdminDashboard`) — tenant/invoice counts (real) + revenue/growth charts (fake, see §2).
- **Allowed pages:** Everything under `/super-admin/*` (Tenants, SaaS Plans/Subscriptions, SaaS Revenue/Payments, Platform Settings), plus the entire CRM tree (super_admin is included in every CRM nav item's role list) and their "own" `/dashboard`.
- **Permissions:** Full cross-tenant access. `hasPermission` in `AuthContext.tsx` maps `super_admin` to `["*"]` (wildcard). Backend: exempted from the Batch 3 automatic tenant-scoping extension entirely (by design — a super_admin legitimately needs cross-tenant queries).
- **Allowed CRUD:** Everything, including tenant creation/deletion (`POST`/`DELETE /api/tenants`, both `super_admin`-only since Batch 2) and impersonation (`POST /api/auth/impersonate` → `tenantsApi.impersonate`, writes a new JWT for the target tenant's owner into the super-admin's browser).
- **Reports/Analytics:** SaaS-level (tenant counts, all-tenant invoice totals) — see fabrication caveats in §2.
- **Settings:** `/super-admin/settings` exists but is non-functional (see §2).
- **Restrictions:** None functionally, by design.

### Gym Owner
- **Dashboard:** `/dashboard` (`DashboardPage`) — owner/manager view: real member/attendance/follow-up stats, fabricated monthly trend charts.
- **Allowed pages:** The full CRM tree except `/super-admin/*`: Enquiries, Follow Ups, Members (+ 6 sub-pages: packages, subscriptions, workout cards, analytics, attendance, renewals), Feedback, WhatsApp Campaigns, Reports (+ 6 sub-reports), Diet Plans, Employee Management (+ Access Control), Payments/Invoices, Expenses, Slot Management, Settings (Biometric, Gym Details, Message Templates).
- **Permissions:** `hasPermission` maps `gym_owner` → `["view_dashboard","manage_members","manage_trainers","manage_billing","view_analytics","manage_settings"]`. Highest role within their own tenant.
- **Allowed CRUD:** Create/update/delete on almost everything tenant-scoped (matches `DELETE_ROLES = [super_admin, gym_owner]` in `roles.ts` — only these two roles can delete records in the generic CRUD factory's default config). Owns the "Access Control" page (though it's a fake-persistence placeholder — see `FEATURE_GAP_ANALYSIS.md`).
- **Reports:** All 6 report sub-pages, membership analytics.
- **Settings:** Full tenant settings (branding, business info, payment keys), Biometric page (cosmetic).
- **Restrictions:** No cross-tenant visibility; no platform/SaaS-level admin.

### Manager
- **Dashboard:** Same `/dashboard` as gym_owner.
- **Allowed pages:** Same CRM tree as gym_owner *except*: no Membership Packages page, no Biometric settings, no Gym Details settings (per the nav config's per-child role arrays).
- **Permissions:** `["view_dashboard","manage_members","manage_trainers","view_billing","view_analytics"]` — notably "view_billing" not "manage_billing".
- **Allowed CRUD:** Included in `DEFAULT_MUTATION_ROLES = [gym_owner, manager]` — can create/update most resources via the generic CRUD factory, but not delete (delete is `gym_owner`/`super_admin` only by default).
- **Reports:** Same 6 report sub-pages as owner.
- **Settings:** Message Templates only (not Gym Details/Biometric).
- **Restrictions:** No delete rights by default; no access-control page.

### Trainer
- **Dashboard:** `/dashboard` (included in that route's role list) — though most of the owner/manager dashboard's data queries are explicitly *disabled* for `super_admin` only, not `trainer`, so a trainer landing here sees the same stat cards as staff.
- **Allowed pages:** DietPlan Management, Slot Management (Schedule), Members Workout Card (`/members/workouts`) — a deliberately narrow slice matching the "trainer" role's actual job (programming + scheduling).
- **Permissions:** `["view_dashboard","view_members","manage_workouts","manage_diet_plans","view_schedule"]`.
- **Allowed CRUD:** `DEFAULT_LIST_ROLES` includes trainer (can list most resources); not in `DEFAULT_MUTATION_ROLES`, so create/update on most generic-CRUD resources is denied by default unless a resource explicitly widens its role config (workouts/diet-plans/schedules effectively do, since trainers need to manage those).
- **Reports:** None in the nav.
- **Settings:** None.
- **Restrictions:** No member CRUD, no billing, no leads/CRM, no staff management.

### Receptionist (`frontdesk` in code)
- **Dashboard:** `/dashboard`.
- **Allowed pages:** Enquiries, Follow Ups, Members (list/attendance/renewals — not packages/subscriptions/analytics/workout-cards), Payments/Invoices, WhatsApp Web link.
- **Permissions:** `["view_dashboard","view_members","manage_attendance","view_payments"]`.
- **Allowed CRUD:** In `MEMBER_MGMT_ROLES` and `ATTENDANCE_ROLES` — can create members and manage attendance/check-in; not in `DEFAULT_MUTATION_ROLES`, so broader edit rights are resource-specific (e.g. `members` resource explicitly lists frontdesk in its `create` roles in `server/index.ts`'s `createCrudRoutes` call).
- **Reports:** None in the nav.
- **Settings:** None.
- **Restrictions:** No delete rights, no billing management (view only), no staff/settings access.

### Member
- **Dashboard:** `/member/dashboard` (`MemberDashboard`) — an entirely separate route tree (`/member/*`), not the CRM `/dashboard`. Since Batch 2, a `member`-role user hitting any CRM-tree URL is redirected to `/unauthorized`.
- **Allowed pages:** `/member/dashboard`, `/member/workouts`, `/member/diets`, `/member/schedule`, `/member/profile` — all under `MemberLayout`, reusing the same `AuthContext`/`ProtectedRoute` as staff (not a separate auth system).
- **Permissions:** Not in `hasPermission`'s map at all (falls through to no permissions) — members are gated almost entirely by route/role checks, not the permission-string system.
- **Allowed CRUD:** Read-mostly: their own workouts/diet/schedule/QR code. `member` is explicitly included in a handful of generic-CRUD `list` role arrays (e.g. `members` resource) where the handler additionally filters `where.userId = req.userId` so a member only ever sees their own record.
- **Known bug (documented, not yet fixed):** every member-portal page resolves "my profile" via `membersApi.list(tenantId)[0]` — i.e., it fetches the tenant's *first* member record, not the one tied to the logged-in user. In any tenant with more than one member, this likely shows the wrong person's data. Flagged as Critical in `DEVELOPMENT_ROADMAP.md` Phase 1, not yet fixed.
- **Reports/Settings:** None.
- **Restrictions:** No access to any CRM/admin functionality; cannot see other members' data (when the bug above isn't in play).

---

# 5. USER JOURNEY

Reconstructed from the actual request flow across the route files, not a generic SaaS description.

```
1. PLATFORM OPERATOR (super_admin) creates a tenant
   → POST /api/tenants (super_admin-only since Batch 2)
   → UI: TenantOnboardingWizard.tsx (5-step wizard: basic info, owner details,
     branding, plan/business type, review)
   → Server: prisma.$transaction — creates Tenant row, then creates a
     UserProfile with role="gym_owner", bcrypt-hashed password
     (tenantRoutes.ts POST /)

2. GYM OWNER logs in
   → POST /api/auth/login (email+password) or /api/auth/send-otp +
     /api/auth/verify-otp (phone, OTP hashed with bcrypt, stored in Redis,
     max 3 attempts) → JWT issued (7-day for email/password, 30-day for OTP)
     containing { userId, tenantId, role }
   → Frontend stores JWT + user object in localStorage (AuthContext.tsx),
     sent as `Authorization: Bearer` on every request (apiClient.ts)

3. GYM OWNER creates staff
   → Employee Management page (/staff) → usersApi.create →
     POST /api/users (generic CRUD, gym_owner-only per its role config)
     — creates a UserProfile with role = manager/trainer/frontdesk

4. STAFF (or owner) adds members
   → Add Member page → POST /api/members (memberRoutes.ts, NOT the generic
     CRUD path — a bespoke handler) → wrapped in prisma.$transaction:
     creates the Member row, and IF a currentPlanId was set, also creates a
     Payment row and an Invoice row in the same transaction

5. MEMBER purchases/renews a membership
   → POST /api/members/renew — looks up the Membership plan (tenant-scoped,
     fixed in Batch 1), computes a new expiry date from the plan's
     durationDays, wraps the plan update + Payment + Invoice creation in
     another $transaction
   → Alternatively: POST /api/payments/settle for ad hoc/manual payment
     settlement (payment + invoice + membership-extension, also
     transactional), or the Razorpay flow: POST /api/payments/razorpay-order
     → client-side Razorpay checkout → POST /api/payments/razorpay-verify
     (HMAC signature check against RAZORPAY_KEY_SECRET)

6. MEMBER checks in
   → Manual: front-desk search + check-in (ManualCheckin.tsx) → POST
     /api/attendance
   → QR: member's app shows a QR code (qrcode.react) → front-desk/kiosk
     scans → POST /api/qr/checkin (token-based, tenant-scoped)

7. TRAINER assigns a workout
   → Workout Templates page → POST /api/members/:memberId/workout_template
     → for each day in the template's exercise plan, upserts a
     DailyWorkoutPlan row for that calendar date (loop-based, not batched —
     a known N+1 pattern, DATABASE_REVIEW.md D6, not yet fixed)
   → Similarly for diet: POST /api/member-diets (assign)

8. MEMBER views their plan
   → GET /api/member/workouts/today (member-role-only inline handler in
     server/index.ts) — looks up today's DailyWorkoutPlan for that member

9. SYSTEM sends renewal reminders (automated)
   → RenewalService.processReminders() — checks members whose planExpiresAt
     is 7/3/1 days out, dispatches via WhatsApp/SMS
   → Runs from a setInterval in server/index.ts every 6 hours — see the
     serverless-deployment caveat in §9, this job's reliability in
     production is not guaranteed given the Vercel function model

10. OWNER reviews reports
    → Reports page (member reports: expiring/inactive/new-joiners) and
      Sales Report page (invoice-based revenue) — both real; Dashboard's
      trend charts are not (§2)

11. SYSTEM notifies staff/owner
    → NotificationService writes Notification rows + attempts Firebase
      push (fcmToken-based) → NotificationCenter.tsx polls unread count
      every 30s
```

---

# 6. DATABASE OVERVIEW

**ORM:** Prisma 7, PostgreSQL (Neon-hosted, inferred from a leaked connection string — see `SECURITY_REPORT.md` C1). One schema file, `prisma/schema.prisma`, ~46 models. A second file, `prisma/schema_additions.prisma`, is dead — not referenced by any Prisma command.

## Core entities and relationships

- **`Tenant`** — the root of multi-tenancy. Every one of the 42 tenant-scoped models below has a required `tenantId` FK back to this, `onDelete: Cascade` (except `SaasInvoice`, deliberately `Restrict` — billing history survives tenant deletion; Batch 1 added a friendly 409 error for this case instead of a raw 500).
- **`UserProfile`** — login-capable accounts (staff + super_admin). `tenantId` is *nullable* here (a super_admin has none). Links 1:1 optionally to `Member`, `Trainer`, or `FrontDesk` via named relations (`UserToMember`, `UserToTrainer`, `UserToFrontDesk`).
- **`Member`** — the gym's customers. Links to `Membership` (current plan), `Trainer` (assigned trainer), and is the hub for `Payment`, `Attendance`, `MemberWorkout`, `MemberDiet`, `Complaint`, `Locker`, `Invoice`, `MemberHealthProfile` (1:1), `BodyMeasurement` (1:many), `MemberFitnessStats` (1:1), `FollowUp`, `DailyWorkoutPlan`.
- **`Membership`** — plan definitions (name, durationDays, priceCents, currency, perks JSON).
- **`Payment`** / **`Invoice`** — payment records (provider: stripe/razorpay/cash — despite the enum naming, Stripe is never actually integrated, only Razorpay and cash are used in code) and formal invoices with line items (JSON), tax fields, status.
- **`Attendance`** — check-in/check-out with device-info JSON.
- **`Trainer`** / **`TrainerSlot`** / **`Schedule`** — trainer records, bookable time slots, and class schedules (linked to `Service`).
- **`Workout`** / **`DietPlan`** / **`MemberWorkout`** / **`MemberDiet`** — programming templates and per-member assignments.
- **`WorkoutTemplate`** / **`DailyWorkoutPlan`** — a separate, newer "weekly plan" system: a `WorkoutTemplate` has a 7-day JSON exercise array; assigning it to a member fans out into individual `DailyWorkoutPlan` rows per calendar date, each with its own progress/status.
- **`MemberHealthProfile`** / **`BodyMeasurement`** / **`MemberFitnessStats`** — health assessment data, measurement history, and gamified stats (streaks, check-in counts). As of Batch 1, all three now correctly have an enforced `tenant` FK (previously the column existed with no constraint).
- **`Lead`** / **`FollowUp`** — CRM: enquiry records and their scheduled follow-ups (type: enquiry/balance/feedback/renewal).
- **`Product`** — POS catalog (priceCents, stockQuantity).
- **`Locker`** — facility asset with assignment/expiry.
- **`Visitor`** / **`Complaint`** — front-desk operational logs.
- **`Expense`** — categorized cost tracking.
- **`Branch`** / **`Service`** / **`FrontDesk`** — multi-location support, bookable services/classes, front-desk staff (a *separate* entity from `StaffProfile` — see §3's Staff row).
- **`StaffProfile`** / **`StaffAttendance`** / **`StaffLeave`** / **`SalarySlip`** — HR module: employee records, their own attendance, leave requests, and salary slips (schema exists; no payroll *calculation* logic found — see §3).
- **`Message`** / **`Campaign`** / **`MessageTemplate`** — communications: individual sends, bulk campaigns, and reusable templates with trigger keys (e.g. `membership_expiry_7d`).
- **`RazorpayOrder`** / **`RazorpayWebhookLog`** — payment-gateway order tracking and webhook event log (the log table exists; no route consuming incoming webhooks was found — verification is currently client-submitted-signature-based only, not server-to-server confirmed).
- **`Discount`** — coupon codes.
- **`MembershipHistory`** — an append-only log of every plan a member has ever held (explicitly documented in the schema as "never overwrite `Member.currentPlanId` without logging here first").
- **`RenewalConfig`** / **`FollowUpRule`** — per-tenant automation config (reminder days, auto-follow-up trigger days).
- **`AuditLog`** — exists (tenantId nullable, action/resourceType/resourceId/changes-JSON/ipAddress/userAgent) but nothing writes to it in any route reviewed — a genuine gap given the platform has a powerful, sensitive impersonation feature with no audit trail.
- **`SaasPlan`** / **`SaasSubscription`** / **`SaasInvoice`** — platform-level billing (you ↔ tenant), described in §1.

## Multi-tenancy enforcement (the most important architectural fact in this database)

Two layers, as of Batch 3:
1. **Explicit, per-query `tenantId` filters** — the original (and still primary) mechanism, present throughout `crudHelper.ts` and the hand-written routes.
2. **A structural backstop** (`server/lib/prismaTenantScope.ts`) — a Prisma client extension that automatically merges `tenantId` into the `where` clause of every query against the 42 required-tenantId models, sourced from an `AsyncLocalStorage`-based request context, for any non-`super_admin` authenticated request. This exists specifically so a *future* missed filter (the exact bug class found and fixed in Batch 1) fails safe instead of leaking data. `UserProfile` and `AuditLog` are deliberately excluded (nullable tenantId, ambiguous ownership semantics).

Indexing: as of Batch 1, all 42 tenant-scoped models have `@@index([tenantId])` (or a `tenantId`-leading composite/unique constraint that serves the same purpose) — migration file generated, **not yet applied to the live database** (see §2).

---

# 7. APPLICATION MODULES

- **CRM Module** — `Lead`, `FollowUp`, `FollowUpRule` + `LeadsPage.tsx`, `FollowUpsPage.tsx`, `LeadGeneratorDialog.tsx` (Google Places / JustDial-scraper sourcing). Routes: `/leads`, `/follow-ups`.
- **Gym Operations Module** — members, attendance, memberships, trainers, schedules, lockers, branches, services, visitors, complaints. The largest module by page count.
- **Fitness Programming Module** — workouts, diet plans, both the older per-member-assignment system and the newer weekly-template/`DailyWorkoutPlan` system.
- **POS / Retail Module** — `Product`, POS checkout flow, tied into `Payment`.
- **Billing Module** — `Payment`, `Invoice`, `Discount`, Razorpay integration, expense tracking. Route: `/billing`, `/invoices`.
- **Reports Module** — member reports and sales reports (real); dashboard analytics (mostly fabricated, see §2).
- **Marketing/Communications Module** — `Message`, `Campaign`, `MessageTemplate`, WhatsApp/SMS services. Routes: `/campaigns`, `/settings/message-templates`.
- **Notifications Module** — `Notification` model, Firebase push, in-app center.
- **Member Portal Module** — the entire `/member/*` route tree, a parallel, simplified UI for the end customer.
- **Super Admin / Platform Module** — tenant CRUD, impersonation, SaaS billing view, platform settings. Routes: `/super-admin/*`.
- **Staff/HR Module** — `StaffProfile`, `StaffAttendance`, `StaffLeave`, `SalarySlip` (schema only for payroll calc), plus the separate `FrontDesk` staff entity.
- **Auth Module** — `server/controllers/authController.ts`, `server/services/otpService.ts`, `server/validators/authValidators.ts`.

---

# 8. DASHBOARD EXPLANATION

### Super Admin Dashboard (`/super-admin`, `pages/admin/superadmin/Dashboard.tsx`)
Widgets: Total Revenue, Active Tenants, Total Users, "System Health: Optimal" (hardcoded string, not derived from any health check) — 4 stat cards, first three real (`tenantsApi.list()`, `usersApi.list()`, `billingApi.getInvoices("all")`, query gated `enabled: user.role === "super_admin"`). Below: "Recent Tenants" list (real, top 5 by createdAt) and a Revenue Growth / Gym Growth chart pair that render from literal `MOCK_REVENUE_DATA`/`MOCK_GROWTH_DATA` arrays — not real. "Fastest Growing Gyms" percentages are `Math.random()` per render.

*(Note: this dashboard's `usersApi.list()` call may silently fail — that endpoint's role config only allows `gym_owner` in its `list` roles, not `super_admin`, a pre-existing misconfiguration noted but not fixed during this engagement — see the Batch 2 plan's "explicitly out of scope" note.)*

### Gym Owner / Manager Dashboard (`/dashboard`, `pages/app/DashboardPage.tsx`)
Widgets: member count, active-member count, attendance-today count, follow-ups-due count (all real, `enabled` for non-super-admin roles), a revenue/membership pie or bar breakdown, and a "monthly trend" chart. The trend chart is the fabricated part: it's extrapolated client-side from a single `totalRevenue` figure into a fake per-month series, not a real time series from the backend.

### Trainer / Receptionist
No dedicated dashboard component — both land on the same `/dashboard` as owner/manager (it's in both roles' nav lists), seeing the same widgets regardless of role-appropriateness.

### Member Dashboard (`/member/dashboard`, `features/member-portal/MemberDashboard.tsx`)
Widgets: membership status/expiry, today's workout, upcoming schedule, QR check-in code. Subject to the "shows the tenant's first member, not the logged-in one" bug noted in §4.

---

# 9. API ARCHITECTURE

## Authentication flow
- `POST /api/auth/register`, `/login` — email/password, bcrypt-hashed, JWT issued (7-day expiry).
- `POST /api/auth/send-otp`, `/verify-otp` — phone-based login. OTP generated (`Math.random()`-based — a known weakness, `SECURITY_REPORT.md` H2, not yet fixed), bcrypt-hashed before storing in Redis, max 3 verify attempts, 30-day JWT on success. A hardcoded `123456` bypass exists when `NODE_ENV !== "production"` — also flagged, not yet fixed.
- `POST /api/auth/impersonate` — super_admin-only, issues a new JWT scoped to a target tenant's owner.
- JWT payload: `{ userId, tenantId, role }`, signed with `process.env.NEXTAUTH_SECRET` (a legacy/confusing name — the code has never used NextAuth).

## Authorization
Two layers (see §6's multi-tenancy section for the data-layer half): 
- **Middleware:** `authenticate` (`server/config/db.ts`) verifies the JWT and populates `req.userId`/`req.tenantId`/`req.role`, then (as of Batch 3) opens an `AsyncLocalStorage` context for the request.
- **Role checks:** mostly inline (`if (req.role !== 'x')`) in hand-written routes; a reusable `requireRole()` middleware (`server/middleware/requireRole.ts`, added Batch 2) exists and is applied to newly-touched routes, not retrofitted everywhere (`SECURITY_REPORT.md` C5, marked partial).
- **Frontend:** `ProtectedRoute`/`SuperAdminRoute` etc. (`src/features/auth/ProtectedRoute.tsx`), enforced at the router level in `App.tsx` since Batch 2 for the member/CRM split and the `/super-admin/*` tree.

## Middleware stack (Express, `server/index.ts`)
CORS (origin-allowlist from `ALLOWED_ORIGINS` env var) → `express.json()` → route mounts → (per-route) `authenticate` → (per-route, some routes) `requireRole`/inline checks → `errorMiddleware` (final handler, `server/middleware/errorMiddleware.ts`).

## Prisma / tenant isolation
Covered fully in §6. In short: Prisma 7 with the `@prisma/adapter-pg` driver adapter against Postgres, a single extended client (`server/config/db.ts`'s `prisma` export) used everywhere, with the Batch 3 tenant-scoping extension as a structural backstop under the existing explicit filters.

## API structure
Two patterns coexist:
1. **Generic CRUD factory** (`server/config/crudHelper.ts`'s `createCrudRoutes`) — registers `GET/POST/PATCH/DELETE /api/<resource>` for 27 resources (members, memberships, trainers, trainer-slots, schedules, workouts, diet-plans, services, branches, leads, follow-ups, visitors, complaints, invoices, expenses, products, lockers, front-desk, notifications, member-workouts, users, member-diets, payments, tenants, saas_plans, saas_subscriptions, saas_invoices), each with configurable search/filter fields, Prisma `include`, and per-verb role arrays. Handles pagination (`page`/`limit`, capped at 100) uniformly.
2. **Hand-written route files** (`server/routes/*.ts`, 20 files) — used where the logic doesn't fit generic CRUD (auth, multi-step transactions like member creation/renewal/payment settlement, reports, QR check-in, file upload, tenant management, billing).

Plus 6 inline route handlers living directly in `server/index.ts` (member-workout-today/update, workout-template CRUD) — a known structural wart (`ARCHITECTURE_REVIEW.md` §3), not yet moved into their own files.

## Request flow (typical authenticated request)
```
Browser → apiClient.ts (attaches Authorization: Bearer <jwt>)
        → Vercel serverless function (api/index.ts → server/index.ts)
        → CORS check → express.json()
        → route match → authenticate middleware
            → JWT verify → req.userId/tenantId/role set
            → AsyncLocalStorage context opened (Batch 3)
        → route handler
            → role check (inline or requireRole)
            → Prisma query (tenantId auto-merged into where by the
              Batch 3 extension, in addition to whatever explicit
              filter the handler itself applies)
        → snakeToCamel() response transform → JSON response
```

---

# 10. PROJECT STRUCTURE

## Frontend architecture
Vite + React 18.3 + TypeScript + react-router-dom v6 + TanStack Query + shadcn/ui (Radix primitives) + Tailwind CSS + React Hook Form + Zod (auth flow only). Structure:
```
src/
├── api/apiClient.ts        — single fetch wrapper, all endpoint definitions
├── components/
│   ├── ui/                 — shadcn primitives
│   └── common/              — DataTable, Pagination, StatCard, FormDialog,
│                              ConfirmDialog, EmptyState, PageHeader — a
│                              genuinely reusable shared layer
├── features/                — domain modules (auth, leads, pos, lockers,
│                              member-portal, follow-ups, front-desk,
│                              notifications, attendance, members,
│                              memberships)
├── layouts/DashboardLayout.tsx — the CRM shell (sidebar, header, nav config)
├── pages/
│   ├── app/                 — CRM pages (~27 files) + members/ subfolder
│   ├── admin/superadmin/    — platform-admin pages
│   └── auth/                — sign in/up, unauthorized, 404
└── App.tsx                  — route table
```
No code-splitting (`React.lazy`) anywhere — the whole app ships as one ~1.8MB JS bundle (`PERFORMANCE_REPORT.md` P1, not yet fixed).

## Backend architecture
Express 5, deployed as a single Vercel serverless function (`api/index.ts` re-exports `server/index.ts`'s app). Structure:
```
server/
├── index.ts                 — app setup, route mounts, 6 inline handlers,
│                              generic-CRUD registrations, cron jobs
├── config/
│   ├── db.ts                — Prisma client (+ Batch 3 extension),
│   │                          authenticate middleware, AuthenticatedRequest
│   ├── crudHelper.ts         — generic CRUD factory
│   ├── roles.ts              — role constants/hierarchy (partially unused)
│   ├── logger.ts             — Winston
│   └── redis.ts
├── lib/                      — Batch 3: tenantScopedModels.ts,
│                              tenantContext.ts, prismaTenantScope.ts
├── middleware/                — errorMiddleware, rateLimiter, validate,
│                              requireRole (Batch 2)
├── routes/                   — 20 route files
├── controllers/authController.ts
├── services/                 — otp, whatsapp, sms, notification, renewal,
│                              followUp, qr, leadScraper, justdialScraper
└── __tests__/                — 3 test files (health, cors, tenantScope)
```

## Database
Prisma 7 + `@prisma/adapter-pg`, PostgreSQL (Neon). One schema, two migrations before this engagement plus one added in Batch 1 (indexes + FK), all under `prisma/migrations/`.

## Cloudinary
File/image storage. `server/routes/uploadRoutes.ts` — now authenticated with a 5MB size limit and an image/PDF MIME allowlist (Batch 2; previously wide open).

## Redis
Used for OTP storage (hashed) and rate limiting (`ipRateLimiter`, `phoneRateLimiter` — the latter built but not wired into the OTP routes, `SECURITY_REPORT.md` M1, not yet fixed). Fails open if Redis is unreachable (logged, not blocking).

## Firebase
`firebase-admin`, initialized in `server/index.ts`, used by `notificationService.ts` for push notifications via `fcmToken`. Degrades gracefully (logs an error, doesn't crash) if credentials are invalid — confirmed in this session's own test runs, which show exactly this failure mode with the placeholder credentials in `.env`.

## WhatsApp
Meta Cloud API (Graph API v25.0), `server/services/whatsappService.ts` — real integration with retry logic, used for OTP delivery, renewal reminders, and campaigns.

## Razorpay
Order creation, checkout handoff, and HMAC-signature verification (`server/routes/paymentRoutes.ts`). No recurring/subscription billing, no server-side webhook consumption found (the `RazorpayWebhookLog` table exists but nothing writes to it in the routes reviewed).

## Deployment
Vercel, via GitHub Actions (`.github/workflows/deploy.yml`: checkout → install → `npm test` → `npm run build` → deploy `--prod` on every push to `main`). `vercel.json` rewrites `/api/*` to the serverless function and everything else to `index.html` (SPA fallback).

---

# 11. IMPLEMENTED FEATURES (flat list)

Auth (email/password + phone/OTP), JWT sessions, role-based nav, member CRUD/directory/profile (10-tab detail view), membership plan CRUD, member renewals with WhatsApp reminders, manual + QR attendance, trainer CRUD + slots, class scheduling, workout templates + assignment + daily plans, diet plan CRUD + assignment, POS with inventory deduction, lead/CRM CRUD + follow-up automation + auto-scheduling + missed-followup detection, WhatsApp campaigns, SMS via Twilio, message templates with trigger-key automation, in-app notifications with push, lockers, branches, services, visitors, complaints, expenses, billing (invoices/payments/PDF), Razorpay order+verify, staff CRUD (two systems), tenant onboarding wizard, tenant CRUD, tenant impersonation, super-admin tenant dashboard, member portal (dashboard/workouts/diets/schedule/profile), feedback management, member reports, sales reports, settings (business/branding/payment-key tabs).

# 12. INCOMPLETE FEATURES (flat list)

Real analytics/BI backend, super-admin plan/subscription management UI, super-admin platform settings UI, recurring/auto-charge billing, Razorpay webhook consumption, class capacity/waitlists, payroll calculation from attendance, audit logging (table exists, unused), two-factor authentication, real invoice viewer (currently `alert()`), working contact form, CMS for marketing content, member-portal identity resolution (shows wrong member), class/trial-booking backend, code-splitting, most routes' Zod validation, D5/D6/D7 query-performance items (pagination on report endpoints, N+1 batching, transaction coverage on loop-writes).

# 13. BUGS (known, from direct code reading — not exhaustive)

| Bug | File | Severity |
|---|---|---|
| Member portal resolves "my profile" as tenant's first member, not the logged-in one | `features/member-portal/*` | High |
| `GET /api/billing` previously ordered by nonexistent `priceInr` field | `billingRoutes.ts` | Fixed in Batch 2 |
| `GET /api/tenants?id=` silently ignored the id param, always returned all tenants | `tenantRoutes.ts` | Fixed in Batch 2 |
| Owner's plaintext password logged to console on tenant creation | `tenantRoutes.ts` | Fixed in Batch 2 |
| OTP logged in plaintext unconditionally | `authController.ts:29` | Open — `SECURITY_REPORT.md` H1 |
| Hardcoded `123456` OTP bypass outside `NODE_ENV=production` | `otpService.ts:26` | Open — H2 |
| Hardcoded JWT secret fallback string | `authController.ts:11` | Open — H3 |
| `usersApi.list()` role config excludes `super_admin`, likely silently breaking the super-admin dashboard's user count | `server/index.ts`'s `createCrudRoutes(app, "users", ...)` | Open, noted not fixed |
| `setInterval`-based cron jobs likely unreliable on Vercel's serverless model | `server/index.ts` | Open — `ARCHITECTURE_REVIEW.md` §4 |
| 6 duplicate/dead frontend page files (unrouted twins of routed pages) | `pages/app/*`, `pages/admin/SuperAdminPage.tsx` | Open — `CODE_AUDIT.md` §1 |
| N+1 query loop on multi-day workout-template assignment | `memberRoutes.ts:350-372` | Open — D6 |
| Several report/list endpoints unbounded (no pagination) | `attendanceRoutes.ts`, `reportRoutes.ts`, `billingRoutes.ts` | Open — D5 |

# 14. SECURITY

**Fixed this engagement (Batches 1–3):** cross-tenant query bypass on 5 known call sites plus a structural Prisma extension closing the whole bug class; missing tenant indexes/FKs (42 models, migration generated, not yet applied); 5 unauthenticated production routes (`tenantRoutes` GET/POST/PATCH, `billingRoutes` GET, `uploadRoutes` POST); no frontend route-level role enforcement; upload endpoint had no size/MIME limits; `SaasInvoice` tenant-deletion crash; `DATABASE_URL`/SSL runtime guards; `req: any` in the two highest-density files.

**Still open — Critical/High:**
- Live DB password and WhatsApp token committed to git (rotation requires external dashboard access — flagged, not actioned).
- Plaintext credentials in `README.md`/`MASTER_PLAN.md`.
- OTP plaintext logging; hardcoded OTP/JWT-secret fallbacks.
- No centralized `requireRole` retrofit across ~15 route files (partial only).

**Medium:** phone-based OTP rate limiter built but unwired; long-lived JWTs with no revocation; JWT in `localStorage` not an httpOnly cookie; no CSP header; CORS wildcard-with-credentials footgun.

**Low:** inconsistent logging (console.* vs. the real Winston logger); no auth/authz automated test coverage beyond the new tenant-scoping unit tests; confusing env var naming (`NEXTAUTH_SECRET` used as a plain JWT secret).

Full detail with file:line references and fix guidance: `SECURITY_REPORT.md`.

# 15. ROADMAP

Per `DEVELOPMENT_ROADMAP.md`, updated for what's actually landed:

- **Phase 0 (credential rotation)** — Open, requires external action.
- **Phase 1 (critical bugs)** — Cross-tenant query bypass ✅ done. Member-portal identity bug, serverless cron reliability, hardcoded subscription-status bug: open.
- **Phase 2 (security)** — Unauthenticated routes ✅, frontend route guards ✅, centralized authorization 🟡 partial, missing tenantId FKs ✅, SaasInvoice delete handling ✅. OTP/JWT-secret hardcoding, upload/Razorpay hardening details, CSP, httpOnly cookies: open.
- **Phase 3 (performance)** — Missing indexes ✅ (pending DB apply). Code-splitting, pagination, N+1 batching, dashboard-chart real aggregation: open.
- **Phase 4 (missing features)** — Super-admin plan management, real BI, recurring billing, class capacity, audit logging, payroll calculation, invoice viewer, trial-booking backend, 2FA: all open, ~2–2.5 months estimated for one engineer.
- **Phase 5 (scalability/polish)** — Dead-code cleanup, doc rewrites, error boundaries, accessibility, test coverage build-out: open, ~1 month, partially parallelizable with Phase 4.

# 16. AI FEATURES (recommendations — none of this is implemented; grounded in this codebase's actual gaps, not generic AI marketing)

1. **Real churn/retention prediction** — the single highest-leverage AI feature, because it directly replaces the fabricated analytics flagged throughout this doc. Train on `Attendance` frequency decay + `Payment` history + `FollowUp` outcomes to flag at-risk members before they lapse, surfaced right where the fake "Retention Rate 88%" card currently sits in `MemberAnalyticsPage.tsx`.
2. **WhatsApp-native AI assistant for enquiries** — since WhatsApp is already the primary channel (real integration, `whatsappService.ts`), an LLM-driven auto-responder for common enquiry questions (pricing, timings, trial booking) feeding straight into the existing `Lead`/`FollowUp` pipeline would compound on infrastructure that already exists rather than requiring new integration work.
3. **AI workout/diet plan generation** — `Workout`/`DietPlan` templates are currently manually authored JSON; a generation assist (goal + equipment + duration in, a structured plan out) would extend the existing template data model with no schema change.
4. **Smart lead scoring** — `Lead.priority` (hot/warm/cold) is currently manually set; a model using `LeadGeneratorDialog.tsx`'s scraped/enriched data plus follow-up outcome history could auto-score and prioritize the CRM queue.
5. **Anomaly detection on payments/attendance** — flagging unusual patterns (a member checking in at implausible frequency, a sudden spike in refunds) as a lightweight fraud/error signal for the owner.
6. **Replace the JustDial scraping fallback** with a licensed data API or an AI-assisted, ToS-compliant enrichment source — this is as much a risk-reduction move as a feature (see §3's flag on `leadScraperService.ts`).

# 17. COMPETITOR COMPARISON

Against GymDesk, Trainerize, Mindbody, Zen Planner, ABC Fitness, PushPress:

**Ahead of typical entry tiers:** WhatsApp/SMS automation with real provider integrations (many competitors only do email), a working POS with live inventory deduction, tenant impersonation for support (a genuinely useful operator feature smaller competitors often lack), and a differentiated (if legally risky) B2B lead-sourcing tool.

**Missing — Critical (table-stakes to compete):** working platform-operator plan/billing management (currently non-functional), reliable renewal-automation delivery (the serverless-cron reliability question), correct member-portal identity resolution, and the tenant-isolation guarantees this engagement spent three batches hardening — all of which every established competitor already has solved.

**Missing — Important:** real BI/retention analytics, class booking with capacity/waitlists, recurring/auto-charge billing, staff payroll automation, audit trails for sensitive actions, a functional public contact/lead-capture form.

**Missing — Nice to have:** biometric/turnstile hardware integration, white-label custom domains, in-app community/leaderboards, mobile app parity (a separate Flutter app exists but wasn't evaluated in this engagement).

Full detail: `FEATURE_GAP_ANALYSIS.md` §3.

# 18. PROJECT SCORE

- **Current maturity:** mid-stage MVP — most day-to-day gym-ops workflows are genuinely built and working; the platform-operator (super-admin) layer and analytics layer are the least mature parts.
- **Production readiness:** not yet — Phase 0 (credential rotation) and the remaining Phase 1/2 items must land first; the Batch 1 migration must be applied to the database.
- **Business readiness:** partial — you cannot yet actually manage what you're selling (no working plan-management UI), which blocks operating this as a real subscription business today even though the underlying billing data model is sound.
- **Technical readiness:** improving — tenant isolation now has both explicit and structural enforcement (Batches 1 & 3); authentication gaps closed (Batch 2); the biggest remaining technical debt is the fabricated-analytics layer and the ~15 route files not yet on the shared `AuthenticatedRequest`/`requireRole` patterns.
- **Scalability:** the serverless deployment model is architecturally sound except for the `setInterval` cron jobs, which don't fit it — needs Vercel Cron or an external scheduler. No code-splitting yet; unbounded list endpoints will degrade with data growth until D5/D6 land.
- **Maintainability:** solid shared frontend component layer (`components/common/*`); backend has two competing patterns (generic CRUD factory vs. hand-written routes) that aren't fully reconciled, plus 6 dead page files and a handful of overlapping models (Staff vs. FrontDesk) that should be resolved.
- **Overall score: ~60–62%**, up from ~58% at the start of this engagement. The number is held down less by missing features (most core CRUD is 70–90% individually complete) and more by three cross-cutting issues: the still-open security items, the almost-entirely-fabricated analytics layer, and near-zero automated test coverage protecting any of it from regressing.

# 19. EXECUTIVE SUMMARY

**What have we built?** A real, substantially-complete multi-tenant gym management SaaS — not a prototype, not a shell. A gym owner today can onboard, add staff and members, track attendance two ways (manual and QR), sell and renew memberships with automated WhatsApp reminders, run a retail POS with live inventory tracking, manage a sales pipeline for walk-in enquiries, assign workout and diet programming, and see real (if not yet deeply analytical) reports on their business. As the platform operator, you can onboard tenants through a guided wizard, manage their accounts, and impersonate them for support — a feature many smaller competitors in this space don't have.

**What's the catch?** Two things, and they're the reason this engagement existed. First, the security and data-isolation foundation had real gaps — a multi-tenant SaaS's core promise is that Tenant A can never see Tenant B's data, and that promise had five concrete, exploitable holes plus several unauthenticated endpoints. Those are now fixed, and as of this week the fix isn't just "we found the bugs and patched them" — there's a structural safety net (a Prisma extension) that makes the entire bug class much harder to reintroduce, even by a future engineer who's never read this document. Second, the parts of the product that are supposed to make an owner feel smart — the analytics dashboards, the growth charts, the retention metrics — are, right now, largely decoration. The numbers on the page are either fabricated client-side from a single real figure or literally hardcoded constants. That's the single biggest gap between how finished this product *looks* in a demo and how finished it *is*.

**Is it safe to sell today?** Not quite, and the remaining blockers are specific and known, not vague: rotate two credentials that are sitting in git history, apply one already-written database migration, close the handful of remaining unauthenticated-adjacent issues (plaintext OTP logging, a hardcoded JWT-secret fallback), and fix the member-portal bug that shows the wrong person's data. None of that is architecturally hard — it's execution, mostly measured in hours to a couple of days per item, laid out with effort estimates in `DEVELOPMENT_ROADMAP.md`.

**What should the new engineering team focus on first?** In order: finish the credential rotation and DB migration (this week, external-access-gated), close the remaining auth hardening items (days), then make a call on the two things that most determine whether this competes seriously in its category — building a real analytics backend (the fabricated-charts problem) and a working platform-operator billing UI (you can't run a SaaS business you can't administer). Everything else — code-splitting, the N+1 queries, the dead pages, the two overlapping staff models — is real technical debt worth fixing, but it's debt, not a blocker.

**What should investors take away?** The core product thesis is validated in code, not just in a pitch deck: the hard, unglamorous parts of a vertical SaaS (multi-tenancy, role-based access, payment integration, WhatsApp automation at the messaging-provider level, a working POS) are built and functioning. The gaps that remain are well-understood, scoped, and estimated, not open-ended unknowns — which is a materially different risk profile than "we don't know what's broken." The three batches of work completed alongside this documentation are direct evidence of that: specific, verified, tested fixes, not a rewrite.
