import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { membersApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { RefreshCw, MessageCircle, Phone, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { PageHeader, DataTable } from "@/components/common"
import type { Column } from "@/components/common"

export const MemberRenewalsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")

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
        queryKey: ["memberships", user?.tenantId],
        queryFn: async () => {
            const res = await membershipsApi.list(user?.tenantId || "")
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!user?.tenantId
    })

    // Fetch Expiring & Expired Members
    const { data: members, isLoading } = useQuery({
        queryKey: ["renewals", user?.tenantId],
        queryFn: async () => {
            if (!user?.tenantId) return [];

            const response = await membersApi.list(user.tenantId)
            if (response.error) throw response.error
            const allMembers = response.data || []

            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

            return allMembers.filter((m: any) => {
                if (m.status === "inactive") return false
                const expiry = m.planExpiresAt
                if (!expiry) return false
                return new Date(expiry) <= thirtyDaysFromNow
            })
        },
        enabled: !!user?.tenantId,
    })

    const filteredMembers = members?.filter((member: any) =>
        (member.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone && member.phone.includes(searchQuery))
    ) || []

    const getDaysRemaining = (dateString: string | null) => {
        if (!dateString) return -999;
        const expiry = new Date(dateString);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    const columns: Column<any>[] = [
        {
            key: "memberInfo",
            label: "Member Info",
            render: (member: any) => (
                <div>
                    <div className="font-bold text-slate-700">{member.fullName}</div>
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {member.phone}
                    </div>
                </div>
            ),
        },
        {
            key: "currentPlan",
            label: "Current Plan",
            render: (member: any) => {
                const plan = memberships?.find((m: any) => m.id === member.currentPlanId)
                return <span className="font-medium text-slate-600">{plan ? plan.name : "Unknown Plan"}</span>
            },
        },
        {
            key: "expiryDate",
            label: "Expiry Date",
            render: (member: any) => (
                <span className="text-xs font-bold text-slate-500">{member.planExpiresAt ? formatDate(member.planExpiresAt) : 'N/A'}</span>
            ),
        },
        {
            key: "countdown",
            label: "Countdown",
            render: (member: any) => {
                const daysLeft = getDaysRemaining(member.planExpiresAt);
                const isExpired = daysLeft < 0;
                return (
                    <Badge className={`rounded-lg font-bold text-[10px] uppercase px-3 py-1 ${isExpired ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-amber-100 text-amber-600 border-amber-200"}`}>
                        {isExpired ? `Expired ${Math.abs(daysLeft)}D Ago` : `${daysLeft}D Remaining`}
                    </Badge>
                )
            },
        },
        {
            key: "action",
            label: "Action",
            headClassName: "text-right",
            className: "text-right",
            render: (member: any) => {
                const daysLeft = getDaysRemaining(member.planExpiresAt);
                const isExpired = daysLeft < 0;
                const dateStr = member.planExpiresAt ? formatDate(member.planExpiresAt) : 'Unknown Date';
                const text = isExpired
                    ? `Hi ${member.fullName}, your gym membership expired on ${dateStr}. Please renew to continue your workouts!`
                    : `Hi ${member.fullName}, your gym membership is expiring in ${daysLeft} days. Renew now to avoid interruption!`;
                return (
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl bg-green-50 hover:bg-green-100"
                            onClick={() => window.open(`https://wa.me/${member.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`, '_blank')}
                        >
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </Button>
                        <Button size="sm" className="bg-slate-900 text-white rounded-xl font-bold h-10 px-6" onClick={() => {
                            setSelectedMember(member)
                            setSelectedPlanId(member.currentPlanId || "")
                            setIsRenewOpen(true)
                        }}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Renew
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Membership Renewals"
                subtitle="Track upcoming and overdue renewals to maintain retention"
                actions={
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">
                            {members?.filter(m => getDaysRemaining(m.planExpiresAt) < 0).length || 0} Critical
                        </span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card className="bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <CalendarClock className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {members?.length || 0}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next 30 Days</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>

            <DataTable
                columns={columns}
                data={filteredMembers}
                loading={isLoading}
                searchable
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by member or phone..."
                emptyMessage="No renewals needed in the next 30 days."
                title="Membership Renewals"
            />

            <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
                <DialogContent className="rounded-xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Renew Membership</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 pt-2">
                            Renewing membership for <b className="text-slate-700">{selectedMember?.fullName}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="space-y-3">
                            <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Selection Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select a membership plan" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-md">
                                    {memberships?.map((plan: any) => (
                                        <SelectItem key={plan.id} value={plan.id} className="rounded-lg font-bold">
                                            {plan.name} ({plan.durationDays} days)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" className="rounded-xl font-bold h-10 px-6 text-slate-500" onClick={() => setIsRenewOpen(false)}>Cancel</Button>
                        <Button variant="brand" onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending} className="rounded-xl font-bold h-10 px-5 shadow-sm shadow-orange-500/20">
                            {renewMutation.isPending ? "Renewing..." : "Confirm Renew"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
