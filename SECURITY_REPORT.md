# SECURITY REPORT

Findings are ranked by severity. Each includes why it matters, business impact, affected files, a concrete fix, and an effort estimate. All findings are based on code actually read in this repository — file:line references are exact as of the audited commit on `dev1`.

---

## CRITICAL

### C1. Live production database credentials committed to git
**Files:** `check_db_members.ts:7`, `check_members.ts:6`, `check_tables.ts:6`, `check_tenants.ts:6`, `create_member_pg.ts:6`, `create_user.js:6`, `create_user.ts:6`, `create_userprofile_pg.ts:6`, `sync_users.ts:6`, `sync_users_pg.ts`
**Why it's a problem:** A real Neon Postgres connection string, including username and password, is hardcoded (not read from `process.env`) in ten tracked files.
**Business impact:** Anyone with read access to this repository (including its full git history, even after later deletion) has the credentials to connect directly to the production database — read, modify, or delete all tenant data, bypassing every application-layer control.
**Fix:** Rotate the Neon database password immediately. Delete these files or rewrite them to use `process.env.DATABASE_URL`. If the repository is or will become public, or if its access has ever been broader than fully-trusted collaborators, treat the credential as compromised regardless of rotation timing, and scrub git history with `git filter-repo` or BFG.
**Estimated effort:** 30 minutes to rotate + 1-2 hours to clean history and update scripts.

### C2. Live WhatsApp Cloud API token committed
**Files:** `.env.example:9` (tracked), `.env:19` (untracked, but pushed at some point if `.env` was ever committed — verify with `git log --all -- .env`)
**Why it's a problem:** `.env.example` is meant to hold placeholders; every other value in it is empty or an obvious dummy string, but this one is a long, real-looking Meta Graph API access token.
**Business impact:** Anyone with repo access can send WhatsApp messages (including OTPs) as your business number, exhausting your messaging quota or impersonating your brand to your gym members.
**Fix:** Rotate the token in Meta Business Manager, replace the value in `.env.example` with a placeholder, confirm `.env` is genuinely gitignored and was never committed.
**Estimated effort:** 30 minutes.

### C3. Multiple production API routes have no authentication

**Status: ✅ Fixed 2026-07-16.** `tenantRoutes.ts` (`GET /`, `POST /`, `PATCH /` — the query-param-style routes the frontend actually calls) now require `authenticate` plus an ownership check (own tenant or `super_admin`) or `requireRole("super_admin")` where appropriate. `billingRoutes.ts` now requires `authenticate` with an ownership check on the `subscription`/`invoices` branches (`plans` stays open to any authenticated user). `uploadRoutes.ts` now requires `authenticate` and enforces a 5MB size limit + image/PDF MIME allowlist. See the Batch 2 plan for the full investigation of which routes the frontend actually calls (several were query-param style, not the path-param routes that already had auth).
**Files/routes:**
- `server/routes/tenantRoutes.ts:8` — `GET /api/tenants` — lists every tenant with member/user counts, no auth.
- `server/routes/tenantRoutes.ts:31` — `POST /api/tenants` — unauthenticated tenant + gym-owner account creation.
- `server/routes/tenantRoutes.ts:103` — `PATCH /api/tenants?id=` — unauthenticated update of **any** tenant by arbitrary id, including subscription/billing fields.
- `server/routes/billingRoutes.ts:7` — `GET /api/billing?type=subscription&tenantId=X` — no auth; read any tenant's SaaS subscription/invoice data by supplying any `tenantId`.
- `server/routes/uploadRoutes.ts:10` — `POST /api/upload` — no auth, no file-size limit, no MIME allowlist; open relay to your Cloudinary account.

