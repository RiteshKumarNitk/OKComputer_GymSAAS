import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { membersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate, exportToCSV } from "@/lib/utils"
import { Filter, Download, CreditCard, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader, SearchBar, CategoryStatsGrid, DataTable, type Column } from "@/components/common"
import { Member } from "@/types"

export const MemberSubscriptionsPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [showAll, setShowAll] = useState(false)

    const { data: members, isLoading } = useQuery({
        queryKey: ["subscriptions", user?.tenantId, searchQuery],
        queryFn: async () => {
            const res = await membersApi.list(user?.tenantId || "", searchQuery)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!user?.tenantId
    })

    const subscriptions = showAll ? (members || []) : (members?.filter(m => m.status === 'active') || [])

    const columns: Column<Member>[] = [
        {
            key: "name",
            label: "Member",
            render: (member) => <span className="font-bold text-slate-700">{member.fullName}</span>,
        },
        {
            key: "plan",
            label: "Plan Name",
            render: (member) => <span className="font-medium text-slate-600">{member.currentPlan?.name || "No Active Plan"}</span>,
        },
        {
            key: "validity",
            label: "Validity",
            render: (member) => (
                <span className="text-xs font-bold text-slate-500">
                    {formatDate(member.planStartedAt || member.joinedAt)} - {formatDate(member.planExpiresAt || member.joinedAt)}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: () => (
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg uppercase text-[10px] font-bold px-3 py-1">Active</Badge>
            ),
        },
        {
            key: "autoRenew",
            label: "Auto-Renew",
            render: () => <span className="text-xs font-bold text-slate-400">OFF</span>,
        },
        {
            key: "action",
            label: "Action",
            render: (member) => (
                <Button variant="ghost" size="sm" className="font-bold text-blue-600" onClick={() => navigate(`/members/${member.id}?tab=memberships`)}>
                    Upgrade
                </Button>
            ),
            headClassName: "text-right",
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Active Memberships"
                subtitle="Manage and track all ongoing member subscriptions"
                actions={
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => {
                        const csvData = subscriptions.map((m: any) => ({
                            "Name": m.fullName || "",
                            "Plan": m.currentPlan?.name || "N/A",
                            "Start": formatDate(m.planStartedAt || m.joinedAt),
                            "Expires": formatDate(m.planExpiresAt || ""),
                            "Status": m.status || "active"
                        }))
                        exportToCSV(csvData, "subscriptions.csv")
                    }}>
                        <Download className="mr-2 h-5 w-5" /> Export Data
                    </Button>
                }
            />

            <CategoryStatsGrid
              items={[
                { label: "Total Active", count: subscriptions.length, icon: <CheckCircle2 className="h-6 w-6" /> },
                { label: "Paid Subscriptions", count: members?.filter(m => m.status === 'active' && m.currentPlan).length || 0, icon: <CreditCard className="h-6 w-6" /> },
                { label: "Recently Expired", count: members?.filter(m => m.status === 'expired').length || 0, icon: <Clock className="h-6 w-6" /> },
              ]}
            />

            <div className="flex items-center gap-4">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by member name or phone..." />
                <Button variant="outline" className="h-10 w-10 rounded-xl p-0 border-slate-200" onClick={() => setShowAll(s => !s)}>
                    <Filter className={`h-5 w-5 transition-colors ${showAll ? 'text-orange-500' : 'text-slate-500'}`} />
                </Button>
            </div>

            <DataTable<Member>
              columns={columns}
              data={subscriptions}
              loading={isLoading}
              pagination={false}
              emptyMessage="No subscriptions found"
              headerClassName="bg-slate-50/50"
            />
        </div>
    )
}
