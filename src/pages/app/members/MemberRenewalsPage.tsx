import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { membersApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import {
    RefreshCw,
    Search,
    MessageCircle,
    Phone,
    AlertCircle,
    CheckCircle2,
    CalendarClock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export const MemberRenewalsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const [isRenewOpen, setIsRenewOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [selectedPlanId, setSelectedPlanId] = useState<string>("")

    const renewMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMember) return
            const response = await membersApi.renew({ id: selectedMember.id, planId: selectedPlanId || undefined })
            if (response.error) throw response.error
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["renewals"] })
            setIsRenewOpen(false)
            toast({ title: "Success", description: "Membership renewed successfully" })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    })

    // Fetch Memberships for lookup
    const { data: memberships } = useQuery({
        queryKey: ["memberships", user?.tenant_id],
        queryFn: async () => {
            const res = await membershipsApi.list(user?.tenant_id || "")
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!user?.tenant_id
    })

    // Fetch Expiring & Expired Members
    const { data: members, isLoading } = useQuery({
        queryKey: ["renewals", user?.tenant_id],
        queryFn: async () => {
            if (!user?.tenant_id) return [];

            const response = await membersApi.list(user.tenant_id)
            if (response.error) throw response.error
            const allMembers = response.data || []

            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

            return allMembers.filter((m: any) => {
                if (m.status === "inactive") return false
                const expiry = m.planExpiresAt || m.plan_expires_at
                if (!expiry) return false
                return new Date(expiry) <= thirtyDaysFromNow
            })
        },
        enabled: !!user?.tenant_id,
    })

    const filteredMembers = members?.filter((member: any) =>
        (member.fullName || member.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone && member.phone.includes(searchQuery))
    ) || []

    // Pagination Logic
    const totalEntries = filteredMembers.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

    const getDaysRemaining = (dateString: string | null) => {
        if (!dateString) return -999;
        const expiry = new Date(dateString);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Membership Renewals</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Track upcoming and overdue renewals to maintain retention
                    </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                     <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">
                         {members?.filter(m => getDaysRemaining(m.planExpiresAt || m.plan_expires_at) < 0).length || 0} Critical
                     </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card className="bg-white dark:bg-slate-900 border-none shadow-sm rounded-3xl overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <CalendarClock className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {members?.length || 0}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next 30 Days</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by member or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-none bg-white dark:bg-slate-900 shadow-inner"
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Member Info</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Current Plan</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Expiry Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Countdown</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={5} className="h-20 bg-slate-50/50 rounded-xl" />
                                </TableRow>
                            ))
                        ) : paginatedMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium italic">
                                    No renewals needed in the next 30 days.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedMembers.map((member: any) => {
                                const expiryDate = member.planExpiresAt || member.plan_expires_at
                                const daysLeft = getDaysRemaining(expiryDate);
                                const isExpired = daysLeft < 0;
                                const plan = memberships?.find((m: any) => m.id === (member.currentPlanId || member.current_plan_id))
                                const planName = plan ? plan.name : "Unknown Plan"

                                return (
                                    <TableRow key={member.id} className={`${isExpired ? "bg-rose-50/30" : ""} border-slate-100`}>
                                        <TableCell className="py-6 px-4">
                                            <div className="font-bold text-slate-700">{member.fullName || member.full_name}</div>
                                            <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                <Phone className="h-3 w-3" /> {member.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-4 font-medium text-slate-600">{planName}</TableCell>
                                        <TableCell className="py-6 px-4 text-xs font-bold text-slate-500">{expiryDate ? formatDate(expiryDate) : 'N/A'}</TableCell>
                                        <TableCell className="py-6 px-4">
                                            <Badge className={`rounded-lg font-black text-[10px] uppercase px-3 py-1 ${isExpired ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-amber-100 text-amber-600 border-amber-200"}`}>
                                                {isExpired ? `Expired ${Math.abs(daysLeft)}D Ago` : `${daysLeft}D Remaining`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-6 px-4">
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 rounded-xl bg-green-50 hover:bg-green-100"
                                                    onClick={() => {
                                                        const dateStr = member.plan_expires_at ? formatDate(member.plan_expires_at) : 'Unknown Date';
                                                        const text = isExpired
                                                            ? `Hi ${member.full_name}, your gym membership expired on ${dateStr}. Please renew to continue your workouts!`
                                                            : `Hi ${member.full_name}, your gym membership is expiring in ${daysLeft} days. Renew now to avoid interruption!`;
                                                        window.open(`https://wa.me/${member.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`, '_blank')
                                                    }}
                                                >
                                                    <MessageCircle className="h-5 w-5 text-green-600" />
                                                </Button>
                                                <Button size="sm" className="bg-slate-900 text-white rounded-xl font-bold h-10 px-6" onClick={() => {
                                                    setSelectedMember(member)
                                                    setSelectedPlanId(member.currentPlanId || member.current_plan_id || "")
                                                    setIsRenewOpen(true)
                                                }}>
                                                    <RefreshCw className="mr-2 h-4 w-4" /> Renew
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination Implementation */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                <div className="text-xs">
                    Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of <span className="text-slate-900">{totalEntries}</span> entries
                </div>

                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="text-xs font-bold rounded-lg px-3"
                    >
                        Previous
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="text-xs font-bold rounded-lg px-3"
                    >
                        Next
                    </Button>
                </div>
            </div>

            <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">Renew Membership</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 pt-2">
                            Renewing membership for <b className="text-slate-700">{(selectedMember?.fullName ?? selectedMember?.full_name)}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="space-y-3">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Selection Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select a membership plan" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    {memberships?.map((plan: any) => (
                                        <SelectItem key={plan.id} value={plan.id} className="rounded-lg font-bold">
                                            {plan.name} ({plan.durationDays || plan.duration_days} days)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" className="rounded-xl font-bold h-11 px-6 text-slate-500" onClick={() => setIsRenewOpen(false)}>Cancel</Button>
                        <Button onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-11 px-8 shadow-lg shadow-orange-500/20">
                            {renewMutation.isPending ? "Renewing..." : "Confirm Renew"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