**Why it's a problem:** These are not edge cases — they are core tenant-management and billing endpoints reachable by anyone on the internet with no token at all.
**Business impact:** `tenantRoutes.ts:103` alone allows anyone to arbitrarily change any gym's subscription status (e.g., set every tenant to `active` with a far-future expiry, destroying your SaaS billing integrity) or corrupt tenant data. `billingRoutes.ts:7` leaks competitor-sensitive financial data across tenants. `uploadRoutes.ts` lets anyone burn through your Cloudinary storage/bandwidth quota at your cost, or host arbitrary files (including ones designed to look legitimate) on your CDN.
**Fix:** Apply the existing `authenticate` middleware (from `server/config/db.ts`) to every route in `tenantRoutes.ts` and `billingRoutes.ts`, and add both `authenticate` and a `super_admin`/`gym_owner` role check where appropriate (tenant creation should arguably remain semi-public for self-serve signup, but if so it needs rate limiting and validation, not the current fully-open state). Add `authenticate` plus file-size/MIME validation to `uploadRoutes.ts`.
**Estimated effort:** 1 day (mostly testing after the change, since these are used by the tenant onboarding wizard and settings pages).

### C4. Route-level authorization is not enforced on the frontend at all

**Status: ✅ Fixed 2026-07-16.** `src/App.tsx`'s outer `<ProtectedRoute>` around the CRM/admin tree now sets `requiredRoles` to every role except `member`, so a member-role user is redirected to `/unauthorized` instead of browsing the owner/manager app shell. The 5 `/super-admin/*` routes are now individually wrapped in the existing `SuperAdminRoute`. Per-page role arrays for the remaining ~50 individual CRM routes are not reconciled against backend role arrays — deferred as separate, lower-urgency work.
**File:** `src/App.tsx`
**Why it's a problem:** Every non-public page is wrapped in a single `<ProtectedRoute>` with no `requiredRoles` prop. `ProtectedRoute.tsx` defines role-specific wrapper components (`SuperAdminRoute`, `GymOwnerRoute`, etc.) that exist but are never used.
**Business impact:** Any authenticated user — including a `member` or `trainer` account — can type `/settings/access-control`, `/billing/saas`, or any admin URL directly into the browser and see (and, if the underlying API also lacks a check, act on) admin-only screens. This is defense-in-depth failure on top of the backend gaps above, not the sole line of defense, but it's currently the *only* line of defense for pages whose backing APIs also don't check roles consistently (see C5).
**Fix:** Apply the existing role-specific route wrappers per route in `App.tsx`, matching the role arrays already defined in `server/config/crudHelper.ts` calls for consistency.
**Estimated effort:** 0.5-1 day.

### C5. No centralized authorization middleware on the backend

**Status: ✅ Fixed 2026-07-16 (Production Ready v1.0, Item 1).** `server/middleware/requireRole.ts` and the new `server/middleware/requirePermission.ts` are now applied across every hand-written route file — 6 pre-existing inline checks lifted mechanically, plus 22 previously-ungated routes (including every payment-handling route) given an explicit role gate for the first time. Full detail in `FEATURE_COMPLETION_MATRIX.md` #42. `crudHelper.ts`'s ownership-style checks intentionally remain inline (not a `requireRole` fit). One follow-up flagged, not yet done: `authRoutes.ts`'s `POST /register` uses a hierarchical caller-role→allowed-target-roles check with its own inline JWT verification, bypassing the shared `authenticate` middleware — doesn't fit this pass's mechanical scope, needs its own look.
**Files:** every hand-written route file under `server/routes/*.ts` and the inline handlers in `server/index.ts:104-204`
**Why it's a problem:** `server/config/roles.ts` defines a proper role-hierarchy system (`hasRole`, `hasMinRole`, `ROLE_HIERARCHY`) but it is **never imported anywhere**. Every hand-written route instead inlines its own `if (req.role !== 'x')` check, duplicated dozens of times, with no single source of truth. This is exactly the kind of inconsistency that produced C3.
**Business impact:** Every new route added by a developer has to remember to add its own ad hoc check; it's already been forgotten multiple times (C3). This class of bug will keep recurring until there's one enforced pattern.
**Fix:** Build a `requireRole(...roles)` Express middleware using the existing (unused) `server/config/roles.ts` helpers, and apply it to every route file, or migrate remaining hand-written routes onto `createCrudRoutes`'s existing role-array pattern (`server/config/crudHelper.ts`), which already does this correctly for the 25 resources registered through it.
**Estimated effort:** 2-3 days to refactor all route files and re-test.

---

