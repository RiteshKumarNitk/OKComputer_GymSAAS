# FEATURE GAP ANALYSIS

Feature inventory based on reading every routed page/feature component in `src/pages/` and `src/features/`. Status definitions: **Complete** = real API-backed CRUD/flow with loading/empty states; **Partial** = real API calls mixed with hardcoded/decorative elements; **Placeholder** = UI shell with no real backend wiring; **Unreachable** = code exists but isn't routed.

## 1. Full feature inventory

| Feature | File(s) | Status | Notes |
|---|---|---|---|
| Dashboard (owner/manager) | `pages/app/DashboardPage.tsx` | Complete, with a caveat | Real API calls, charts, CSV export. Monthly trend charts are extrapolated client-side from a single `totalRevenue` figure, not a true time series — looks real, isn't statistically real. |
| Dashboard (super admin) | same file | Partial | Real tenant/invoice counts; "System Health: Optimal" is hardcoded text. |
| Member Analytics | `pages/app/members/MemberAnalyticsPage.tsx` | **Complete (fixed 2026-07-16)** | Previously: real stat cards but "Retention Rate 88%" and all percentage deltas were hardcoded, revenue trend and plan analytics panels showed literal "Coming Soon" text. Now backed by `server/lib/analytics.ts`: real 30-day/90-day retention, real month-over-month change % on every metric card, a real revenue trend chart, and a real top-performing-plans list. See `FEATURE_COMPLETION_MATRIX.md` #30. |
| Reports (member reports) | `pages/app/ReportsPage.tsx` | Complete | Real data, tabs, CSV export. |
| Sales Report | `pages/app/SalesReportPage.tsx` | Partial | Real invoice data; filter controls (Tax Type/Plan/Sale Type) and "Apply" button are non-functional decoration. |
| POS (Point of Sale) | `features/pos/POSPage.tsx` | Complete | Real product CRUD, cart, checkout that both records payment and decrements stock. |
| Leads / Enquiries (CRM) | `features/leads/LeadsPage.tsx` | Complete | Full CRUD, filters, CSV export, follow-up automation. |
| Lead Generator (B2B scraper) | `features/leads/LeadGeneratorDialog.tsx`, `server/services/{leadScraperService,justdialScraper}.ts` | Complete, but see legal note below | Primary path: Google Places API. Fallback: live Playwright scraping of justdial.com with explicit anti-bot-detection evasion (spoofed UA, disabled automation flags, randomized delays). |
| Member Portal | `features/member-portal/*` | Partial | Real routes/API calls, but every page resolves "my profile" via `membersApi.list(tenantId)[0]` — i.e., it shows the tenant's first member, not the logged-in member. Likely shows the wrong data for any tenant with >1 member. |
| WhatsApp Campaigns | `pages/app/CampaignsPage.tsx`, `server/services/whatsappService.ts` | Complete | Real Meta Graph API integration, functional once credentials are set. |
| Message Templates | `pages/app/MessageTemplatesPage.tsx` | Complete | Real CRUD, trigger-key automation, live preview, test-send. |
| SMS | `server/services/smsService.ts` | Complete | Real Twilio integration with retry. |
| Notifications | `features/notifications/NotificationCenter.tsx` | Complete | Real unread polling, mark-read. |
| QR Kiosk / Check-in | `pages/app/QrKioskPage.tsx` | Complete | Real check-in flow. |
| Attendance | `pages/app/members/MemberAttendancePage.tsx`, `features/attendance/*` | Complete | Manual check-in, history, date filters. "Setup Hardware" button is decorative. |
| Follow-Ups | `features/follow-ups/FollowUpsPage.tsx` | Partial | Real fetch/filter/export, but "Allocate"/"Scheduled By" columns and lead fallback name/phone are hardcoded literals (`"sonu verma"`, `"ARUN KUMAR"`); row actions have empty handlers. |
| Members Directory | `pages/app/members/MemberDirectoryPage.tsx` | Complete | Full CRUD, stats, export. |
| Member Profile (detail) | `pages/app/members/MemberProfilePage.tsx` | Complete | 10 tabs, each independently wired; "Biometric" tab is cosmetic (toast only), reasonably so — no hardware exists to integrate. |
| Membership Packages | `pages/app/members/MembershipPackagesPage.tsx`, `features/memberships/PlanForm.tsx` | Complete | Full CRUD, activate/deactivate. |
| Active Subscriptions view | `pages/app/members/MemberSubscriptionsPage.tsx` | Partial (bug) | "Status" hardcoded to "Active", "Auto-Renew" hardcoded to "OFF" regardless of real data. |
| Renewals | `pages/app/members/MemberRenewalsPage.tsx` | Complete | Expiry filtering, WhatsApp reminder deep-link, renew mutation. |
| Workout Templates | `pages/app/members/MemberWorkoutsPage.tsx` | Complete | CRUD + assign-to-member. |
| Diet Plans | `pages/app/DietPlansPage.tsx` | Complete | CRUD, meal builder, assignment. |
| Trainers | `pages/app/TrainersPage.tsx` | Complete | Full CRUD. |
| Staff (system users) | `pages/app/StaffPage.tsx` | Complete | CRUD, activate/deactivate, password reset (sets literal `Welcome@123` default). "Gym QR" dialog is a static placeholder. |
| Front Desk Staff (separate entity) | `features/front-desk/StaffManagement.tsx` | Complete | Separate CRUD from the above — see `CODE_AUDIT.md` for the overlap question. |
| Front Desk Hub | `pages/app/FrontDeskPage.tsx` | Partial | Real tiles to real pages; has a stub "Coming Soon" toast fallback path for any future tile without a target. |
| Access Controls (permissions) | `pages/app/AccessControlsPage.tsx` | **Placeholder (fake persistence)** | Full granular-permission UI, but "Save" writes only to `localStorage`; nothing server-side reads or enforces this data — it's decorative. |
| Branches | `pages/app/BranchesPage.tsx` | Complete | Full CRUD. |
| Services & Pricing | `pages/app/ServicesPage.tsx` | Complete | Full CRUD (overlap question noted in `CODE_AUDIT.md`). |
| Schedule / Class Booking | `pages/app/SchedulePage.tsx` | Complete | Full CRUD, daily/weekly views. |
| Billing & Finance | `pages/app/BillingPage.tsx` | Complete | Expense CRUD, payments/invoices, printable invoice. |
| Invoices | `pages/app/InvoicesPage.tsx` | Partial | List/export real; "view" action is a plain `alert()`, not a real invoice viewer. |
| SaaS Billing (tenant-facing) | `pages/app/SaasBillingPage.tsx` | Partial | Real invoice fetch and PDF generation; plan name/tier text is hardcoded, not derived from actual subscription. |
| Operations (Visitors/Complaints) | `pages/app/OperationsPage.tsx` | Complete | Full CRUD both. |
| Feedback | `pages/app/FeedbackPage.tsx` | Complete | CRUD/reply flow. |
| Add Enquiry | `pages/app/AddEnquiryPage.tsx` | Partial | Core submission works; "Book a Trial" sub-panel data is captured but never sent — pure decoration. |
| Lockers | `features/lockers/LockersPage.tsx` | Complete | CRUD, assign/release with expiry logic. |
| Profile / Business Settings | `pages/app/ProfilePage.tsx`, `pages/app/SettingsPage.tsx` | Complete, mostly | Two-Factor Authentication button explicitly disabled with "Coming Soon". |
| Super Admin: Tenants | `pages/admin/superadmin/Tenants.tsx` | Complete | Real CRUD, suspend/activate, and a genuine tenant-impersonation feature — powerful and correctly wired, but see `SECURITY_REPORT.md` for whether it's adequately gated. "Members: 128 / Trainers: 12" table figures are hardcoded, not real per-tenant counts. |
| Super Admin: Dashboard | `pages/admin/superadmin/Dashboard.tsx` | Partial | Real tenant/invoice counts; growth charts use literal `MOCK_REVENUE_DATA`/`MOCK_GROWTH_DATA`; "Fastest Growing Gyms" percentage is `Math.random()` per render. |
| Super Admin: Subscriptions | `pages/admin/superadmin/Subscriptions.tsx` | **Placeholder** | Fetches plans but only logs the count; all pricing tiers/prices/module lists are hardcoded JSX; no button has a handler. |
| Super Admin: Payments | `pages/admin/superadmin/Payments.tsx` | Partial | Real invoice table; MRR/growth/churn figures are hardcoded constants; export buttons have no handlers. |
| Super Admin: Settings | `pages/admin/superadmin/Settings.tsx` | **Placeholder** | Entire page has zero state, zero API calls, zero working buttons. |
| Marketing: Landing/Pricing/Blog/Contact | `pages/{LandingPage,PricingPage,BlogPage,ContactPage}.tsx` | Static / Partial | Real static pages (not stubs), but the **Contact form has no submit handler at all** — fully non-functional; Blog is 3 hardcoded cards with no CMS or detail pages; Pricing is hardcoded and disconnected from real `billingApi` plan data. |
| Auth (Sign In/Up, OTP, Setup Admin) | `pages/auth/*` | Complete | Real flows. |

