import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Trainer, UserRole } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export const TrainersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null)
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null)
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const canManageTrainers = hasRole(["super_admin", "gym_owner", "manager"] as UserRole[])

  // Fetch Trainers
  const { data: trainers, isLoading } = useQuery({
    queryKey: ["trainers", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("trainers")
        .select("*")
        .eq("tenant_id", user?.tenant_id)

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      query = query.order("created_at", { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return data as Trainer[]
    },
    enabled: !!user?.tenant_id,
  })

  // Create/Update Mutation
  const saveTrainerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.tenant_id) {
        throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
      }

      const data = {
        tenant_id: user.tenant_id,
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        bio: formData.get("bio") as string,
        specialties: (formData.get("specialties") as string).split(",").map((s) => s.trim()),
        hourly_rate_cents: Math.round(parseFloat(formData.get("hourly_rate") as string) * 100),
        is_active: true,
      }

      if (selectedTrainer) {
        const { error } = await supabase
          .from("trainers")
          .update(data)
          .eq("id", selectedTrainer.id)
          .eq("tenant_id", user.tenant_id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("trainers").insert([data])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      setIsDialogOpen(false)
      setSelectedTrainer(null)
      toast({ title: "Success", description: `Trainer ${selectedTrainer ? "updated" : "added"} successfully` })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  // Delete Mutation
  const deleteTrainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trainers")
        .delete()
        .eq("id", id)
        .eq("tenant_id", user?.tenant_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      setTrainerToDelete(null)
      toast({ title: "Success", description: "Trainer deleted successfully" })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    saveTrainerMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
        {canManageTrainers && (
          <Button onClick={() => { setSelectedTrainer(null); setIsDialogOpen(true); }}>
            Add Trainer
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trainers List</CardTitle>
          <CardDescription>Manage your gym trainers and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                {canManageTrainers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers?.map((trainer) => (
                <TableRow key={trainer.id}>
                  <TableCell className="font-medium">{trainer.full_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1 text-sm">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                        {trainer.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                        {trainer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trainer.specialties?.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(trainer.hourly_rate_cents || 0)}/hr</TableCell>
                  <TableCell>
                    <Badge variant={trainer.is_active ? "default" : "secondary"}>
                      {trainer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManageTrainers && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTrainer(trainer); setIsDialogOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTrainerToDelete(trainer)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {trainers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No trainers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTrainer ? "Edit Trainer" : "Add Trainer"}</DialogTitle>
            <DialogDescription>
              {selectedTrainer ? "Update trainer details" : "Add a new trainer to your gym"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={selectedTrainer?.full_name}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedTrainer?.email || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={selectedTrainer?.phone || ""}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialties">Specialties (comma separated)</Label>
                <Input
                  id="specialties"
                  name="specialties"
                  defaultValue={selectedTrainer?.specialties?.join(", ")}
                  placeholder="Yoga, HIIT, Cardio"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  defaultValue={(selectedTrainer?.hourly_rate_cents || 0) / 100}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={selectedTrainer?.bio || ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveTrainerMutation.isPending}>
                {saveTrainerMutation.isPending ? "Saving..." : "Save Trainer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!trainerToDelete} onOpenChange={(open) => !open && setTrainerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {trainerToDelete?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainerToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => trainerToDelete && deleteTrainerMutation.mutate(trainerToDelete.id)}
              disabled={deleteTrainerMutation.isPending}
            >
              {deleteTrainerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}