## HIGH

### H1. OTP is logged in plaintext on every request
**File:** `server/controllers/authController.ts:29` — `logger.info(\`🔑 [TEST OTP] for ${phone}: ${otp}\`)`
**Why it's a problem:** This log line runs unconditionally, not gated behind a dev/test environment check, despite the "TEST OTP" label implying it should be.
**Business impact:** Anyone with access to application logs (a common blast radius — logging platforms, on-call engineers, misconfigured log-forwarding) can read any user's live OTP and log in as them, completely bypassing the hashed-OTP storage design in `otpService.ts`.
**Fix:** Remove this log line, or gate it strictly behind `if (process.env.NODE_ENV !== 'production')`.
**Estimated effort:** 15 minutes.

### H2. Hardcoded master OTP bypass, gated only by `NODE_ENV`
**File:** `server/services/otpService.ts:26` — accepts `'123456'` as valid for any phone whenever `process.env.NODE_ENV !== 'production'`
**Why it's a problem:** If `NODE_ENV` is ever unset or misconfigured in the deployed environment (a common failure mode — Vercel doesn't always set this automatically for every function invocation path), this becomes a universal login bypass for every account in the system.
**Business impact:** Full authentication bypass for any phone number, in the worst case in production.
**Fix:** Explicitly check `process.env.ALLOW_TEST_OTP === 'true'` (an opt-in flag you deliberately never set in production config) rather than relying on the absence of a different flag.
**Estimated effort:** 30 minutes.

### H3. Hardcoded JWT signing-secret fallback
**File:** `server/controllers/authController.ts:11` — `process.env.NEXTAUTH_SECRET || "gym-saas-secret-key"`
**Why it's a problem:** If the env var is ever missing in this code path (it's inconsistent with `server/config/db.ts`, which correctly refuses to start without it), tokens get signed with a hardcoded, public string anyone can read from this repo.
**Business impact:** Anyone can forge a valid JWT for any user/role/tenant, including `super_admin`, achieving full account takeover across the entire platform.
**Fix:** Import the same fail-fast secret check used in `server/config/db.ts` instead of redefining it with a fallback in `authController.ts`. Never fall back to a literal string for a signing secret.
**Estimated effort:** 30 minutes.

### H4. Cross-tenant data access via unfiltered `findUnique`/`update`/`delete`

**Status: ✅ Fixed 2026-07-16, then hardened structurally 2026-07-16.** See `DATABASE_REVIEW.md` D1 — beyond fixing the 5 known call sites, a Prisma extension now auto-injects `tenantId` into tenant-scoped queries for every request, so this bug class can't silently reappear in code not yet reviewed.
**Files:** `server/index.ts:187` (workout template PATCH), `server/index.ts:199` (workout template DELETE), `server/routes/memberRoutes.ts:31` (membership lookup), `server/routes/memberRoutes.ts:96`, `server/routes/memberRoutes.ts:343` (template assignment)
**Why it's a problem:** These queries use only `{ where: { id } }` with no `tenantId` filter, despite every one of these models having a `tenantId` column meant to isolate tenants.
**Business impact:** A malicious or curious authenticated user from **Tenant A** can pass an id that belongs to **Tenant B** and modify or delete Tenant B's workout templates, or attach Tenant B's membership plan/pricing to a member in their own gym. In a multi-tenant SaaS this is the single most reputation-damaging class of bug possible — it breaks the fundamental promise of tenant isolation this product is sold on.
**Fix:** Add `tenantId: req.tenantId` to every `where` clause on tenant-scoped models. This is the single highest-value, lowest-effort fix in this entire audit.
**Estimated effort:** 2-3 hours (mechanical fix, needs a careful sweep — see `DATABASE_REVIEW.md` for the full list of at-risk queries beyond these five).

