import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
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
} from "lucide-react"
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
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get member counts
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user?.tenant_id)

      const { count: activeMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user?.tenant_id)
        .eq("status", "active")

      // Get revenue data
      const { data: payments } = await supabase
        .from("payments")
        .select("amount_cents, paid_at")
        .eq("tenant_id", user?.tenant_id)
        .eq("status", "paid")

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0

      const currentMonth = new Date().getMonth()
      const monthlyRevenue =
        payments
          ?.filter((p) => new Date(p.paid_at!).getMonth() === currentMonth)
          .reduce((sum, p) => sum + p.amount_cents, 0) || 0

      // Get attendance data
      const today = new Date().toISOString().split("T")[0]
      const { count: attendanceToday } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user?.tenant_id)
        .gte("checkin_at", `${today}T00:00:00`)
        .lt("checkin_at", `${today}T23:59:59`)

      // Get new members this month
      const { count: newMembersThisMonth } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user?.tenant_id)
        .gte("created_at", new Date(new Date().getFullYear(), currentMonth, 1).toISOString())

      // Get membership distribution
      const { data: membershipData } = await supabase
        .from("members")
        .select("memberships(name)")
        .eq("tenant_id", user?.tenant_id)
        .eq("status", "active")

      const membershipDistribution: { [key: string]: number } = {}
      membershipData?.forEach((member) => {
        const name = member.memberships?.name || "No Plan"
        membershipDistribution[name] = (membershipDistribution[name] || 0) + 1
      })

      // Get revenue trend (last 6 months)
      const revenueTrend = []
      for (let i = 5; i >= 0; i--) {
        const month = new Date()
        month.setMonth(month.getMonth() - i)
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)

        const monthRevenue =
          payments
            ?.filter((p) => {
              const paidDate = new Date(p.paid_at!)
              return paidDate >= monthStart && paidDate <= monthEnd
            })
            .reduce((sum, p) => sum + p.amount_cents, 0) || 0

        revenueTrend.push({
          month: month.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthRevenue,
        })
      }

      // Get attendance trend (last 7 days)
      const attendanceTrend = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]

        const { count: dayAttendance } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", user?.tenant_id)
          .gte("checkin_at", `${dateStr}T00:00:00`)
          .lt("checkin_at", `${dateStr}T23:59:59`)

        attendanceTrend.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          count: dayAttendance || 0,
        })
      }

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        totalRevenue,
        monthlyRevenue,
        attendanceToday: attendanceToday || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        membershipDistribution,
        revenueTrend,
        attendanceTrend,
      }
    },
    enabled: !!user?.tenant_id,
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
    </div>
  )
}