import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { leadsApi, followUpsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { useNavigate } from "react-router-dom"
import {
    Plus,
    Phone,
    Mail,
    Calendar,
    Download,
    Users,
    X,
    CheckCircle2,
    PhoneOff,
    Percent,
    Send,
    User,
    MapPin,
    Target,
    DollarSign,
    Layers,
    RotateCcw,
    Smartphone,
    UserPlus,
    Ban,
    Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchBar, ActionMenu, CategoryStatsGrid, DataTable } from "@/components/common"
import { LeadGeneratorDialog } from "./LeadGeneratorDialog"
import type { Column } from "@/components/common"
import { exportToCSV } from "@/lib/utils"

const GYM_SERVICES = [
    "General", "Massage", "Kick Boxing", "Fitness Workout",
    "Personal Training", "Yoga", "Zumba", "Aerobics"
]

const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export interface Lead {
    id: string
    fullName?: string
    email: string | null
    phone: string
    status: 'new' | 'contacted' | 'trial' | 'converted' | 'lost'
    source: string
    notes: string | null
    createdAt?: string
    priority?: 'hot' | 'warm' | 'cold'
    gender?: string
}

export const LeadsPage: React.FC = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    // UI State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Filter State
    const [handleBy, setHandleBy] = useState("All")
    const [leadType, setLeadType] = useState("All")
    const [trialBooked, setTrialBooked] = useState("All")
    const [gender, setGender] = useState("All")
    const [followUp, setFollowUp] = useState("All")
    const [dateFilter, setDateFilter] = useState("")

    // Selection state for batch actions
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])

    // New Enquiry Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        gender: "male",
        leadType: "warm",
        budget: "",
        address: "",
        remark: "",
        services: [] as string[],
        bookTrial: false,
        addFollowUp: true
    })

    // Fetch Leads
    const { data: leads, isLoading } = useQuery({
        queryKey: ["leads", user?.tenantId],
        queryFn: async () => {
            const response = await leadsApi.list(user?.tenantId || "")
            if (response.error) throw response.error
            return response.data as Lead[]
        },
        enabled: !!user?.tenantId,
    })

    // Add/Update Mutation
    const saveLeadMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (selectedLead) {
                const response = await leadsApi.update(selectedLead.id, formData)
                if (response.error) throw response.error
                return response.data
            } else {
                const response = await leadsApi.create(formData)
                if (response.error) throw response.error

                // If follow-up is requested
                if (formData.addFollowUp && response.data?.id) {
                    const followUpDate = new Date()
                    followUpDate.setDate(followUpDate.getDate() + 3)

                    const followUpPayload = {
                        leadId: response.data.id,
                        type: 'enquiry',
                        priority: formData.leadType || 'warm',
                        followUpDate: followUpDate.toISOString(),
                        notes: 'New enquiry follow-up',
                        status: 'pending'
                    }
                    await followUpsApi.create(followUpPayload)
                }
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            setIsAddOpen(false)
            setSelectedLead(null)
            resetForm()
            // toast({ title: "Success", description: `Enquiry ${selectedLead ? "updated" : "added"} successfully` })
        },
        onError: (error: any) => {
            // toast({ title: "Error", description: error.message, variant: "destructive" })
            console.error("Mutation error:", error)
        }
    })

    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            mobile: "",
            email: "",
            gender: "male",
            leadType: "warm",
            budget: "",
            address: "",
            remark: "",
            services: [] as string[],
            bookTrial: false,
            addFollowUp: true
        })
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.mobile,
            email: formData.email,
            gender: formData.gender,
            priority: formData.leadType,
            budget: parseFloat(formData.budget) || 0,
            address: formData.address,
            notes: formData.remark,
            services: formData.services,
            source: 'walk-in',
            status: 'new'
        }
        saveLeadMutation.mutate(payload)
    }

    const handleServiceToggle = (service: string) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }))
    }

    const filteredLeads = leads?.filter(lead => {
        const matchesSearch = (lead.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.phone || "").includes(searchQuery)
        const matchesType = leadType === "All" || lead.priority?.toLowerCase() === leadType.toLowerCase()
        const matchesGender = gender === "All" || lead.gender?.toLowerCase() === gender.toLowerCase()
        // ... other filters can go here
        return matchesSearch && matchesType && matchesGender
    }) || []

    const priorityColors: any = {
        hot: "bg-red-600 text-white hover:bg-red-700 h-6 px-2 rounded-lg text-[10px] font-bold",
        warm: "bg-orange-500 text-white hover:bg-orange-600 h-6 px-2 rounded-lg text-[10px] font-bold",
        cold: "bg-blue-500 text-white hover:bg-blue-600 h-6 px-2 rounded-lg text-[10px] font-bold"
    }

    const trialBadgeStyles = (booked: boolean) => booked
        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 h-8 px-4 rounded-xl text-xs font-bold"
        : "bg-rose-600 text-white border-rose-700 hover:bg-rose-700 h-8 px-4 rounded-xl text-xs font-bold"

    // Dynamic Stats Calculation
    const openEnquiries = leads?.filter(l => l.status === 'new' || l.status === 'contacted' || l.status === 'trial').length || 0
    const closedEnquiries = leads?.filter(l => l.status === 'converted').length || 0
    const notInterested = leads?.filter(l => l.status === 'lost').length || 0
    const contactedCount = leads?.filter(l => l.status === 'contacted').length || 0
    const notConnectedCount = leads?.filter(l => l.status === 'new').length || 0 // Assuming 'new' is not yet connected

    const statCategories = [
        { label: 'Open Enquiry', count: openEnquiries, icon: <Users className="h-6 w-6" /> },
        { label: 'Close Enquiry', count: closedEnquiries, icon: <CheckCircle2 className="h-6 w-6" /> },
        { label: 'Not Interested', count: notInterested, icon: <X className="h-6 w-6" /> },
        { label: 'Call Done', count: contactedCount, icon: <Phone className="h-6 w-6" /> },
        { label: 'Call Not Connected', count: notConnectedCount, icon: <PhoneOff className="h-6 w-6" /> },
    ]

    const exportSelected = () => {
        const csvData = selectedLeads.map(id => {
            const lead = filteredLeads.find((l: Lead) => l.id === id)
            return {
                "Name": lead?.fullName || "",
                "Phone": lead?.phone || "",
                "Email": lead?.email || "",
                "Status": lead?.status || "",
                "Source": lead?.source || ""
            }
        })
        exportToCSV(csvData, "selected-leads")
    }

    const exportAll = () => {
        if (!filteredLeads || filteredLeads.length === 0) return
        const csvData = filteredLeads.map((lead: Lead) => ({
            "Name": lead.fullName || "",
            "Phone": lead.phone || "",
            "Email": lead.email || "",
            "Status": lead.status || "",
            "Source": lead.source || "",
            "Notes": (lead.notes || "").replace(/"/g, '""'),
            "Date": lead.createdAt ? formatDate(lead.createdAt) : ""
        }))
        exportToCSV(csvData, `leads-${new Date().toISOString().split("T")[0]}`)
    }

    const columns: Column<Lead>[] = [
        {
            key: "select",
            label: "",
            render: (lead) => (
                <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => {
                        if (checked) setSelectedLeads([...selectedLeads, lead.id])
                        else setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                    }}
                />
            ),
            className: "w-12 text-center",
            headClassName: "w-12 text-center",
        },
        {
            key: "enquiryNo",
            label: "Enquiry No.",
            render: (lead) => <span className="font-mono text-sm text-slate-500">{lead.id.split('-')[0].toUpperCase()}</span>,
        },
        {
            key: "enquiryDate",
            label: "Enquiry Date",
            render: (lead) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatDate(lead.createdAt)}</span>,
        },
        {
            key: "nameMobile",
            label: "Name & Mob. No.",
            render: (lead) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{lead.fullName}</span>
                    <span className="text-xs text-slate-500 font-medium">+91 {lead.phone}</span>
                </div>
            ),
        },
        {
            key: "trialBooked",
            label: "Trial Booked",
            render: (lead) => (
                <Badge className={trialBadgeStyles(lead.status === 'trial')}>
                    {lead.status === 'trial' ? "Yes" : "No"}
                </Badge>
            ),
            className: "text-center",
            headClassName: "text-center",
        },
        {
            key: "handleBy",
            label: "Handle by",
            render: (lead) => <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.source === 'walk-in' ? 'Admin' : 'Online'}</span>,
        },
        {
            key: "leadType",
            label: "Lead Type",
            render: (lead) => (
                <Badge className={priorityColors[lead.priority || 'warm']}>
                    {(lead.priority || 'warm').toUpperCase()}
                </Badge>
            ),
            className: "text-center",
            headClassName: "text-center",
        },
        {
            key: "remark",
            label: "Remark/Summary",
            render: (lead) => <span className="text-xs text-slate-400 max-w-[200px] truncate">{lead.notes || "—"}</span>,
        },
        {
            key: "createdBy",
            label: "Created By",
            render: (lead) => <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.source === 'walk-in' ? 'Admin' : 'Online'}</span>,
        },
        {
            key: "action",
            label: "",
            render: (lead) => (
                <ActionMenu
                    options={[
                        { label: "Sale Enquiry", icon: <Smartphone className="h-4 w-4 mr-3 text-emerald-500" />, onClick: () => navigate('/members/add', { state: { prefill: lead } }) },
                        { label: "Edit Enquiry", icon: <UserPlus className="h-4 w-4 mr-3 text-blue-500" />, onClick: () => { setSelectedLead(lead); setIsAddOpen(true); } },
                        { label: "Not Interested", icon: <Ban className="h-4 w-4 mr-3 text-red-500" />, onClick: () => saveLeadMutation.mutate({ ...lead, status: 'lost' }) },
                        { label: "Call Done", icon: <Phone className="h-4 w-4 mr-3 text-orange-500" />, onClick: () => saveLeadMutation.mutate({ ...lead, status: 'contacted' }) },
                        { label: "Call Not Connected", icon: <PhoneOff className="h-4 w-4 mr-3 text-slate-400" />, onClick: () => saveLeadMutation.mutate({ ...lead, status: 'new' }) },
                        { label: "Schedule Follow Up", icon: <RotateCcw className="h-4 w-4 mr-3" />, onClick: () => { setSelectedLead(lead); setFormData({ ...formData, addFollowUp: true }); setIsAddOpen(true); } },
                    ]}
                />
            ),
            headClassName: "text-right",
            className: "text-right",
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Enquiry</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsGeneratorOpen(true)}
                        variant="outline"
                        className="px-5 rounded-xl font-bold h-10 border-emerald-500 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                    >
                        <Sparkles className="mr-2 h-4 w-4" /> Generate Leads
                    </Button>
                    <Button
                        onClick={() => navigate("/enquiries/new")}
                        variant="brand"
                        className="px-6 rounded-xl font-bold h-10 shadow-sm shadow-orange-500/20"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add Enquiry
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <CategoryStatsGrid items={statCategories} />

            <Card className="w-fit bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Percent className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Enquiry Ratio: {leads?.length ? ((closedEnquiries / leads.length) * 100).toFixed(1) : 0}%</span>
                </CardContent>
            </Card>

            {/* Filters Section */}
            <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Select value={handleBy} onValueChange={setHandleBy}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Handle by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Staff</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={leadType} onValueChange={setLeadType}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Lead Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="hot">🔥 Hot</SelectItem>
                            <SelectItem value="warm">⚡ Warm</SelectItem>
                            <SelectItem value="cold">❄️ Cold</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={trialBooked} onValueChange={setTrialBooked}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Trial Booked" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Gender</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={followUp} onValueChange={setFollowUp}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-10 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Follow up" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">Follow up</SelectItem>
                            <SelectItem value="Today">Today</SelectItem>
                            <SelectItem value="Missed">Missed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="dd/mm/yyyy"
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="brand" className="rounded-xl px-5 font-bold h-10" onClick={() => {}}>Apply</Button>
                    <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl px-5 font-bold h-10" onClick={() => {
                        setHandleBy("All"); setLeadType("All"); setTrialBooked("All"); setGender("All"); setFollowUp("All"); setDateFilter("");
                    }}>Clear</Button>
                </div>
            </div>

    {/* Action Bar */ }
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t dark:border-slate-800">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search" />
        <div className="flex items-center gap-2">
            {selectedLeads.length > 0 && (
                <Button className="h-10 bg-slate-900 text-white hover:bg-black rounded-xl font-bold px-6 shadow-md animate-in zoom-in-95" onClick={exportSelected}>
                    <Send className="mr-2 h-4 w-4" /> Export ({selectedLeads.length})
                </Button>
            )}
            <Button variant="outline" className="h-10 px-6 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-600" onClick={exportAll}>
                <Download className="mr-2 h-5 w-5" /> Generate XLS Report
            </Button>
        </div>
    </div>

    {/* List View Table */ }
    <div className="pt-2">
        <div className="flex items-center gap-3 pb-2">
            <Checkbox 
                checked={selectedLeads.length === filteredLeads?.length && (filteredLeads?.length ?? 0) > 0}
                onCheckedChange={(checked) => {
                    if (checked) setSelectedLeads(filteredLeads?.map(l => l.id) || [])
                    else setSelectedLeads([])
                }}
            />
            <span className="text-xs font-bold text-slate-500">Select all</span>
        </div>
        <DataTable
            columns={columns}
            data={filteredLeads}
            loading={isLoading}
            searchable={false}
            emptyMessage="No enquiries found."
        />
    </div>

            {/* Bottom Sticky Action Bar */}
            <div className="sticky bottom-6 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl flex items-center justify-between z-30">
                <div className="flex items-center gap-4">
                    <Select>
                        <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-slate-800 h-10 bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Assign Trainer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            <SelectItem value="T1">Trainer 1</SelectItem>
                            <SelectItem value="T2">Trainer 2</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-slate-800 h-10 bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="whatsapp">Send Welcome WhatsApp</SelectItem>
                            <SelectItem value="sms">Send Welcome SMS</SelectItem>
                            <SelectItem value="email">Send Welcome Email</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500">{selectedLeads.length} Selected</span>
                    <Button 
                        disabled={selectedLeads.length === 0}
                        className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 h-10 transition-all "
                        onClick={exportSelected}
                    >
                        Export Selected
                    </Button>
                </div>
            </div>

            <LeadGeneratorDialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen} />

            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-xl border-none shadow-2xl">
                    <div className="bg-slate-950 p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Add New Enquiry</h2>
                            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Registration & Lead Management</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAddOpen(false)}
                            className="rounded-full h-10 w-10 text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <ScrollArea className="max-h-[85vh] p-6 bg-[#F8FAFC]">
                        <form onSubmit={handleFormSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* LEFT COLUMN: Personal Info */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                                            <User className="h-4 w-4 text-orange-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Details</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                                                <Input
                                                    className="rounded-xl h-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                    placeholder="Enter first name"
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                                                <Input
                                                    className="rounded-xl h-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                    placeholder="Enter last name"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                    <Input
                                                        className="rounded-xl h-10 pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                        placeholder="e.g. 9876543210"
                                                        value={formData.mobile}
                                                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                    <Input
                                                        className="rounded-xl h-10 pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                        placeholder="example@mail.com"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                                                <Textarea
                                                    className="rounded-xl pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium min-h-[80px]"
                                                    placeholder="Enter complete address..."
                                                    value={formData.address}
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                                            <Layers className="h-4 w-4 text-blue-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Services & Interest</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {GYM_SERVICES.map(service => (
                                                <button
                                                    key={service}
                                                    type="button"
                                                    onClick={() => handleServiceToggle(service)}
                                                    className={`py-2 px-3 rounded-xl text-[10px] font-bold tracking-tight uppercase transition-all border ${formData.services.includes(service)
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                            : 'bg-slate-50/50 border-transparent text-slate-500 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {service}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enquiry Summary</label>
                                            <Textarea
                                                className="rounded-xl bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium min-h-[100px]"
                                                placeholder="Add details about the conversation..."
                                                value={formData.remark}
                                                onChange={e => setFormData({ ...formData, remark: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Status & Logic */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                                        <div className="space-y-3 pb-4 border-b border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Target className="h-3.5 w-3.5 text-rose-500" /> Lead Priority
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['hot', 'warm', 'cold'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, leadType: type as any })}
                                                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${formData.leadType === type
                                                                ? type === 'hot' ? 'bg-rose-600 border-rose-600 text-white' : type === 'warm' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                                                                : 'bg-slate-50 border-transparent text-slate-400'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pb-4 border-b border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-blue-500" /> Gender
                                            </label>
                                            <div className="flex gap-2">
                                                {['male', 'female'].map(g => (
                                                    <button
                                                        key={g}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, gender: g })}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${formData.gender === g ? 'bg-slate-900 text-white' : 'bg-slate-50 border-transparent text-slate-400'
                                                            }`}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Estimated Budget
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <Input
                                                    type="number"
                                                    className="pl-10 rounded-xl h-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                    placeholder="0"
                                                    value={formData.budget}
                                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }} className="rounded-xl h-11 px-6 border-slate-200 font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="brand" className="rounded-xl h-11 px-8 font-bold" disabled={saveLeadMutation.isPending}>
                                    {saveLeadMutation.isPending ? "Saving..." : selectedLead ? "Update Enquiry" : "Save Enquiry"}
                                </Button>
                            </div>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
