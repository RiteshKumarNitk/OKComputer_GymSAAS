import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { attendanceApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export const AttendanceHistory: React.FC = () => {
    const { user } = useAuth()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const { data: logs, isLoading } = useQuery({
        queryKey: ["attendance-history", selectedDate],
        queryFn: async () => {
            const response = await attendanceApi.list(user?.tenant_id || "", undefined, selectedDate)
            if (response.error) throw response.error
            return response.data || []
        },
        enabled: !!user?.tenant_id,
    })

    const filteredLogs = (logs || []).filter((log: any) => 
        (log.member?.fullName || log.member?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.member?.memberCode || log.member?.member_code || "").includes(searchQuery)
    )

    // Pagination Logic
    const totalEntries = filteredLogs.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Attendance History</CardTitle>
                        <CardDescription>View check-ins for a specific date</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search member..."
                                className="pl-8 w-[200px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Input
                            type="date"
                            className="w-[150px]"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Member Code</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLogs.length > 0 ? (
                                        paginatedLogs.map((log: any) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    {new Date(log.checkinAt || log.checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {log.member?.fullName || log.member?.full_name}
                                                </TableCell>
                                                <TableCell>
                                                    {log.member?.memberCode || log.member?.member_code}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline">Checked In</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No records found for this date.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                            <div className="text-xs">
                                Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of <span className="text-slate-900">{totalEntries}</span> entries
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    Rows per page:
                                    <select 
                                        className="bg-transparent font-bold text-slate-900 focus:outline-none" 
                                        value={rowsPerPage} 
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value)); 
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
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
                                                    className={`h-8 w-8 text-xs font-bold rounded-lg ${currentPage === pageNum ? 'bg-slate-900 text-white' : ''}`}
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
                )}
            </CardContent>
        </Card>
    )
}
