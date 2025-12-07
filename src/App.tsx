
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/features/auth/AuthContext"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"

// Pages
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { DashboardPage } from "@/pages/app/DashboardPage"
import { MembersPage } from "@/pages/app/MembersPage"
import { TrainersPage } from "@/pages/app/TrainersPage"
import { AttendancePage } from "@/pages/app/AttendancePage"
import { SchedulePage } from "@/pages/app/SchedulePage"
import { BillingPage } from "@/pages/app/BillingPage"
import { WorkoutsPage } from "@/pages/app/WorkoutsPage"
import { DietPlansPage } from "@/pages/app/DietPlansPage"
import { AnalyticsPage } from "@/pages/app/AnalyticsPage"
import { ReportsPage } from "@/pages/app/ReportsPage"
import { SettingsPage } from "@/pages/app/SettingsPage"
import { ProfilePage } from "@/pages/app/ProfilePage"
import { UnauthorizedPage } from "@/pages/auth/UnauthorizedPage"
import { NotFoundPage } from "@/pages/auth/NotFoundPage"
import { SuperAdminPage } from "@/pages/admin/SuperAdminPage"
import { BranchesPage } from "@/pages/app/BranchesPage"
import { ServicesPage } from "@/pages/app/ServicesPage"
import { FrontDeskPage } from "@/pages/app/FrontDeskPage"
import { LeadsPage } from "@/features/leads/LeadsPage"
import { RenewalsPage } from "@/features/renewals/RenewalsPage"
import { POSPage } from "@/features/pos/POSPage"
import { LockersPage } from "@/features/lockers/LockersPage"
import { OperationsPage } from "@/pages/app/OperationsPage"
import { MemberLayout } from "@/features/member-portal/MemberLayout"
import { MemberDashboard } from "@/features/member-portal/MemberDashboard"

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
              {/* Auth routes */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Member Portal Routes */}
              <Route path="/member" element={
                <ProtectedRoute>
                  <MemberLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<MemberDashboard />} />
                <Route path="schedule" element={<div className="p-4">Schedule Coming Soon</div>} />
                <Route path="profile" element={<div className="p-4">Profile Coming Soon</div>} />
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
                        <Route path="/super-admin" element={<SuperAdminPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/members" element={<MembersPage />} />
                        <Route path="/trainers" element={<TrainersPage />} />
                        <Route path="/front-desk" element={<FrontDeskPage />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/renewals" element={<RenewalsPage />} />
                        <Route path="/pos" element={<POSPage />} />
                        <Route path="/lockers" element={<LockersPage />} />
                        <Route path="/operations" element={<OperationsPage />} />
                        <Route path="/branches" element={<BranchesPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/workouts" element={<WorkoutsPage />} />
                        <Route path="/diet-plans" element={<DietPlansPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
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