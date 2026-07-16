-- Batch 1: tenant-isolation & data-integrity fixes (see DATABASE_REVIEW.md D2, D4)
-- All statements below are additive and non-destructive: new indexes and one new
-- foreign key constraint on columns that already exist and are already populated
-- by application code. Safe to run on a database with existing data.

-- D2: missing @@index([tenantId]) on tenant-scoped tables
-- (32 models identified in the audit, plus Membership and StaffLeave found
-- missing an index during implementation)

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE INDEX "Trainer_tenantId_idx" ON "Trainer"("tenantId");

-- CreateIndex
CREATE INDEX "TrainerSlot_tenantId_idx" ON "TrainerSlot"("tenantId");

-- CreateIndex
CREATE INDEX "Schedule_tenantId_idx" ON "Schedule"("tenantId");

-- CreateIndex
CREATE INDEX "Workout_tenantId_idx" ON "Workout"("tenantId");

-- CreateIndex
CREATE INDEX "DietPlan_tenantId_idx" ON "DietPlan"("tenantId");

-- CreateIndex
CREATE INDEX "MemberWorkout_tenantId_idx" ON "MemberWorkout"("tenantId");

-- CreateIndex
CREATE INDEX "MemberDiet_tenantId_idx" ON "MemberDiet"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "Visitor_tenantId_idx" ON "Visitor"("tenantId");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_idx" ON "Complaint"("tenantId");

-- CreateIndex
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "FollowUp_tenantId_idx" ON "FollowUp"("tenantId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE INDEX "Locker_tenantId_idx" ON "Locker"("tenantId");

-- CreateIndex
CREATE INDEX "SaasSubscription_tenantId_idx" ON "SaasSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "SaasInvoice_tenantId_idx" ON "SaasInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");

-- CreateIndex
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");

-- CreateIndex
CREATE INDEX "FrontDesk_tenantId_idx" ON "FrontDesk"("tenantId");

-- CreateIndex
CREATE INDEX "MembershipHistory_tenantId_idx" ON "MembershipHistory"("tenantId");

-- CreateIndex
CREATE INDEX "MemberHealthProfile_tenantId_idx" ON "MemberHealthProfile"("tenantId");

-- CreateIndex
CREATE INDEX "BodyMeasurement_tenantId_idx" ON "BodyMeasurement"("tenantId");

-- CreateIndex
CREATE INDEX "MemberFitnessStats_tenantId_idx" ON "MemberFitnessStats"("tenantId");

-- CreateIndex
CREATE INDEX "StaffAttendance_tenantId_idx" ON "StaffAttendance"("tenantId");

-- CreateIndex
CREATE INDEX "StaffLeave_tenantId_idx" ON "StaffLeave"("tenantId");

-- CreateIndex
CREATE INDEX "SalarySlip_tenantId_idx" ON "SalarySlip"("tenantId");

-- CreateIndex
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- CreateIndex
CREATE INDEX "RazorpayOrder_tenantId_idx" ON "RazorpayOrder"("tenantId");

-- CreateIndex
CREATE INDEX "RazorpayWebhookLog_tenantId_idx" ON "RazorpayWebhookLog"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- D4: MemberHealthProfile, BodyMeasurement, MemberFitnessStats carried a
-- tenantId column with no enforced foreign key to Tenant. Adding it now.
-- Existing rows are expected to already satisfy this (tenantId was always
-- set by application code to a valid Tenant.id), so this should apply
-- cleanly; if it fails with a foreign key violation, some rows have a
-- tenantId that doesn't match any Tenant and must be fixed manually first.

-- AddForeignKey
ALTER TABLE "MemberHealthProfile" ADD CONSTRAINT "MemberHealthProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFitnessStats" ADD CONSTRAINT "MemberFitnessStats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
