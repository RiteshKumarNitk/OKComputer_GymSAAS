import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { reportsApi, dashboardApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency, exportToCSV } from "@/lib/utils"
import { Download, Users, AlertTriangle, TrendingUp, UserMinus } from "lucide-react"
import { PageHeader, DataTable } from "@/components/common"
import type { Column } from "@/components/common"

export const ReportsPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("overview")

    // Fetch total members separately from dashboard stats to populate the Total Members card
    const { data: statsData } = useQuery({
        queryKey: ["dashboard-stats", user?.tenantId],
        queryFn: async () => {
             const response = await dashboardApi.getStats()
             if (response.error) throw response.error
             return response.data
        },
        enabled: !!user?.tenantId
    })

    // Consolidated reports query
    const { data: reportData, isLoading } = useQuery({
        queryKey: ["reports_members", user?.tenantId],
        queryFn: async () => {
             const response = await reportsApi.getMembers()
             if (response.error) throw response.error
             return response.data
        },
        enabled: !!user?.tenantId
    })

    const expiringMembers = reportData?.expiring || []
    const inactiveMembers = reportData?.inactive || []
    const newMembers = reportData?.newJoiners || []

    const handleExport = () => {
        let dataToExport: any[] = []
        let filename = `report-${activeTab}-${new Date().toISOString().split('T')[0]}`

        if (activeTab === "expiring" && expiringMembers) {
            dataToExport = expiringMembers.map((m: any) => ({
                Name: m.fullName ?? m.fullName,
                Phone: m.phone,
                Plan: m.currentPlan?.name ?? m.memberships?.name,
                ExpiresAt: formatDate(m.planExpiresAt ?? m.planExpiresAt),
                Status: m.status
            }))
        } else if (activeTab === "inactive" && inactiveMembers) {
            dataToExport = inactiveMembers.map((m: any) => ({
                Name: m.fullName ?? m.fullName,
                Phone: m.phone,
                LastCheckin: "N/A", // Handled by server filters
                MemberCode: m.memberCode ?? m.memberCode
            }))
        } else if (activeTab === "new" && newMembers) {
            dataToExport = newMembers.map((m: any) => ({
                Name: m.fullName ?? m.fullName,
                Phone: m.phone,
                JoinedAt: formatDate(m.joinedAt ?? m.joinedAt),
                Plan: m.currentPlan?.name ?? m.memberships?.name,
                Amount: m.currentPlan?.priceCents ? (m.currentPlan.priceCents / 100).toFixed(2) : "0"
            }))
        } else if (activeTab === "overview") {
            dataToExport = [
                { Metric: "Expiring Soon", Count: expiringMembers?.length || 0 },
                { Metric: "Inactive Members", Count: inactiveMembers?.length || 0 },
                { Metric: "New Joiners", Count: newMembers?.length || 0 }
            ]
        }

        if (dataToExport.length > 0) {
            exportToCSV(dataToExport, filename)
        }
    }

    const expiringColumns: Column<any>[] = [
        { key: "member", label: "Member", render: (m: any) => <div><div className="font-medium">{m.fullName ?? m.fullName}</div><div className="text-xs text-muted-foreground">{m.phone}</div></div> },
        { key: "plan", label: "Plan", render: (m: any) => <>{m.currentPlan?.name ?? m.memberships?.name}</> },
        { key: "expiresOn", label: "Expires On", render: (m: any) => <>{formatDate(m.planExpiresAt ?? m.planExpiresAt)}</> },
        { key: "daysLeft", label: "Days Left", render: (m: any) => { const expiryDate = m.planExpiresAt ?? m.planExpiresAt; const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0; return <Badge variant={daysLeft < 7 ? "destructive" : "secondary"}>{daysLeft} days</Badge> } },
        { key: "action", label: "Action", className: "text-right", render: (m: any) => <Button size="sm" variant="outline" onClick={() => navigate(`/billing?member=${m.id}&action=renew`)}>Renew</Button> },
    ]

    const inactiveColumns: Column<any>[] = [
        { key: "member", label: "Member", render: (m: any) => <span className="font-medium">{m.fullName ?? m.fullName}</span> },
        { key: "lastCheckin", label: "Last Check-in", render: () => <span>Inactive</span> },
        { key: "phone", label: "Phone", render: (m: any) => <>{m.phone}</> },
        { key: "action", label: "Action", className: "text-right", render: (m: any) => <Button size="sm" variant="outline" onClick={() => window.open(`tel:${m.phone}`)}>Contact</Button> },
    ]

    const newMemberColumns: Column<any>[] = [
        { key: "member", label: "Member", render: (m: any) => <div><div className="font-medium">{m.fullName ?? m.fullName}</div><div className="text-xs text-muted-foreground">{m.memberCode ?? m.memberCode}</div></div> },
        { key: "joinedDate", label: "Joined Date", render: (m: any) => <>{formatDate(m.joinedAt ?? m.joinedAt)}</> },
        { key: "plan", label: "Plan", render: (m: any) => <>{(m.currentPlan?.name ?? m.memberships?.name) || "-"}</> },
        { key: "amount", label: "Amount", render: (m: any) => <>{m.currentPlan?.priceCents ? formatCurrency(m.currentPlan.priceCents) : "-"}</> },
        { key: "action", label: "Action", className: "text-right", render: (m: any) => <Button size="sm" variant="ghost" onClick={() => navigate(`/members/${m.id}`)}>View</Button> },
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Member Reports"
                titleClassName="text-3xl font-bold tracking-tight"
                actions={
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expiring Soon (30d)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : expiringMembers?.length}</div>
                        <p className="text-xs text-muted-foreground">Memberships ending this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk / Inactive</CardTitle>
                        <UserMinus className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : inactiveMembers?.length}</div>
                        <p className="text-xs text-muted-foreground">No visit in last 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Joiners</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : newMembers?.length}</div>
                        <p className="text-xs text-muted-foreground">Joined in last 30 days</p>
                    </CardContent>
                </Card>
                {/* Placeholder for Revenue or other metric */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statsData?.activeMembers ?? "--"}</div>
                        <p className="text-xs text-muted-foreground">Active members</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="expiring" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive Members</TabsTrigger>
                    <TabsTrigger value="new">New Joiners</TabsTrigger>
                </TabsList>

                <TabsContent value="expiring" className="space-y-4">
                    <DataTable
                        columns={expiringColumns}
                        data={expiringMembers}
                        loading={isLoading}
                        title="Expiring Memberships"
                        emptyMessage="No expiring memberships found."
                    />
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                    <DataTable
                        columns={inactiveColumns}
                        data={inactiveMembers}
                        loading={isLoading}
                        title="Inactive / At-Risk Members"
                        emptyMessage="No inactive members found!"
                    />
                </TabsContent>

                <TabsContent value="new" className="space-y-4">
                    <DataTable
                        columns={newMemberColumns}
                        data={newMembers}
                        loading={isLoading}
                        title="New Joiners"
                        emptyMessage="No new members recently."
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
