import React from "react"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { membersApi, memberWorkoutsApi } from "@/api/apiClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Calendar, User, AlignLeft } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"

export const MemberWorkouts: React.FC = () => {
    const { user } = useAuth()

    // 1. Fetch Member object to get the correct Member UUID
    const { data: member, isLoading: isMemberLoading } = useQuery({
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

    // 2. Fetch assigned Workouts using Member UUID
    const { data: workouts, isLoading: isWorkoutsLoading } = useQuery({
        queryKey: ["member-workouts", member?.id],
        queryFn: async () => {
            if (!member?.id) return []
            const response = await memberWorkoutsApi.list(member.id)
            if (response.error) {
                console.error("Error fetching member workouts:", response.error)
                return []
            }
            return response.data || []
        },
        enabled: !!member?.id
    })

    const isLoading = isMemberLoading || isWorkoutsLoading

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
                Profile not found. Cannot load workouts.
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
            <PageHeader title="My Workouts" />

            {(!workouts || workouts.length === 0) && (
                <div className="p-8 text-center text-muted-foreground border rounded-xl bg-slate-50">
                    <Dumbbell className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    No workouts assigned to you yet. Ask your trainer to add one!
                </div>
            )}

            <div className="space-y-4">
                {workouts?.map((item: any) => {
                    const workout = item.workout
                    const exercises = workout?.exercises ? (typeof workout.exercises === "string" ? JSON.parse(workout.exercises) : workout.exercises) : []

                    return (
                        <Card key={item.id} className="shadow-md border-indigo-100/50 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="h-5 w-5" />
                                        <CardTitle className="text-lg">{workout?.name || "Workout Routine"}</CardTitle>
                                    </div>
                                    {workout?.difficulty && (
                                        <Badge className="bg-white/20 text-white border-none capitalize">
                                            {workout.difficulty}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {workout?.description && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-2">
                                        <AlignLeft className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                        {workout.description}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Exercises List</h4>
                                    {exercises.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No exercises attached to this routine.</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100 border rounded-lg">
                                            {exercises.map((ex: any, idx: number) => (
                                                <div key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50/50">
                                                    <div>
                                                        <span className="text-xs font-bold text-indigo-500 mr-2">#{idx + 1}</span>
                                                        <span className="font-semibold text-sm text-slate-800">{ex.name || "Exercise"}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {ex.sets && <Badge variant="secondary" className="text-xs">{ex.sets} Sets</Badge>}
                                                        {ex.reps && <Badge variant="outline" className="text-xs">{ex.reps} Reps</Badge>}
                                                        {ex.weight && <Badge variant="outline" className="text-xs bg-slate-50">{ex.weight}</Badge>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" /> Assigned: {new Date(item.assignedAt).toLocaleDateString()}
                                    </span>
                                    {item.assignedBy && (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3.5 w-3.5" /> Coach ID: {item.assignedBy.substring(0, 8)}...
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
