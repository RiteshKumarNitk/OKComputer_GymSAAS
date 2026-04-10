import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { reportsApi, dashboardApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatCurrency, exportToCSV } from "@/lib/utils"
import { Download, Users, AlertTriangle, TrendingUp, UserMinus } from "lucide-react"

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

    const isLoadingExpiring = isLoading
    const isLoadingInactive = isLoading
    const isLoadingNew = isLoading

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Member Reports</h1>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expiring Soon (30d)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingExpiring ? "-" : expiringMembers?.length}</div>
                        <p className="text-xs text-muted-foreground">Memberships ending this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk / Inactive</CardTitle>
                        <UserMinus className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingInactive ? "-" : inactiveMembers?.length}</div>
                        <p className="text-xs text-muted-foreground">No visit in last 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Joiners</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingNew ? "-" : newMembers?.length}</div>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Expiring Memberships</CardTitle>
                            <CardDescription>Members whose plans are expiring in the next 30 days. Recommend following up for renewal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingExpiring ? <Skeleton className="h-40 w-full" /> : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Expires On</TableHead>
                                                <TableHead>Days Left</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {expiringMembers?.map((m: any) => {
                                                const expiryDate = m.planExpiresAt ?? m.planExpiresAt
                                                const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                                                return (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="font-medium">
                                                            <div>{m.fullName ?? m.fullName}</div>
                                                            <div className="text-xs text-muted-foreground">{m.phone}</div>
                                                        </TableCell>
                                                        <TableCell>{m.currentPlan?.name ?? m.memberships?.name}</TableCell>
                                                        <TableCell>{formatDate(expiryDate)}</TableCell>
                                                        <TableCell><Badge variant={daysLeft < 7 ? "destructive" : "secondary"}>{daysLeft} days</Badge></TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="outline" onClick={() => navigate(`/billing?member=${m.id}&action=renew`)}>Renew</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {expiringMembers?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No expiring memberships found.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inactive / At-Risk Members</CardTitle>
                            <CardDescription>Active members who haven't visited in the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingInactive ? <Skeleton className="h-40 w-full" /> : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Last Check-in</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {inactiveMembers?.map((m: any) => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="font-medium">{m.fullName ?? m.fullName}</TableCell>
                                                    <TableCell>{"Inactive"}</TableCell>
                                                    <TableCell>{m.phone}</TableCell>
                                                    <TableCell className="text-right"><Button size="sm" variant="outline">Contact</Button></TableCell>
                                                </TableRow>
                                            ))}
                                            {inactiveMembers?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4">No inactive members found!</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="new" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Joiners</CardTitle>
                            <CardDescription>Members who joined in the last 30 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingNew ? <Skeleton className="h-40 w-full" /> : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Joined Date</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {newMembers?.map((m: any) => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="font-medium">
                                                        <div>{m.fullName ?? m.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">{m.memberCode ?? m.memberCode}</div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(m.joinedAt ?? m.joinedAt)}</TableCell>
                                                    <TableCell>{(m.currentPlan?.name ?? m.memberships?.name) || "-"}</TableCell>
                                                    <TableCell>{m.currentPlan?.priceCents ? formatCurrency(m.currentPlan.priceCents) : "-"}</TableCell>
                                                    <TableCell className="text-right"><Button size="sm" variant="ghost">View</Button></TableCell>
                                                </TableRow>
                                            ))}
                                            {newMembers?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No new members recently.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
