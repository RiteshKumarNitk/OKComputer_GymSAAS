import React from "react"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { schedulesApi } from "@/api/apiClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User } from "lucide-react"

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export const MemberSchedule: React.FC = () => {
    const { user } = useAuth()

    const { data: schedules, isLoading } = useQuery({
        queryKey: ["schedules", user?.id],
        queryFn: async () => {
            const tenantId = (user as any)?.tenant_id || ""
            const response = await schedulesApi.list(tenantId)
            if (response.error) {
                console.error("Error fetching schedules:", response.error)
                return []
            }
            return response.data || []
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

    // Group schedules by dayOfWeek
    const groupedSchedules = schedules?.reduce((acc: any, schedule: any) => {
        const day = schedule.dayOfWeek ?? 1 // default to monday if undefined
        if (!acc[day]) acc[day] = []
        acc[day].push(schedule)
        return acc
    }, {})

    // Sort days from Sunday to Saturday (0 to 6)
    const sortedDays = Object.keys(groupedSchedules || {}).sort((a, b) => Number(a) - Number(b))

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold text-center">Class Schedule</h1>

            {(!schedules || schedules.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                    No schedules listed for your gym yet.
                </div>
            )}

            {sortedDays.map((dayKey) => {
                const daySchedules = groupedSchedules[dayKey]
                const dayName = DAYS_OF_WEEK[Number(dayKey)]

                return (
                    <div key={dayKey} className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-1">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            <h2 className="font-semibold text-lg">{dayName}</h2>
                            <Badge variant="outline" className="ml-2">
                                {daySchedules.length} {daySchedules.length === 1 ? "Class" : "Classes"}
                            </Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {daySchedules.map((item: any) => (
                                <Card key={item.id} className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-indigo-900">
                                                    {item.service?.name || "Unspecified Class"}
                                                </h3>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>
                                                        {item.startTime} • {item.durationMinutes} mins
                                                    </span>
                                                </div>
                                                {item.trainer && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                        <User className="h-3.5 w-3.5" />
                                                        <span>{item.trainer.fullName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {item.maxCapacity && (
                                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">
                                                    Capacity: {item.maxCapacity}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
