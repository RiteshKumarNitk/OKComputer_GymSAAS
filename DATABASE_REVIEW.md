# DATABASE REVIEW

**ORM:** Prisma 7 with `@prisma/adapter-pg`, PostgreSQL.
**Schema file:** `prisma/schema.prisma` (~40 models). A second file, `prisma/schema_additions.prisma`, duplicates several models but is not referenced by any Prisma command and is dead — see `MIGRATION_AUDIT.md`.
**Migrations:** two migrations present (`20260320083045_init`, `20260320084307_init`) — both named `init`, suggesting the migration history was squashed/reset at some point rather than representing genuine incremental schema evolution. Not a defect by itself, but means there's no real migration audit trail to review.

## 1. Model inventory and tenant-isolation posture

| Model | Has `tenantId` | `onDelete` on tenant FK | Indexing notes |
|---|---|---|---|
| `Tenant` | — (root entity) | — | `slug` unique |
| `UserProfile` | nullable | `SetNull` (default) | `email` unique (global, not per-tenant); indexed on phone/role/tenantId+role |
| `Member` | ✓ | Cascade | `@@unique(tenantId, memberCode)`; indexed on status, tenantId+status, joinedAt, planExpiresAt |
| `Payment` | ✓ | Cascade | `razorpayOrderId` unique; indexed tenantId+status, tenantId+memberId, paidAt |
| `Attendance` | ✓ | Cascade | indexed tenantId+memberId+checkinAt |
| `SaasInvoice` | ✓ | **Restrict** (the one outlier — see finding D3) | `invoiceNumber` unique |
| `MemberHealthProfile`, `BodyMeasurement`, `MemberFitnessStats` | ✓ (raw column) | **No FK/relation to `Tenant` at all** | memberId FK/unique only |
| ~25 other tenant-scoped models (Visitor, Complaint, Expense, Lead, Product, Locker, Branch, Service, Workout, DietPlan, Message, Campaign, Invoice, Discount, StaffProfile, StaffAttendance, SalarySlip, MessageTemplate, RazorpayOrder, WorkoutTemplate, RenewalConfig, FollowUpRule, TrainerSlot, Schedule, Trainer, MemberWorkout, MemberDiet, Notification, MembershipHistory, StaffLeave) | ✓ | Cascade | **none carry `@@index([tenantId])`** |
| `SaasPlan` | — (platform-level, correctly global) | — | — |

## 2. Findings, most severe first

### D1. Cross-tenant reads/writes bypass the `tenantId` filter entirely (Critical — duplicated from `SECURITY_REPORT.md` H4, included here for the DB-level view)

**Status: ✅ Fixed 2026-07-16 (specific instances), then made structural 2026-07-16.** The 5 identified call sites were fixed directly, and — as this section originally recommended — a Prisma client extension now auto-injects `tenantId` into the `where` clause of every query against a tenant-scoped model for the current request (`server/lib/prismaTenantScope.ts`, `server/lib/tenantScopedModels.ts`, `server/lib/tenantContext.ts`, wired into `server/config/db.ts`). This is a backstop under the existing explicit filters, not a replacement for them — it exists specifically to catch any cross-tenant query bypass not yet found by manual review. `super_admin` requests and background/cron jobs (which run outside any request context) are correctly exempted. Covered by unit tests in `server/__tests__/tenantScope.test.ts`.
`server/index.ts:187,199` (workout template update/delete), `server/routes/memberRoutes.ts:31,96,343` (membership/template lookups) query by `{ where: { id } }` alone. Every one of these models has a `tenantId` column specifically to prevent this. This is the single most important database-layer finding in the audit — it's not a missing index or a performance nit, it's the multi-tenancy guarantee failing at the query level.
**Fix:** add `tenantId: req.tenantId` to every `where` clause on a tenant-scoped model. Consider a Prisma middleware (`$extends`/query extension) that automatically injects a tenant filter for a defined list of models, so this class of bug becomes structurally hard to reintroduce — this is the closest equivalent to what Row-Level Security used to guarantee in the pre-migration Supabase design (see `MIGRATION_AUDIT.md` §A).
**Effort:** 2-3 hours for the known instances; 1 day if building the Prisma-middleware structural fix.

### D2. Missing `tenantId` indexes on nearly every tenant-scoped table (High)

