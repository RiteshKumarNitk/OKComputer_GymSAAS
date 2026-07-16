# MIGRATION AUDIT

## Scope correction

The audit brief asked me to verify a migration **Supabase/Vite → Next.js/Prisma/Neon/NextAuth/Cloudinary**. Only half of that migration ever happened. What actually occurred, confirmed by code:

- **Supabase → Prisma + Postgres + Express + hand-rolled JWT + Redis-backed OTP**: real, and largely complete.
- **Vite → Next.js**: never happened. The app is still Vite + react-router-dom. No `next.config.*`, no `app/` or `pages/` router directory, no `next` package in `package.json`.
- **→ NextAuth**: never happened. `NEXTAUTH_SECRET` exists only as an env var *name* (`.env.example:5`, and reused oddly as the JWT-signing secret in `server/controllers/authController.ts:11` and `server/config/db.ts`), but the `next-auth` package is not installed and no NextAuth code exists anywhere.
- **→ Neon**: plausible but not verifiable from tracked config — no `.env.example` entry names Neon specifically. It is inferred from a **committed real connection string** (`ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech`) found hardcoded in multiple debug scripts — see §D. That string being committed is itself the more important finding.
- **→ Stripe**: never happened. No `stripe` package, no Stripe code. Payments are built around **Razorpay** (`RazorpayOrder`, `RazorpayWebhookLog` Prisma models, `razorpayOrderId` fields).
- **→ Cloudinary**: real, correctly implemented (`server/index.ts:83-87`, `server/routes/uploadRoutes.ts`).

Everything below audits the migration that **did** happen (Supabase removal), plus a full dead-code sweep, since that was the spirit of the request even though the target stack named in the brief doesn't match reality.

## A. Supabase removal checklist

| Item | Status | Evidence |
|---|---|---|
| Supabase SDK removed from dependencies | ✅ Done | No `@supabase/supabase-js` in `package.json` or `package-lock.json` |
| Supabase client instantiation (`createClient`) removed | ✅ Done | Zero matches repo-wide (excl. `gymowl_app`) |
| Supabase query builder (`.from()`, `.select()`, `.eq()` chains) removed | ✅ Done | Zero matches |
| Supabase Auth removed | ✅ Done | Replaced by `server/controllers/authController.ts` (JWT) + `server/services/otpService.ts` (OTP/Redis) |
| Supabase Storage removed | ✅ Done | Replaced by Cloudinary (`server/routes/uploadRoutes.ts`) |
| Supabase Realtime removed | ✅ Done | No `channel(`/realtime subscription code found anywhere |
| Supabase env vars removed | ✅ Done | No `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_*` in `.env.example` or code |
| Row-Level Security replaced by app-layer tenant checks | ⚠️ Partially | Most Prisma queries filter by `tenantId` in app code, but several do not — this is a real regression versus RLS, which enforced isolation at the DB layer regardless of application bugs. See `SECURITY_REPORT.md` and `DATABASE_REVIEW.md` for the specific routes that skip the `tenantId` filter (`server/index.ts:187,199` workout-template update/delete; `server/routes/memberRoutes.ts:31,96,343`). **This is the actual cost of the migration**: Supabase RLS made cross-tenant leakage structurally hard; the Prisma rewrite makes it a per-query discipline problem, and that discipline has already lapsed in at least four places. |
| `supabase_schema.sql` / `supabase_seed.sql` removed | ✅ Gone, but still **referenced** in `README.md:93-94` as setup steps that no longer apply | Files don't exist; instructions are now wrong and would break onboarding for a new developer following the README |

**Verdict: the Supabase migration is code-complete but not fully "clean."** No functional dependency on Supabase remains, but (1) tenant isolation was demonstrably weakened by the move away from RLS in a handful of concrete routes, and (2) documentation and comments still narrate the old architecture as if current.

## B. Cosmetic-only Supabase remnants (safe to clean, not a functional risk)

| File | Line(s) | What |
|---|---|---|
| `src/api/apiClient.ts` | 2-3 | Comment: "Replaces all direct Supabase calls... instead of `{ supabase } from "@/api/supabase"`" — references a file that no longer exists |
| `server/config/db.ts` | 27 | Comment: "Snake_case → camelCase converter for Supabase shim compatibility" |
| `prisma/schema.prisma` | 316 | Inline comment: "Remove this field entirely if using Supabase Auth" |
| `README.md` | 3, 21, 41, 58, 83-94, 126, 289 | Describes Supabase as current backend; setup instructions reference nonexistent SQL files; also references a "Next.js" migration target that never happened |
| `PROJECT_ARCHITECTURE.md` | 4, 10-13, 29, 48 | Entire doc describes the pre-migration Supabase/RLS architecture as current |
| `DATABASE_SCHEMA.md` | 3, 21 | Describes schema as "built on PostgreSQL (via Supabase)" with RLS as the security model — neither is true of the current Prisma/Express implementation |

