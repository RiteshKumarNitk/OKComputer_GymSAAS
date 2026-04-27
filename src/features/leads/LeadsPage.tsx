import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { leadsApi, followUpsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { useNavigate } from "react-router-dom"
import {
    ArrowLeft,
    Search,
    Plus,
    MoreVertical,
    Phone,
    Mail,
    MessageCircle,
    Calendar,
    Download,
    FileSpreadsheet,
    Users,
    X,
    Filter,
    CheckCircle2,
    Clock,
    PhoneOff,
    Percent,
    Send,
    User,
    MapPin,
    Target,
    DollarSign,
    Layers,
    MessageSquare,
    ChevronDown,
    Save,
    RotateCcw,
    Smartphone,
    UserPlus,
    Ban
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    full_name?: string
    fullName?: string
    email: string | null
    phone: string
    status: 'new' | 'contacted' | 'trial' | 'converted' | 'lost'
    source: string
    notes: string | null
    created_at?: string
    createdAt?: string
    priority?: 'hot' | 'warm' | 'cold'
    gender?: string
}

export const LeadsPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    // UI State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Filter State
    const [handleBy, setHandleBy] = useState("All")
    const [leadType, setLeadType] = useState("All")
    const [trialBooked, setTrialBooked] = useState("All")
    const [gender, setGender] = useState("All")
    const [followUp, setFollowUp] = useState("All")
    const [dateFilter, setDateFilter] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    
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
        queryKey: ["leads", user?.tenant_id],
        queryFn: async () => {
            const response = await leadsApi.list(user?.tenant_id || "")
            if (response.error) throw response.error
            return response.data as Lead[]
        },
        enabled: !!user?.tenant_id,
    })

    // Add/Update Mutation
    const saveLeadMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (selectedLead) {
                const response = await leadsApi.update(selectedLead.id, payload)
                if (response.error) throw response.error
            } else {
                const response = await leadsApi.create(payload)
                if (response.error) throw response.error
                
                // If it's a new lead and follow-up is requested
                if (formData.addFollowUp && response.data?.id) {
                     const followUpDate = new Date()
                     followUpDate.setDate(followUpDate.getDate() + 3)
             
                     const followUpPayload = {
                       leadId: response.data.id,
                       type: 'enquiry',
                       priority: formData.leadType,
                       followUpDate: followUpDate.toISOString(),
                       notes: 'New enquiry follow-up',
                       status: 'pending'
                     }
                     await followUpsApi.create(followUpPayload)
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            setIsAddOpen(false)
            setSelectedLead(null)
            resetForm()
            toast({ title: "Success", description: `Enquiry ${selectedLead ? "updated" : "added"} successfully` })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
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

    // Delete Mutation
    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await leadsApi.delete(id)
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast({ title: "Success", description: "Lead deleted successfully" })
        },
    })


     const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        saveLeadMutation.mutate(formData)
    }

    const filteredLeads = leads?.filter(lead => {
        const matchesSearch = (lead.fullName || lead.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (lead.phone || "").includes(searchQuery)
        const matchesType = leadType === "All" || lead.priority?.toLowerCase() === leadType.toLowerCase()
        const matchesGender = gender === "All" || lead.gender?.toLowerCase() === gender.toLowerCase()
        // ... other filters can go here
        return matchesSearch && matchesType && matchesGender
    }) || []

    // Pagination Logic
    const totalEntries = filteredLeads.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)


    const statusColors: any = {
        new: "bg-blue-100 text-blue-800",
        contacted: "bg-yellow-100 text-yellow-800",
        trial: "bg-purple-100 text-purple-800",
        converted: "bg-green-100 text-green-800",
        lost: "bg-red-100 text-red-800"
    }

    const priorityColors: any = {
        hot: "bg-red-600 text-white hover:bg-red-700 h-6 px-2 rounded-lg text-[10px] font-black",
        warm: "bg-orange-500 text-white hover:bg-orange-600 h-6 px-2 rounded-lg text-[10px] font-black",
        cold: "bg-blue-500 text-white hover:bg-blue-600 h-6 px-2 rounded-lg text-[10px] font-black"
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Enquiry</h1>
                </div>
                <Button 
                    onClick={() => navigate("/enquiries/new")}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-bold h-11 shadow-lg shadow-orange-500/20"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add Enquiry
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-blue-600 border-none text-white shadow-xl shadow-blue-500/20 rounded-2xl relative overflow-hidden group transition-all hover:scale-[1.02]">
                    <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black">{openEnquiries}</p>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-90">Open Enquiry</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-emerald-500 group-hover:text-emerald-600 transition-colors">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{closedEnquiries}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Close Enquiry</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-rose-500 group-hover:text-rose-600 transition-colors">
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                                <X className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{notInterested}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Not Interested</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-orange-500 group-hover:text-orange-600 transition-colors">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <Phone className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{contactedCount}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-700 transition-colors">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <PhoneOff className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-700 dark:text-white">{notConnectedCount}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Not Connected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="w-fit bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl">
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
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Handle by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Staff</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={leadType} onValueChange={setLeadType}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 font-medium bg-white dark:bg-slate-900">
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
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Trial Booked" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 font-medium bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Gender</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={followUp} onValueChange={setFollowUp}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 font-medium bg-white dark:bg-slate-900">
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
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl px-8 font-bold h-11">Apply</Button>
                    <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl px-8 font-bold h-11" onClick={() => {
                        setHandleBy("All"); setLeadType("All"); setTrialBooked("All"); setGender("All"); setFollowUp("All"); setDateFilter("");
                    }}>Clear</Button>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t dark:border-slate-800">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-slate-100/50 dark:bg-slate-900 border-none shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {selectedLeads.length > 0 && (
                        <Button className="h-12 bg-slate-900 text-white hover:bg-black rounded-xl font-bold px-6 shadow-xl animate-in zoom-in-95">
                            <Send className="mr-2 h-4 w-4" /> Send SMS ({selectedLeads.length})
                        </Button>
                    )}
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-600">
                        <Download className="mr-2 h-5 w-5" /> Generate XLS Report
                    </Button>
                </div>
            </div>

            {/* List View Table */}
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                            <TableHead className="w-12 text-center">
                                <Checkbox 
                                    checked={selectedLeads.length === filteredLeads?.length && filteredLeads?.length > 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedLeads(filteredLeads?.map(l => l.id) || [])
                                        else setSelectedLeads([])
                                    }}
                                />
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Enquiry No.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Enquiry Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Name & Mob. No.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-center">Trial Booked</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Handle by</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-center">Lead Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Remark/Summary</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Created By</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={9} className="h-20 bg-slate-50/30 mb-2 rounded-xl" />
                                </TableRow>
                            ))
                        ) : paginatedLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-slate-400 font-medium font-bold">
                                    No enquiries found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLeads.map((lead) => (
                                <TableRow key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                                    <TableCell className="text-center">
                                        <Checkbox 
                                            checked={selectedLeads.includes(lead.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedLeads([...selectedLeads, lead.id])
                                                else setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-slate-500 py-6 px-4">{lead.id.split('-')[0].toUpperCase()}</TableCell>
                                    <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-300 py-6 px-4">
                                        {formatDate(lead.createdAt || lead.created_at)}
                                    </TableCell>
                                    <TableCell className="py-6 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{lead.fullName || lead.full_name}</span>
                                            <span className="text-xs text-slate-500 font-medium">+91 {lead.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-6 px-4">
                                        <Badge className={trialBadgeStyles(lead.status === 'trial')}>
                                            {lead.status === 'trial' ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-6 px-4">{lead.source === 'walk-in' ? 'Admin' : 'Online'}</TableCell>
                                    <TableCell className="text-center py-6 px-4">
                                        <Badge className={priorityColors[lead.priority || 'warm']}>
                                            {(lead.priority || 'warm').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400 max-w-[200px] truncate py-6 px-4">
                                        {lead.notes || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-6 px-4">{lead.source === 'walk-in' ? 'Admin' : 'Online'}</TableCell>
                                    <TableCell className="text-right py-6 px-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100">
                                                    <MoreVertical className="h-5 w-5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 p-2 min-w-[200px]">
                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                                    onClick={() => navigate('/members/add', { state: { prefill: lead } })}
                                                >
                                                    <Smartphone className="h-4 w-4 mr-3 text-emerald-500" /> Sale Enquiry
                                                </DropdownMenuItem>
                                                
                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                                    onClick={() => { setSelectedLead(lead); setIsAddOpen(true); }}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-3 text-blue-500" /> Edit Enquiry
                                                </DropdownMenuItem>

                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                                    onClick={() => saveLeadMutation.mutate({...lead, status: 'lost'})}
                                                >
                                                    <Ban className="h-4 w-4 mr-3 text-red-500" /> Not Interested
                                                </DropdownMenuItem>

                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                                    onClick={() => saveLeadMutation.mutate({...lead, status: 'contacted'})}
                                                >
                                                    <Phone className="h-4 w-4 mr-3 text-orange-500" /> Call Done
                                                </DropdownMenuItem>

                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                                    onClick={() => saveLeadMutation.mutate({...lead, status: 'new'})}
                                                >
                                                    <PhoneOff className="h-4 w-4 mr-3 text-slate-400" /> Call Not Connected
                                                </DropdownMenuItem>

                                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

                                                <DropdownMenuItem 
                                                    className="rounded-xl px-4 py-2.5 font-bold text-orange-600"
                                                    onClick={() => { setSelectedLead(lead); setFormData({...formData, addFollowUp: true}); setIsAddOpen(true); }}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-3" /> Schedule Follow Up
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Bottom Sticky Action Bar */}
            <div className="sticky bottom-6 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between z-30">
                <div className="flex items-center gap-4">
                    <Select>
                        <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Assign Trainer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            <SelectItem value="T1">Trainer 1</SelectItem>
                            <SelectItem value="T2">Trainer 2</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900">
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
                        className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-10 h-11 transition-all "
                    >
                        Submit
                    </Button>
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-slate-950 p-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-white">Add New Enquiry</h2>
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

                    <ScrollArea className="max-h-[85vh] p-8 bg-[#F8FAFC]">
                        <form onSubmit={handleFormSubmit} className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                 {/* LEFT COLUMN: Personal Info */}
                                 <div className="md:col-span-2 space-y-6">
                                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                                             <User className="h-4 w-4 text-orange-500" />
                                             <span className="text-xs font-black uppercase tracking-widest text-slate-400">Personal Details</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">First Name</label>
                                                 <Input 
                                                    className="rounded-xl h-11 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                    placeholder="Enter first name"
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                                                    required
                                                 />
                                             </div>
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Last Name</label>
                                                 <Input 
                                                    className="rounded-xl h-11 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                    placeholder="Enter last name"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                                                 />
                                             </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                                                 <div className="relative">
                                                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                     <Input 
                                                        className="rounded-xl h-11 pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                        placeholder="e.g. 9876543210"
                                                        value={formData.mobile}
                                                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                                                        required
                                                     />
                                                 </div>
                                             </div>
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                                                 <div className="relative">
                                                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                     <Input 
                                                        className="rounded-xl h-11 pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium"
                                                        placeholder="example@mail.com"
                                                        value={formData.email}
                                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                                     />
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="space-y-1.5">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Residential Address</label>
                                             <div className="relative">
                                                 <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                                                 <Textarea 
                                                    className="rounded-xl pl-10 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium min-h-[80px]"
                                                    placeholder="Enter complete address..."
                                                    value={formData.address}
                                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                                 />
                                             </div>
                                         </div>
                                     </div>

                                     <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                                             <Layers className="h-4 w-4 text-blue-500" />
                                             <span className="text-xs font-black uppercase tracking-widest text-slate-400">Services & Interest</span>
                                         </div>
                                         <div className="grid grid-cols-4 gap-2">
                                             {GYM_SERVICES.map(service => (
                                                 <button
                                                     key={service}
                                                     type="button"
                                                     onClick={() => handleServiceToggle(service)}
                                                     className={`py-2 px-3 rounded-xl text-[10px] font-black tracking-tight uppercase transition-all border ${
                                                         formData.services.includes(service)
                                                             ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                             : 'bg-slate-50/50 border-transparent text-slate-500 hover:border-slate-200'
                                                     }`}
                                                 >
                                                     {service}
                                                 </button>
                                             ))}
                                         </div>
                                         <div className="space-y-1.5 pt-2">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Enquiry Summary</label>
                                             <Textarea 
                                                className="rounded-xl bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-medium min-h-[100px]"
                                                placeholder="Add details about the conversation..."
                                                value={formData.remark}
                                                onChange={e => setFormData({...formData, remark: e.target.value})}
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 {/* RIGHT COLUMN: Status & Logic */}
                                 <div className="space-y-6">
                                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                         <div className="space-y-3 pb-4 border-b border-slate-50">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                               <Target className="h-3.5 w-3.5 text-rose-500" /> Lead Priority
                                             </label>
                                             <div className="grid grid-cols-3 gap-2">
                                               {['hot', 'warm', 'cold'].map(type => (
                                                 <button
                                                   key={type}
                                                   type="button"
                                                   onClick={() => setFormData({...formData, leadType: type as any})}
                                                   className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                     formData.leadType === type
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
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                               <User className="h-3.5 w-3.5 text-blue-500" /> Gender
                                             </label>
                                             <div className="flex gap-2">
                                               {['male', 'female'].map(g => (
                                                 <button
                                                   key={g}
                                                   type="button"
                                                   onClick={() => setFormData({...formData, gender: g})}
                                                   className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                     formData.gender === g ? 'bg-slate-900 text-white' : 'bg-slate-50 border-transparent text-slate-400'
                                                   }`}
                                                 >
                                                   {g}
                                                 </button>
                                               ))}
                                             </div>
                                         </div>

                                         <div className="space-y-3">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                               <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Estimated Budget
                                             </label>
                                             <div className="relative">
                                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                               <Input 
                                                 type="number" 
                                                 className="rounded-xl pl-8 h-11 bg-slate-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 font-black"
                                                 placeholder="0.00"
                                                 value={formData.budget}
                                                 onChange={e => setFormData({...formData, budget: e.target.value})}
                                               />
                                             </div>
                                         </div>
                                      </div>

                                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                          <div 
                                              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                                formData.bookTrial ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-transparent'
                                              }`}
                                              onClick={() => setFormData({...formData, bookTrial: !formData.bookTrial})}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`p-2 rounded-xl ${formData.bookTrial ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                      <Calendar className="h-4 w-4" />
                                                  </div>
                                                  <span className="text-xs font-black uppercase tracking-widest text-slate-800">Book Trial</span>
                                              </div>
                                              {formData.bookTrial && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
                                          </div>

                                          <div 
                                              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                                formData.addFollowUp ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50/50 border-transparent'
                                              }`}
                                              onClick={() => setFormData({...formData, addFollowUp: !formData.addFollowUp})}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`p-2 rounded-xl ${formData.addFollowUp ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                      <Clock className="h-4 w-4" />
                                                  </div>
                                                  <span className="text-xs font-black uppercase tracking-widest text-slate-800">Follow-Up</span>
                                              </div>
                                              {formData.addFollowUp && <CheckCircle2 className="h-5 w-5 text-orange-500" />}
                                          </div>

                                          <Button 
                                             block 
                                             className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 mt-4"
                                             disabled={saveLeadMutation.isPending}
                                          >
                                             {saveLeadMutation.isPending ? "Processing..." : "Save Enquiry"}
                                          </Button>
                                      </div>
                                 </div>
                             </div>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