## 2. Explicitly missing (not found anywhere in the codebase)

- **Audit logs** — no model, table, or UI surfaced for "who changed what, when." Impersonation (a security-sensitive action) and permission changes are not logged anywhere.
- **Data backups** — no backup tooling, scheduled export, or disaster-recovery mechanism found in code (expected to be a Neon/hosting-platform responsibility, but nothing in-app surfaces backup status/history to an admin).
- **Real analytics/BI pipeline** — every "analytics" screen in the app either extrapolates one aggregate number into a fake series, hardcodes percentage deltas, or shows a literal "Coming Soon" panel. There is no backend aggregation/rollup job or time-series storage found (`dashboardApi.getStats()` returns simple current-state totals only).
- **Working super-admin subscription/plan management** — `Subscriptions.tsx` and `Settings.tsx` under super-admin are non-functional mockups; a platform operator currently cannot actually manage plans or global payment-gateway settings through the UI, despite the screens existing.
- **Real invoice viewer** — "view invoice" is a plain `alert()` in `InvoicesPage.tsx`; only the SaaS billing PDF generator produces an actual document.
- **Class/trial booking backend support** — the UI for booking a trial class exists in `AddEnquiryPage.tsx` but the captured data is never submitted; there's no `TrialBooking`-type model in the schema.
- **Two-factor authentication** — explicitly disabled/labeled "Coming Soon" in `ProfilePage.tsx`.
- **CMS for marketing content** — Blog/Pricing pages are hardcoded; no content-management backend.

