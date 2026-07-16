
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"

// Pages
import { LandingPage } from "@/pages/LandingPage"
import { PricingPage } from "@/pages/PricingPage"
import { BlogPage } from "@/pages/BlogPage"
import { ContactPage } from "@/pages/ContactPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { DashboardPage } from "@/pages/app/DashboardPage"

// Members Section
import { MemberDirectoryPage } from "@/pages/app/members/MemberDirectoryPage"
import { MembershipPackagesPage } from "@/pages/app/members/MembershipPackagesPage"
import { MemberSubscriptionsPage } from "@/pages/app/members/MemberSubscriptionsPage"
import { MemberProfilePage } from "@/pages/app/members/MemberProfilePage"
import { MemberWorkoutsPage } from "@/pages/app/members/MemberWorkoutsPage"
import { MemberAnalyticsPage } from "@/pages/app/members/MemberAnalyticsPage"
import { MemberAttendancePage } from "@/pages/app/members/MemberAttendancePage"
import { MemberRenewalsPage } from "@/pages/app/members/MemberRenewalsPage"
import { AddMemberPage } from "@/pages/app/AddMemberPage"

import { TrainersPage } from "@/pages/app/TrainersPage"
import { SchedulePage } from "@/pages/app/SchedulePage"
import { BillingPage } from "@/pages/app/BillingPage"
import { DietPlansPage } from "@/pages/app/DietPlansPage"
import { ReportsPage } from "@/pages/app/ReportsPage"
import { SalesReportPage } from "@/pages/app/SalesReportPage"
import { AccessControlsPage } from "@/pages/app/AccessControlsPage"
import { SettingsPage } from "@/pages/app/SettingsPage"
import { ProfilePage } from "@/pages/app/ProfilePage"
import { InvoicesPage } from "@/pages/app/InvoicesPage"
import { SaasBillingPage } from "@/pages/app/SaasBillingPage"
import { UnauthorizedPage } from "@/pages/auth/UnauthorizedPage"
import { NotFoundPage } from "@/pages/auth/NotFoundPage"
import { SuperAdminDashboard } from "@/pages/admin/superadmin/Dashboard"
import { SuperAdminTenants } from "@/pages/admin/superadmin/Tenants"
import { SuperAdminSubscriptions } from "@/pages/admin/superadmin/Subscriptions"
import { SuperAdminPayments } from "@/pages/admin/superadmin/Payments"
import { SuperAdminSettings } from "@/pages/admin/superadmin/Settings"
import { SetupAdminPage } from "@/pages/auth/SetupAdminPage"
import { BranchesPage } from "@/pages/app/BranchesPage"
import { ServicesPage } from "@/pages/app/ServicesPage"
import { FrontDeskPage } from "@/pages/app/FrontDeskPage"
import { LeadsPage } from "@/features/leads/LeadsPage"
import { POSPage } from "@/features/pos/POSPage"
import { LockersPage } from "@/features/lockers/LockersPage"
import { OperationsPage } from "@/pages/app/OperationsPage"
import { StaffPage } from "@/pages/app/StaffPage"
import { MemberLayout } from "@/features/member-portal/MemberLayout"
import { MemberDashboard } from "@/features/member-portal/MemberDashboard"
import { MemberProfile } from "@/features/member-portal/MemberProfile"
import { MemberSchedule } from "@/features/member-portal/MemberSchedule"
import { MemberWorkouts } from "@/features/member-portal/MemberWorkouts"
import { MemberDiets } from "@/features/member-portal/MemberDiets"
import { FeedbackPage } from "@/pages/app/FeedbackPage"
import { AddEnquiryPage } from "@/pages/app/AddEnquiryPage"
import { FollowUpsPage } from "@/features/follow-ups/FollowUpsPage"
import { CampaignsPage } from "@/pages/app/CampaignsPage"
import { MessageTemplatesPage } from "@/pages/app/MessageTemplatesPage"
import { QrKioskPage } from "@/pages/app/QrKioskPage"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/setup-admin" element={<SetupAdminPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Member Portal Routes */}
              <Route path="/member" element={
                <ProtectedRoute>
                  <MemberLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<MemberDashboard />} />
                <Route path="workouts" element={<MemberWorkouts />} />
                <Route path="diets" element={<MemberDiets />} />
                <Route path="schedule" element={<MemberSchedule />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* CRM/Admin Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/super-admin" element={<SuperAdminDashboard />} />
                        <Route path="/super-admin/tenants" element={<SuperAdminTenants />} />
                        <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
                        <Route path="/super-admin/payments" element={<SuperAdminPayments />} />
                        <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        {/* Members Group */}
                        <Route path="/members" element={<MemberDirectoryPage />} />
                        <Route path="/members/packages" element={<MembershipPackagesPage />} />
                        <Route path="/members/subscriptions" element={<MemberSubscriptionsPage />} />
                        <Route path="/members/workouts" element={<MemberWorkoutsPage />} />
                        <Route path="/members/analytics" element={<MemberAnalyticsPage />} />
                        <Route path="/members/attendance" element={<MemberAttendancePage />} />
                        <Route path="/members/renewals" element={<MemberRenewalsPage />} />
                        <Route path="/members/:id" element={<MemberProfilePage />} />
                        <Route path="/members/add" element={<AddMemberPage />} />

                        <Route path="/trainers" element={<TrainersPage />} />
                        <Route path="/front-desk" element={<FrontDeskPage />} />
                        <Route path="/staff" element={<StaffPage />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/pos" element={<POSPage />} />
                        <Route path="/lockers" element={<LockersPage />} />
                        <Route path="/operations" element={<OperationsPage />} />
                        <Route path="/branches" element={<BranchesPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/diet-plans" element={<DietPlansPage />} />
                        <Route path="/feedback" element={<FeedbackPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/reports/sales" element={<SalesReportPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/access-control" element={<AccessControlsPage />} />
                        <Route path="/invoices" element={<InvoicesPage />} />
                        <Route path="/billing/saas" element={<SaasBillingPage />} />
                        <Route path="/enquiries/new" element={<AddEnquiryPage />} />
                        <Route path="/follow-ups" element={<FollowUpsPage />} />
                        <Route path="/campaigns" element={<CampaignsPage />} />
                        <Route path="/settings/message-templates" element={<MessageTemplatesPage />} />
                        <Route path="/qr-kiosk" element={<QrKioskPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        
                        {/* Legacy Redirects for stability */}
                        <Route path="/plans" element={<Navigate to="/members/packages" replace />} />
                        <Route path="/workouts" element={<Navigate to="/members/workouts" replace />} />
                        <Route path="/attendance" element={<Navigate to="/members/attendance" replace />} />
                        <Route path="/analytics" element={<Navigate to="/members/analytics" replace />} />
                        <Route path="/renewals" element={<Navigate to="/members/renewals" replace />} />
                        <Route path="/expenses" element={<Navigate to="/operations" replace />} />
                        <Route path="/reports/balance-due" element={<Navigate to="/reports" replace />} />
                        <Route path="/reports/expired" element={<Navigate to="/reports" replace />} />
                        <Route path="/reports/member-card" element={<Navigate to="/reports" replace />} />
                        <Route path="/reports/due-membership" element={<Navigate to="/reports" replace />} />
                        <Route path="/reports/sms" element={<Navigate to="/reports" replace />} />
                        <Route path="/settings/biometric" element={<Navigate to="/settings" replace />} />

                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App