**Status: ✅ Fixed 2026-07-16.** Added `@@index([tenantId])` to 34 models — the ~32 originally identified here plus `Membership` and `StaffLeave`, which turned out to be missing an index too and were caught while implementing this fix. Migration: `prisma/migrations/20260716120000_add_tenant_indexes_and_health_fk/migration.sql` (not yet applied to the database — additive `CREATE INDEX` statements, run `npx prisma migrate deploy` when ready).
None of the ~25 models listed above have `@@index([tenantId])`, despite every list/filter query in `createCrudRoutes` (`server/config/crudHelper.ts:49`) and most hand-written routes filtering by `tenantId` first. Postgres does not automatically index foreign-key columns.
**Business impact:** every list page (members, leads, invoices, attendance, etc.) performs a sequential scan filtered by tenant as data grows — currently invisible with small seed data, but this is exactly the kind of issue that turns into a production incident once a handful of tenants have tens of thousands of rows each.
**Fix:** add `@@index([tenantId])` (or a composite index leading with `tenantId` matching the most common query shape, e.g. `@@index([tenantId, createdAt])` for list-and-sort pages) to every affected model.
**Effort:** 2-3 hours to write and migrate; low risk (additive migration).

### D3. Inconsistent `onDelete` behavior — one model will throw an unhandled error on tenant deletion (Medium)

