import React from "react"
import { useQuery } from "@tanstack/react-query"
import { attendanceApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Attendance } from "@/types"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export const AttendanceLog: React.FC = () => {
    const { user } = useAuth()
    const today = new Date().toISOString().split("T")[0]

    const { data: logs, isLoading } = useQuery({
        queryKey: ["attendance-log", today],
        queryFn: async () => {
            const response = await attendanceApi.list(user?.tenant_id || "")
            if (response.error) throw response.error
            
            // Client-side filter for today
            const filtered = response.data?.filter((log: any) => 
                (log.checkinAt || log.checkin_at || "").startsWith(today)
            ) || []
            
            return filtered as any[]
        },
        enabled: !!user?.tenant_id,
    })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Today's Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Activity ({logs?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Method</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            {new Date(log.checkinAt || log.checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">
                                                        {(log.member?.fullName || log.member?.full_name || "??").substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{log.member?.fullName || log.member?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.member?.memberCode || log.member?.member_code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                Checked In
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {(log.deviceInfo || log.device_info)?.type || "Manual"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No check-ins today
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
