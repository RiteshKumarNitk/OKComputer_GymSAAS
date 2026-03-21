import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { membersApi, attendanceApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, XCircle, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface CheckInDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const CheckInDialog: React.FC<CheckInDialogProps> = ({ open, onOpenChange }) => {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")
    const [checkinStatus, setCheckinStatus] = useState<{
        success: boolean
        message: string
        member?: Member
    } | null>(null)

    // Search members
    const { data: searchResults } = useQuery({
        queryKey: ["members-search", searchQuery],
        queryFn: async () => {
            if (!searchQuery || searchQuery.length < 2) return []

            const response = await membersApi.list(user?.tenant_id || "", searchQuery)
            if (response.error) throw response.error
            return response.data as Member[]
        },
        enabled: searchQuery.length >= 2,
    })

    // Check-in mutation
    const checkinMutation = useMutation({
        mutationFn: async (member: Member) => {
            // Check if already checked in today
            const today = new Date().toISOString().split("T")[0]
            const checkResponse = await attendanceApi.list(user?.tenant_id || "", member.id, today)
            if (checkResponse.error) throw checkResponse.error
            const existing = checkResponse.data && checkResponse.data.length > 0

            if (existing) {
                throw new Error("Member already checked in today")
            }

            const response = await attendanceApi.checkin({
                memberId: member.id,
                checkinAt: new Date().toISOString(),
                deviceInfo: { type: "manual", by: user?.full_name },
            })

            if (response.error) throw response.error
            return member
        },
        onSuccess: (member) => {
            setCheckinStatus({
                success: true,
                message: `Successfully checked in ${member.full_name}`,
                member,
            })
            setSearchQuery("")
            queryClient.invalidateQueries({ queryKey: ["attendance-log"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            // Note: We don't close the dialog immediately so they can see success
        },
        onError: (error: any) => {
            setCheckinStatus({
                success: false,
                message: error.message || "Failed to check in",
            })
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Member Check-In</DialogTitle>
                    <DialogDescription>
                        Search for a member to check them in manually.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, code, or phone..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                if (e.target.value.length < 2) setCheckinStatus(null)
                            }}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    {/* Status Message */}
                    {checkinStatus && (
                        <div className={`p-3 rounded-md flex items-center space-x-2 text-sm ${checkinStatus.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {checkinStatus.success ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <span className="font-medium">{checkinStatus.message}</span>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchQuery.length >= 2 && searchResults && (
                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No members found
                                </div>
                            ) : (
                                searchResults.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{member.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{member.member_code}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                                                {member.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                onClick={() => checkinMutation.mutate(member)}
                                                disabled={checkinMutation.isPending || member.status !== "active"}
                                            >
                                                Check In
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
