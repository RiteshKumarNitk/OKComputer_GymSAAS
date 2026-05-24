import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { visitorsApi, complaintsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MessageSquareWarning, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "react-router-dom"
import { PageHeader, DataTable } from "@/components/common"
import type { Column } from "@/components/common"

export const OperationsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()

    // Default tab from URL
    const defaultTab = searchParams.get("tab") || "visitors"

    // States
    const [isAddVisitorOpen, setIsAddVisitorOpen] = useState(false)
    const [isAddComplaintOpen, setIsAddComplaintOpen] = useState(false)
    const [visitorPurpose, setVisitorPurpose] = useState("Inquiry")
    const [complaintPriority, setComplaintPriority] = useState("medium")

    // --- VISITORS LOGIC ---
    const { data: visitors, isLoading: isVisitorLoading } = useQuery({
        queryKey: ["visitors", user?.tenantId],
        queryFn: async () => {
             const response = await visitorsApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data || []
        },
        enabled: !!user?.tenantId
    })

    const addVisitorMutation = useMutation({
        mutationFn: async (data: { name: string; phone: string; purpose: string }) => {
            const response = await visitorsApi.create({
                name: data.name,
                phone: data.phone,
                visit_purpose: data.purpose
            })
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visitors"] }); setIsAddVisitorOpen(false); setVisitorPurpose("Inquiry"); toast({ title: "Visitor Logged" }) }
    })

    // --- COMPLAINTS LOGIC ---
    const { data: complaints } = useQuery({
        queryKey: ["complaints", user?.tenantId],
        queryFn: async () => {
             const response = await complaintsApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data
        },
        enabled: !!user?.tenantId
    })

    const addComplaintMutation = useMutation({
        mutationFn: async (data: { title: string; description: string; priority: string }) => {
            const response = await complaintsApi.create({
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: 'open'
            })
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); setIsAddComplaintOpen(false); setComplaintPriority("medium"); toast({ title: "Complaint Logged" }) }
    })

    const updateComplaintMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const response = await complaintsApi.update(id, { status })
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); toast({ title: "Status updated" }) },
        onError: (err: any) => { toast({ title: "Error", description: err.message, variant: "destructive" }) }
    })

    const visitorColumns: Column<any>[] = [
        { key: "time", label: "Time", render: (v: any) => <>{formatDate(v.visitTime ?? v.visit_time, "h:mm a")}</> },
        { key: "name", label: "Name", render: (v: any) => <span className="font-medium">{v.name}</span> },
        { key: "purpose", label: "Purpose", render: (v: any) => <Badge variant="outline">{v.visitPurpose ?? v.visit_purpose}</Badge> },
        { key: "phone", label: "Phone", render: (v: any) => <>{v.phone || "-"}</> },
    ]

    return (
        <div className="space-y-6">
            <PageHeader title="Gym Operations" titleClassName="text-3xl font-bold tracking-tight" />

            <Tabs defaultValue={defaultTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="visitors">Visitor Log</TabsTrigger>
                    <TabsTrigger value="complaints">Complaints & Requests</TabsTrigger>
                    {/* Staff Log could be here too */}
                </TabsList>

                {/* VISITOR TAB */}
                <TabsContent value="visitors" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Daily Visitor Log</h2>
                        <Dialog open={isAddVisitorOpen} onOpenChange={setIsAddVisitorOpen}>
                            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Log Visitor</Button></DialogTrigger>
                                <DialogContent>
                                <DialogHeader><DialogTitle>Log New Visitor</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addVisitorMutation.mutate({ name: fd.get("name") as string, phone: fd.get("phone") as string, purpose: visitorPurpose }); }} className="space-y-4">
                                    <Input name="name" placeholder="Visitor Name" required />
                                    <Input name="phone" placeholder="Phone Number" />
                                    <Select value={visitorPurpose} onValueChange={setVisitorPurpose}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Inquiry">Membership Inquiry</SelectItem>
                                            <SelectItem value="Guest">Guest Workout</SelectItem>
                                            <SelectItem value="Vendor">Vendor/Delivery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DialogFooter><Button type="submit">Log Entry</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <DataTable
                        columns={visitorColumns}
                        data={visitors || []}
                        loading={isVisitorLoading}
                        emptyMessage="No visitors today."
                    />
                </TabsContent>

                {/* COMPLAINTS TAB */}
                <TabsContent value="complaints" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Member Feedback & Issues</h2>
                        <Dialog open={isAddComplaintOpen} onOpenChange={setIsAddComplaintOpen}>
                            <DialogTrigger asChild><Button variant="destructive"><MessageSquareWarning className="mr-2 h-4 w-4" /> Log Complaint</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Log Complaint/Request</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addComplaintMutation.mutate({ title: fd.get("title") as string, description: fd.get("description") as string, priority: complaintPriority }); }} className="space-y-4">
                                    <Input name="title" placeholder="Issue Subject (e.g. AC not working)" required />
                                    <Select value={complaintPriority} onValueChange={setComplaintPriority}>
                                        <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input name="description" placeholder="Details..." />
                                    <DialogFooter><Button type="submit">Submit Ticket</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="space-y-4">
                        {complaints?.map((ticket: any) => (
                            <Card key={ticket.id} className="border-l-4 border-l-primary">
                                <CardHeader className="py-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{ticket.title}</CardTitle>
                                            <CardDescription className="text-xs">{formatDate(ticket.createdAt ?? ticket.created_at)} • {ticket.member ? (ticket.member.fullName ?? ticket.member.fullName) : "General"}</CardDescription>
                                        </div>
                                        <Badge className={ticket.status === 'resolved' ? 'bg-green-500' : 'bg-yellow-500'}>{ticket.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-2 pb-4 text-sm flex justify-between items-end">
                                    <p>{ticket.description}</p>
                                    {ticket.status !== 'resolved' && (
                                        <Button size="sm" variant="outline" onClick={() => updateComplaintMutation.mutate({ id: ticket.id, status: 'resolved' })}>Mark Resolved</Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {complaints?.length === 0 && <div className="text-center text-muted-foreground py-10">No active complaints.</div>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
