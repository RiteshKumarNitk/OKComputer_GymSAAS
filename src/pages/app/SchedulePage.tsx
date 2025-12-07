import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, User, Trash2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Service, Trainer } from "@/types"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface ScheduleSlot {
  id: string
  day_of_week: number
  start_time: string
  duration_minutes: number
  service_id: string
  trainer_id: string | null
  service?: Service
  trainer?: Trainer
}

export const SchedulePage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()) // Default to today
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const [formDay, setFormDay] = useState<string>("1")
  const [formService, setFormService] = useState<string>("")
  const [formTrainer, setFormTrainer] = useState<string>("none")

  // Fetch Schedule
  const { data: schedule } = useQuery({
    queryKey: ["schedules", user?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*, service:services(*), trainer:trainers(*)")
        .eq("tenant_id", user?.tenant_id)
      if (error) throw error
      return data as ScheduleSlot[]
    },
    enabled: !!user?.tenant_id
  })

  // Fetch Services (Classes)
  const { data: services } = useQuery({
    queryKey: ["services", user?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("tenant_id", user?.tenant_id).eq("type", "class")
      return data as Service[] || []
    },
    enabled: !!user?.tenant_id
  })

  // Fetch Trainers
  const { data: trainers } = useQuery({
    queryKey: ["trainers", user?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase.from("trainers").select("*").eq("tenant_id", user?.tenant_id)
      return data as Trainer[] || []
    },
    enabled: !!user?.tenant_id
  })

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!formService) throw new Error("Please select a class/service")

      const data = {
        tenant_id: user?.tenant_id,
        day_of_week: parseInt(formDay),
        start_time: formData.get("time") as string,
        duration_minutes: parseInt(formData.get("duration") as string),
        service_id: formService,
        trainer_id: formTrainer === "none" ? null : formTrainer
      }
      const { error } = await supabase.from("schedules").insert([data])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      setIsAddOpen(false)
      toast({ title: "Success", description: "Class scheduled successfully" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      toast({ title: "Deleted", description: "Slot removed" })
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addMutation.mutate(new FormData(e.currentTarget))
  }

  // Filter slots for current view
  const daySlots = schedule?.filter(s => s.day_of_week === selectedDay).sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
          <p className="text-muted-foreground">Manage weekly class timings and trainers.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant={viewMode === 'daily' ? 'default' : 'outline'} onClick={() => setViewMode('daily')}>
            Daily
          </Button>
          <Button variant={viewMode === 'weekly' ? 'default' : 'outline'} onClick={() => setViewMode('weekly')}>
            Weekly
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>
      </div>

      {/* Day Selector - Only show in Daily Mode */}
      {viewMode === 'daily' && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {DAYS.map((day, index) => (
            <Button
              key={day}
              variant={selectedDay === index ? "default" : "outline"}
              onClick={() => setSelectedDay(index)}
              className="min-w-[100px]"
            >
              {day}
            </Button>
          ))}
        </div>
      )}

      {/* Schedule Grid */}
      {viewMode === 'daily' ? (
        <Card>
          <CardHeader>
            <CardTitle>{DAYS[selectedDay]} Schedule</CardTitle>
            <CardDescription>
              {daySlots?.length === 0 ? "No classes scheduled for this day." : `${daySlots?.length} classes scheduled.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daySlots?.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full text-primary font-bold text-sm min-w-[80px] text-center">
                      {slot.start_time.slice(0, 5)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{slot.service?.name || "Unknown Class"}</h4>
                      <div className="flex items-center text-sm text-muted-foreground space-x-3">
                        <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {slot.duration_minutes}m</span>
                        {slot.trainer && (
                          <span className="flex items-center"><User className="mr-1 h-3 w-3" /> {slot.trainer.full_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-red-600" onClick={() => deleteMutation.mutate(slot.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day, index) => {
            const slots = schedule?.filter(s => s.day_of_week === index).sort((a, b) => a.start_time.localeCompare(b.start_time))
            if (!slots || slots.length === 0) return null

            return (
              <Card key={day}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-bold w-16">{slot.start_time.slice(0, 5)}</span>
                          <div>
                            <p className="font-medium">{slot.service?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.duration_minutes}m • {slot.trainer?.full_name || 'No Trainer'}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(slot.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {schedule?.length === 0 && <div className="text-center text-muted-foreground">No classes scheduled yet. Add some classes to see them here.</div>}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a Class</DialogTitle>
            <DialogDescription>Add a weekly recurring class slot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input name="time" type="time" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Class / Service</Label>
              <Select value={formService} onValueChange={setFormService}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trainer</Label>
                <Select value={formTrainer} onValueChange={setFormTrainer}>
                  <SelectTrigger><SelectValue placeholder="No Trainer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Trainer</SelectItem>
                    {trainers?.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (mins)</Label>
                <Input name="duration" type="number" defaultValue="60" required />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Add to Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}