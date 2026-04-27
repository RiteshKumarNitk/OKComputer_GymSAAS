import React, { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { followUpsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import {
    Search,
    Calendar,
    Download,
    MoreVertical,
    RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export const FollowUpsPage: React.FC = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Filter State
    const [followType, setFollowType] = useState("All")
    const [convertibleType, setConvertibleType] = useState("All")
    const [status] = useState("All")
    const [allocate, setAllocate] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [dateFilter, setDateFilter] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Fetch Follow Ups
    const { data: followUps, isLoading } = useQuery({
        queryKey: ["follow-ups", user?.id],
        queryFn: async () => {
            const response = await followUpsApi.list(user?.tenant_id || "")
            if (response.error) throw response.error
            return response.data
        },
        enabled: !!user?.tenant_id,
    })

    // Filter Logic
    const filteredFollowUps = followUps?.filter((fu: any) => {
        const matchesSearch = (fu.lead?.fullName || fu.lead?.full_name || "ARUN KUMAR").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (fu.lead?.phone || "8107800370").includes(searchQuery)
        const matchesStatus = status === "All" || fu.status?.toLowerCase() === status.toLowerCase()
        const matchesType = followType === "All" || fu.type?.toLowerCase() === followType.toLowerCase()
        return matchesSearch && matchesStatus && matchesType
    }) || []

    // Pagination Logic
    const totalEntries = filteredFollowUps.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedFollowUps = filteredFollowUps.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

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

    const typeBadgeStyles = (type: string) => {
        return "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-xl px-4 py-1 font-bold text-[10px] capitalize";
    }

    const convertibilityStyles = (status: string) => {
        return "bg-rose-600 text-white hover:bg-rose-700 rounded-lg px-2 py-1 font-black text-[10px] uppercase";
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Follow Ups</h1>

            {/* Filters Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Select value={followType} onValueChange={setFollowType}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Follow Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="enquiry">Enquiry</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={convertibleType} onValueChange={setConvertibleType}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Convertible Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All types</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={status} disabled>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-slate-500">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={allocate} onValueChange={setAllocate}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-bold text-slate-500">
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
                        className="pl-10 h-11 rounded-xl border-slate-200"
                    />
                </div>

                <Button className="h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold px-8 shadow-lg shadow-orange-500/20">
                    Apply
                </Button>
            </div>

            <Button variant="outline" className="bg-orange-500/10 text-orange-600 border-none hover:bg-orange-500/20 rounded-xl px-8 font-bold h-11" onClick={() => {
                setFollowType("All"); setConvertibleType("All"); setAllocate("All"); setDateFilter("");
            }}>
                Clear
            </Button>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-slate-50 border-none"
                    />
                </div>
                <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 bg-white font-bold text-slate-500" onClick={() => {}}>
                    <Download className="mr-2 h-5 w-5" /> Generate XLS Report
                </Button>
            </div>

            <p className="text-xs font-bold text-slate-400">Total Follow Ups ({followUps?.length || 0})</p>

            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Follow Up Date & Time</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Follow Up Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Name & Number</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Allocate</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Scheduled By</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Convertibility Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Comment</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={9} className="h-16 bg-slate-50/30 mb-2 rounded-xl" />
                                </TableRow>
                             ))
                        ) : paginatedFollowUps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-slate-400 font-medium">
                                    No follow-ups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedFollowUps.map((fu: any) => (
                                <TableRow key={fu.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                                    <TableCell className="text-sm font-bold text-slate-600 py-6 px-4">
                                        {formatDate(fu.followUpDate)}
                                    </TableCell>
                                    <TableCell className="py-6 px-4 text-center">
                                        <Badge className={statusBadgeStyles(fu.status)}>
                                            {fu.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-6 px-4 text-center">
                                        <Badge className={typeBadgeStyles(fu.type)}>
                                            {fu.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-6 px-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 uppercase tracking-tight">{fu.lead?.fullName || "ARUN KUMAR"}</span>
                                            <span className="text-xs text-slate-500 font-medium">{fu.lead?.phone || "8107800370"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-700 py-6 px-4">sonu verma</TableCell>
                                    <TableCell className="text-sm font-bold text-slate-700 py-6 px-4">sonu verma</TableCell>
                                    <TableCell className="py-6 px-4 text-center">
                                        <Badge className={convertibilityStyles('hot')}>
                                            HOT
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400 max-w-[150px] truncate py-6 px-4">
                                        {fu.notes || "—"}
                                    </TableCell>
                                    <TableCell className="text-right py-6 px-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100">
                                                    <MoreVertical className="h-5 w-5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl shaodw-xl border-slate-200 p-2">
                                                <DropdownMenuItem className="rounded-xl px-4 py-2 font-bold text-slate-700">View Details</DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl px-4 py-2 font-bold text-emerald-600">Complete Follow Up</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination Integration */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                <div className="text-xs">
                    Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of <span className="text-slate-900">{totalEntries}</span> entries
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        Rows per page:
                        <Select value={rowsPerPage.toString()} onValueChange={(v) => {setRowsPerPage(parseInt(v)); setCurrentPage(1);}}>
                            <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map(n => (
                                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="text-xs font-bold rounded-lg px-3"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center">
                            {Array.from({length: Math.min(3, totalPages)}, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`h-8 w-8 text-xs font-bold rounded-lg ${currentPage === pageNum ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="text-xs font-bold rounded-lg px-3"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
