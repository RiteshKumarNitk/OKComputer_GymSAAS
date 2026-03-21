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
    CheckCircle2
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
import { useNavigate } from "react-router-dom"

export const RenewalsPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

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
    )

    const getDaysRemaining = (dateString: string | null) => {
        if (!dateString) return -999;
        const expiry = new Date(dateString);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

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
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expiring Members List</CardTitle>
                    <CardDescription>Prioritize calls to members with negative days remaining (Expired).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Expires On</TableHead>
                                <TableHead>Days Left</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            )}
                            {filteredMembers?.map((member: any) => {
                                const expiryDate = member.planExpiresAt || member.plan_expires_at
                                const daysLeft = getDaysRemaining(expiryDate);
                                const isExpired = daysLeft < 0;
                                const plan = memberships?.find((m: any) => m.id === (member.currentPlanId || member.current_plan_id))
                                const planName = plan ? plan.name : "Unknown Plan"

                                return (
                                    <TableRow key={member.id} className={isExpired ? "bg-red-50 dark:bg-red-950/10" : ""}>
                                        <TableCell>
                                            {isExpired ? (
                                                <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Expired
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex w-fit items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Expiring
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{member.fullName || member.full_name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {member.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>{planName}</TableCell>
                                        <TableCell>{expiryDate ? formatDate(expiryDate) : 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className={isExpired ? "text-red-600 font-bold" : "text-yellow-600 font-bold"}>
                                                {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        const dateStr = member.plan_expires_at ? formatDate(member.plan_expires_at) : 'Unknown Date';
                                                        const text = isExpired
                                                            ? `Hi ${member.full_name}, your gym membership expired on ${dateStr}. Please renew to continue your workouts!`
                                                            : `Hi ${member.full_name}, your gym membership is expiring in ${daysLeft} days. Renew now to avoid interruption!`;
                                                        window.open(`https://wa.me/${member.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`, '_blank')
                                                    }}
                                                >
                                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="sm" onClick={() => navigate("/billing")}>
                                                    <RefreshCw className="mr-2 h-3 w-3" /> Renew
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {!isLoading && filteredMembers?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                        No renewals needed in the next 30 days!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
