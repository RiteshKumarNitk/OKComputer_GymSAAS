import React, { useMemo } from "react"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { membersApi } from "@/api/apiClient"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { generateQrCodeData, formatDate, calculateAge } from "@/lib/utils"
import { LogOut, Dumbbell, Clock } from "lucide-react"

export const MemberDashboard: React.FC = () => {
    const { user, signOut } = useAuth()

    // Fetch Member Details associated with the logged-in user
    const { data: member, isLoading } = useQuery({
        queryKey: ["my-profile", user?.id],
        queryFn: async () => {
            const tenantId = user?.tenant_id || ""
            const response = await membersApi.list(tenantId)
            if (response.error) {
                console.error("Error fetching member profile:", response.error)
                return null
            }
            return response.data && response.data.length > 0 ? response.data[0] : null
        },
        enabled: !!user?.id
    })

    const qrData = useMemo(() => {
        if (!member) return ""
        return generateQrCodeData(member.id, member.tenant_id || "")
    }, [member])

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
            <div className="flex flex-col items-center justify-center p-8 text-center h-[80vh]">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <LogOut className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Member Profile Not Found</h2>
                <p className="text-gray-500 mb-6">It seems your account hasn't been linked to a member profile yet. Please contact the front desk.</p>
                <Button onClick={() => signOut()}>Sign Out</Button>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Hi, {(member.full_name || "Member").split(" ")[0]}!</h1>
                    <p className="text-xs text-muted-foreground">{formatDate(new Date(), "EEEE, MMM d")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => signOut()}>
                    <LogOut className="h-5 w-5 text-gray-400" />
                </Button>
            </div>

            {/* Digital ID Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl p-6">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black opacity-10 rounded-full blur-xl"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl mb-4 shadow-sm">
                        <QRCodeSVG value={qrData} size={150} level="H" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold tracking-wide">{member.member_code}</h2>
                        <p className="text-indigo-200 text-xs">Scan at entrance</p>
                    </div>
                </div>
            </div>

            {/* Status & Plan */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50/50 border-green-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-green-600 font-semibold uppercase mb-1">Status</span>
                        <Badge className="bg-green-500 hover:bg-green-600">{member.status}</Badge>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-blue-600 font-semibold uppercase mb-1">Plan</span>
                        <span className="font-bold text-sm text-gray-800">{member.currentPlan?.name || "No Plan"}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Stats */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600">Your Activity</h3>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            <div className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                                <div className="bg-orange-100 p-2 rounded-full mr-3">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Next Expiry</p>
                                    <p className="text-xs text-muted-foreground">{member.plan_expires_at ? formatDate(member.plan_expires_at) : "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                                <div className="bg-pink-100 p-2 rounded-full mr-3">
                                    <Dumbbell className="h-4 w-4 text-pink-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Joined</p>
                                    <p className="text-xs text-muted-foreground">{calculateAge(member.joined_at)} years ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
