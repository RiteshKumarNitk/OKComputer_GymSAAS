import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { membersApi, membershipsApi, invoicesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { MemberForm } from "@/features/members/MemberForm"
import type { Member, Membership } from "@/types"
import {
    ChevronLeft,
    Plus,
    CreditCard,
    Calendar,
    Clock,
    Activity,
    MoreVertical,
    FileText,
    Dumbbell,
    UserCircle,
    History,
    Utensils,
    Upload,
    Fingerprint,
    Apple,
    HeartPulse,
    Users,
    Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const MemberProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("memberships")

    // Fetch member details
    const { data: member, isLoading } = useQuery({
        queryKey: ["member", id],
        queryFn: async () => {
            const response = await membersApi.get(id!)
            if (response.error) throw response.error
            return response.data as Member
        },
        enabled: !!id,
    })

    // Fetch memberships for the form
    const { data: memberships } = useQuery({
        queryKey: ["memberships", user?.tenant_id],
        queryFn: async () => {
          const response = await membershipsApi.list(user?.tenant_id || "")
          if (response.error) throw response.error
          return response.data as Membership[]
        },
        enabled: !!user?.tenant_id,
    })

    const { data: invoices } = useQuery({
        queryKey: ["member-invoices", id],
        queryFn: async () => {
            const res = await invoicesApi.list(user?.tenant_id || "", id)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!id && !!user?.tenant_id
    })

    if (isLoading) return <div className="p-8 h-screen flex items-center justify-center font-black text-slate-400 animate-pulse">LOADING PROFILE HUB...</div>
    if (!member) return <div className="p-8 h-screen flex items-center justify-center font-black text-rose-500">MEMBER NOT FOUND.</div>

    const menuItems = [
        { id: "edit", label: "Edit Profile", icon: <Edit className="h-4 w-4" /> },
        { id: "memberships", label: "Memberships", icon: <Users className="h-4 w-4" /> },
        { id: "followups", label: "Follow Ups", icon: <History className="h-4 w-4" /> },
        { id: "payments", label: "Payment History", icon: <CreditCard className="h-4 w-4" /> },
        { id: "reportcard", label: "Report Card", icon: <FileText className="h-4 w-4" /> },
        { id: "workouts", label: "Workout History", icon: <Dumbbell className="h-4 w-4" /> },
        { id: "diet", label: "Diet History", icon: <Utensils className="h-4 w-4" /> },
        { id: "documents", label: "Upload Documents", icon: <Upload className="h-4 w-4" /> },
        { id: "attendance", label: "Attendance", icon: <Calendar className="h-4 w-4" /> },
        { id: "biometric", label: "Biometric", icon: <Fingerprint className="h-4 w-4" /> },
        { id: "health", label: "Health Assessment", icon: <HeartPulse className="h-4 w-4" /> },
    ]

    return (
        <div className="flex h-[calc(100vh-80px)] -m-6 lg:-m-10 bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[340px] border-r border-slate-100 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-8">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/members")} className="text-slate-400 font-bold hover:text-slate-600 mb-8 p-0 group">
                        <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Members Profile
                    </Button>
                    
                    <div className="flex items-center gap-5 mb-8">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-slate-50 dark:border-slate-800 rounded-[28px] shadow-sm">
                                <AvatarImage src={member.photo_url || ""} />
                                <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-2xl">
                                    {(member.fullName || member.full_name)?.charAt(0) || "M"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight lowercase tracking-tight">{member.fullName || member.full_name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Client ID : <span className="text-slate-800 dark:text-slate-300">{member.memberCode || member.member_code}</span></p>
                        </div>
                    </div>

                    <Button className="w-full h-12 bg-[#FF6B3D] hover:bg-[#E85A2C] text-white rounded-xl font-black shadow-lg shadow-orange-500/30 mb-8 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                         <Plus className="h-5 w-5" /> Add to New Sale
                    </Button>

                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
                                    activeTab === item.id 
                                    ? "bg-stone-50 text-[#FF6B3D] shadow-sm" 
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                                }`}
                            >
                                <div className={`${activeTab === item.id ? "text-[#FF6B3D]" : "text-slate-400"}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-sm ${activeTab === item.id ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC] dark:bg-slate-950">
                <div className="p-12 max-w-7xl mx-auto space-y-10">
                    <div className="flex items-center justify-between">
                         <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            {menuItems.find(i => i.id === activeTab)?.label || "Profile"}
                         </h1>
                    </div>

                    {/* Member Fast Facts */}
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="grid grid-cols-3">
                            {[
                                { label: "Mobile Number", value: member.phone || "---" },
                                { label: "Email ID", value: member.email || "---" },
                                { label: "DOB", value: (member as any).dob || "---" },
                                { label: "Anniversary Date", value: (member as any).anniversary_date || "---" },
                                { label: "Emergency Contact Name", value: (member as any).emergency_contact_name || "---" },
                                { label: "Emergency Contact No", value: (member as any).emergency_contact_phone || "---" },
                            ].map((fact, idx) => (
                                <div key={idx} className={`p-8 ${idx < 3 ? 'border-b' : ''} ${idx % 3 !== 2 ? 'border-r' : ''} border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/50`}>
                                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">{fact.label}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fact.value}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Content Sections */}
                    {activeTab === "edit" && (
                        <Card className="p-8 border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 mx-auto max-w-4xl">
                            <MemberForm 
                                member={member} 
                                memberships={memberships || []} 
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["member", id] })}
                                onCancel={() => setActiveTab("memberships")}
                            />
                        </Card>
                    )}

                    {activeTab === "memberships" && (
                        <div className="space-y-6">
                            <Tabs defaultValue="active" className="w-full">
                                <TabsList className="bg-transparent h-12 w-full justify-start gap-8 border-b border-slate-100 dark:border-slate-800 px-0 rounded-none mb-6">
                                    <TabsTrigger value="active" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none h-12 px-0 text-[10px] font-black uppercase tracking-widest text-slate-400">Active Membership</TabsTrigger>
                                    <TabsTrigger value="past" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none h-12 px-0 text-[10px] font-black uppercase tracking-widest text-slate-400">Past Membership</TabsTrigger>
                                </TabsList>
                                <TabsContent value="active" className="mt-0">
                                    <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6 px-8">Name</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Duration</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Start Date</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">End Date</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Status</TableHead>
                                                    <TableHead className="text-right px-8"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {member.currentPlan ? (
                                                    <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="px-8 py-8">
                                                            <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">{member.currentPlan.name}</p>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">{Math.ceil(member.currentPlan.duration_days / 30)} Months</TableCell>
                                                        <TableCell className="text-xs font-bold text-slate-500">{formatDate(member.plan_started_at || member.joined_at)}</TableCell>
                                                        <TableCell className="text-xs font-bold text-slate-500">{formatDate(member.plan_expires_at || member.joined_at)}</TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[9px] font-black uppercase px-2 py-1">Active</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right px-8">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-40 text-center text-slate-400 italic font-bold">No active membership found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <div className="space-y-6">
                            <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 pb-8 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-100 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6 px-8">Date</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Check In</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Check Out</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="border-slate-100 hover:bg-slate-50 transition-colors">
                                            <TableCell className="px-8 py-6 text-xs font-bold text-slate-600">26 Apr, 2026</TableCell>
                                            <TableCell className="text-xs font-black text-slate-800">06:45 AM</TableCell>
                                            <TableCell className="text-xs font-black text-slate-800">08:12 AM</TableCell>
                                            <TableCell>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-lg text-[9px] font-black uppercase px-2 py-1">Present</Badge>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 pb-8 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6 px-8">Invoice No</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Total</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Paid</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-slate-400 italic font-bold">No payment history found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices?.map((invoice: any) => (
                                            <TableRow key={invoice.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                                <TableCell className="px-8 py-6 text-xs font-mono font-bold text-slate-500">{invoice.invoiceNumber || invoice.invoice_number}</TableCell>
                                                <TableCell className="text-xs font-bold text-slate-700">{formatDate(invoice.createdAt || invoice.created_at)}</TableCell>
                                                <TableCell className="text-xs font-black text-slate-800">₹{invoice.totalAmount || invoice.total_amount}</TableCell>
                                                <TableCell className="text-xs font-bold text-emerald-600">₹{invoice.paidAmount || invoice.paid_amount}</TableCell>
                                                <TableCell>
                                                    <Badge className={`${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-none rounded-lg text-[9px] font-black uppercase px-2 py-1`}>
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {activeTab === "followups" && (
                        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 pb-8 overflow-hidden">
                             <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-8">Follow Up Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6">Remark / Feedback</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 text-right px-8">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                                        <TableCell className="py-6 px-8 text-xs font-bold text-slate-700">24 Apr, 2026</TableCell>
                                        <TableCell className="max-w-[400px]">
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">Payment reminder follow-up.</p>
                                        </TableCell>
                                        <TableCell className="text-right py-6 px-8">
                                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                             </Table>
                        </Card>
                    )}

                    {activeTab === "workouts" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-all p-6 space-y-4">
                                <div className="h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                                    <Dumbbell className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase">Morning Core Blaster</h3>
                                <p className="text-xs font-bold text-slate-400">Assigned: 14 Apr, 2026</p>
                            </Card>
                        </div>
                    )}

                    {activeTab === "diet" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-all p-6 space-y-4">
                                <div className="h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                                    <Utensils className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase">Weight Loss Diet Plan</h3>
                                <p className="text-xs font-bold text-slate-400">Assigned: 14 Apr, 2026</p>
                            </Card>
                        </div>
                    )}

                    {activeTab === "health" && (
                        <div className="space-y-6">
                             <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: "Blood Group", value: "B+" },
                                    { label: "Blood Pressure", value: "120/80" },
                                    { label: "Heart Rate", value: "72 bpm" }
                                ].map((h, i) => (
                                    <Card key={i} className="border-none shadow-sm rounded-3xl p-6 bg-white shrink-0 h-32 flex flex-col justify-center">
                                         <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{h.label}</p>
                                         <p className="text-xl font-black text-slate-800">{h.value}</p>
                                    </Card>
                                ))}
                             </div>
                        </div>
                    )}

                    {activeTab === "documents" && (
                         <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Member Documents</h3>
                                <Button className="bg-slate-900 text-white rounded-xl font-bold h-10 px-6">
                                    <Upload className="h-4 w-4 mr-2" /> Upload New
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { name: "Aadhar_Card.pdf", size: "1.2 MB", date: "14 Apr, 2026" },
                                    { name: "Membership_Agreement.pdf", size: "0.8 MB", date: "15 Apr, 2026" },
                                    { name: "Medical_Certificate.jpg", size: "2.4 MB", date: "16 Apr, 2026" },
                                ].map((doc, i) => (
                                    <Card key={i} className="border-none shadow-sm rounded-3xl p-6 bg-white hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-black text-slate-800 truncate">{doc.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{doc.size} • {doc.date}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                         </div>
                    )}

                    {activeTab === "biometric" && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-none shadow-sm max-w-2xl mx-auto">
                            <div className="relative mb-10">
                                <div className="h-32 w-32 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
                                    <Fingerprint className="h-16 w-16 text-emerald-500" />
                                </div>
                                <div className="absolute -top-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                                    <Badge className="bg-transparent text-white p-0"><Plus className="h-4 w-4" /></Badge>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Biometric Status: Active</h3>
                            <p className="text-sm font-bold text-slate-400 mb-10">Fingerprint registered on 14th April, 2026</p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="h-12 rounded-2xl px-8 font-black text-slate-600 border-slate-200">Reset Data</Button>
                                <Button className="h-12 rounded-2xl px-8 font-black bg-slate-900 text-white">Re-Scan Finger</Button>
                            </div>
                        </div>
                    )}

                    {!["edit", "memberships", "followups", "attendance", "workouts", "payments", "diet", "health", "documents", "biometric"].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-slate-900 rounded-3xl border-none shadow-sm h-96">
                            <Clock className="h-12 w-12 text-slate-100 mb-4" />
                            <p className="text-slate-400 font-bold italic tracking-tight">{menuItems.find(i => i.id === activeTab)?.label} section is under development.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
