import React from "react"
import { useQuery } from "@tanstack/react-query"
import { dashboardApi, reportsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart3,
    TrendingUp,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    PieChart,
    ChevronDown,
    Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common"
import { formatCurrency } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

/** % change between the last two points of a trend array. Null if there isn't enough data to compare. */
function monthOverMonthChange(points: { value: number }[] | undefined): number | null {
    if (!points || points.length < 2) return null
    const previous = points[points.length - 2].value
    const current = points[points.length - 1].value
    if (previous === 0) return current === 0 ? 0 : null
    return Math.round(((current - previous) / previous) * 1000) / 10
}

function ChangeBadge({ change }: { change: number | null }) {
    if (change === null) {
        return (
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                <Minus className="h-3 w-3" /> N/A
            </div>
        )
    }
    const up = change >= 0
    return (
        <div className={`flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {up ? '+' : ''}{change}%
        </div>
    )
}

export const MemberAnalyticsPage: React.FC = () => {
  const { user } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.tenantId],
    queryFn: async () => {
      const response = await dashboardApi.getStats()
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenantId,
  })

  const { data: revenueTrend } = useQuery({
    queryKey: ["revenue-trend-6", user?.tenantId],
    queryFn: async () => {
      const response = await reportsApi.getRevenueTrend(6)
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const { data: memberGrowthTrend } = useQuery({
    queryKey: ["member-growth-trend-6", user?.tenantId],
    queryFn: async () => {
      const response = await reportsApi.getMemberGrowthTrend(6)
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const { data: leadGrowthTrend } = useQuery({
    queryKey: ["lead-growth-trend-6", user?.tenantId],
    queryFn: async () => {
      const response = await reportsApi.getLeadGrowthTrend(6)
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const { data: retention } = useQuery({
    queryKey: ["retention", user?.tenantId],
    queryFn: async () => {
      const response = await reportsApi.getRetention()
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenantId,
  })

  const { data: topPlans } = useQuery({
    queryKey: ["top-plans", user?.tenantId],
    queryFn: async () => {
      const response = await reportsApi.getTopPlans(12)
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const revenueChange = React.useMemo(
    () => monthOverMonthChange(revenueTrend?.map(p => ({ value: p.revenue }))),
    [revenueTrend]
  )
  const memberGrowthChange = React.useMemo(() => monthOverMonthChange(memberGrowthTrend), [memberGrowthTrend])
  const leadGrowthChange = React.useMemo(() => monthOverMonthChange(leadGrowthTrend), [leadGrowthTrend])

  const metrics = [
    {
        title: "Total Revenue",
        value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`,
        change: revenueChange,
        icon: <CreditCard className="h-5 w-5 text-emerald-500" />
    },
    {
        title: "Active Members",
        value: stats?.activeMembers?.toString() || '0',
        change: memberGrowthChange,
        icon: <Users className="h-5 w-5 text-blue-500" />
    },
    {
        title: "30-Day Retention",
        value: retention ? `${retention.rate30}%` : '—',
        change: retention?.changePercent ?? null,
        icon: <TrendingUp className="h-5 w-5 text-amber-500" />
    },
    {
        title: "New Enquiries",
        value: stats?.totalLeads?.toString() || '0',
        change: leadGrowthChange,
        icon: <BarChart3 className="h-5 w-5 text-purple-500" />
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Membership Analytics"
        subtitle="Real-time insights and business performance metrics"
        actions={
          <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white font-bold flex items-center gap-2">
            Last 30 Days <ChevronDown className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
            <Card key={metric.title} className="border-none shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            {metric.icon}
                        </div>
                        <ChangeBadge change={metric.change} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{metric.title}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
      <p className="text-[10px] font-bold text-slate-400 -mt-4 ml-1">
        Change % compares the most recent month to the one before it, except 30-Day Retention, which compares members who joined 30+ days ago against those who joined 90+ days ago.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 h-96">
            <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Revenue Trend
                </CardTitle>
            </CardHeader>
            <CardContent className="h-64 px-2">
                {revenueTrend && revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMemberRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} />
                            <Tooltip formatter={(value: number) => formatCurrency(value * 100)} contentStyle={{ borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" fill="url(#colorMemberRevenue)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <BarChart3 className="h-20 w-20 text-slate-100 mb-4" />
                        <p className="text-sm font-bold text-slate-400">No revenue recorded in this window yet.</p>
                    </div>
                )}
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 h-96">
            <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Membership Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-64">
                <div className="relative h-48 w-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-slate-800">{stats?.activeMembers || '0'}</p>
                        <p className="text-[9px] font-bold uppercase text-slate-400">Total Active</p>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>

       <Card className="border-none shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <CardTitle className="text-lg font-bold text-slate-800">Top Performing Plans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topPlans && topPlans.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {topPlans.map((plan, i) => (
                <div key={plan.planId} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{plan.planName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{plan.memberCount} member{plan.memberCount === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(plan.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-slate-400 italic">No plan revenue recorded in the last 12 months yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
