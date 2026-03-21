import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { tenantsApi, usersApi, billingApi, dashboardApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { DashboardStats } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Calendar,
  ArrowRight,
  CreditCard,
  Dumbbell,
  Shield,
  Plus,
  Building,
  Users as UsersIcon,
  Settings,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RevenueChart } from "@/components/charts/RevenueChart"
import { AttendanceChart } from "@/components/charts/AttendanceChart"
import { MembershipChart } from "@/components/charts/MembershipChart"

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.tenant_id],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await dashboardApi.getStats()
      if (response.error) throw response.error
      return response.data as DashboardStats
    },
    enabled: !!user?.tenant_id && user?.role !== "super_admin",
  })

  // Fetch Super Admin Stats
  const { data: superStats, isLoading: superLoading } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const tenantsRes = await tenantsApi.list()
      const usersRes = await usersApi.list()
      const invoicesRes = await billingApi.getInvoices("all")

      const activeTenants = tenantsRes.data?.filter((t: any) => t.subscription_status === "active") || []
      const totalRevenue = invoicesRes.data?.reduce((acc: number, curr: any) => acc + (curr.amount_cents || 0), 0) || 0
      
      // Calculate monthly revenue from recent invoices
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const monthlyRevenue = invoicesRes.data
        ?.filter((inv: any) => new Date(inv.created_at) > thirtyDaysAgo)
        .reduce((acc: number, curr: any) => acc + (curr.amount_cents || 0), 0) || 0

      return {
        totalTenants: tenantsRes.data?.length || 0,
        activeTenants: activeTenants.length,
        totalUsers: usersRes.data?.length || 0,
        totalRevenue,
        monthlyRevenue,
        recentTenants: tenantsRes.data?.slice(0, 5) || []
      }
    },
    enabled: user?.role === "super_admin"
  })

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    description?: string
    trend?: number
    loading?: boolean
    className?: string
  }> = ({ title, value, icon, description, trend, loading, className }) => {
    if (loading) {
      return (
        <Card className={className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            {description && <Skeleton className="h-4 w-32" />}
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full text-primary">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          <div className="flex items-center justify-between mt-1">
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend !== undefined && (
              <div className={`flex items-center text-xs font-medium ${trend >= 0 ? "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded" : "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded"}`}>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {user?.role === "super_admin" ? (
        <>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white shadow-lg">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                System Overview
              </h1>
              <p className="text-slate-300 max-w-xl">
                Manage the entire GymPro ecosystem. You currently have {superStats?.activeTenants || 0} active gyms across the platform.
              </p>
            </div>
            <Shield className="absolute right-8 top-1/2 -translate-y-1/2 h-24 w-24 text-white/10" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(superStats?.totalRevenue || 0)}
              icon={<DollarSign className="h-4 w-4" />}
              description="All-time SaaS revenue"
              loading={superLoading}
              className="border-l-emerald-500"
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(superStats?.monthlyRevenue || 0)}
              icon={<TrendingUp className="h-4 w-4" />}
              description="Last 30 days"
              loading={superLoading}
              className="border-l-blue-500"
            />
            <StatCard
              title="Active Tenants"
              value={superStats?.activeTenants || 0}
              icon={<Building className="h-4 w-4" />}
              description={`Out of ${superStats?.totalTenants || 0} total`}
              loading={superLoading}
              className="border-l-amber-500"
            />
            <StatCard
              title="System Users"
              value={superStats?.totalUsers || 0}
              icon={<UsersIcon className="h-4 w-4" />}
              description="Total platform users"
              loading={superLoading}
              className="border-l-violet-500"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Latest gyms to join the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {superStats?.recentTenants.map((tenant: any) => (
                    <div key={tenant.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.owner_email}</p>
                        </div>
                      </div>
                      <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {tenant.subscription_status || 'Trial'}
                      </Badge>
                    </div>
                  ))}
                  {superStats?.recentTenants.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No tenants yet.</p>
                  )}
                </div>
                <Button variant="link" className="w-full mt-4" onClick={() => navigate("/super-admin")}>
                  View All Tenants <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col" onClick={() => navigate("/super-admin")}>
                  <Plus className="h-5 w-5 mb-2" />
                  Add Tenant
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={() => navigate("/super-admin#plans")}>
                  <CreditCard className="h-5 w-5 mb-2" />
                  Manage Plans
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={() => navigate("/super-admin?tab=users")}>
                  <UsersIcon className="h-5 w-5 mb-2" />
                  View Users
                </Button>
                <Button variant="outline" className="h-20 flex flex-col" onClick={() => navigate("/settings")}>
                  <Settings className="h-5 w-5 mb-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-lg">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Welcome back, {user?.full_name?.split(" ")[0] || "Gym Owner"}!
              </h1>
              <p className="text-indigo-100 max-w-xl">
                Here's what's happening at your gym today. You have {stats?.attendanceToday || 0} active check-ins and {stats?.newMembersThisMonth || 0} new members this month.
              </p>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 -skew-x-12 transform translate-x-12" />
            <div className="absolute right-20 bottom-0 h-full w-1/3 bg-white/5 -skew-x-12 transform translate-x-12" />
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon={<Users className="h-4 w-4" />}
              description="Active members"
              loading={statsLoading}
              className="border-l-blue-500"
            />
            <StatCard
              title="Revenue (Monthly)"
              value={formatCurrency(stats?.monthlyRevenue || 0)}
              icon={<DollarSign className="h-4 w-4" />}
              description="This month"
              trend={12.5}
              loading={statsLoading}
              className="border-l-emerald-500"
            />
            <StatCard
              title="Attendance Today"
              value={stats?.attendanceToday || 0}
              icon={<Activity className="h-4 w-4" />}
              description="Checked in today"
              loading={statsLoading}
              className="border-l-amber-500"
            />
            <StatCard
              title="New Members"
              value={stats?.newMembersThisMonth || 0}
              icon={<UserPlus className="h-4 w-4" />}
              description="This month"
              trend={8.2}
              loading={statsLoading}
              className="border-l-violet-500"
            />
          </div>

          {/* Charts & Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Analytics</TabsTrigger>
                {hasRole(["gym_owner", "manager", "super_admin"]) && (
                  <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Reports</TabsTrigger>
                )}
              </TabsList>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-white px-3 py-1 rounded-md border shadow-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Monthly revenue performance</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <RevenueChart data={stats?.revenueTrend || []} />
                  </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle>Membership Distribution</CardTitle>
                    <CardDescription>Active members by plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MembershipChart data={stats?.membershipDistribution || {}} />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions Row */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate("/members")}
                >
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Add Member</h3>
                      <p className="text-sm text-muted-foreground">Register a new gym member</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate("/billing")}
                >
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Record Payment</h3>
                      <p className="text-sm text-muted-foreground">Process a new transaction</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate("/workouts")}
                >
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Create Workout</h3>
                      <p className="text-sm text-muted-foreground">Design a new workout plan</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Last 7 days check-in activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AttendanceChart data={stats?.attendanceTrend || []} />
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-start space-x-4 pb-4 border-b last:border-0 last:pb-0">
                          <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-medium">New member registration</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {hasRole(["gym_owner", "manager", "super_admin"]) && (
              <TabsContent value="reports" className="space-y-6">
                <Card className="shadow-sm border-slate-200">
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Monthly revenue and expense tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">Total Revenue</span>
                        <span className="font-bold text-lg text-emerald-600">{formatCurrency(stats?.totalRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">Monthly Revenue</span>
                        <span className="font-bold text-lg text-blue-600">{formatCurrency(stats?.monthlyRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">Active Members</span>
                        <span className="font-bold text-lg text-violet-600">{stats?.activeMembers || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  )
}