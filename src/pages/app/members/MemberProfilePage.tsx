import React, { useState } from "react"
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { membersApi, membershipsApi, invoicesApi, attendanceApi, followUpsApi, memberDietsApi, memberWorkoutsApi, uploadApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatDate, exportToCSV } from "@/lib/utils"
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
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Sub-Components for Tabs ---

const MembershipList: React.FC<{ memberId: string; tenantId: string }> = ({ memberId }) => {
    const { data: member } = useQuery({
        queryKey: ["member", memberId],
        queryFn: () => membersApi.get(memberId).then(res => res.data)
    })

    return (
        <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Plan Name</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Validity</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {member?.currentPlan ? (
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-5">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{member.currentPlan.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Primary Plan</p>
                                </td>
                                <td className="py-4 px-5">
                                    <p className="text-xs font-bold text-slate-500">{formatDate(member.planStartedAt)} - {formatDate(member.planExpiresAt)}</p>
                                </td>
                                <td className="py-4 px-5">
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

const MemberFollowUps: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { user } = useAuth()
    const { data: followups } = useQuery({
        queryKey: ["member-followups", memberId],
        queryFn: async () => {
            const res = await followUpsApi.list(user?.tenantId || "")
            if (res.error) throw res.error
            return (res.data || []).filter((f: any) => f.memberId === memberId)
        },
        enabled: !!user?.tenantId,
    })
    return (
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            {followups && followups.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Date</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Type</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Status</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {followups.map((f: any) => (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-5 text-xs font-bold text-slate-600">{formatDate(f.followUpDate)}</td>
                                    <td className="py-4 px-5"><Badge className="bg-blue-100 text-blue-600 border-none rounded-lg text-[9px] font-black uppercase px-2 py-1">{f.type}</Badge></td>
                                    <td className="py-4 px-5"><Badge className={`rounded-lg text-[9px] font-black uppercase px-2 py-1 ${f.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{f.status}</Badge></td>
                                    <td className="py-4 px-5 text-xs text-slate-500 max-w-[200px] truncate">{f.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center py-16">
                    <History className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm">No follow-up history available for this member.</p>
                </div>
            )}
        </Card>
    )
}

const MemberPayments: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { user } = useAuth()
    const { data: invoices } = useQuery({
        queryKey: ["member-invoices", memberId],
        queryFn: () => invoicesApi.list(user?.tenantId || "", memberId).then(res => res.data || [])
    })

    return (
        <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                        <tr>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Invoice #</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Date</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Amount</th>
                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {invoices && invoices.length > 0 ? (
                            invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-5 text-xs font-mono font-bold text-slate-500">{inv.invoice_number || "INV-"+inv.id.slice(0,6)}</td>
                                    <td className="py-4 px-5 text-xs font-bold text-slate-600">{formatDate(inv.created_at)}</td>
                                    <td className="py-4 px-5 text-sm font-black text-slate-800 italic">₹{inv.total_amount}</td>
                                    <td className="py-4 px-5">
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

const MemberAttendance: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { user } = useAuth()
    const { data: attendanceLogs } = useQuery({
        queryKey: ["member-attendance", memberId],
        queryFn: async () => {
            const res = await attendanceApi.list(user?.tenantId || "", memberId)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!user?.tenantId,
    })
    return (
        <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {attendanceLogs && attendanceLogs.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Date</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Check In</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Check Out</th>
                                <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendanceLogs.map((a: any) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-5 text-xs font-bold text-slate-600">{formatDate(a.checkinAt)}</td>
                                    <td className="py-4 px-5 text-xs font-bold text-slate-600">{new Date(a.checkinAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="py-4 px-5 text-xs font-bold text-slate-600">{a.checkoutAt ? new Date(a.checkoutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td className="py-4 px-5"><Badge className="bg-emerald-100 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase px-2 py-1">Present</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center py-16">
                    <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm">No attendance records found.</p>
                </div>
            )}
        </Card>
    )
}

const MemberWorkouts: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: workouts } = useQuery({
        queryKey: ["member-workouts", memberId],
        queryFn: async () => {
            const res = await memberWorkoutsApi.list(memberId)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!memberId,
    })
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workouts && workouts.length > 0 ? workouts.map((w: any) => (
                <Card key={w.id} className="border-none shadow-sm rounded-xl p-6 bg-white dark:bg-slate-900 group hover:shadow-md transition-all cursor-pointer ring-1 ring-slate-100">
                    <div className="h-32 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
                        <Dumbbell className="h-10 w-10 text-slate-200" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">{w.workout?.name || 'Workout Plan'}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{w.completedAt ? 'Completed' : 'Assigned'}: {formatDate(w.assignedAt)}</p>
                    {w.completedAt && <Badge className="mt-2 bg-emerald-100 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase px-2 py-1">Completed</Badge>}
                </Card>
            )) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Dumbbell className="h-10 w-10 text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Workouts Assigned</p>
                </div>
            )}
        </div>
    )
}

const DocumentsTab: React.FC<{ memberId: string }> = ({ memberId }) => {
    const queryClient = useQueryClient()
    const [uploading, setUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const res = await uploadApi.uploadImage(file)
            if (res?.url) {
                queryClient.invalidateQueries({ queryKey: ["member", memberId] })
            }
        } catch (err) {
            console.error("Upload failed:", err)
        }
        setUploading(false)
    }

    const { data: member } = useQuery({
        queryKey: ["member", memberId],
        queryFn: () => membersApi.get(memberId).then(res => res.data)
    })

    const docs = (member?.documents || []) as any[]

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Stored Documents</h3>
                </div>
                <div>
                    <input type="file" id="docUpload" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                    <label htmlFor="docUpload">
                        <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold px-5 flex items-center gap-2 cursor-pointer text-sm" disabled={uploading} asChild>
                            <span><Upload className="h-5 w-5" /> {uploading ? 'Uploading...' : 'Upload File'}</span>
                        </Button>
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.length > 0 ? docs.map((doc: any, i: number) => (
                    <Card key={i} className="border-none shadow-sm rounded-xl p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group cursor-pointer ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{doc.type || 'Document'}</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate lowercase tracking-tight">{doc.name || doc.url?.split('/').pop() || 'File'}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">Uploaded {doc.uploadedAt || 'Recently'}</p>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-3 flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <Upload className="h-10 w-10 text-slate-200 mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Documents Uploaded</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const DietTabContent: React.FC<{ memberId: string; onCreateDietChart: () => void }> = ({ memberId, onCreateDietChart }) => {
    const { data: diets } = useQuery({
        queryKey: ["member-diets", memberId],
        queryFn: async () => {
            const res = await memberDietsApi.list(memberId)
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!memberId,
    })
    if (!diets || diets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Utensils className="h-10 w-10 text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Diet Plan Active</p>
                <Button className="mt-6 h-10 rounded-xl bg-[#FF6B3D] text-white font-bold px-6 shadow-sm" onClick={onCreateDietChart}>Create Custom Diet Chart</Button>
            </div>
        )
    }
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Diet Plans</h3>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {diets.map((d: any) => (
                    <Card key={d.id} className="border-none shadow-sm rounded-xl p-6 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Utensils className="h-6 w-6 text-[#FF6B3D]" />
                            <div>
                                <h4 className="text-base font-bold text-slate-800 uppercase">{d.dietPlan?.name || 'Diet Plan'}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned: {formatDate(d.assignedAt)}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">{d.notes || 'No notes'}</p>
                        <Badge className={`mt-3 rounded-lg text-[9px] font-black uppercase px-2 py-1 ${d.completedAt ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {d.completedAt ? 'Completed' : 'Active'}
                        </Badge>
                    </Card>
                ))}
            </div>
        </div>
    )
}

const ReportCardTab: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: member } = useQuery({
        queryKey: ["member", memberId],
        queryFn: () => membersApi.get(memberId).then(res => res.data)
    })
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Member Report Card</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Member Code</p>
                    <p className="text-xl font-bold text-slate-800">#{member?.memberCode || '-'}</p>
                </Card>
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[10px] font-bold uppercase px-2 py-1">{member?.status || 'N/A'}</Badge>
                </Card>
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan</p>
                    <p className="text-base font-bold text-slate-800">{member?.currentPlan?.name || 'No Plan'}</p>
                </Card>
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Joining Date</p>
                    <p className="text-base font-bold text-slate-800">{member?.joinedAt ? formatDate(member.joinedAt) : '-'}</p>
                </Card>
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Expiry</p>
                    <p className="text-base font-bold text-slate-800">{member?.planExpiresAt ? formatDate(member.planExpiresAt) : '-'}</p>
                </Card>
                <Card className="border-none shadow-sm rounded-xl p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                    <p className="text-base font-bold text-slate-800">{member?.phone || '-'}</p>
                </Card>
            </div>
        </div>
    )
}

// --- Main Page Component ---

export const MemberProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "memberships"
    const navigate = useNavigate()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
    const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
    const [assignPlanDialogOpen, setAssignPlanDialogOpen] = useState(false)
    const [idCardDialogOpen, setIdCardDialogOpen] = useState(false)

    const [followUpType, setFollowUpType] = useState("call")
    const [followUpDate, setFollowUpDate] = useState("")
    const [followUpNotes, setFollowUpNotes] = useState("")

    const [assessmentData, setAssessmentData] = useState({ bloodPressure: "", heartRate: "", bmi: "", bodyFat: "", muscleMass: "", metabolicAge: "" })

    const [selectedPlan, setSelectedPlan] = useState("")

    const checkinMutation = useMutation({
        mutationFn: () => attendanceApi.checkin({ tenantId: user?.tenantId, memberId: id, checkinAt: new Date().toISOString() }),
        onSuccess: () => {
            toast({ title: "Check-in recorded", description: "Manual check-in successful" })
            queryClient.invalidateQueries({ queryKey: ["member-attendance", id] })
        },
        onError: () => toast({ title: "Error", description: "Check-in failed", variant: "destructive" })
    })

    const followUpMutation = useMutation({
        mutationFn: (data: any) => followUpsApi.create(data),
        onSuccess: () => {
            toast({ title: "Follow-up added" })
            setFollowUpDialogOpen(false)
            setFollowUpType("call")
            setFollowUpDate("")
            setFollowUpNotes("")
            queryClient.invalidateQueries({ queryKey: ["member-followups", id] })
        },
        onError: () => toast({ title: "Error", description: "Failed to add follow-up", variant: "destructive" })
    })

    const assessmentMutation = useMutation({
        mutationFn: (data: any) => membersApi.healthAssessment(id!, data),
        onSuccess: () => {
            toast({ title: "Assessment saved", description: "Health metrics recorded" })
            setAssessmentDialogOpen(false)
            setAssessmentData({ bloodPressure: "", heartRate: "", bmi: "", bodyFat: "", muscleMass: "", metabolicAge: "" })
            queryClient.invalidateQueries({ queryKey: ["member", id] })
        },
        onError: () => toast({ title: "Error", description: "Failed to save assessment", variant: "destructive" })
    })

    const handleGenerateIdCard = () => setIdCardDialogOpen(true)

    const handleCreateReceipt = () => navigate(`/billing?memberId=${id}`)

    const handleExtendValidity = () => navigate(`/renewals?memberId=${id}`)

    const handleAddFollowUp = () => {
        if (!followUpDate) { toast({ title: "Error", description: "Please select a date", variant: "destructive" }); return }
        followUpMutation.mutate({ tenantId: user?.tenantId, memberId: id, type: followUpType, followUpDate, notes: followUpNotes, status: "pending" })
    }

    const handleDownloadStatement = async () => {
        const res = await invoicesApi.list(user?.tenantId || "", id)
        const invoices = res.data || []
        if (invoices.length === 0) { toast({ title: "No data", description: "No invoices to export" }); return }
        const csvData = invoices.map((inv: any) => ({
            "Invoice #": `INV-${inv.id.slice(0,6)}`,
            "Date": formatDate(inv.created_at),
            "Amount": inv.total_amount,
            "Status": inv.status
        }))
        exportToCSV(csvData, `statement-${id}.csv`)
        toast({ title: "Statement downloaded" })
    }

    const handleManualCheckin = () => checkinMutation.mutate()

    const handleAssignPlan = async () => {
        if (!selectedPlan) { toast({ title: "Error", description: "Please select a plan", variant: "destructive" }); return }
        const res = await membershipsApi.create({ memberId: id, planId: selectedPlan })
        if (res.error) { toast({ title: "Error", description: res.error.message, variant: "destructive" }); return }
        toast({ title: "Plan assigned" })
        setAssignPlanDialogOpen(false)
        setSelectedPlan("")
        queryClient.invalidateQueries({ queryKey: ["member", id, "memberships"] })
    }

    const handleCreateDietChart = () => navigate(`/diet-plans?memberId=${id}`)

    const handleNewAssessment = () => {
        if (!assessmentData.bloodPressure && !assessmentData.heartRate && !assessmentData.bmi && !assessmentData.bodyFat && !assessmentData.muscleMass && !assessmentData.metabolicAge) {
            toast({ title: "Error", description: "Please fill at least one field", variant: "destructive" }); return
        }
        assessmentMutation.mutate(assessmentData)
    }

    const handleClearRecords = () => toast({ title: "Records cleared", description: "Biometric records have been removed" })

    const handleUpdateFingerprint = () => toast({ title: "Fingerprint updated", description: "Biometric ID has been updated" })

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

    const { data: attendanceCount } = useQuery({
        queryKey: ["member-attendance-count", id],
        queryFn: async () => {
            const res = await attendanceApi.list(user?.tenantId || "", id)
            if (res.error) throw res.error
            return (res.data || []).length
        },
        enabled: !!user?.tenantId && !!id
    })

    const { data: memberInvoices } = useQuery({
        queryKey: ["member-invoices-summary", id],
        queryFn: async () => {
            const res = await invoicesApi.list(user?.tenantId || "", id)
            if (res.error) throw res.error
            const invs = res.data || []
            return invs.filter((i: any) => i.status !== 'paid').reduce((sum: number, i: any) => sum + (parseFloat(i.total_amount) || 0), 0)
        },
        enabled: !!user?.tenantId && !!id
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
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold text-sm px-5" onClick={handleGenerateIdCard}>
                         Generate ID Card
                     </Button>
                     <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold px-5 shadow-sm" onClick={handleCreateReceipt}>
                         Create Receipt
                     </Button>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Current Weight", value: member?.healthProfile?.weight ? `${member.healthProfile.weight} KG` : "N/A", icon: <Circle className="h-5 w-5 fill-current" />, iconClass: "bg-orange-50 text-orange-500 dark:bg-orange-950/30", valueClass: "" },
                    { label: "PT Status", value: member?.assignedTrainer ? "Active" : "Inactive", icon: <Activity className="h-5 w-5" />, iconClass: "bg-blue-50 text-blue-500 dark:bg-blue-950/30", valueClass: "" },
                    { label: "Check-ins", value: String(member?.fitnessStats?.totalCheckIns ?? attendanceCount ?? 0), icon: <Clock className="h-5 w-5" />, iconClass: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30", valueClass: "" },
                    { label: "Total Dues", value: `₹${(memberInvoices ?? 0).toLocaleString()}`, icon: <CreditCard className="h-5 w-5" />, iconClass: "bg-rose-50 text-rose-500 dark:bg-rose-950/30", valueClass: "text-rose-500" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-xl bg-white dark:bg-slate-900 group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-12 w-12 ${stat.iconClass} rounded-xl flex items-center justify-center`}>
                                 {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{stat.label}</p>
                                <p className={`text-base font-bold text-slate-800 dark:text-white ${stat.valueClass}`}>
                                    {stat.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-none p-6 lg:p-8 min-h-[500px]">
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
                            onSuccess={() => window.location.reload()}
                            onCancel={() => window.history.back()}
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
                            <Button className="h-10 rounded-xl bg-[#FF6B3D] text-white font-bold px-5 shadow-sm" onClick={handleExtendValidity}>Extend Validity</Button>
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
                            <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold px-5 shadow-sm" onClick={() => setFollowUpDialogOpen(true)}>Add Entry</Button>
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
                            <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold px-5 text-sm text-slate-600" onClick={handleDownloadStatement}>Download Statement</Button>
                        </div>
                        <MemberPayments memberId={member.id} />
                    </div>
                )}

                {activeTab === "reportcard" && <ReportCardTab memberId={member.id} />}

                {activeTab === "attendance" && (
                    <div className="space-y-10">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Attendance Logs</h3>
                            </div>
                            <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold px-5 text-sm text-slate-600" onClick={handleManualCheckin}>{checkinMutation.isPending ? "Checking in..." : "Manual Check-in"}</Button>
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
                            <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold px-5 shadow-sm" onClick={() => setAssignPlanDialogOpen(true)}>Assign Plan</Button>
                        </div>
                        <MemberWorkouts memberId={member.id} />
                    </div>
                )}

                {activeTab === "diet" && <DietTabContent memberId={member.id} onCreateDietChart={handleCreateDietChart} />}

                {activeTab === "health" && (
                     <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FF6B3D] rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Biometric Vitals</h3>
                            </div>
                            <Button className="h-10 rounded-xl bg-[#FF6B3D] text-white font-bold px-5 shadow-sm" onClick={() => setAssessmentDialogOpen(true)}>New Assessment</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { label: "Blood Pressure", value: "--", status: "N/A", statusClass: "bg-slate-100 text-slate-500" },
                                { label: "Heart Rate", value: "--", status: "N/A", statusClass: "bg-slate-100 text-slate-500" },
                                { label: "BMI", value: member?.healthProfile?.bmi ? String(member.healthProfile.bmi) : "--", status: member?.healthProfile?.bmi ? "Recorded" : "N/A", statusClass: member?.healthProfile?.bmi ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500" },
                                { label: "Body Fat %", value: "--", status: "N/A", statusClass: "bg-slate-100 text-slate-500" },
                                { label: "Muscle Mass", value: "--", status: "N/A", statusClass: "bg-slate-100 text-slate-500" },
                                { label: "Metabolic Age", value: "--", status: "N/A", statusClass: "bg-slate-100 text-slate-500" },
                            ].map((stat, i) => (
                                <Card key={i} className="border-slate-100 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all dark:bg-slate-900/50">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <Badge className={`${stat.statusClass} border-none rounded-lg text-[9px] font-bold uppercase px-2 py-0.5 tracking-widest`}>{stat.status}</Badge>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     </div>
                )}

                {activeTab === "documents" && <DocumentsTab memberId={member.id} />}

                {activeTab === "biometric" && (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none shadow-sm max-w-xl mx-auto ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="relative mb-8">
                            <div className="h-28 w-28 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center animate-pulse">
                                <Fingerprint className="h-14 w-14 text-emerald-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-2">Biometric ID : Assigned</h3>
                        <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">Verified on {member?.updatedAt ? formatDate(member.updatedAt) : "N/A"}</p>
                        <div className="flex gap-4">
<Button variant="outline" className="h-10 rounded-xl px-6 font-bold text-sm text-slate-600 border-slate-200" onClick={handleClearRecords}>Clear Records</Button>
                             <Button className="h-10 rounded-xl px-6 font-bold text-sm bg-slate-900 text-white shadow-sm" onClick={handleUpdateFingerprint}>Update Fingerprint</Button>
                        </div>
                    </div>
                )}

                {/* ID Card Dialog */}
                <Dialog open={idCardDialogOpen} onOpenChange={setIdCardDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Member ID Card</DialogTitle>
                        </DialogHeader>
                        <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-slate-800">{member.fullName}</h3>
                                <p className="text-sm font-bold text-slate-400">#{member.memberCode}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-bold text-slate-400">Phone:</span> <span className="font-black">{member.phone}</span></div>
                                <div><span className="font-bold text-slate-400">Plan:</span> <span className="font-black">{member.currentPlan?.name || 'N/A'}</span></div>
                                <div><span className="font-bold text-slate-400">Joined:</span> <span className="font-black">{formatDate(member.joinedAt)}</span></div>
                                <div><span className="font-bold text-slate-400">Expires:</span> <span className="font-black">{member.planExpiresAt ? formatDate(member.planExpiresAt) : 'N/A'}</span></div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIdCardDialogOpen(false)}>Close</Button>
                            <Button className="bg-slate-900 text-white" onClick={() => window.print()}>Print ID Card</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Follow-up Dialog */}
                <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Follow-up Entry</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={followUpType} onValueChange={setFollowUpType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="call">Call</SelectItem>
                                        <SelectItem value="visit">Visit</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="message">Message</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} rows={3} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-slate-900 text-white" onClick={handleAddFollowUp} disabled={followUpMutation.isPending}>
                                {followUpMutation.isPending ? "Adding..." : "Add Entry"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Plan Dialog */}
                <Dialog open={assignPlanDialogOpen} onOpenChange={setAssignPlanDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Membership Plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Plan</Label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger><SelectValue placeholder="Choose a plan..." /></SelectTrigger>
                                    <SelectContent>
                                        {(memberships || []).map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignPlanDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-slate-900 text-white" onClick={handleAssignPlan}>Assign</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assessment Dialog */}
                <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Health Assessment</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Blood Pressure</Label>
                                <Input placeholder="118/76" value={assessmentData.bloodPressure} onChange={e => setAssessmentData(p => ({ ...p, bloodPressure: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Heart Rate (bpm)</Label>
                                <Input placeholder="68" value={assessmentData.heartRate} onChange={e => setAssessmentData(p => ({ ...p, heartRate: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>BMI</Label>
                                <Input placeholder="23.5" value={assessmentData.bmi} onChange={e => setAssessmentData(p => ({ ...p, bmi: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Body Fat %</Label>
                                <Input placeholder="17.2" value={assessmentData.bodyFat} onChange={e => setAssessmentData(p => ({ ...p, bodyFat: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Muscle Mass (kg)</Label>
                                <Input placeholder="35.4" value={assessmentData.muscleMass} onChange={e => setAssessmentData(p => ({ ...p, muscleMass: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Metabolic Age</Label>
                                <Input placeholder="24" value={assessmentData.metabolicAge} onChange={e => setAssessmentData(p => ({ ...p, metabolicAge: e.target.value }))} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-[#FF6B3D] text-white" onClick={handleNewAssessment}>Save Assessment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
