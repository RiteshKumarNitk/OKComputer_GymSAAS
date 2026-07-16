# DEVELOPMENT ROADMAP

Every item below is traceable to a specific finding in the companion reports. Priority and effort are estimates based on code complexity actually observed, not guesses about team velocity.

---

## Phase 0 — Do today, before anything else (Credential exposure)

Not part of the brief's phase structure, but nothing else matters if these aren't handled — this is active credential exposure, not a code-quality issue.

| Task | Files | Effort | Priority |
|---|---|---|---|
| Rotate Neon DB password | `check_db_members.ts` + 9 other root scripts | 30 min | Critical |
| Rotate WhatsApp Cloud API token | `.env.example`, `.env` | 30 min | Critical |
| Rotate any real credentials found in README/MASTER_PLAN | `README.md`, `MASTER_PLAN.md` | 1 hr | Critical |
| Scrub git history of the above if repo access is/will be broad | whole repo | 1-2 hrs | Critical |
| Delete root-level debug scripts, `output_members.json`, stray artifacts | see `MIGRATION_AUDIT.md` §D | 2-3 hrs | High |

**Total Phase 0: ~1 day.**

---

## Phase 1 — Critical bugs

| Task | Ref | Effort | Priority |
|---|---|---|---|
| Fix cross-tenant query bypass (add `tenantId` filter to unfiltered queries) | `SECURITY_REPORT.md` H4 / `DATABASE_REVIEW.md` D1 | 2-3 hrs | Critical |
| Fix member-portal identity bug (fetches tenant's first member, not logged-in member) | `FEATURE_GAP_ANALYSIS.md` §1 | 0.5-1 day | Critical |
| Replace `setInterval` cron jobs with a serverless-compatible scheduler | `ARCHITECTURE_REVIEW.md` §4 | 1-2 days | Critical |
| Fix hardcoded status bugs in Member Subscriptions view | `CODE_AUDIT.md` §4 | 2-3 hrs | High |
| Fix Contact page form (no submit handler) | `UI_UX_REVIEW.md` §4 | 2-4 hrs | Medium |

**Total Phase 1: ~4-5 days.**

---

## Phase 2 — Security fixes

| Task | Ref | Effort | Priority |
|---|---|---|---|
| Add `authenticate` (+ role checks) to `tenantRoutes.ts`, `billingRoutes.ts`, `uploadRoutes.ts` | `SECURITY_REPORT.md` C3 | 1 day | Critical |
| Enforce role-based route guards on the frontend router | `SECURITY_REPORT.md` C4 | 0.5-1 day | Critical |
| Build and apply a centralized `requireRole()` middleware (wire up existing `server/config/roles.ts`) | `SECURITY_REPORT.md` C5 | 2-3 days | Critical |
| Remove plaintext OTP logging | `SECURITY_REPORT.md` H1 | 15 min | High |
| Fix hardcoded master-OTP bypass condition | `SECURITY_REPORT.md` H2 | 30 min | High |
| Remove hardcoded JWT secret fallback | `SECURITY_REPORT.md` H3 | 30 min | High |
| Add file-size/MIME validation to upload route | `SECURITY_REPORT.md` H5 | 1-2 hrs | High |
| Fail closed on missing Razorpay secret + constant-time signature compare | `SECURITY_REPORT.md` H6 | 30 min | High |
| Wire `phoneRateLimiter` into OTP routes | `SECURITY_REPORT.md` M1 | 30 min | Medium |
| Add missing `tenantId` foreign keys (health/measurement tables) | `DATABASE_REVIEW.md` D4 | 1-2 hrs | Medium |
| Fix `SaasInvoice` cascade/delete handling | `DATABASE_REVIEW.md` D3 | 2-4 hrs | Medium |
| Route caught server errors through `errorMiddleware.ts` instead of leaking raw messages | `CODE_AUDIT.md` §7 | 1 day | Medium |
| Move JWT/session to httpOnly cookies + CSRF protection (larger, can follow) | `SECURITY_REPORT.md` M4 | 2-3 days | Medium |
| Add CSP header | `SECURITY_REPORT.md` M5 | 1 day | Medium |
| Add auth/authorization/tenant-isolation test coverage | `SECURITY_REPORT.md` L1 | 3-5 days | High (prevents regression of everything above) |

**Total Phase 2: ~2.5-3 weeks**, front-loaded on the Critical items (roughly the first week).

---

## Phase 3 — Performance

| Task | Ref | Effort | Priority |
|---|---|---|---|
| Add route-level code splitting (`React.lazy`/`Suspense`) | `PERFORMANCE_REPORT.md` P1 | 1 day | High |
| Add pagination to unbounded report/list endpoints | `PERFORMANCE_REPORT.md` P5 / `DATABASE_REVIEW.md` D5 | 4-6 hrs | Medium-High |
| Add `@@index([tenantId])` (or composite) to ~25 tenant-scoped tables | `DATABASE_REVIEW.md` D2 | 2-3 hrs | High |
| Replace N+1 loop writes with batched queries | `DATABASE_REVIEW.md` D6 | 4-6 hrs | Medium |
| Memoize shared `DataTable`/derived-list computations | `PERFORMANCE_REPORT.md` P3 | 1-2 days | Medium |
| Move dashboard chart aggregation to the backend, remove client-side fabrication | `PERFORMANCE_REPORT.md` P4 | 2-3 days | Medium (also a correctness fix) |
| Add Cloudinary upload/delivery transformations | `PERFORMANCE_REPORT.md` P6 | 0.5-1 day | Low-Medium |

**Total Phase 3: ~1.5-2 weeks.**

---

## Phase 4 — Missing features

Ordered by the Critical/Important/Nice-to-have ranking from `FEATURE_GAP_ANALYSIS.md`.

| Task | Ref | Effort | Priority |
|---|---|---|---|
| Build working super-admin plan/subscription management (replace `Subscriptions.tsx`, `Settings.tsx` placeholders) | `FEATURE_GAP_ANALYSIS.md` §2 | 1-2 weeks | Critical |
| Real business intelligence: backend aggregation for revenue/retention/growth (retire hardcoded/`MOCK_*` data) | `FEATURE_GAP_ANALYSIS.md` §3 | 1-2 weeks | Important |
| Recurring billing / membership auto-charge (Razorpay mandates or equivalent) | `FEATURE_GAP_ANALYSIS.md` §3 | 1-2 weeks | Important |
| Class booking capacity/waitlist logic | `FEATURE_GAP_ANALYSIS.md` §3 | 3-5 days | Important |
| Audit log for sensitive actions (impersonation, permission changes, billing edits) | `FEATURE_GAP_ANALYSIS.md` §2 | 3-5 days | Important |
| Real invoice viewer (replace `alert()`) | `FEATURE_GAP_ANALYSIS.md` §2 | 1-2 days | Medium |
| Wire trial-booking form data through to a real model/flow | `FEATURE_GAP_ANALYSIS.md` §2 | 2-3 days | Medium |
| Staff payroll computation from attendance (`SalarySlip` model exists, logic doesn't) | `FEATURE_GAP_ANALYSIS.md` §3 | 1 week | Important |
| Two-factor authentication | `FEATURE_GAP_ANALYSIS.md` §2 | 3-5 days | Nice to have |
| Legal review of JustDial scraping fallback; consider removing or gating it behind explicit terms review | `FEATURE_GAP_ANALYSIS.md` §1 | Legal consult + 1-2 days eng | Important (risk mitigation, not a feature) |

**Total Phase 4: ~2-2.5 months**, sequenced by business priority — the super-admin plan management and real BI are the two items most likely to block actually operating this as a SaaS business, so pull those earliest within this phase.

---

## Phase 5 — Scalability & polish

| Task | Ref | Effort | Priority |
|---|---|---|---|
| Break up `server/index.ts`, `MemberProfilePage.tsx`, `TenantOnboardingWizard.tsx` | `CODE_AUDIT.md` §3 | 3-5 days | Medium |
| Resolve duplicate/dead page files (6 files) | `CODE_AUDIT.md` §1 | 1-2 days | Medium |
| Delete `prisma/schema_additions.prisma`, resolve dual `PrismaClient` | `CODE_AUDIT.md` §1 | 2-4 hrs | Low |
| Rewrite `README.md`/`PROJECT_ARCHITECTURE.md`/`DATABASE_SCHEMA.md` to match reality | `MIGRATION_AUDIT.md` §F | 1 day | Medium |
| Add error boundaries + client error reporting | `UI_UX_REVIEW.md` U1 | 0.5 day + ongoing | High (cheap, high value — consider pulling into Phase 1) |
| Accessibility pass (aria-labels on icon buttons, modal focus handling) | `UI_UX_REVIEW.md` U3 | 1-2 days | Medium |
| Dark-mode persistence + app-wide scope | `UI_UX_REVIEW.md` U4 | 0.5 day | Low |
| Frontend/E2E test coverage build-out (Testing Library + Playwright are already installed, unused) | `FINAL_PROJECT_SCORE.md` | 2-3 weeks (ongoing investment) | High |
| Naming/URL consistency cleanup (kebab vs snake_case routes) | `CODE_AUDIT.md` §5 | 0.5 day | Low |

**Total Phase 5: ~1 month**, much of it parallelizable with Phase 4 feature work since it doesn't block feature delivery.

---

## Suggested sequencing note

Phase 0 and the Critical rows of Phase 1/2 (roughly: rotate credentials, fix tenant-isolation queries, lock down the five unauthenticated routes, add frontend route guards) can realistically be done by one engineer in under two weeks and should happen **before** any Phase 4 feature work — shipping new features on top of an unauthenticated tenant-management endpoint just increases what needs to be re-tested when it's fixed. The error-boundary addition in Phase 5 is cheap enough (half a day) that it's worth pulling forward into Phase 1 rather than waiting.

## Overall estimate

| Phase | Duration (1 engineer, focused) |
|---|---|
| Phase 0 | ~1 day |
| Phase 1 | ~1 week |
| Phase 2 | ~2.5-3 weeks |
| Phase 3 | ~1.5-2 weeks |
| Phase 4 | ~2-2.5 months |
| Phase 5 | ~1 month (partially parallel with Phase 4) |
| **Total (sequential)** | **~4.5-5.5 months** for one engineer; meaningfully shorter with 2-3 engineers working Phases 2/3/5 in parallel once Phase 0/1 criticals land. |
