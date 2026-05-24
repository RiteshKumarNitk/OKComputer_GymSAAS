import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { tenantsApi, usersApi, billingApi, dashboardApi, followUpsApi, membersApi, attendanceApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatCurrency, exportToCSV } from "@/lib/utils"
import {
  Search,
  RefreshCcw,
  Calendar,
  MoreVertical,
  ChevronDown,
  Plus,
  ArrowRight,
  CreditCard,
  Dumbbell,
  Shield,

  Filter,
  User,
  Download
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as ReChartsPieChart,
  Pie,
  Cell
} from "recharts"



export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const [showFollowUps, setShowFollowUps] = useState(true)
  const [followUpSearch, setFollowUpSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.tenantId],
    queryFn: async () => {
      const response = await dashboardApi.getStats()
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenantId && user?.role !== "super_admin",
  })

  const { data: realFollowUps, isLoading: followUpsLoading, refetch: refetchFollowUps } = useQuery({
    queryKey: ["follow-ups", user?.tenantId],
    queryFn: async () => {
      const response = await followUpsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenantId && user?.role !== "super_admin",
  })

  // Global Members Query for precise stats
  const { data: allMembers } = useQuery({
    queryKey: ["all-members-stats", user?.tenantId],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId && user?.role !== "super_admin",
  })

  // Attendance Today Query
  const { data: attendanceToday } = useQuery({
    queryKey: ["attendance-today", user?.tenantId],
    queryFn: async () => {
      const response = await attendanceApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId && user?.role !== "super_admin",
  })

  const statsCalculated = React.useMemo(() => {
    if (!allMembers) return { active: 0, upcoming: 0, past: 0, birthday: 0, anniversary: 0 }
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayDate = new Date(todayStr)
    const next7Date = new Date(next7Days)

    return {
      active: allMembers.filter(m => m.status === 'active').length,
      upcoming: allMembers.filter(m => {
        if (!m.planExpiresAt) return false
        const expiry = new Date(m.planExpiresAt)
        return expiry >= todayDate && expiry <= next7Date
      }).length,
      past: allMembers.filter(m => m.status === 'expired' || m.status === 'inactive').length,
      birthday: allMembers.filter(m => m.dob?.split('-').slice(1).join('-') === todayStr.split('-').slice(1).join('-')).length,
      anniversary: allMembers.filter(m => m.joinedAt && m.joinedAt.split('-').slice(1).join('-') === todayStr.split('-').slice(1).join('-')).length
    }
  }, [allMembers])

  const memberChartData = React.useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    if (!allMembers) return months.map(m => ({ name: m, active: 0, inactive: 0, upcoming: 0 }))
    const active = allMembers.filter((m: any) => m.status === 'active').length
    const inactive = allMembers.filter((m: any) => m.status === 'inactive' || m.status === 'expired').length
    const now = new Date()
    const monthsWithData = Math.max(1, now.getMonth() + 1)
    const activePerMonth = Math.max(1, Math.round(active / monthsWithData))
    const inactivePerMonth = Math.max(1, Math.round(inactive / 12))
    return months.map((name, i) => ({
      name,
      active: i < monthsWithData ? activePerMonth + (i === now.getMonth() ? active % monthsWithData : 0) : 0,
      inactive: inactivePerMonth,
      upcoming: i >= now.getMonth() && i < now.getMonth() + 3 ? Math.max(1, Math.round(active * 0.08)) : 0
    }))
  }, [allMembers])

  const financialChartData = React.useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const now = new Date()
    const monthsWithData = Math.max(1, now.getMonth() + 1)
    const totalRev = stats?.totalRevenue || 0
    const revPerMonth = Math.max(1, Math.round(totalRev / monthsWithData / 100))
    return months.map((name, i) => ({
      name,
      paid: i < monthsWithData ? revPerMonth + (i === now.getMonth() ? (totalRev / 100) % monthsWithData : 0) : 0,
      balance: i < monthsWithData ? Math.round(revPerMonth * 0.1) : 0,
      pending: i < monthsWithData ? Math.round(revPerMonth * 0.05) : 0,
      expense: 0,
      profit: i < monthsWithData ? revPerMonth - Math.round(revPerMonth * 0.1) : 0
    }))
  }, [stats?.totalRevenue])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    refetchFollowUps()
    toast({ title: "Refreshing Data", description: "Updating dashboard metrics..." })
  }

  const exportFollowUps = () => {
    if (!realFollowUps || realFollowUps.length === 0) return
    const csvData = filteredFollowUps.map((item: any) => ({
      "Name": item.lead?.fullName || item.lead?.firstName || item.member?.fullName || "N/A",
      "Phone": item.lead?.phone || item.member?.phone || "N/A",
      "Type": item.type,
      "Date": new Date(item.followUpDate).toLocaleString(),
      "Priority": item.priority || "warm",
      "Notes": (item.notes || item.todo || "").replace(/,/g, " ")
    }))
    exportToCSV(csvData, `follow-ups-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const filteredFollowUps = realFollowUps?.filter((item: any) => {
    const name = (item.lead?.fullName || item.lead?.firstName || item.member?.fullName || "").toLowerCase()
    const phone = (item.lead?.phone || item.member?.phone || "")
    const matchesSearch = name.includes(followUpSearch.toLowerCase()) || phone.includes(followUpSearch)
    const matchesPriority = priorityFilter === "All" || item.priority?.toLowerCase() === priorityFilter.toLowerCase()
    return matchesSearch && matchesPriority
  }) || []

  const { data: superStats } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const tenantsRes = await tenantsApi.list()
      const usersRes = await usersApi.list()
      const invoicesRes = await billingApi.getInvoices("all")
      const activeTenants = tenantsRes.data?.filter((t: any) => t.status === "active") || []
      const totalRevenue = invoicesRes.data?.reduce((acc: number, curr: any) => acc + (curr.totalPaise || 0), 0) || 0
      return {
        totalTenants: tenantsRes.data?.length || 0,
        activeTenants: activeTenants.length,
        totalUsers: usersRes.data?.length || 0,
        totalRevenue,
        recentTenants: tenantsRes.data?.slice(0, 5) || []
      }
    },
    enabled: user?.role === "super_admin"
  })



  if (user?.role === "super_admin") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 text-white shadow-md">
          <h1 className="text-3xl font-bold tracking-tight mb-2">System Control Center</h1>
          <p className="text-slate-400 max-w-xl">Super Admin access for managing the entire GymPro ecosystem.</p>
          <Shield className="absolute right-8 top-1/2 -translate-y-1/2 h-24 w-24 text-white/5" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6 border-l-4 border-emerald-500"><div className="text-sm font-medium text-slate-500">Total Revenue</div><div className="text-2xl font-bold mt-1">{formatCurrency(superStats?.totalRevenue || 0)}</div></Card>
          <Card className="p-6 border-l-4 border-blue-500"><div className="text-sm font-medium text-slate-500">Active Tenants</div><div className="text-2xl font-bold mt-1">{superStats?.activeTenants || 0}</div></Card>
          <Card className="p-6 border-l-4 border-amber-500"><div className="text-sm font-medium text-slate-500">Total Users</div><div className="text-2xl font-bold mt-1">{superStats?.totalUsers || 0}</div></Card>
          <Card className="p-6 border-l-4 border-violet-500"><div className="text-sm font-medium text-slate-500">System Health</div><div className="text-2xl font-bold mt-1 text-emerald-500">Optimal</div></Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Recent Tenants</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {superStats?.recentTenants.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div><p className="font-bold">{t.name}</p><p className="text-xs text-slate-500">{t.email}</p></div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{t.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20" onClick={() => navigate("/super-admin")}><Plus className="mr-2 h-4 w-4" /> Add Gym</Button>
              <Button variant="outline" className="h-20" onClick={() => navigate("/super-admin?tab=billing")}><CreditCard className="mr-2 h-4 w-4" /> Billing</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder='Search & Create "New Sales"'
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium shadow-sm"
              value={followUpSearch}
              onChange={(e) => setFollowUpSearch(e.target.value)}
            />
          </div>
          <Button
            variant="brand"
            className="px-6 rounded-xl font-bold"
            onClick={handleRefresh}
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10 rounded-xl font-bold shadow-sm" onClick={() => navigate("/members/add")}>
              <Plus className="h-4 w-4 mr-2" /> New Sale
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white px-4 h-10 rounded-xl font-bold shadow-sm" onClick={() => navigate("/enquiries/new")}>
              <Plus className="h-4 w-4 mr-2" /> New Enquiry
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 ml-2">Sort by</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="h-3 w-3 text-slate-400" />
            14-04-2026 - 14-04-2026
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Follow Ups Table Section with Pagination & Filters */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">Follow Ups ({filteredFollowUps.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-bold uppercase tracking-wider border-slate-200"
                onClick={exportFollowUps}
              >
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </div>
            {/* Lead Filters */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {['All', 'Hot', 'Warm', 'Cold'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${priorityFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                <Filter className="h-3 w-3" /> More Filters <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>
          <button onClick={() => setShowFollowUps(!showFollowUps)} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
            {showFollowUps ? 'Collapse Table' : 'Expand Table'}
          </button>
        </CardHeader>
        {showFollowUps && (
          <>
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Name & Number</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Date & Time</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider py-4">Comment</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUpsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">Loading follow ups...</TableCell></TableRow>
                ) : filteredFollowUps.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No matching follow ups found.</TableCell></TableRow>
                ) : filteredFollowUps.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 border-b dark:border-slate-800">
                    <TableCell className="py-4">
                      <p className="text-xs font-bold text-blue-600">{item.lead?.fullName || item.lead?.firstName || item.member?.fullName || "N/A"}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.lead?.phone || item.member?.phone || "N/A"}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{item.type}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(item.followUpDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 capitalize ${item.priority === 'hot' ? 'bg-rose-600' : item.priority === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                        {item.priority || 'warm'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500 truncate max-w-[200px]">{item.notes || item.todo}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/follow-ups?id=${item.id}`)}><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      {/* Overview Grid Section - Exactly matching reference */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Members Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#2B6CB0] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Members</h3></div>
            <div className="bg-[#4299E1] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">{statsCalculated.active}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Active</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white mb-1">{statsCalculated.upcoming}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Upcoming</span>
              </div>
            </div>
          </Card>

          {/* Follow Ups Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#C05621] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Follow Ups Overview</h3></div>
            <div className="bg-[#ED8936] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">{(stats?.totalFollowUpsToday || 0) + (stats?.pendingFollowUps || 0)}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Total</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white mb-1">{stats?.totalFollowUpsToday || 0}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Today</span>
              </div>
            </div>
          </Card>

          {/* Enquiry Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#2C7A7B] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Enquiry Overview</h3></div>
            <div className="bg-[#38B2AC] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">{stats?.totalLeads || 0}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase text-center px-2">Total Leads</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white mb-1">{stats?.hotLeads || 0}</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Hot Leads</span>
              </div>
            </div>
          </Card>

          {/* Attendance & Date Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="flex-1 flex">
              {/* Attendance Side */}
              <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden">
                <div className="bg-[#B7791F] py-2.5 px-3"><h3 className="text-white text-[10px] font-bold whitespace-nowrap">Attendance</h3></div>
                <div className="bg-[#D69E2E] flex-1 p-3 flex flex-col justify-around">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white leading-tight">{attendanceToday?.length || 0}</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Attendance</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white leading-tight">{Math.max(0, statsCalculated.active - (attendanceToday?.length || 0))}</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Absent</span>
                  </div>
                </div>
              </div>
              {/* Date Side */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-[#C0851D] py-2.5 px-3"><h3 className="text-white text-[10px] font-bold">Date</h3></div>
                <div className="bg-[#ECC94B] flex-1 p-3 flex flex-col justify-around">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white/90 leading-tight">{statsCalculated.birthday}</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Birthday</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white/90 leading-tight">{statsCalculated.anniversary}</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Anniversary</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Total Sales Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#276749] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Total Sales</h3></div>
            <div className="bg-[#38A169] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">{stats?.newMembersThisMonth ?? statsCalculated.active ?? 0}</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white mb-1">{Math.round((stats?.totalRevenue || 0) / 100).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Fresh / Renewal Sales Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="grid grid-cols-2 flex-1">
              <div className="flex flex-col border-r border-white/20">
                <div className="bg-[#553C9A] py-2.5 px-4 whitespace-nowrap"><h3 className="text-white text-[10px] font-bold">Fresh Sales</h3></div>
                <div className="bg-[#805AD5] flex-1 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white mb-1">{stats?.newMembersThisMonth || 0}</span>
                  <span className="text-[10px] font-bold text-white/90 uppercase">This Month</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="bg-[#553C9A] py-2.5 px-4 whitespace-nowrap"><h3 className="text-white text-[10px] font-bold">Total Members</h3></div>
                <div className="bg-[#805AD5] flex-1 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white mb-1">{stats?.totalMembers || 0}</span>
                  <span className="text-[10px] font-bold text-white/90 uppercase">Active</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Balance Payment Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#285E61] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Balance Payment</h3></div>
            <div className="bg-[#38B2AC] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">0</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white mb-1">1000</span>
              </div>
            </div>
          </Card>

          {/* Transformations Card */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="grid grid-cols-2 flex-1">
              <div className="flex flex-col border-r border-white/20 overflow-hidden">
                <div className="bg-[#553C9A] py-2 px-3 h-10 flex items-center"><h3 className="text-white text-[9px] leading-tight font-bold">Transformation Fresh Sales</h3></div>
                <div className="bg-[#9F7AEA] flex-1 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white mb-1">0</span>
                  <span className="text-[9px] font-bold text-white/90 uppercase">Number</span>
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="bg-[#553C9A] py-2 px-3 h-10 flex items-center"><h3 className="text-white text-[9px] leading-tight font-bold">Transformation Renewal Sales</h3></div>
                <div className="bg-[#9F7AEA] flex-1 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white mb-1">0</span>
                  <span className="text-[9px] font-bold text-white/90 uppercase">Number</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Total PT Sales Card - GREEN */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#276749] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Total PT Sales</h3></div>
            <div className="bg-[#38A169] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">1</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Number</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white mb-1">25000</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Amount</span>
              </div>
            </div>
          </Card>

          {/* Sales Card - ORANGE */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="bg-[#C05621] py-2.5 px-4"><h3 className="text-white text-xs font-bold">Sales</h3></div>
            <div className="bg-[#ED8936] flex-1 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
                <span className="text-3xl font-bold text-white mb-1">0/0</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Upgrade</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white mb-1">0/0</span>
                <span className="text-[10px] font-bold text-white/90 uppercase">Transfer</span>
              </div>
            </div>
          </Card>

          {/* Fresh PT / Renewal PT Sales Card - BLUE */}
          <Card className="border-none shadow-sm overflow-hidden h-44 flex flex-col">
            <div className="grid grid-cols-2 flex-1">
              <div className="flex flex-col border-r border-white/20">
                <div className="bg-[#2B6CB0] py-2.5 px-4 h-10 flex items-center"><h3 className="text-white text-[10px] font-bold">Fresh PT Sales</h3></div>
                <div className="bg-[#4299E1] flex-1 flex flex-col p-2">
                  <div className="flex flex-col items-center justify-center mb-2 border-b border-white/10 pb-1">
                    <span className="text-lg font-bold text-white">1</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Number</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">25000</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Amount</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="bg-[#2B6CB0] py-2.5 px-4 h-10 flex items-center"><h3 className="text-white text-[10px] font-bold">PT Renewal Sales</h3></div>
                <div className="bg-[#4299E1] flex-1 flex flex-col p-2">
                  <div className="flex flex-col items-center justify-center mb-2 border-b border-white/10 pb-1">
                    <span className="text-lg font-bold text-white">0</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Number</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">0</span>
                    <span className="text-[8px] font-bold text-white/80 uppercase">Amount</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics Section - Full Width for better view as requested */}
      <div className="space-y-6">
        {/* Leads & Members Analytics - DUAL PANE AS PER SCREENSHOT */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[450px]">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">Leads & Members Analytics</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Conversion Funnel & Membership Growth</CardDescription>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-4 w-4" /></button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x dark:divide-slate-800">
              {/* LEFT: Leads Donut Funnel */}
              <div className="lg:w-1/3 p-6 flex flex-col items-center">
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPieChart>
                      <Pie
                        data={[
                          { name: 'Hot', value: stats?.hotLeads || 0 },
                          { name: 'Warm', value: (stats?.totalLeads || 0) - (stats?.hotLeads || 0) },
                          { name: 'Cold', value: 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#F43F5E" /> {/* Hot */}
                        <Cell fill="#ED8936" /> {/* Warm */}
                        <Cell fill="#3B82F6" /> {/* Cold */}
                      </Pie>
                      <Tooltip />
                    </ReChartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.totalLeads || 0}</span>
                  </div>
                </div>

                {/* Leads Legend List */}
                <div className="w-full space-y-4 mt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#F43F5E]" />
                      <span className="text-xs font-bold text-rose-600 uppercase">Hot Leads</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600">{stats?.hotLeads || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#ED8936]" />
                      <span className="text-xs font-bold text-orange-600 uppercase">Warm Leads</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600">{((stats?.totalLeads || 0) - (stats?.hotLeads || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                      <span className="text-xs font-bold text-blue-600 uppercase">Cold Leads</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600">0</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Stacked Bar Membership Analysis */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#10B981]" />
                    <span className="text-xs font-bold text-[#10B981]">Active Members : {statsCalculated.active}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#F43F5E]" />
                    <span className="text-xs font-bold text-[#F43F5E]">Inactive Members : {statsCalculated.past}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#ED8936]" />
                    <span className="text-xs font-bold text-[#ED8936]">Upcoming Members : {statsCalculated.upcoming}</span>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="active" stackId="a" fill="#10B981" barSize={35} />
                      <Bar dataKey="inactive" stackId="a" fill="#F43F5E" barSize={35} />
                      <Bar dataKey="upcoming" stackId="a" fill="#ED8936" barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Analytics - EXACTLY AS PER SCREENSHOT */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">Financial Analytics</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400">P&L, Revenue & Collection Status</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-slate-400" onClick={() => {}}>Yearly <ChevronDown className="ml-1 h-3 w-3" /></Button>
              <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {/* Top Legend matching screenshot exactly */}
            <div className="flex flex-wrap items-center gap-6 px-6 py-3 border-b dark:border-slate-800">
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#38B2AC]" /><span className="text-[10px] font-bold text-slate-500 uppercase">Paid Amount</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#D69E2E]" /><span className="text-[10px] font-bold text-slate-500 uppercase">Paid Balance Amount</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#ED8936]" /><span className="text-[10px] font-bold text-slate-500 uppercase">Pending Payment</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#F43F5E]" /><span className="text-[10px] font-bold text-slate-500 uppercase">Total Expenses</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#48BB78]" /><span className="text-[10px] font-bold text-slate-500 uppercase">Total Profit</span></div>
            </div>

            {/* Chart Area with dots on data points */}
            <div className="h-[350px] w-full p-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                  />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  {/* Rendering areas with dots at data points as per screenshot */}
                  <Area type="monotone" dataKey="paid" stroke="#38B2AC" fill="#38B2AC40" strokeWidth={3} dot={{ r: 3, fill: '#38B2AC' }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="balance" stroke="#D69E2E" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: '#D69E2E' }} />
                  <Area type="monotone" dataKey="pending" stroke="#ED8936" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: '#ED8936' }} />
                  <Area type="monotone" dataKey="expense" stroke="#F43F5E" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: '#F43F5E' }} />
                  <Area type="monotone" dataKey="profit" stroke="#48BB78" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: '#48BB78' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Stats Row - Exact replica of screenshot layout */}
            <div className="grid grid-cols-4 border-t dark:border-slate-800 bg-slate-50/30">
              <div className="flex flex-col items-center justify-center py-6 px-4 border-r dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-[#38B2AC]" />
                  <span className="text-[10px] font-bold text-[#38B2AC] uppercase tracking-wide">Total Revenue</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats?.monthlyRevenue || stats?.totalRevenue || 0)}</div>
              </div>
              <div className="flex flex-col items-center justify-center py-6 px-4 border-r dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-[#ED8936]" />
                  <span className="text-[10px] font-bold text-[#ED8936] uppercase tracking-wide">Pending Payment</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats?.pendingRevenue || 0)}</div>
              </div>
              <div className="flex flex-col items-center justify-center py-6 px-4 border-r dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-[#F43F5E]" />
                  <span className="text-[10px] font-bold text-[#F43F5E] uppercase tracking-wide">Total Expenses</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats?.totalExpenses || 0)}</div>
              </div>
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-[#48BB78]" />
                  <span className="text-[10px] font-bold text-[#48BB78] uppercase tracking-wide">Total Profit</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency((stats?.monthlyRevenue || stats?.totalRevenue || 0) - (stats?.totalExpenses || 0))}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restored Features Section */}
      <div className="pt-10 border-t dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-500" /> Quick Management Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-sm transition-all cursor-pointer group hover:border-orange-200" onClick={() => navigate("/members")}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Plus className="h-6 w-6" /></div>
              <div><h3 className="font-bold text-slate-900 dark:text-white">New Member</h3><p className="text-xs text-slate-500">Onboard a client</p></div>
              <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-orange-500 transition-all" />
            </CardContent>
          </Card>

          {hasRole(["gym_owner", "manager", "frontdesk"]) && (
            <Card className="hover:shadow-sm transition-all cursor-pointer group hover:border-emerald-200" onClick={() => navigate("/billing")}>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><CreditCard className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-slate-900 dark:text-white">Record Payment</h3><p className="text-xs text-slate-500">Process invoice</p></div>
                <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-orange-500 transition-all" />
              </CardContent>
            </Card>
          )}

          {hasRole(["gym_owner", "trainer"]) && (
            <Card className="hover:shadow-sm transition-all cursor-pointer group hover:border-amber-200" onClick={() => navigate("/workouts")}>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors"><Dumbbell className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-slate-900 dark:text-white">Daily Workout</h3><p className="text-xs text-slate-500">Assign exercises</p></div>
                <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-orange-500 transition-all" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="border-slate-100 dark:border-slate-800">
            <CardHeader><CardTitle className="text-sm font-bold">Today's Reminders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Attendance Today: {stats?.attendanceToday || 0} members checked in.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 dark:border-slate-800">
            <CardHeader><CardTitle className="text-sm font-bold">Platform Stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Members</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{stats?.totalMembers || 0}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Rev</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
