/**
 * Prisma models that carry a REQUIRED (non-nullable) tenantId FK to Tenant —
 * i.e. every row of these models unambiguously belongs to exactly one tenant.
 *
 * Used by prismaTenantScope.ts to auto-inject `tenantId` into query `where`
 * clauses. Prisma's runtime dmmf does not expose field nullability in this
 * version, so this list can't be derived automatically — add new models here
 * when they're given a required `tenantId` field in schema.prisma.
 *
 * Deliberately excluded:
 * - Tenant, SaasPlan — not tenant-scoped themselves (root / platform-level).
 * - UserProfile, AuditLog — tenantId is NULLABLE on these (a super_admin's
 *   own UserProfile row has tenantId: null); auto-scoping them risks
 *   breaking legitimate cross-tenant lookups on genuinely ambiguous-owner
 *   models. They keep relying on the existing explicit tenantId filters.
 */
export const TENANT_SCOPED_MODELS: ReadonlySet<string> = new Set([
  "Membership",
  "Member",
  "Payment",
  "Attendance",
  "Trainer",
  "TrainerSlot",
  "Schedule",
  "Workout",
  "DietPlan",
  "MemberWorkout",
  "MemberDiet",
  "Notification",
  "Visitor",
  "Complaint",
  "Expense",
  "Lead",
  "FollowUp",
  "Product",
  "Locker",
  "SaasSubscription",
  "SaasInvoice",
  "Branch",
  "Service",
  "FrontDesk",
  "MembershipHistory",
  "MemberHealthProfile",
  "BodyMeasurement",
  "MemberFitnessStats",
  "StaffProfile",
  "StaffAttendance",
  "StaffLeave",
  "SalarySlip",
  "RenewalConfig",
  "FollowUpRule",
  "Message",
  "Campaign",
  "MessageTemplate",
  "RazorpayOrder",
  "RazorpayWebhookLog",
  "Invoice",
  "Discount",
  "WorkoutTemplate",
  "DailyWorkoutPlan",
])
