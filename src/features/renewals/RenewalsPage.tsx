import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { membersApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import {
    RefreshCw,
    MessageCircle,
    Phone,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { DataTable, SearchBar } from "@/components/common"
import type { Column } from "@/components/common"

export const RenewalsPage: React.FC = () => {
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
                const expiry = m.planExpiresAt || m.plan_expires_at
                if (!expiry) return false
                return new Date(expiry) <= thirtyDaysFromNow
            })
        },
        enabled: !!user?.tenantId,
    })

    const filteredMembers = members?.filter((member: any) =>
        (member.fullName || member.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    const handleWhatsApp = (member: any, isExpired: boolean, daysLeft: number) => {
        const actualExpiry = member.planExpiresAt || member.plan_expires_at;
        const dateStr = actualExpiry ? formatDate(actualExpiry) : 'Unknown Date';
        const memberName = member.fullName || member.full_name || "Member";
        const text = isExpired
            ? `Hi ${memberName}, your gym membership expired on ${dateStr}. Please renew to continue your workouts!`
            : `Hi ${memberName}, your gym membership is expiring in ${daysLeft} days. Renew now to avoid interruption!`;
        window.open(`https://wa.me/${member.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`, '_blank')
    }

    const columns: Column<any>[] = [
        {
            key: "status",
            label: "Status",
            render: (member) => {
                const expiryDate = member.planExpiresAt || member.plan_expires_at
                const daysLeft = getDaysRemaining(expiryDate);
                const isExpired = daysLeft < 0;
                return isExpired ? (
                    <Badge variant="destructive" className="flex w-fit items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Expired
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex w-fit items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Expiring
                    </Badge>
                );
            },
        },
        {
            key: "member",
            label: "Member",
            render: (member) => (
                <div>
                    <div className="font-medium">{member.fullName || member.full_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {member.phone}
                    </div>
                </div>
            ),
        },
        {
            key: "plan",
            label: "Plan",
            render: (member) => {
                const plan = memberships?.find((m: any) => m.id === (member.currentPlanId || member.current_plan_id))
                const planName = plan ? plan.name : "Unknown Plan"
                return <span>{planName}</span>;
            },
        },
        {
            key: "expiresOn",
            label: "Expires On",
            render: (member) => {
                const expiryDate = member.planExpiresAt || member.plan_expires_at
                return <span>{expiryDate ? formatDate(expiryDate) : 'N/A'}</span>;
            },
        },
        {
            key: "daysLeft",
            label: "Days Left",
            render: (member) => {
                const expiryDate = member.planExpiresAt || member.plan_expires_at
                const daysLeft = getDaysRemaining(expiryDate);
                const isExpired = daysLeft < 0;
                return (
                    <span className={isExpired ? "text-red-600 font-bold" : "text-yellow-600 font-bold"}>
                        {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                    </span>
                );
            },
        },
        {
            key: "actions",
            label: "Actions",
            render: (member) => {
                const expiryDate = member.planExpiresAt || member.plan_expires_at
                const daysLeft = getDaysRemaining(expiryDate);
                const isExpired = daysLeft < 0;
                return (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleWhatsApp(member, isExpired, daysLeft)}
                        >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" onClick={() => {
                            setSelectedMember(member)
                            setSelectedPlanId(member.currentPlanId || member.current_plan_id || "")
                            setIsRenewOpen(true)
                        }}>
                            <RefreshCw className="mr-2 h-3 w-3" /> Renew
                        </Button>
                    </div>
                );
            },
            headClassName: "text-right",
            className: "text-right",
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Membership Renewals</h1>
                    <p className="text-muted-foreground mt-2">
                        Members expiring in the next 30 days or already expired.
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-sm">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search members..." />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredMembers}
                loading={isLoading}
                searchable={false}
                title="Expiring Members List"
                emptyMessage="No renewals needed in the next 30 days!"
            />

            <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renew Membership</DialogTitle>
                        <DialogDescription>
                            Renewing membership for <b>{(selectedMember?.fullName || selectedMember?.full_name)}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a membership plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {memberships?.map((plan: any) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name} ({plan.durationDays || plan.duration_days} days)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenewOpen(false)}>Cancel</Button>
                        <Button onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending}>
                            {renewMutation.isPending ? "Renewing..." : "Confirm Renew"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
