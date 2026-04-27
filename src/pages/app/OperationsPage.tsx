import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { visitorsApi, complaintsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MessageSquareWarning, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "react-router-dom"

export const OperationsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()

    // Default tab from URL
    const defaultTab = searchParams.get("tab") || "visitors"

    // Pagination State (Visitors)
    const [visitorPage, setVisitorPage] = useState(1)
    const [visitorRowsPerPage, setVisitorRowsPerPage] = useState(10)

    // States
    const [isAddVisitorOpen, setIsAddVisitorOpen] = useState(false)
    const [isAddComplaintOpen, setIsAddComplaintOpen] = useState(false)

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

    const filteredVisitors = visitors || []
    const totalVisitors = filteredVisitors.length
    const visitorTotalPages = Math.ceil(totalVisitors / visitorRowsPerPage)
    const paginatedVisitors = filteredVisitors.slice((visitorPage - 1) * visitorRowsPerPage, visitorPage * visitorRowsPerPage)
    const visitorShowingFrom = totalVisitors === 0 ? 0 : (visitorPage - 1) * visitorRowsPerPage + 1
    const visitorShowingTo = Math.min(visitorPage * visitorRowsPerPage, totalVisitors)

    const addVisitorMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await visitorsApi.create({
                name: formData.get("name"),
                phone: formData.get("phone"),
                visit_purpose: formData.get("purpose")
            })
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visitors"] }); setIsAddVisitorOpen(false); toast({ title: "Visitor Logged" }) }
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
        mutationFn: async (formData: FormData) => {
            const response = await complaintsApi.create({
                title: formData.get("title"),
                description: formData.get("description"),
                priority: formData.get("priority"),
                status: 'open'
            })
            if (response.error) throw response.error
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["complaints"] }); setIsAddComplaintOpen(false); toast({ title: "Complaint Logged" }) }
    })

    const updateComplaintStatus = async (id: string, status: string) => {
        const response = await complaintsApi.update(id, { status })
        if (response.error) toast({ title: "Error", description: response.error.message || "Failed to update", variant: "destructive" })
        else queryClient.invalidateQueries({ queryKey: ["complaints"] })
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gym Operations</h1>

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
                                <form onSubmit={(e) => { e.preventDefault(); addVisitorMutation.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                                    <Input name="name" placeholder="Visitor Name" required />
                                    <Input name="phone" placeholder="Phone Number" />
                                    <Select name="purpose" defaultValue="Inquiry">
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
                    <Card><CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Phone</TableHead>
                                </TableRow>
                            </TableHeader>
                                <TableBody>
                                    {isVisitorLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse">
                                                <TableCell colSpan={4} className="h-10 bg-slate-50" />
                                            </TableRow>
                                        ))
                                    ) : paginatedVisitors.length > 0 ? (
                                        paginatedVisitors.map((v: any) => (
                                            <TableRow key={v.id}>
                                                <TableCell>{formatDate(v.visitTime ?? v.visit_time, "h:mm a")}</TableCell>
                                                <TableCell className="font-medium">{v.name}</TableCell>
                                                <TableCell><Badge variant="outline">{v.visitPurpose ?? v.visit_purpose}</Badge></TableCell>
                                                <TableCell>{v.phone || "-"}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center py-4">No visitors today.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination Integration */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 text-slate-500 font-bold border-t border-slate-100">
                                <div className="text-xs">
                                    Showing <span className="text-slate-900">{visitorShowingFrom}</span> to <span className="text-slate-900">{visitorShowingTo}</span> of <span className="text-slate-900">{totalVisitors}</span> entries
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        Rows:
                                        <select className="bg-transparent font-bold text-slate-900 focus:outline-none" value={visitorRowsPerPage} onChange={(e) => {setVisitorRowsPerPage(Number(e.target.value)); setVisitorPage(1);}}>
                                            {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setVisitorPage(prev => Math.max(1, prev - 1))}
                                            disabled={visitorPage === 1}
                                            className="h-8 text-xs font-bold"
                                        >
                                            Prev
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setVisitorPage(prev => Math.min(visitorTotalPages, prev + 1))}
                                            disabled={visitorPage === visitorTotalPages || visitorTotalPages === 0}
                                            className="h-8 text-xs font-bold"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* COMPLAINTS TAB */}
                <TabsContent value="complaints" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Member Feedback & Issues</h2>
                        <Dialog open={isAddComplaintOpen} onOpenChange={setIsAddComplaintOpen}>
                            <DialogTrigger asChild><Button variant="destructive"><MessageSquareWarning className="mr-2 h-4 w-4" /> Log Complaint</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Log Complaint/Request</DialogTitle></DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); addComplaintMutation.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                                    <Input name="title" placeholder="Issue Subject (e.g. AC not working)" required />
                                    <Select name="priority" defaultValue="medium">
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
                                        <Button size="sm" variant="outline" onClick={() => updateComplaintStatus(ticket.id, 'resolved')}>Mark Resolved</Button>
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
