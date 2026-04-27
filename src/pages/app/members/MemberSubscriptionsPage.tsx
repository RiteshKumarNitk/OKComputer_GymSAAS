import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { membersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { Search, Filter, Download, CreditCard, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export const MemberSubscriptionsPage: React.FC = () => {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")

    const { data: members, isLoading } = useQuery({
        queryKey: ["subscriptions", user?.tenant_id, searchQuery],
        queryFn: async () => {
            const res = await membersApi.list(user?.tenant_id || "", searchQuery)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!user?.tenant_id
    })

    const activeSubscriptions = members?.filter(m => m.status === 'active') || []

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Active Memberships</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage and track all ongoing member subscriptions</p>
                </div>
                <div className="flex items-center gap-3">
                     <Button variant="outline" className="h-11 rounded-xl border-slate-200">
                        <Download className="mr-2 h-5 w-5" /> Export Data
                     </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-emerald-500 border-none text-white shadow-xl shadow-emerald-500/20 rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-3xl font-black">{activeSubscriptions.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Total Active</p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-700 dark:text-white">
                                {members?.filter(m => m.status === 'active' && m.currentPlan).length || 0}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid Subscriptions</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-700 dark:text-white">
                                {members?.filter(m => m.status === 'expired').length || 0}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recently Expired</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search by member name or phone..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm"
                    />
                </div>
                <Button variant="outline" className="h-12 w-12 rounded-xl p-0 border-slate-200">
                    <Filter className="h-5 w-5 text-slate-500" />
                </Button>
            </div>

            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                 <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Member</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Plan Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Validity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Auto-Renew</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                            ))
                        ) : activeSubscriptions.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">No active subscriptions found</TableCell></TableRow>
                        ) : (
                            activeSubscriptions.map((member) => (
                                <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-6 px-4 font-bold text-slate-700">{member.fullName || member.full_name}</TableCell>
                                    <TableCell className="py-6 px-4 font-medium text-slate-600">{member.currentPlan?.name || "No Active Plan"}</TableCell>
                                    <TableCell className="py-6 px-4 text-xs font-bold text-slate-500">
                                        {formatDate(member.plan_started_at || member.joined_at)} - {formatDate(member.plan_expires_at || member.joined_at)}
                                    </TableCell>
                                    <TableCell className="py-6 px-4">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg uppercase text-[10px] font-black px-3 py-1">Active</Badge>
                                    </TableCell>
                                    <TableCell className="py-6 px-4 text-xs font-bold text-slate-400">OFF</TableCell>
                                    <TableCell className="py-6 px-4 text-right">
                                        <Button variant="ghost" size="sm" className="font-bold text-blue-600">Upgrade</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                 </Table>
            </Card>
        </div>
    )
}