### H5. File upload endpoint has no size limit, no MIME allowlist, and no auth
**File:** `server/routes/uploadRoutes.ts` (whole file)
**Why it's a problem:** `multer.memoryStorage()` is configured with no `limits.fileSize`, and the uploaded file's mimetype is trusted as-is when building the base64 data URI sent to Cloudinary. Combined with the missing auth (C3), this is a fully open, unbounded upload relay.
**Business impact:** (a) Cost/DoS: an attacker can upload arbitrarily large files repeatedly, consuming your Cloudinary storage/bandwidth quota and, since this runs in a memory-buffered Vercel serverless function, potentially exhausting function memory and crashing the invocation. (b) Content risk: uploading non-image files (executables disguised with an image extension, SVGs containing embedded `<script>` for stored XSS if ever rendered inline rather than via `<img>`) that end up hosted on your CDN under your domain's trust.
**Fix:** Add `authenticate`, a `limits: { fileSize: <reasonable max> }` to multer, and a MIME-type allowlist (`image/jpeg`, `image/png`, `application/pdf`, etc. — whatever the product actually needs).
**Estimated effort:** 1-2 hours.

### H6. Razorpay signature verification falls back to an empty HMAC key
**File:** `server/routes/paymentRoutes.ts:100` — `crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")`
**Why it's a problem:** If `RAZORPAY_KEY_SECRET` is unset, the HMAC is computed with an empty string instead of failing closed. An attacker who knows (or guesses) this can compute a valid signature for a fabricated `razorpayOrderId|razorpayPaymentId` pair themselves.
**Business impact:** Combined with an unset secret, this could allow a forged "payment verified" call, marking a `RazorpayOrder` as paid and creating a `Payment` record without any real money moving. The immediate risk is contained by the fact the secret is normally set, but this is a landmine for any environment (staging, a new deploy) where it briefly isn't.
**Fix:** Throw/500 if `RAZORPAY_KEY_SECRET` is not set, rather than defaulting to an empty string. Also switch the comparison at line 104 to `crypto.timingSafeEqual` instead of `!==` to avoid a timing side-channel.
**Estimated effort:** 30 minutes.

### H7. Plaintext credentials committed in project documentation
**Files:** `README.md` (~lines 313-346), `MASTER_PLAN.md`
**Why it's a problem:** Full email/password pairs for a super admin, several tenant/staff roles, and a member phone-number login are written directly into tracked markdown files.
**Business impact:** If these correspond to real, currently-active accounts (the super admin one in particular — `innovatex@gmail.com` — looks like it could be), anyone with repo access has standing admin credentials to the live system, independent of any of the JWT/auth bugs above.
**Fix:** Rotate any of these that are real accounts. Move demo/seed credentials to a local, gitignored setup doc instead of the committed README.
**Estimated effort:** 1 hour.

---

## MEDIUM

### M1. OTP request rate limiting is implemented but not applied
**Files:** `server/middleware/rateLimiter.ts:27` (`phoneRateLimiter`, 3 requests/10min per phone — correctly implemented), `server/routes/authRoutes.ts:14,17` (only `ipRateLimiter`, 20 req/min per IP, is actually wired to `/send-otp` and `/verify-otp`)
**Why it's a problem:** The per-phone throttle exists and is well-built, but isn't attached to the routes it was clearly written for. IP-based limiting alone is trivially bypassed with distributed requests, leaving a single victim phone number exposed to OTP brute-forcing / spam from many IPs.
**Business impact:** Increased risk of OTP brute-force against a specific victim, and of OTP-spam harassment against a specific member.
**Fix:** Add `phoneRateLimiter` to `/send-otp` and `/verify-otp` alongside `ipRateLimiter`.
**Estimated effort:** 30 minutes.

### M2. Rate limiter fails open when Redis is unavailable
**File:** `server/middleware/rateLimiter.ts:21-23, 45-47` — `catch (err) { logger.error(...); next(); }`
**Why it's a problem:** A reasonable default for availability, but it means any Redis outage silently disables all rate limiting with no alerting differentiator visible to callers.
**Business impact:** During a Redis incident, brute-force/OTP-spam protection disappears exactly when attackers might be probing for it (e.g., timed around a known maintenance window).
**Fix:** Keep fail-open for now (fail-closed would take the whole API down on a Redis blip, which is worse), but add monitoring/alerting on the `logger.error` path so a Redis outage is visible operationally.
**Estimated effort:** 1-2 hours (alerting wiring, depends on your ops stack).

