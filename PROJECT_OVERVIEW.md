# PROJECT OVERVIEW

**Audit date:** 2026-07-16
**Branch audited:** `dev1`
**Scope:** Web application (`src/`, `server/`, `api/`, `prisma/`). The Flutter mobile app (`gymowl_app/`) was excluded from this audit by request and is not covered below.

---

## 1. What this project actually is

This is **not** the stack described in the audit brief. That brief (Next.js 16, React 19, NextAuth, Prisma+Neon, Stripe, Vercel) describes an *aspirational or unrelated* architecture. The real, running codebase is:

| Layer | Actual technology | Evidence |
|---|---|---|
| Frontend build | **Vite 5** (not Next.js) | `package.json` scripts (`vite`, `vite build`), no `next.config.*`, no `app/` router |
| Frontend framework | **React 18.3** (not React 19) | `package.json:67-69` |
| Routing | **react-router-dom v6** (not App Router) | `src/App.tsx`, dependency at `package.json:73` |
| Backend | **Express 5**, a single long-lived-style server (`server/index.ts`) deployed as a **Vercel serverless function** via `api/index.ts` → `server/index.js` | `api/index.ts`, `vercel.json` |
| ORM | **Prisma 7** with `@prisma/adapter-pg` against **PostgreSQL** (connection string pattern strongly suggests **Neon**, but this is inferred from a leaked connection string, not from an env template) | `server/config/db.ts`, `prisma/schema.prisma` |
| Auth | **Hand-rolled JWT** (`jsonwebtoken` + `bcrypt`), not NextAuth. An OTP/phone login flow backed by **Redis** | `server/controllers/authController.ts`, `server/services/otpService.ts` |
| File storage | **Cloudinary** — this part of the brief is correct | `server/index.ts:83-87`, `server/routes/uploadRoutes.ts` |
| Payments | **No Stripe.** Schema and routes reference **Razorpay** (`RazorpayOrder`, `RazorpayWebhookLog` models; `razorpayOrderId` fields) | `prisma/schema.prisma` |
| Push/Firebase | **firebase-admin** is present and actively used for push notifications — not mentioned in the brief at all | `server/index.ts:4,43-56`, `server/services/notificationService.ts` |
| Messaging | Real **WhatsApp Cloud API** and **Twilio SMS** integrations | `server/services/whatsappService.ts`, `server/services/smsService.ts` |
| Testing | **Vitest**, but configured to run **only backend tests** (`server/__tests__/**`) — zero frontend test coverage configured | `vitest.config.ts` |
| Deployment | **Vercel**, via GitHub Actions (`.github/workflows/deploy.yml`) | confirmed |
| Mobile | A separate **Flutter** app (`gymowl_app/`) exists alongside the web app — out of scope for this audit per your instruction |

**Bottom line:** the product is a Vite/React SPA talking to an Express API (deployed as a single Vercel serverless function) backed by Prisma/Postgres, with JWT+OTP auth, Cloudinary storage, Razorpay billing, and WhatsApp/SMS/Firebase notifications. It is a real, substantially-built product — not a skeleton — but its actual shape has diverged significantly from every architecture document in the repo (`README.md`, `PROJECT_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`), which still describe the **original, pre-migration Supabase/RLS/Stripe design**. See `MIGRATION_AUDIT.md` for the full breakdown of what changed and what documentation is now false.

## 2. Migration history (confirmed from code, not assumed)

The project genuinely was migrated once already: **Supabase → Prisma/Postgres + Express + hand-rolled JWT**. This is confirmed by:
- No `@supabase/supabase-js` in `package.json` or `package-lock.json`, no `createClient()`, no Supabase query-builder (`.from()`) calls anywhere in `src/` or `server/`.
- Stale comments that only make sense as leftovers from that migration, e.g. `src/api/apiClient.ts:2-3` ("Replaces all direct Supabase calls... instead of `{ supabase } from "@/api/supabase"`") and `server/config/db.ts:27` ("Snake_case → camelCase converter for Supabase shim compatibility").
- The docs (`README.md`, `PROJECT_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`) reference `supabase_schema.sql` / `supabase_seed.sql` files that **no longer exist** in the repo.

That migration is functionally complete for Supabase specifically. It was **never migrated to Next.js/NextAuth/Stripe** — those were never real; the audit brief's premise about that second migration does not apply here. Full detail in `MIGRATION_AUDIT.md`.

## 3. Immediate, non-negotiable findings

These surfaced during initial reconnaissance and are severe enough to call out before anything else, full detail in `SECURITY_REPORT.md`:

1. **A live Neon Postgres password is committed to git** in at least 10 root-level debug scripts (`check_db_members.ts`, `check_members.ts`, `check_tables.ts`, `check_tenants.ts`, `create_member_pg.ts`, `create_user.js`, `create_user.ts`, `create_userprofile_pg.ts`, `sync_users.ts`, `sync_users_pg.ts`), each hardcoding the same connection string.
2. **A live WhatsApp Cloud API access token is committed** in `.env.example:9` (and duplicated in the untracked `.env:19`).
3. **Several production API routes have no authentication middleware at all**, including one that lets anyone update any tenant's billing/subscription fields (`server/routes/tenantRoutes.ts:103`) and one that leaks any tenant's subscription/invoice data (`server/routes/billingRoutes.ts:7`).
4. **Plaintext credentials for real-looking accounts** (super admin, tenant owners, staff, a member login phone number) are committed in `README.md` and `MASTER_PLAN.md`.

These are treated as Phase 0 / Critical in `DEVELOPMENT_ROADMAP.md` and should be actioned before anything else in this report, regardless of audit sequencing.

## 4. Repository shape

- `src/` — 127 frontend files: pages, feature modules, shared UI (shadcn/ui-based), one shared `apiClient.ts`, a single `AuthContext.tsx`.
- `server/` — Express route handlers, controllers, services (WhatsApp/SMS/Firebase/OTP/renewals/follow-ups/lead-scraping), middleware, config, and a Vitest test suite (2 test files: CORS, health).
- `prisma/` — one active `schema.prisma` (~40+ models) plus a second, unused `schema_additions.prisma` that duplicates several models but is wired into nothing.
- Root level — a large amount of one-off developer/debug scripts, log dumps, and a committed query-result JSON file, none of which belong in version control (see `MIGRATION_AUDIT.md` §D and `CODE_AUDIT.md`).
- `gymowl_app/` — Flutter mobile client, excluded from this audit.

## 5. Companion reports

| Report | Contents |
|---|---|
| `ARCHITECTURE_REVIEW.md` | Real system architecture, request lifecycle, serverless deployment implications |
| `MIGRATION_AUDIT.md` | Full Supabase-remnant classification, dead-code inventory |
| `CODE_AUDIT.md` | Code quality, duplication, dead files, severity-ranked issues |
| `SECURITY_REPORT.md` | Full security findings incl. auth, tenant isolation, secrets |
| `DATABASE_REVIEW.md` | Prisma schema, indexing, transactions, N+1s |
| `FEATURE_GAP_ANALYSIS.md` | Feature-by-feature completeness, competitor comparison |
| `PERFORMANCE_REPORT.md` | Frontend/backend performance findings |
| `UI_UX_REVIEW.md` | UX, accessibility, responsiveness, loading/error states |
| `DEVELOPMENT_ROADMAP.md` | Phased remediation plan with effort/priority |
| `FINAL_PROJECT_SCORE.md` | Completion percentages and overall scoring |
