import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { followUpsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SearchBar, ActionMenu, DataTable } from "@/components/common"
import type { Column } from "@/components/common"
import { exportToCSV } from "@/lib/utils"

export const FollowUpsPage: React.FC = () => {
    const { user } = useAuth()

    // Filter State
    const [followType, setFollowType] = useState("All")
    const [convertibleType, setConvertibleType] = useState("All")
    const [status] = useState("All")
    const [allocate, setAllocate] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [dateFilter, setDateFilter] = useState("")

    // Fetch Follow Ups
    const { data: followUps, isLoading } = useQuery({
        queryKey: ["follow-ups", user?.id],
        queryFn: async () => {
            const response = await followUpsApi.list(user?.tenantId || "")
            if (response.error) throw response.error
            return response.data
        },
        enabled: !!user?.tenantId,
    })

    // Filter Logic
    const filteredFollowUps = followUps?.filter((fu: any) => {
        const matchesSearch = (fu.lead?.fullName || fu.lead?.full_name || "ARUN KUMAR").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (fu.lead?.phone || "8107800370").includes(searchQuery)
        const matchesStatus = status === "All" || fu.status?.toLowerCase() === status.toLowerCase()
        const matchesType = followType === "All" || fu.type?.toLowerCase() === followType.toLowerCase()
        return matchesSearch && matchesStatus && matchesType
    }) || []

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) + " " + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    const statusBadgeStyles = (status: string) => {
        switch(status.toLowerCase()) {
            case 'pending': return "bg-orange-500 text-white hover:bg-orange-600 rounded-xl px-4 py-1 font-bold text-[10px] uppercase";
            case 'completed': return "bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4 py-1 font-bold text-[10px] uppercase";
            default: return "bg-slate-500 text-white rounded-xl px-4 py-1 font-bold text-[10px] uppercase";
        }
    }

    const typeBadgeStyles = (_type: string) => {
        return "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-xl px-4 py-1 font-bold text-[10px] capitalize";
    }

    const convertibilityStyles = (_status: string) => {
        return "bg-rose-600 text-white hover:bg-rose-700 rounded-lg px-2 py-1 font-bold text-[10px] uppercase";
    }

    const exportFollowUps = () => {
        if (!followUps || followUps.length === 0) return
        const csvData = followUps.map((item: any) => ({
            "Name": item.lead?.fullName || item.lead?.firstName || item.member?.fullName || "N/A",
            "Phone": item.lead?.phone || item.member?.phone || "N/A",
            "Type": item.type || "",
            "Date": item.followUpDate ? new Date(item.followUpDate).toLocaleString() : "",
            "Priority": item.priority || "warm",
            "Notes": (item.notes || item.todo || "").replace(/"/g, '""')
        }))
        exportToCSV(csvData, `follow-ups-${new Date().toISOString().split("T")[0]}`)
    }

    const columns: Column<any>[] = [
        {
            key: "followUpDate",
            label: "Follow Up Date & Time",
            render: (fu) => <span className="text-sm font-bold text-slate-600">{formatDate(fu.followUpDate)}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (fu) => <Badge className={statusBadgeStyles(fu.status)}>{fu.status}</Badge>,
            className: "text-center",
            headClassName: "text-center",
        },
        {
            key: "type",
            label: "Follow Up Type",
            render: (fu) => <Badge className={typeBadgeStyles(fu.type)}>{fu.type}</Badge>,
            className: "text-center",
            headClassName: "text-center",
        },
        {
            key: "nameNumber",
            label: "Name & Number",
            render: (fu) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 uppercase tracking-tight">{fu.lead?.fullName || "ARUN KUMAR"}</span>
                    <span className="text-xs text-slate-500 font-medium">{fu.lead?.phone || "8107800370"}</span>
                </div>
            ),
        },
        {
            key: "allocate",
            label: "Allocate",
            render: () => <span className="text-sm font-bold text-slate-700">sonu verma</span>,
        },
        {
            key: "scheduledBy",
            label: "Scheduled By",
            render: () => <span className="text-sm font-bold text-slate-700">sonu verma</span>,
        },
        {
            key: "scheduledBy",
            label: "Scheduled By",
            render: () => <span className="text-sm font-bold text-slate-700">sonu verma</span>,
        },
        {
            key: "convertibility",
            label: "Convertibility Status",
            render: () => <Badge className={convertibilityStyles('hot')}>HOT</Badge>,
            className: "text-center",
            headClassName: "text-center",
        },
        {
            key: "comment",
            label: "Comment",
            render: (fu) => <span className="text-xs text-slate-400 max-w-[150px] truncate">{fu.notes || "—"}</span>,
        },
        {
            key: "action",
            label: "",
            render: (_fu) => (
                <ActionMenu
                    options={[
                        { label: "View Details", onClick: () => {} },
                        { label: "Complete Follow Up", onClick: () => {} }
                    ]}
                />
            ),
            headClassName: "text-right",
            className: "text-right",
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Follow Ups</h1>

            {/* Filters Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Select value={followType} onValueChange={setFollowType}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Follow Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="enquiry">Enquiry</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={convertibleType} onValueChange={setConvertibleType}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Convertible Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All types</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={status} disabled>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={allocate} onValueChange={setAllocate}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Select Allocate" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="All">All Users</SelectItem>
                         <SelectItem value="me">Allocate To Me</SelectItem>
                    </SelectContent>
                </Select>

                <div className="relative col-span-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="dd/mm/yyyy" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-slate-200"
                    />
                </div>

                <Button variant="brand" className="h-10 rounded-xl font-bold px-5 shadow-sm shadow-orange-500/20" onClick={() => {}}>
                    Apply
                </Button>
            </div>

            <Button variant="outline" className="bg-orange-500/10 text-orange-600 border-none hover:bg-orange-500/20 rounded-xl px-5 font-bold h-10" onClick={() => {
                setFollowType("All"); setConvertibleType("All"); setAllocate("All"); setDateFilter("");
            }}>
                Clear
            </Button>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <SearchBar 
                    value={searchQuery} 
                    onChange={setSearchQuery} 
                    placeholder="Search" 
                />
                <Button variant="outline" className="h-10 px-6 rounded-xl border-slate-200 bg-white font-bold text-slate-500" onClick={exportFollowUps}>
                    <Download className="mr-2 h-5 w-5" /> Generate XLS Report
                </Button>
            </div>

            <p className="text-xs font-bold text-slate-400">Total Follow Ups ({followUps?.length || 0})</p>

            <DataTable
                columns={columns}
                data={filteredFollowUps}
                loading={isLoading}
                searchable={false}
                emptyMessage="No follow-ups found."
            />
        </div>
    )
}