### M3. JWTs are long-lived with no revocation mechanism
**Files:** `server/routes/authRoutes.ts:46` (30-day tokens for phone/OTP login), `:123,163,191,233` (7-day tokens for email/password login, registration, admin setup, and impersonation)
**Why it's a problem:** There is no refresh-token rotation and no server-side session/blacklist table, so a stolen token (see H-adjacent XSS risk below) remains valid for up to 30 days with no way to revoke it short of rotating the signing secret (which would log out every user simultaneously).
**Business impact:** Increases the damage window of any token theft; there's no "log out this device" or "log out everywhere" capability for a compromised account.
**Fix:** Shorten token lifetime and add a refresh-token flow, or at minimum add a server-side revocation list (even a simple "tokens issued before timestamp X for user Y are invalid" record) for password-reset/logout-everywhere flows.
**Estimated effort:** 2-3 days for a proper refresh-token system; 0.5 day for a minimal revocation list.

### M4. JWT and user object stored in `localStorage`, not an httpOnly cookie
**Files:** `src/features/auth/AuthContext.tsx:98-99,124-125,163-164`, `src/api/apiClient.ts:24-33`
**Why it's a problem:** `localStorage` is readable by any JavaScript running on the page, including injected via XSS. An httpOnly cookie would not be readable by client-side script even in the presence of an XSS bug.
**Business impact:** Any XSS vulnerability elsewhere in the SPA (see M5) becomes a full account-takeover vector, with a token valid for up to 30 days (M3), rather than being contained.
**Fix:** This is a meaningful architectural change (move to httpOnly cookie-based sessions, which also requires CSRF protection since cookies are auto-sent). Reasonable to defer until other criticals are fixed, but should be on the roadmap for a product handling payment and PII data.
**Estimated effort:** 2-3 days.

### M5. No CSP, no explicit output-encoding review performed
**Files:** N/A — no Content-Security-Policy header was found configured anywhere in `server/index.ts` or `vercel.json`.
**Why it's a problem:** React escapes JSX children by default, which mitigates most reflected/stored XSS, but there was no CSP header found as a defense-in-depth layer, and several pages render user-controlled data that wasn't individually re-verified in this pass (e.g., lead names/notes, complaint text, campaign templates with placeholder interpolation in `MessageTemplatesPage.tsx`).
**Business impact:** Without CSP, a single missed escaping bug anywhere in ~70 page components becomes exploitable with no second line of defense; combined with M4's localStorage token storage, the payout for finding one is high.
**Fix:** Add a CSP header (`vercel.json` or Express middleware) restricting script sources, and do a targeted review of any component using `dangerouslySetInnerHTML` (none were found flagged during this pass, which is a good sign, but wasn't independently verified for every one of the ~70 page files at the line level).
**Estimated effort:** 1 day for CSP + spot-check; treat as ongoing hygiene.

### M6. CORS allows credentialed requests with an env-driven origin allowlist that defaults permissively
**File:** `server/index.ts:64-79`
**Why it's a problem:** `ALLOWED_ORIGINS` defaults to `"http://localhost:5173,http://localhost:3000"` if unset, and the code explicitly allows `"*"` as a valid entry in that list while `credentials: true` is also set — if an operator ever sets `ALLOWED_ORIGINS=*` for convenience, this becomes a wildcard-plus-credentials CORS misconfiguration (browsers normally block this combination, but the app-layer logic reflects any origin with `callback(null, true)` when `"*"` is present, which is the unsafe pattern regardless of what any single browser enforces).
**Business impact:** Low today (requires an operator misconfiguration), but it's a footgun sitting in the code waiting for a deploy-time mistake to activate it.
**Fix:** Remove the `"*"` allowance from the credentialed-CORS code path entirely; if a public, non-credentialed API is ever needed, serve it from a separate route/config.
**Estimated effort:** 30 minutes.

---

## LOW

### L1. Health/CORS test coverage exists but almost nothing else does
See `DEVELOPMENT_ROADMAP.md`/`FINAL_PROJECT_SCORE.md` for testing completion — noted here because untested auth/authorization code is itself a security-process gap: none of the findings above would have been caught by CI because there are no tests exercising auth, roles, or tenant isolation.

### L2. `console.log`/`console.error` used for security-relevant events instead of structured logging
**Files:** e.g. `server/index.ts:52,54,71`, `server/routes/uploadRoutes.ts:19` use `console.*` while a real `winston`-based `logger` (`server/config/logger.ts`) exists and is used elsewhere (`otpService.ts`, `rateLimiter.ts`, `validate.ts`).
**Why it's a problem:** Inconsistent logging makes it harder to build alerting/SIEM rules around security events (CORS blocks, upload failures, Firebase init failures) since they don't go through the same structured pipeline as everything else.
**Fix:** Route all logging through `server/config/logger.ts`.
**Estimated effort:** 1-2 hours.

### L3. `.env.example` includes an unused `NEXTAUTH_SECRET` alongside a used `JWT_SECRET`-equivalent under a different name
**File:** `.env.example:5-6`
**Why it's a problem:** The code actually reads `process.env.NEXTAUTH_SECRET` as the JWT signing secret (a confusing name given there's no NextAuth), while `.env.example:6`'s `JWT_SECRET` variable is never read by anything. An operator following the example file could set the wrong variable and hit the fallback in H3.
**Fix:** Rename the env var the code reads to `JWT_SECRET` (matching what it actually is) and remove the unused entry, or vice versa — just make them consistent.
**Estimated effort:** 30 minutes + redeploy.