**Recommendation**: rewrite these three docs to describe the actual Prisma/Express/JWT architecture, or delete them if they're no longer intended to be authoritative. Leaving them as-is actively misleads new contributors (and misled the author of this audit's original brief, which is presumably downstream of one of these documents).

## C. Vite / react-router — confirm NOT removed (by design, not a defect)

The brief asked to verify "Vite completely removed" and "React Router removed" as part of a Next.js migration. Since that migration never happened, Vite and react-router-dom are **still the live, correct, functioning frontend stack** — there is nothing to remove. Flagging this only so it's explicit: this is not an incomplete migration, it's a migration that was never started, and given the app works on Vite today, there's no code-quality reason to start it unless there's a product reason (SSR/SEO needs for the marketing pages, discussed in `UI_UX_REVIEW.md`) that justifies the cost.

## D. Other dead code and leaked-credential findings surfaced during the sweep

These aren't Supabase-related but were found while doing the "read everything, find legacy/dead code" pass and are severe enough to require action:

| Finding | Files | Severity |
|---|---|---|
| **Live database password committed to git** (same Neon connection string, including password, hardcoded in each) | `check_db_members.ts:7`, `check_members.ts:6`, `check_tables.ts:6`, `check_tenants.ts:6`, `create_member_pg.ts:6`, `create_user.js:6`, `create_user.ts:6`, `create_userprofile_pg.ts:6`, `sync_users.ts:6`, `sync_users_pg.ts` | **Critical** |
| **Live WhatsApp Cloud API token committed** | `.env.example:9` (tracked), duplicated in untracked `.env:19` | **Critical** |
| Committed query-result dump containing real member PII (names/phones/UUIDs) | `output_members.json` | **High** |
| Machine-specific / accidental artifacts tracked in git | `"tall git-filter-repo"` (raw `git log` redirect output), `server/error.txt`, `server/output.txt` | Low (hygiene) |
| One-off debug/seed scripts sitting at repo root instead of a `scripts/` folder or removed entirely | `check_db_members.ts`, `check_members.ts`, `check_tables.ts`, `check_tenants.ts`, `create_member_pg.ts`, `create_user.js`, `create_user.ts`, `create_userprofile_pg.ts`, `run-seed.js`/`seed-admin.js`/`seed-admin.ts` (in `server/`) | Medium (clutter, but the credential issue above is the real risk) |
| Orphan Prisma file not used by any Prisma command, duplicating live models | `prisma/schema_additions.prisma` | Medium |
| Second, unconfigured `PrismaClient` instantiation never imported anywhere except a stray doc reference | `src/lib/prisma.ts` | Low |
| Unused role-hierarchy helper module (`hasRole`, `hasMinRole`) — never imported | `server/config/roles.ts` | Medium (represents effort spent building the *right* abstraction that then wasn't wired in — see `ARCHITECTURE_REVIEW.md` §7) |
| Six duplicate/unreachable frontend pages with a routed near-twin elsewhere | `pages/app/AnalyticsPage.tsx`, `AttendancePage.tsx`, `WorkoutsPage.tsx`, `MembersPage.tsx`, `pages/admin/SuperAdminPage.tsx`, `features/renewals/RenewalsPage.tsx` | Medium |
| `firebase-admin` — confirmed **not** dead, actively used for push notifications | `server/index.ts:4,43-56`, `server/services/notificationService.ts:3,83-86` | N/A (informational — brief didn't mention it, it's a legitimate active dependency) |

## E. Plaintext credentials committed in documentation

`README.md` (lines ~313-346) and `MASTER_PLAN.md` contain what read as real login credentials for a super admin account, several tenant/staff accounts, and a member phone-number login — committed directly into tracked markdown files. Even if these are seed/demo accounts rather than real production users, publishing role/tenant/password triples for every role in the system in a public-facing (or eventually public) README is a credential-hygiene problem: rotate any of these that correspond to real deployed accounts, and move demo credentials to a non-committed local setup doc instead.

## F. Recommendation summary

1. **Rotate the Neon DB password and WhatsApp token now** — both are live credentials in git history, not just working tree. Rotating in `.env` alone does not remove them from history; a history rewrite (`git filter-repo`/BFG) is needed if this repo is or will be public, or if the credential scope is broader than trusted collaborators.
2. Delete the root-level debug scripts, `output_members.json`, and the stray `"tall git-filter-repo"`/`error.txt`/`output.txt` files (or move genuinely useful ones into a `scripts/` directory with env-var-based config, no hardcoded credentials).
3. Rewrite `README.md`, `PROJECT_ARCHITECTURE.md`, `DATABASE_SCHEMA.md` to reflect the real stack.
4. Delete `prisma/schema_additions.prisma` and `src/lib/prisma.ts` (or wire the latter in and delete the duplicate client in `server/config/db.ts` — pick one).
5. Wire `server/config/roles.ts` into actual route middleware, or delete it.
6. Resolve the six duplicate page files per the recommendation in `ARCHITECTURE_REVIEW.md` §7.4.
