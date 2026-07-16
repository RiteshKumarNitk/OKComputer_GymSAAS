
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute, SuperAdminRoute } from "@/features/auth/ProtectedRoute"
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

// Per-route role sets. Kept in sync with DashboardLayout.tsx's `navigation`
// config on purpose — that's the single source of truth for "which role
// sees this in the sidebar", and this is "which role can reach it directly
// by URL". They should never drift apart.
const OWNER_MANAGER_FRONTDESK = ["gym_owner", "manager", "frontdesk"] as const
const OWNER_MANAGER = ["gym_owner", "manager"] as const
const OWNER_MANAGER_TRAINER = ["gym_owner", "manager", "trainer"] as const
const OWNER_ONLY = ["gym_owner"] as const
const EVERYONE_NON_MEMBER = ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"] as const

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

              {/* Member Portal Routes — open to any authenticated user on
                  purpose (staff previewing the member portal isn't a data
                  leak; they already have more access than what's shown
                  there). Not gated to the "member" role specifically. */}
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
                  <ProtectedRoute requiredRoles={["super_admin", "gym_owner", "manager", "trainer", "frontdesk"]}>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
                        <Route path="/super-admin/tenants" element={<SuperAdminRoute><SuperAdminTenants /></SuperAdminRoute>} />
                        <Route path="/super-admin/subscriptions" element={<SuperAdminRoute><SuperAdminSubscriptions /></SuperAdminRoute>} />
                        <Route path="/super-admin/payments" element={<SuperAdminRoute><SuperAdminPayments /></SuperAdminRoute>} />
                        <Route path="/super-admin/settings" element={<SuperAdminRoute><SuperAdminSettings /></SuperAdminRoute>} />
                        {/* Same role set as the outer gate above — no extra wrapper needed */}
                        <Route path="/dashboard" element={<DashboardPage />} />

                        {/* Members Group */}
                        <Route path="/members" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><MemberDirectoryPage /></ProtectedRoute>} />
                        <Route path="/members/packages" element={<ProtectedRoute requiredRoles={OWNER_ONLY}><MembershipPackagesPage /></ProtectedRoute>} />
                        <Route path="/members/subscriptions" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><MemberSubscriptionsPage /></ProtectedRoute>} />
                        <Route path="/members/workouts" element={<ProtectedRoute requiredRoles={["gym_owner", "trainer"]}><MemberWorkoutsPage /></ProtectedRoute>} />
                        <Route path="/members/analytics" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><MemberAnalyticsPage /></ProtectedRoute>} />
                        <Route path="/members/attendance" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><MemberAttendancePage /></ProtectedRoute>} />
                        <Route path="/members/renewals" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><MemberRenewalsPage /></ProtectedRoute>} />
                        <Route path="/members/:id" element={<ProtectedRoute requiredRoles={["gym_owner", "manager", "frontdesk", "trainer"]}><MemberProfilePage /></ProtectedRoute>} />
                        <Route path="/members/add" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><AddMemberPage /></ProtectedRoute>} />

                        <Route path="/trainers" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_TRAINER}><TrainersPage /></ProtectedRoute>} />
                        <Route path="/front-desk" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><FrontDeskPage /></ProtectedRoute>} />
                        <Route path="/staff" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><StaffPage /></ProtectedRoute>} />
                        <Route path="/leads" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><LeadsPage /></ProtectedRoute>} />
                        <Route path="/pos" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><POSPage /></ProtectedRoute>} />
                        <Route path="/lockers" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><LockersPage /></ProtectedRoute>} />
                        <Route path="/operations" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><OperationsPage /></ProtectedRoute>} />
                        <Route path="/branches" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><BranchesPage /></ProtectedRoute>} />
                        <Route path="/services" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><ServicesPage /></ProtectedRoute>} />
                        <Route path="/schedule" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_TRAINER}><SchedulePage /></ProtectedRoute>} />
                        <Route path="/billing" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><BillingPage /></ProtectedRoute>} />
                        <Route path="/diet-plans" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_TRAINER}><DietPlansPage /></ProtectedRoute>} />
                        <Route path="/feedback" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><FeedbackPage /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><ReportsPage /></ProtectedRoute>} />
                        <Route path="/reports/sales" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><SalesReportPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute requiredRoles={OWNER_ONLY}><SettingsPage /></ProtectedRoute>} />
                        <Route path="/settings/access-control" element={<ProtectedRoute requiredRoles={OWNER_ONLY}><AccessControlsPage /></ProtectedRoute>} />
                        <Route path="/invoices" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><InvoicesPage /></ProtectedRoute>} />
                        <Route path="/billing/saas" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><SaasBillingPage /></ProtectedRoute>} />
                        <Route path="/enquiries/new" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><AddEnquiryPage /></ProtectedRoute>} />
                        <Route path="/follow-ups" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><FollowUpsPage /></ProtectedRoute>} />
                        <Route path="/campaigns" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><CampaignsPage /></ProtectedRoute>} />
                        <Route path="/settings/message-templates" element={<ProtectedRoute requiredRoles={OWNER_MANAGER}><MessageTemplatesPage /></ProtectedRoute>} />
                        <Route path="/qr-kiosk" element={<ProtectedRoute requiredRoles={OWNER_MANAGER_FRONTDESK}><QrKioskPage /></ProtectedRoute>} />
                        {/* Every non-member role has their own profile — deliberately not narrowed */}
                        <Route path="/profile" element={<ProtectedRoute requiredRoles={EVERYONE_NON_MEMBER}><ProfilePage /></ProtectedRoute>} />

                        {/* Legacy Redirects for stability — not individually gated: they
                            render no data themselves, and the route they redirect to
                            enforces its own guard the moment the browser lands there. */}
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
