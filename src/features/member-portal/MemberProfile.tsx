import React from "react"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { membersApi } from "@/api/apiClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Phone, User, Calendar, Award } from "lucide-react"

export const MemberProfile: React.FC = () => {
    const { user } = useAuth()

    const { data: member, isLoading } = useQuery({
        queryKey: ["my-profile", user?.id],
        queryFn: async () => {
            const tenantId = (user as any)?.tenantId || ""
            const response = await membersApi.list(tenantId)
            if (response.error) {
                console.error("Error fetching member profile:", response.error)
                return null
            }
            return response.data && response.data.length > 0 ? response.data[0] : null
        },
        enabled: !!user?.id
    })

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    if (!member) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Profile not found.
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-center">Profile</h1>

            <Card className="shadow-lg border-primary/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{member.fullName}</CardTitle>
                            <p className="text-xs opacity-80">{member.memberCode}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-indigo-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Mobile Number</p>
                            <p className="text-sm font-semibold">{member.phone || "N/A"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-purple-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Current Plan</p>
                            <p className="text-sm font-semibold">{member.currentPlan?.name || "No Plan"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Plan Expiry (Last Date)</p>
                            <p className="text-sm font-semibold">
                                {member.planExpiresAt ? formatDate(member.planExpiresAt) : "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Joined At</p>
                            <p className="text-sm font-semibold">
                                {member.joinedAt ? formatDate(member.joinedAt) : "N/A"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
