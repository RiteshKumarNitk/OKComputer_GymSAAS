import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { workoutsApi, membersApi, trainerWorkoutsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, UserPlus, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Member } from "@/types"
import { PageHeader } from "@/components/common"

interface Exercise {
  name: string
  sets: string
  reps: string
}

interface Workout {
  id: string
  name: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  exercises: Exercise[]
}

export const WorkoutsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // UI States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  // Form States
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: "3", reps: "10" }])
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate")

  // Fetch Workouts
  const { data: workouts } = useQuery({
    queryKey: ["workouts", user?.tenantId],
    queryFn: async () => {
      const response = await workoutsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Workout[]
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
    mutationFn: async (data: { name: string; description: string }) => {
      const payload = {
        name: data.name,
        description: data.description,
        difficulty: difficulty,
        exercises: exercises
      }
      const response = await workoutsApi.create(payload)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      setIsCreateOpen(false)
      setExercises([{ name: "", sets: "3", reps: "10" }])
      toast({ title: "Success", description: "Workout template created" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to create workout", variant: "destructive" })
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (!selectedWorkout) throw new Error("No workout selected")

      const payload = {
        name: data.name,
        description: data.description,
        difficulty: difficulty,
        exercises: exercises
      }
      const response = await workoutsApi.update(selectedWorkout.id, payload)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      setIsCreateOpen(false)
      setSelectedWorkout(null)
      setExercises([{ name: "", sets: "3", reps: "10" }])
      toast({ title: "Updated", description: "Workout template updated" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to update workout", variant: "destructive" })
  })

  const assignMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!selectedWorkout) return
      const response = await trainerWorkoutsApi.assignDailyWorkout({
        memberId: memberId,
        date: selectedDate,
        planType: "template",
        exercises: selectedWorkout.exercises
      })
      if (response.error) throw response.error
    },
    onSuccess: () => {
      setIsAssignOpen(false)
      toast({ title: "Assigned", description: `Workout assigned to member` })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  })

  // Handlers
  const openCreateDialog = () => {
    setSelectedWorkout(null)
    setExercises([{ name: "", sets: "3", reps: "10" }])
    setDifficulty("Intermediate")
    setIsCreateOpen(true)
  }

  const openEditDialog = (workout: Workout) => {
    setSelectedWorkout(workout)
    setExercises(workout.exercises || [])
    setDifficulty(workout.difficulty)
    setIsCreateOpen(true)
  }

  const addExerciseRow = () => setExercises([...exercises, { name: "", sets: "3", reps: "10" }])
  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newEx = [...exercises]
    newEx[index][field] = value
    setExercises(newEx)
  }
  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workouts"
        subtitle="Create training templates and assign them to members."
        titleClassName="text-3xl font-bold tracking-tight"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts?.map((workout) => (
          <Card key={workout.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{workout.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={workout.difficulty === 'Advanced' ? 'destructive' : 'secondary'}>{workout.difficulty}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(workout)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Exercises ({workout.exercises?.length || 0})</p>
                <div className="space-y-1">
                  {workout.exercises?.slice(0, 3).map((ex, i) => (
                    <div key={i} className="text-sm flex justify-between border-b pb-1 last:border-0">
                      <span>{ex.name}</span>
                      <span className="text-muted-foreground">{ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                  {(workout.exercises?.length || 0) > 3 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">+{(workout.exercises?.length || 0) - 3} more</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/20">
              <Button className="w-full" variant="outline" onClick={() => { setSelectedWorkout(workout); setIsAssignOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" /> Assign to Member
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWorkout ? "Edit Workout Template" : "Create Workout Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = { name: fd.get("name") as string, description: (fd.get("description") as string) || "" };
            if (selectedWorkout) {
              updateMutation.mutate(data)
            } else {
              createMutation.mutate(data);
            }
          }} className="space-y-6">
            <div className="space-y-2">
              <Label>Workout Name</Label>
              <Input name="name" placeholder="e.g. Chest & Triceps A" required defaultValue={selectedWorkout?.name} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Focus on hypertrophy..." defaultValue={selectedWorkout?.description} />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select name="difficulty" value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Exercises</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addExerciseRow}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 border rounded-md p-2 bg-muted/10">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input placeholder="Exercise Name" value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} />
                    </div>
                    <div className="w-20">
                      <Input placeholder="Sets" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} />
                    </div>
                    <div className="w-20">
                      <Input placeholder="Reps" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeExercise(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{selectedWorkout ? "Update Template" : "Save Template"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign "{selectedWorkout?.name}"</DialogTitle>
            <DialogDescription>Select a member and date to assign this workout plan to.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Assignment Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
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