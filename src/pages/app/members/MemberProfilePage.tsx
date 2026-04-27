import React from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { membersApi, membershipsApi, invoicesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate } from "@/lib/utils"
import { MemberForm } from "@/features/members/MemberForm"
import type { Member } from "@/types"
import {
    Plus,
    CreditCard,
    Clock,
    Activity,
    FileText,
    Dumbbell,
    History,
    Utensils,
    Upload,
    Fingerprint,
    Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// --- Sub-Components for Tabs ---

const MembershipList: React.FC<{ memberId: string; tenantId: string }> = ({ memberId }) => {
    const { data: member } = useQuery({
        queryKey: ["member", memberId],
        queryFn: () => membersApi.get(memberId).then(res => res.data)
    })

    return (
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Plan Name</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Validity</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {member?.currentPlan ? (
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-5 px-6">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{member.currentPlan.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Primary Plan</p>
                                </td>
                                <td className="py-5 px-6">
                                    <p className="text-xs font-bold text-slate-500">{formatDate(member.planStartedAt)} - {formatDate(member.planExpiresAt)}</p>
                                </td>
                                <td className="py-5 px-6">
                                    <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[9px] font-black uppercase px-2 py-1 italic">Active</Badge>
                                </td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={3} className="py-20 text-center font-bold text-slate-400 italic">No active membership found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

const MemberFollowUps: React.FC<{ memberId: string }> = () => (
    <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-8 text-center py-20">
             <History className="h-10 w-10 text-slate-200 mx-auto mb-4" />
             <p className="font-bold text-slate-400 italic">No follow-up history available for this member.</p>
        </div>
    </Card>
)

const MemberPayments: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { user } = useAuth()
    const { data: invoices } = useQuery({
        queryKey: ["member-invoices", memberId],
        queryFn: () => invoicesApi.list(user?.tenantId || "", memberId).then(res => res.data || [])
    })

    return (
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Invoice #</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Date</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Amount</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-5 px-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {invoices && invoices.length > 0 ? (
                            invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-5 px-6 text-xs font-mono font-bold text-slate-500">{inv.invoice_number || "INV-"+inv.id.slice(0,6)}</td>
                                    <td className="py-5 px-6 text-xs font-bold text-slate-600">{formatDate(inv.created_at)}</td>
                                    <td className="py-5 px-6 text-sm font-black text-slate-800 italic">₹{inv.total_amount}</td>
                                    <td className="py-5 px-6">
                                        <Badge className={`rounded-lg text-[9px] font-black uppercase px-2 py-1 ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">No transaction records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

const MemberAttendance: React.FC<{ memberId: string }> = () => (
    <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 p-12 text-center py-20">
         <Clock className="h-10 w-10 text-slate-200 mx-auto mb-4" />
         <p className="font-bold text-slate-400 italic">Historical attendance logs are being synchronized...</p>
    </Card>
)

const MemberWorkouts: React.FC<{ memberId: string }> = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl p-8 bg-white dark:bg-slate-900 group hover:shadow-xl transition-all cursor-pointer ring-1 ring-slate-100">
             <div className="h-40 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-100 transition-colors">
                 <Dumbbell className="h-12 w-12 text-slate-200" />
             </div>
             <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Strength Training V1</h4>
             <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Assigned: 14 April, 2026</p>
        </Card>
    </div>
)

// --- Main Page Component ---

export const MemberProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "memberships"

    const { data: member, isLoading } = useQuery({
        queryKey: ["member", id],
        queryFn: async () => {
            const response = await membersApi.get(id!)
            if (response.error) throw response.error
            return response.data as Member
        },
        enabled: !!id
    })

    const { data: memberships } = useQuery({
        queryKey: ["memberships", user?.tenantId],
        queryFn: async () => {
            const response = await membershipsApi.list(user?.tenantId || "")
            if (response.error) throw response.error
            return response.data || []
        },
        enabled: !!user?.tenantId
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B3D]"></div>
        </div>
    )

    if (!member) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="p-6 bg-rose-50 rounded-full">
                <FileText className="h-12 w-12 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Member Not Found</h2>
            <Link to="/members" className="text-[#FF6B3D] font-black hover:underline uppercase tracking-widest text-sm">Return to Directory</Link>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Stats Info */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                        {member.fullName}
                        <Badge className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none rounded-xl text-[10px] font-black uppercase px-3 py-1.5 italic tracking-widest">Active</Badge>
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="text-slate-800 dark:text-white font-black">#{member.memberCode}</span> 
                        <span className="opacity-30">•</span> 
                        Joined {formatDate(member.joinedAt)}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-black text-slate-600 px-8 hover:bg-white hover:shadow-md transition-all">
                         Generate ID Card
                    </Button>
                    <Button className="h-12 rounded-2xl bg-slate-900 text-white font-black px-8 shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all">
                         Create Receipt
                    </Button>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Current Weight", value: "72.5", unit: "KG", icon: <Circle className="h-6 w-6 fill-current" />, color: "orange" },
                    { label: "PT Status", value: "Active", unit: "", icon: <Activity className="h-6 w-6" />, color: "blue" },
                    { label: "Attendance", value: "85", unit: "%", icon: <Clock className="h-6 w-6" />, color: "emerald" },
                    { label: "Total Dues", value: "1,200", unit: "INR", icon: <CreditCard className="h-6 w-6" />, color: "rose" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white dark:bg-slate-900 group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6 flex items-center gap-5">
                            <div className={`h-14 w-14 bg-${stat.color}-50 dark:bg-${stat.color}-950/30 rounded-[22px] flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                 {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className={`text-xl font-black text-slate-800 dark:text-white ${stat.color === 'rose' ? 'text-rose-500' : ''}`}>
                                    {stat.value} <span className="text-xs opacity-40 font-bold ml-1">{stat.unit}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border-none p-8 lg:p-12 min-h-[600px]">
                {/* Section Rendering Logic */}
                {activeTab === "edit" && (
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Basic Profile Information</h3>
                        </div>
                        <MemberForm 
                            member={member} 
                            memberships={memberships || []}
                            onSuccess={() => {}}
                            onCancel={() => {}}
                        />
                    </div>
                )}

                {activeTab === "memberships" && (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Membership Details</h3>
                            </div>
                            <Button className="h-11 rounded-2xl bg-[#FF6B3D] text-white font-black px-8 shadow-lg shadow-orange-500/20">Extend Validity</Button>
                        </div>
                        <MembershipList memberId={member.id} tenantId={user?.tenantId || ""} />
                    </div>
                )}

                {activeTab === "followups" && (
                    <div className="space-y-10">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Notes & Followups</h3>
                            </div>
                            <Button className="h-11 rounded-2xl bg-slate-900 text-white font-black px-8 shadow-lg shadow-slate-900/10">Add Entry</Button>
                        </div>
                        <MemberFollowUps memberId={member.id} />
                    </div>
                )}

                {activeTab === "payments" && (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Financial History</h3>
                            </div>
                            <Button variant="outline" className="h-11 rounded-2xl border-slate-200 font-black px-8 text-slate-600">Download Statement</Button>
                        </div>
                        <MemberPayments memberId={member.id} />
                    </div>
                )}

                {activeTab === "attendance" && (
                    <div className="space-y-10">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Attendance Logs</h3>
                            </div>
                            <Button variant="outline" className="h-11 rounded-2xl border-slate-200 font-black px-8 text-slate-600">Manual Check-in</Button>
                        </div>
                        <MemberAttendance memberId={member.id} />
                    </div>
                )}

                {activeTab === "workouts" && (
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Training Plans</h3>
                            </div>
                            <Button className="h-11 rounded-2xl bg-slate-900 text-white font-black px-8">Assign Plan</Button>
                        </div>
                        <MemberWorkouts memberId={member.id} />
                    </div>
                )}

                {activeTab === "diet" && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                         <Utensils className="h-12 w-12 text-slate-200 mb-6" />
                         <p className="text-lg font-black text-slate-400 uppercase tracking-widest italic">No Diet Plan Active</p>
                         <Button className="mt-8 h-12 rounded-2xl bg-[#FF6B3D] text-white font-black px-10 shadow-xl shadow-orange-500/20">Create Custom Diet Chart</Button>
                    </div>
                )}

                {activeTab === "health" && (
                     <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Biometric Vitals</h3>
                            </div>
                            <Button className="h-11 rounded-2xl bg-[#FF6B3D] text-white font-black px-8">New Assessment</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { label: "Blood Pressure", value: "118/76", status: "Optimal", color: "emerald" },
                                { label: "Heart Rate", value: "68 bpm", status: "Excellent", color: "emerald" },
                                { label: "BMI", value: "23.5", status: "Normal", color: "emerald" },
                                { label: "Body Fat %", value: "17.2%", status: "Good", color: "blue" },
                                { label: "Muscle Mass", value: "35.4kg", status: "High", color: "blue" },
                                { label: "Metabolic Age", value: "24", status: "Athletic", color: "emerald" },
                            ].map((stat, i) => (
                                <Card key={i} className="border-slate-100 dark:border-slate-800 shadow-sm rounded-[32px] overflow-hidden group hover:shadow-lg transition-all dark:bg-slate-900/50">
                                    <CardContent className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <Badge className={`bg-${stat.color}-500/10 text-${stat.color}-500 border-none rounded-lg text-[9px] font-black uppercase px-2.5 py-1 tracking-widest`}>{stat.status}</Badge>
                                        </div>
                                        <p className="text-3xl font-black text-slate-800 dark:text-white italic">{stat.value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     </div>
                )}

                {activeTab === "documents" && (
                    <div className="space-y-10">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Stored Documents</h3>
                            </div>
                            <Button className="h-11 rounded-2xl bg-slate-900 text-white font-black px-8 flex items-center gap-2">
                                <Upload className="h-5 w-5" /> Upload File
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { name: "Aadhar_Card.pdf", size: "1.2 MB", date: "14 Apr 2026", type: "ID Proof" },
                                { name: "Medical_Hist.docx", size: "0.4 MB", date: "15 Apr 2026", type: "Medical" },
                                { name: "Joining_Agreement.pdf", size: "2.1 MB", date: "16 Apr 2026", type: "Contract" },
                            ].map((doc, i) => (
                                <Card key={i} className="border-none shadow-sm rounded-[32px] p-8 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group cursor-pointer ring-1 ring-slate-100 dark:ring-slate-800">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{doc.type}</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate lowercase tracking-tight">{doc.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2">{doc.size} • Uploaded {doc.date}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "biometric" && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[60px] border-none shadow-sm max-w-2xl mx-auto ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="relative mb-12">
                            <div className="h-40 w-40 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center animate-pulse">
                                <Fingerprint className="h-20 w-20 text-emerald-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">Biometric ID : Assigned</h3>
                        <p className="text-sm font-bold text-slate-400 mb-12 uppercase tracking-[0.2em]">Verified on 14th April, 2026</p>
                        <div className="flex gap-6">
                            <Button variant="outline" className="h-12 rounded-2xl px-10 font-black text-slate-600 border-slate-200 hover:bg-white hover:shadow-md transition-all">Clear Records</Button>
                            <Button className="h-12 rounded-2xl px-10 font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all">Update Fingerprint</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
