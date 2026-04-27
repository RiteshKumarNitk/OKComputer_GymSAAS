import React from "react"
import { useQuery } from "@tanstack/react-query"
import { membersApi, dashboardApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    CreditCard, 
    ArrowUpRight, 
    ArrowDownRight,
    PieChart,
    ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const MemberAnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  
  // Real stats from API
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.tenant_id],
    queryFn: async () => {
      const response = await dashboardApi.getStats(user?.tenant_id || "")
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenant_id,
  })

  const metrics = [
    { 
        title: "Total Revenue", 
        value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`, 
        change: "+12.5%", 
        up: true, 
        icon: <CreditCard className="h-5 w-5 text-emerald-500" /> 
    },
    { 
        title: "Active Members", 
        value: stats?.activeMembers?.toString() || '0', 
        change: "+4.2%", 
        up: true, 
        icon: <Users className="h-5 w-5 text-blue-500" /> 
    },
    { 
        title: "Retention Rate", 
        value: "88%", 
        change: "-2.1%", 
        up: false, 
        icon: <TrendingUp className="h-5 w-5 text-amber-500" /> 
    },
    { 
        title: "New Enquiries", 
        value: stats?.totalLeads?.toString() || '0', 
        change: "+18.3%", 
        up: true, 
        icon: <BarChart3 className="h-5 w-5 text-purple-500" /> 
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Membership Analytics</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Real-time insights and business performance metrics</p>
        </div>
        <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-bold flex items-center gap-2">
            Last 30 Days <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
            <Card key={metric.title} className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            {metric.icon}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold ${metric.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {metric.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {metric.change}
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{metric.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{metric.title}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 h-96">
            <CardHeader className="p-8">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Revenue Trend
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-64">
                <BarChart3 className="h-20 w-20 text-slate-100 mb-4" />
                <p className="text-sm font-bold text-slate-400">Trend data processing...</p>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 h-96">
            <CardHeader className="p-8">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Membership Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-64">
                <div className="relative h-48 w-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-3xl font-black text-slate-800">{stats?.activeMembers || '0'}</p>
                        <p className="text-[9px] font-black uppercase text-slate-400">Total Active</p>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>

       <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-lg font-black text-slate-800">Top Performing Plans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-20">
             <p className="text-sm font-bold text-slate-400 italic">Advanced Plan Analytics Coming Soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
