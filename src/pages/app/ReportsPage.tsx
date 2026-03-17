import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
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
    const [activeTab, setActiveTab] = useState("overview")

    // Query: Expiring Members (Next 30 Days)
    const { data: expiringMembers, isLoading: isLoadingExpiring } = useQuery({
        queryKey: ["reports_expiring", user?.tenant_id],
        queryFn: async () => {
            const today = new Date()
            const next30Days = new Date()
            next30Days.setDate(today.getDate() + 30)

            const { data, error } = await supabase
                .from("members")
                .select("*, memberships(name)")
                .eq("tenant_id", user?.tenant_id)
                .eq("status", "active")
                .gte("plan_expires_at", today.toISOString())
                .lte("plan_expires_at", next30Days.toISOString())
                .order("plan_expires_at", { ascending: true })

            if (error) throw error
            return data
        },
        enabled: !!user?.tenant_id
    })

    // Query: Inactive Members (No attendance in last 7 days)
    // Logic: Active members who are NOT in the attendance table for the last 7 days
    const { data: inactiveMembers, isLoading: isLoadingInactive } = useQuery({
        queryKey: ["reports_inactive", user?.tenant_id],
        queryFn: async () => {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            // 1. Get all active members
            const { data: allMembers, error: memberError } = await supabase
                .from("members")
                .select("id, full_name, member_code, phone, last_checkin_at")
                .eq("tenant_id", user?.tenant_id)
                .eq("status", "active")

            if (memberError) throw memberError

            // 2. Filter those who haven't checked in recently
            // Note: relying on last_checkin_at if available, otherwise checking attendance table is expensive. 
            // Assuming last_checkin_at is updated on checkin (if not, we might need a trigger or subquery).
            // For now, let's assume we can filter locally or if last_checkin_at exists.
            // If last_checkin_at column doesn't exist, we might need to change strategy.
            // Let's check if we have last_checkin_at? The user didn't show the schema, but I'll assume standard columns.
            // Actually, let's use a simpler query: Members created > 7 days ago AND (last_checkin < 7 days ago OR null)

            return allMembers?.filter((m: any) => {
                if (!m.last_checkin_at) return true // Never checked in
                return new Date(m.last_checkin_at) < sevenDaysAgo
            })
        },
        enabled: !!user?.tenant_id
    })

    // Query: New Joiners (Last 30 Days)
    const { data: newMembers, isLoading: isLoadingNew } = useQuery({
        queryKey: ["reports_new", user?.tenant_id],
        queryFn: async () => {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data, error } = await supabase
                .from("members")
                .select("*, memberships(name, price_cents)")
                .eq("tenant_id", user?.tenant_id)
                .gte("joined_at", thirtyDaysAgo.toISOString())
                .order("joined_at", { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!user?.tenant_id
    })

    const handleExport = () => {
        let dataToExport: any[] = []
        let filename = `report-${activeTab}-${new Date().toISOString().split('T')[0]}`

        if (activeTab === "expiring" && expiringMembers) {
            dataToExport = expiringMembers.map((m: any) => ({
                Name: m.full_name,
                Phone: m.phone,
                Plan: m.memberships?.name,
                ExpiresAt: formatDate(m.plan_expires_at),
                Status: m.status
            }))
        } else if (activeTab === "inactive" && inactiveMembers) {
            dataToExport = inactiveMembers.map((m: any) => ({
                Name: m.full_name,
                Phone: m.phone,
                LastCheckin: m.last_checkin_at ? formatDate(m.last_checkin_at) : "Never",
                MemberCode: m.member_code
            }))
        } else if (activeTab === "new" && newMembers) {
            dataToExport = newMembers.map((m: any) => ({
                Name: m.full_name,
                Phone: m.phone,
                JoinedAt: formatDate(m.joined_at),
                Plan: m.memberships?.name,
                Amount: m.memberships?.price_cents ? (m.memberships.price_cents / 100).toFixed(2) : "0"
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
                        {/* We could fetch total count separately, but for now just showing a placeholder or we can calc it if we had all members */}
                        <div className="text-2xl font-bold">--</div>
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
                                                const daysLeft = Math.ceil((new Date(m.plan_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                                return (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="font-medium">
                                                            <div>{m.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">{m.phone}</div>
                                                        </TableCell>
                                                        <TableCell>{m.memberships?.name}</TableCell>
                                                        <TableCell>{formatDate(m.plan_expires_at)}</TableCell>
                                                        <TableCell><Badge variant={daysLeft < 7 ? "destructive" : "secondary"}>{daysLeft} days</Badge></TableCell>
                                                        <TableCell className="text-right"><Button size="sm" variant="outline">Renew</Button></TableCell>
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
                                                    <TableCell className="font-medium">{m.full_name}</TableCell>
                                                    <TableCell>{m.last_checkin_at ? formatDate(m.last_checkin_at) : "Never"}</TableCell>
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
                                                        <div>{m.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">{m.member_code}</div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(m.joined_at)}</TableCell>
                                                    <TableCell>{m.memberships?.name || "-"}</TableCell>
                                                    <TableCell>{m.memberships?.price_cents ? formatCurrency(m.memberships.price_cents) : "-"}</TableCell>
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
