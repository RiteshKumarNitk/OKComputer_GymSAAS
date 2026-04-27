import React from "react"
import { useQuery } from "@tanstack/react-query"
import { tenantsApi, billingApi } from "@/api/apiClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building, 
  Users, 
  Banknote, 
  Activity, 
  UserPlus 
} from "lucide-react"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area 
} from "recharts"
import { formatCurrency } from "@/lib/utils"

const MOCK_REVENUE_DATA = [
  { name: "Jan", revenue: 45000 },
  { name: "Feb", revenue: 52000 },
  { name: "Mar", revenue: 48000 },
  { name: "Apr", revenue: 61000 },
  { name: "May", revenue: 75000 },
  { name: "Jun", revenue: 82000 },
]

const MOCK_GROWTH_DATA = [
  { name: "Jan", gyms: 12, members: 1200 },
  { name: "Feb", gyms: 15, members: 1550 },
  { name: "Mar", gyms: 18, members: 1900 },
  { name: "Apr", gyms: 22, members: 2400 },
  { name: "May", gyms: 28, members: 3100 },
  { name: "Jun", gyms: 35, members: 4200 },
]

export const SuperAdminDashboard: React.FC = () => {
    const { data: tenants } = useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const { data, error } = await tenantsApi.list()
            if (error) throw error
            return data
        },
    })

    const { data: invoices } = useQuery({
        queryKey: ["saas_invoices"],
        queryFn: async () => {
            const { data, error } = await billingApi.getInvoices("all")
            if (error) throw error
            return data
        }
    })

    const totalRevenue = invoices?.reduce((acc: number, curr: any) => acc + (curr.amount_cents || 0), 0) || 0
    const activeGyms = tenants?.filter((t: any) => t.subscriptionStatus === 'active').length || 0
    const totalMembers = 5000 

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Pulse</h1>
                <p className="text-muted-foreground">Monitor your SaaS growth and platform health.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Gyms</CardTitle>
                        <Building className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenants?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">+{activeGyms} active now</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-emerald-600 font-medium">↑ 12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all tenants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,482</div>
                        <p className="text-xs text-orange-600 font-medium">Live activity pulse</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Revenue Growth (MRR)</CardTitle>
                        <CardDescription>Monthly recurring revenue trends</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_REVENUE_DATA}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Gym & Member Growth</CardTitle>
                        <CardDescription>Platform adoption over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_GROWTH_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar yAxisId="left" dataKey="gyms" name="Gyms" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="members" name="Members" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Fastest Growing Gyms</CardTitle>
                        <CardDescription>Tenants with highest week-over-week growth</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tenants?.slice(0, 4).map((t, i) => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{i+1}</div>
                                        <div>
                                            <p className="text-sm font-medium">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.slug}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">+{Math.floor(Math.random() * 25) + 5}%</p>
                                        <p className="text-xs text-muted-foreground">Growth</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                        <CardDescription>Latest tenants to join the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tenants?.slice(-3).reverse().map((t) => (
                                <div key={t.id} className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <UserPlus className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{t.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{t.ownerEmail}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">Just Now</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: string, className?: string }) {
    const variants: Record<string, string> = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "text-foreground border border-input transition-colors hover:bg-accent hover:text-accent-foreground",
    }
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${variants[variant]} ${className}`}>
            {children}
        </span>
    )
}
