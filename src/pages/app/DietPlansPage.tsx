import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { dietPlansApi, memberDietsApi, membersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, UserPlus, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Member } from "@/types"
import { PageHeader } from "@/components/common"

interface Meal {
  name: string
  time: string
  items: string
  calories: string
}

interface DietPlan {
  id: string
  name: string
  description: string
  targetCalories: number
  meals: Meal[]
}

export const DietPlansPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // UI States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedDiet, setSelectedDiet] = useState<DietPlan | null>(null)

  // Form States
  const [meals, setMeals] = useState<Meal[]>([{ name: "Breakfast", time: "08:00", items: "", calories: "" }])

  // Fetch Diet Plans
  const { data: plans } = useQuery({
    queryKey: ["diet_plans", user?.tenantId],
    queryFn: async () => {
      const response = await dietPlansApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as DietPlan[]
    },
    enabled: !!user?.tenantId
  })

  // Fetch Members (for assignment)
  const { data: members } = useQuery({
    queryKey: ["members-basic", user?.tenantId],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "", "", "active")
      if (response.error) throw response.error
      return response.data as Member[]
    },
    enabled: isAssignOpen
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; targetCalories: number }) => {
      const response = await dietPlansApi.create({ ...data, meals })
      if (response.error) throw response.error
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to create diet plan", variant: "destructive" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet_plans"] })
      setIsCreateOpen(false)
      setMeals([{ name: "Breakfast", time: "08:00", items: "", calories: "" }])
      toast({ title: "Success", description: "Diet Plan created" })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; targetCalories: number }) => {
      if (!selectedDiet) throw new Error("No plan selected")
      const response = await dietPlansApi.update(selectedDiet.id, { ...data, meals })
      if (response.error) throw response.error
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to update diet plan", variant: "destructive" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet_plans"] })
      setIsCreateOpen(false)
      setSelectedDiet(null)
      setMeals([{ name: "Breakfast", time: "08:00", items: "", calories: "" }])
      toast({ title: "Success", description: "Diet Plan updated" })
    }
  })

  const assignMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!selectedDiet) return
      const response = await memberDietsApi.assign({
        memberId: memberId,
        dietPlanId: selectedDiet.id
      })
      if (response.error) throw response.error
    },
    onSuccess: () => {
      setIsAssignOpen(false)
      toast({ title: "Assigned", description: `Diet Plan assigned to member` })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  })

  // Handlers
  const openCreateDialog = () => {
    setSelectedDiet(null)
    setMeals([{ name: "Breakfast", time: "08:00", items: "", calories: "" }])
    setIsCreateOpen(true)
  }

  const openEditDialog = (plan: DietPlan) => {
    setSelectedDiet(plan)
    setMeals(plan.meals || [])
    setIsCreateOpen(true)
  }

  const addMealRow = () => setMeals([...meals, { name: "", time: "", items: "", calories: "" }])
  const updateMeal = (index: number, field: keyof Meal, value: string) => {
    const newMeals = [...meals]
    newMeals[index][field] = value
    setMeals(newMeals)
  }
  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Plans"
        subtitle="Detailed nutrition plans for your members."
        titleClassName="text-3xl font-bold tracking-tight"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create Diet Plan
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{plan.targetCalories} kCal</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(plan)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Meals ({plan.meals?.length || 0})</p>
                <div className="space-y-1">
                  {plan.meals?.slice(0, 3).map((meal, i) => (
                    <div key={i} className="text-sm flex justify-between border-b pb-1 last:border-0">
                      <span>{meal.name}</span>
                      <span className="text-muted-foreground text-xs">{meal.items && meal.items.slice(0, 15)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/20">
              <Button className="w-full" variant="outline" onClick={() => { setSelectedDiet(plan); setIsAssignOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" /> Assign to Member
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDiet ? "Edit Diet Plan" : "Create Diet Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = {
              name: fd.get("name") as string,
              description: (fd.get("description") as string) || "",
              targetCalories: parseInt(fd.get("calories") as string) || 0
            };
            if (selectedDiet) {
              updateMutation.mutate(data)
            } else {
              createMutation.mutate(data);
            }
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input name="name" placeholder="e.g. Weight Loss Phase 1" required defaultValue={selectedDiet?.name} />
              </div>
              <div className="space-y-2">
                <Label>Target Calories</Label>
                <Input name="calories" type="number" placeholder="2000" required defaultValue={selectedDiet?.targetCalories} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Low carb, high protein..." defaultValue={selectedDiet?.description} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Daily Meals</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addMealRow}><Plus className="h-3 w-3 mr-1" /> Add Meal</Button>
              </div>
              <div className="space-y-2 border rounded-md p-2 bg-muted/10">
                {meals.map((meal, idx) => (
                  <div key={idx} className="flex gap-2 items-start mb-2 pb-2 border-b last:border-0 last:pb-0 last:mb-0">
                    <div className="w-[120px] space-y-1">
                      <Input placeholder="Timing" type="time" value={meal.time} onChange={(e) => updateMeal(idx, 'time', e.target.value)} />
                      <Input placeholder="Type (e.g. Lunch)" value={meal.name} onChange={(e) => updateMeal(idx, 'name', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <Textarea placeholder="Food Items (e.g. 200g Chicken, Rice)" value={meal.items} onChange={(e) => updateMeal(idx, 'items', e.target.value)} rows={3} />
                    </div>
                    <div className="w-[80px]">
                      <Input placeholder="kCal" type="number" value={meal.calories} onChange={(e) => updateMeal(idx, 'calories', e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive w-full mt-1" onClick={() => removeMeal(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{selectedDiet ? "Update Diet Plan" : "Save Diet Plan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign "{selectedDiet?.name}"</DialogTitle>
            <DialogDescription>Select a member to assign this diet plan to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                <div>
                  <p className="font-medium">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground">{member.memberCode}</p>
                </div>
                <Button size="sm" onClick={() => assignMutation.mutate(member.id)}>Assign</Button>
              </div>
            ))}
            {members?.length === 0 && <p className="text-center text-muted-foreground p-4">No active members found.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}