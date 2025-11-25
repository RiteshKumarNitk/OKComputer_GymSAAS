import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, CheckCircle, XCircle, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const ManualCheckin: React.FC = () => {
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

            const { data, error } = await supabase
                .from("members")
                .select("*, memberships(name, is_active)")
                .eq("tenant_id", user?.tenant_id)
                .or(`full_name.ilike.%${searchQuery}%,member_code.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(5)

            if (error) throw error
            return data as Member[]
        },
        enabled: searchQuery.length >= 2,
    })

    // Check-in mutation
    const checkinMutation = useMutation({
        mutationFn: async (member: Member) => {
            // Check if already checked in today
            const today = new Date().toISOString().split("T")[0]
            const { data: existing } = await supabase
                .from("attendance")
                .select("*")
                .eq("member_id", member.id)
                .gte("checkin_at", `${today}T00:00:00`)
                .lt("checkin_at", `${today}T23:59:59`)
                .maybeSingle()

            if (existing) {
                throw new Error("Member already checked in today")
            }

            const { error } = await supabase
                .from("attendance")
                .insert({
                    tenant_id: user?.tenant_id,
                    member_id: member.id,
                    checkin_at: new Date().toISOString(),
                    device_info: { type: "manual", by: user?.full_name },
                })

            if (error) throw error
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

            // Clear status after 3 seconds
            setTimeout(() => setCheckinStatus(null), 3000)
        },
        onError: (error: any) => {
            setCheckinStatus({
                success: false,
                message: error.message || "Failed to check in",
            })
        },
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manual Check-in</CardTitle>
                <CardDescription>Search for a member to check them in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, code, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && searchResults && (
                    <div className="border rounded-md divide-y">
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
                                    <div className="flex items-center space-x-3">
                                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
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

                {/* Status Message */}
                {checkinStatus && (
                    <div className={`p-4 rounded-md flex items-center space-x-2 ${checkinStatus.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                        {checkinStatus.success ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium">{checkinStatus.message}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