---

## What's genuinely done well (for balance)

- Passwords are hashed with `bcrypt` (not a weaker/rolled-your-own scheme).
- OTPs are bcrypt-hashed before being stored in Redis, not stored in plaintext (undermined only by the plaintext logging bug, H1).
- OTP verification enforces a max-attempt counter server-side (`otpService.ts:44-47`).
- The Razorpay payment-settlement flow (`paymentRoutes.ts:32-59`) correctly wraps a multi-step write (payment + invoice + membership extension) in `prisma.$transaction`.
- `createCrudRoutes` (`server/config/crudHelper.ts`) — the mechanism behind 25 of the app's resources — correctly derives tenant scoping from the verified JWT (`req.tenantId`) rather than trusting any client-supplied value, and applies per-verb role arrays consistently. Most of the app's surface area is protected by this one well-built mechanism; the vulnerabilities above are concentrated in the routes that bypass it.
- Zod-based request validation (`server/middleware/validate.ts`) is a sound, reusable pattern where it's used (registration flow).

## Summary table

| ID | Finding | Severity | Status |
|---|---|---|---|
| C1 | DB password committed to git | Critical | Open |
| C2 | WhatsApp token committed to git | Critical | Open |
| C3 | Unauthenticated tenant/billing/upload routes | Critical | ✅ Fixed 2026-07-16 |
| C4 | No frontend route-level role enforcement | Critical | ✅ Fixed 2026-07-16 |
| C5 | No centralized backend authorization middleware | Critical | ✅ Fixed 2026-07-16 |
| H1 | OTP logged in plaintext | High | Open |
| H2 | Hardcoded master OTP bypass | High | Open |
| H3 | Hardcoded JWT secret fallback | High | Open |
| H4 | Cross-tenant data access (missing tenantId filters) | High | ✅ Fixed 2026-07-16 |
| H5 | Upload endpoint: no size/MIME limits, no auth | High | Open |
| H6 | Razorpay signature verification empty-key fallback | High | Open |
| H7 | Plaintext credentials in README/MASTER_PLAN | High | Open |
| M1 | Phone OTP rate limiter built but not wired in | Medium | Open |
| M2 | Rate limiter fails open on Redis outage | Medium | Open |
| M3 | Long-lived JWTs, no revocation | Medium | Open |
| M4 | JWT in localStorage, not httpOnly cookie | Medium | Open |
| M5 | No CSP header | Medium | Open |
| M6 | CORS wildcard-with-credentials footgun | Medium | Open |
| L1 | No auth/authz test coverage | Low | Open |
| L2 | Inconsistent logging for security events | Low | Open |
| L3 | Confusing/unused env var naming | Low | Open |