**Status: ✅ Fixed 2026-07-16 (guarded, not cascaded).** Per product decision, `SaasInvoice` still does not cascade — billing history is preserved. `server/routes/tenantRoutes.ts`'s `DELETE /api/tenants` now catches the Prisma `P2003` foreign-key-violation error and returns a clear `409` ("Cannot delete tenant with existing billing history...") instead of an unhandled `500`.
`SaasInvoice.tenant` has no explicit `onDelete`, defaulting to `Restrict` (confirmed in `migration.sql:662`), while every other tenant-scoped model cascades. `server/routes/tenantRoutes.ts:118` calls `prisma.tenant.deleteMany({ where: { id } })` unconditionally.
**Business impact:** deleting any tenant that has ever had a SaaS invoice generated will throw an unhandled FK-violation 500 error instead of either cascading or returning a clear "cannot delete tenant with billing history" message.
**Fix:** either make `SaasInvoice` cascade like everything else (if invoice history doesn't need retention after tenant deletion) or — better for a billing record — catch the FK violation in the delete route and return a clear 409 with an explanatory message, and/or implement soft-delete for tenants instead of hard delete given they have financial history attached.
**Effort:** 2-4 hours depending on which approach (soft-delete is more work but more correct for a billing entity).

### D4. `MemberHealthProfile`, `BodyMeasurement`, `MemberFitnessStats` have a `tenantId` column with no actual foreign key (Medium)

**Status: ✅ Fixed 2026-07-16.** All three models now have `tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)`, matching every other tenant-scoped model. Included in the same migration as D2 (see above) — not yet applied to the database.
Confirmed absent in `migration.sql:384-393` — only the `memberId` FK exists on these tables.
**Business impact:** tenant integrity on these three tables is enforced only by application code remembering to filter/set `tenantId` correctly — there's no database-level guarantee, and no cascade behavior if a tenant is deleted (these rows would become orphaned rather than cleaned up).
**Fix:** add the missing `tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)` to all three models and migrate.
**Effort:** 1-2 hours.

### D5. Unbounded list endpoints — no pagination on several report/list routes (Medium)
`server/routes/attendanceRoutes.ts:19` (`GET /`), `server/routes/reportRoutes.ts:75,83,91` (revenue/attendance/member-growth reports), `server/routes/billingRoutes.ts:23` (invoices) all call `findMany` with no `skip`/`take`. By contrast, `crudHelper.ts:82-95` implements proper pagination (page/limit, capped at 100) for everything routed through it.
**Business impact:** these specific endpoints will return every row in the table on every call as data grows — slow responses, high memory use per request, and (given the serverless deployment — see `ARCHITECTURE_REVIEW.md`) risk of hitting function memory/time limits under load.
**Fix:** apply the same pagination pattern used in `crudHelper.ts` to these hand-written routes, or route them through the CRUD factory if their shape allows it.
**Effort:** 4-6 hours across the affected routes.

### D6. N+1 query patterns in loop-based writes (Medium)
`server/routes/memberRoutes.ts:350-372` loops per weekly-template day doing a `findFirst` + `create`/`update` each iteration instead of a single batched query; `memberRoutes.ts:323-327` loops individual `bodyMeasurement.create` calls instead of `createMany`.
**Business impact:** for a 7-day workout template assignment, this is 7-14+ round trips to the database instead of 1-2; multiplies out with member count during bulk operations (e.g. assigning a template to many members).
**Fix:** replace the day-loop with a single `createMany`/`upsert`-batch pattern where the data shape allows it (weekly-plan upserts may need `Promise.all` at minimum if true batch upsert isn't expressible, but that's still better than sequential awaits).
**Effort:** 4-6 hours.

### D7. Non-atomic multi-step writes outside the two `$transaction` usages (Low-Medium)
`prisma.$transaction` is used correctly in `memberRoutes.ts:18` (member creation), `memberRoutes.ts:99` (renewal), `tenantRoutes.ts:69` (tenant+owner creation), and `paymentRoutes.ts:32-59` (payment settlement — payment + invoice + membership extension, correctly transactional). However, the N+1 loops in D6 are themselves multi-step writes with no transaction wrapper — a failure partway through leaves a partially-assigned workout template or partially-recorded measurement set.
**Fix:** wrap the batched replacement for D6 in `prisma.$transaction` once converted to fewer queries.
**Effort:** included in D6's estimate.

### D8. `DATABASE_URL` has no runtime validation guard (Low)

**Status: ✅ Fixed 2026-07-16.** `server/config/db.ts` now checks `DATABASE_URL` explicitly and exits with a clear error if unset, matching the existing `JWT_SECRET` guard pattern in the same file.
`server/config/db.ts:17` uses `process.env.DATABASE_URL!` — a TypeScript-only non-null assertion, not an actual runtime check. By contrast, `JWT_SECRET`/`NEXTAUTH_SECRET` in the same file is checked and the process exits if missing.
**Business impact:** if `DATABASE_URL` is ever unset, the failure mode is an unclear runtime crash from deep inside the Prisma adapter rather than a clear startup error — harder to diagnose in a serverless cold-start context where logs are less accessible.
**Fix:** add the same explicit guard used for the JWT secret.
**Effort:** 15 minutes.

### D9. No explicit SSL configuration for the Postgres adapter (Low, informational)

**Status: ✅ Fixed 2026-07-16.** `server/config/db.ts` now warns at startup if `DATABASE_URL` doesn't appear to request SSL (`sslmode=require`/`ssl=true`). Kept as a warning, not a hard fail, since Neon's pooled connection strings can express this differently.
`server/config/db.ts` does not pass explicit SSL options to `PrismaPg` — connection security depends entirely on `sslmode=require` (or equivalent) being present in the `DATABASE_URL` string itself. This is Neon's default and typically fine, but it's implicit rather than enforced in code, so a misconfigured connection string (missing `sslmode`) would silently connect over plaintext.
**Fix:** consider asserting `sslmode=require` is present in `DATABASE_URL` at startup, or passing explicit SSL config to the adapter rather than relying solely on the connection string.
**Effort:** 30 minutes.

## 3. What's done well

- Schema breadth is genuinely comprehensive for a gym SaaS — members, memberships, attendance, trainers, scheduling, payments (Razorpay), invoicing, workouts/diet plans, staff/payroll, leads/CRM, POS/products, lockers, branches, messaging templates, and SaaS-level billing (plans/subscriptions/invoices) are all modeled with sensible relations.
- Most tenant-scoped models correctly cascade on tenant deletion (the one outlier is documented in D3).
- Composite uniqueness constraints are used appropriately where they matter: `Member` (`tenantId`+`memberCode`), `StaffProfile` (`tenantId`+`employeeCode`), `StaffAttendance` (`staffId`+`date`), `SalarySlip` (`staffId`+`month`+`year`), `MessageTemplate` (`tenantId`+`triggerKey`), `Discount` (`tenantId`+`code`), `WorkoutTemplate` (`tenantId`+`name`), `RenewalConfig`/`FollowUpRule` (per-tenant singleton/type patterns) — this reflects real thought about what should be unique per-tenant vs. globally.
- The generic CRUD layer's pagination (`crudHelper.ts:82-95`) is well implemented and capped sensibly (max 100/page) where it's used.
- The four genuine `$transaction` usages (member creation, renewal, tenant+owner creation, payment settlement) are all in exactly the places that most need atomicity — these are correct, not decorative.

## 4. Priority fix order for this report specifically

1. D1 (cross-tenant query bypass) — same finding as `SECURITY_REPORT.md` H4, do this first regardless of which report you're reading.
2. D2 (missing tenantId indexes) — cheap, safe, high future payoff.
3. D4 (missing FK on health/measurement tables) — cheap, closes a real integrity gap.
4. D3 (SaasInvoice onDelete) — before it causes a support incident on your first tenant offboarding.
5. D5/D6/D7 (pagination, N+1s, transaction coverage) — performance, not correctness; schedule after the above.
6. D8/D9 — low-effort hygiene, bundle with other config work.
