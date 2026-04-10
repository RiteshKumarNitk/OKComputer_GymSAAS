import React from "react"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { membersApi, memberDietsApi } from "@/api/apiClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Apple, Calendar, AlignLeft } from "lucide-react"

export const MemberDiets: React.FC = () => {
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

    // 2. Fetch assigned Diets using Member UUID
    const { data: diets, isLoading: isDietsLoading } = useQuery({
        queryKey: ["member-diets", member?.id],
        queryFn: async () => {
            if (!member?.id) return []
            const response = await memberDietsApi.list(member.id)
            if (response.error) {
                console.error("Error fetching member diets:", response.error)
                return []
            }
            return response.data || []
        },
        enabled: !!member?.id
    })

    const isLoading = isMemberLoading || isDietsLoading

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
                Profile not found. Cannot load diet plans.
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold text-center">Diet & Nutrition</h1>

            {(!diets || diets.length === 0) && (
                <div className="p-8 text-center text-muted-foreground border rounded-xl bg-slate-50">
                    <Apple className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    No diet plans assigned to you yet. Ask your nutritionist to add one!
                </div>
            )}

            <div className="space-y-4">
                {diets?.map((item: any) => {
                    const diet = item.dietPlan
                    const meals = diet?.meals ? (typeof diet.meals === "string" ? JSON.parse(diet.meals) : diet.meals) : []

                    return (
                        <Card key={item.id} className="shadow-md border-emerald-100/50 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Apple className="h-5 w-5" />
                                        <CardTitle className="text-lg">{diet?.name || "Diet Plan"}</CardTitle>
                                    </div>
                                    {diet?.targetCalories && (
                                        <Badge className="bg-white/20 text-white border-none">
                                            {diet.targetCalories} kcal
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {diet?.description && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-2">
                                        <AlignLeft className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                        {diet.description}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Daily Meals Timeline</h4>
                                    {meals.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No meals attached to this plan.</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100 border rounded-lg">
                                            {meals.map((meal: any, idx: number) => (
                                                <div key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50/50">
                                                    <div>
                                                        <span className="text-xs font-bold text-emerald-500 mr-2">Meal #{idx + 1}</span>
                                                        <span className="font-semibold text-sm text-slate-800">{meal.name || "Meal"}</span>
                                                        {meal.time && <span className="text-xs text-muted-foreground ml-2">({meal.time})</span>}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {meal.items && <Badge variant="secondary" className="text-xs">{meal.items}</Badge>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" /> Assigned: {new Date(item.assignedAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
