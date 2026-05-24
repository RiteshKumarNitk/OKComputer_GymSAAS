import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { attendanceApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/common"
import type { Column } from "@/components/common"
import { usePagination, Pagination } from "@/components/common"

export const AttendanceHistory: React.FC = () => {
    const { user } = useAuth()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [searchQuery, setSearchQuery] = useState("")

    const { data: logs, isLoading } = useQuery({
        queryKey: ["attendance-history", selectedDate],
        queryFn: async () => {
            const response = await attendanceApi.list(user?.tenantId || "", undefined, selectedDate)
            if (response.error) throw response.error
            return response.data || []
        },
        enabled: !!user?.tenantId,
    })

    const filteredLogs = (logs || []).filter((log: any) => 
        (log.member?.fullName || log.member?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.member?.memberCode || log.member?.member_code || "").includes(searchQuery)
    )

    const paginationHook = usePagination(filteredLogs, 10)

    const columns: Column<any>[] = [
        { key: "time", label: "Time", render: (log) => new Date(log.checkinAt || log.checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { key: "member", label: "Member", render: (log) => <span className="font-medium">{log.member?.fullName || log.member?.full_name}</span> },
        { key: "code", label: "Member Code", render: (log) => log.member?.memberCode || log.member?.member_code },
        { key: "action", label: "Action", headClassName: "text-right", render: () => <Badge variant="outline" className="float-right">Checked In</Badge> },
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Attendance History</CardTitle>
                        <CardDescription>View check-ins for a specific date</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search member..."
                            className="h-10 w-[200px] rounded-xl bg-slate-50 dark:bg-slate-900 border-none shadow-inner pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Input
                            type="date"
                            className="w-[150px] h-10 rounded-xl"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    loading={isLoading}
                    searchable={false}
                    pagination={false}
                    emptyMessage="No records found for this date."
                />
                {filteredLogs.length > 0 && (
                    <Pagination
                        currentPage={paginationHook.currentPage}
                        totalPages={paginationHook.totalPages}
                        totalEntries={paginationHook.totalEntries}
                        rowsPerPage={paginationHook.rowsPerPage}
                        showingFrom={paginationHook.showingFrom}
                        showingTo={paginationHook.showingTo}
                        onPageChange={paginationHook.setCurrentPage}
                        onRowsPerPageChange={paginationHook.setRowsPerPage}
                    />
                )}
            </CardContent>
        </Card>
    )
}