## 3. Ranked comparison against category incumbents (GymDesk, Trainerize, Mindbody, Zen Planner, ABC Fitness, PushPress, Wodify)

### Critical (table-stakes for a gym owner to switch to this product)
| Gap | Current state | Why it's critical |
|---|---|---|
| Working plan/subscription management for platform operator | Placeholder (`Subscriptions.tsx`) | Without this, you as the SaaS operator cannot actually manage what you're selling — every incumbent has working billing-plan admin. |
| Reliable renewal/expiry/follow-up automation | Code exists but likely doesn't run in production (serverless `setInterval` bug — see `ARCHITECTURE_REVIEW.md`) | Automated renewal reminders are the single most-cited reason gym owners buy this category of software; if it silently doesn't fire, the core value proposition is broken without anyone noticing until members lapse. |
| Correct member-portal identity resolution | Bug — shows tenant's first member, not logged-in member | A member portal that shows the wrong person's workouts/diet/schedule is worse than no portal at all; every incumbent's member app correctly scopes to the logged-in user. |
| Tenant data isolation guarantees | Several unfiltered cross-tenant queries (see `SECURITY_REPORT.md`) | This is the fundamental trust promise of any multi-tenant SaaS; incumbents at this scale have this solved. |

### Important (expected by most gym owners evaluating options, present in most incumbents)
| Gap | Current state |
|---|---|
| Real business intelligence (retention curves, cohort/LTV analysis, revenue forecasting) | Fabricated/hardcoded everywhere it appears |
| Class/session booking with capacity limits and waitlists | `SchedulePage.tsx` provides CRUD scheduling but no capacity/waitlist logic was found |
| Recurring billing / auto-charge for memberships | Razorpay integration exists for one-off order/verify, but no subscription/auto-debit (mandate) flow found |
| Staff payroll automation tied to attendance | `SalarySlip`/`StaffAttendance` models exist in schema but no computation logic surfaced in the audited routes |
| Audit trail for sensitive actions (impersonation, permission changes, billing edits) | None found |
| Working contact/lead-capture form on the marketing site | Contact form has no submit handler |

### Nice to have (differentiators, not required to compete)
| Gap | Current state |
|---|---|
| Biometric/turnstile hardware integration | Explicitly cosmetic (toast-only), reasonable to defer — needs real hardware partnerships |
| White-label/custom domain support | Branding fields (logo/colors) exist on `Tenant`, but no custom-domain routing found |
| In-app community/leaderboards | Not present (was aspirational in `MASTER_PLAN.md`, never built) |
| Mobile app parity | Flutter app exists separately (out of scope for this audit) — parity not verified here |

## 4. What's ahead of a typical MVP in this category (credit where due)

- **WhatsApp/SMS automation with real provider integrations** (not just "email a CSV") is further along than many competitors' base tiers.
- **POS with live inventory deduction** tied to a real payment record is a genuinely complete "Phase 2" feature per the product's own `MASTER_PLAN.md`, already built.
- **Lead scraping/enrichment** (Google Places, with a JustDial fallback) is a differentiated, unusual feature not commonly found in this category at all — legal risk aside (see `SECURITY_REPORT.md`/note above), it's more sophisticated than most competitors' lead-gen tooling.
- **Tenant impersonation for support** is a real, useful operator feature many smaller competitors lack.
