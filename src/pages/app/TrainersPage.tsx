import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { trainersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Trainer, UserRole } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { PageHeader, DataTable, ActionMenu, ConfirmDialog } from "@/components/common"
import type { Column } from "@/components/common"
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
    queryKey: ["trainers", user?.tenantId],
    queryFn: async () => {
       const response = await trainersApi.list(user?.tenantId || "")
       if (response.error) throw response.error
       return (response.data || []) as Trainer[]
    },
    enabled: !!user?.tenantId,
  })

  const filteredTrainers = (trainers || []).filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (t.fullName ?? "").toLowerCase().includes(q) ||
      (t.email ?? "").toLowerCase().includes(q) ||
      (t.phone ?? "").toLowerCase().includes(q)
  })

  const columns: Column<Trainer>[] = [
    {
      key: "name",
      label: "Name",
      render: (trainer) => (
        <span className="font-medium">{trainer.fullName ?? trainer.fullName}</span>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (trainer) => (
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
      ),
    },
    {
      key: "specialties",
      label: "Specialties",
      render: (trainer) => (
        <div className="flex flex-wrap gap-1">
          {trainer.specialties?.map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "rate",
      label: "Hourly Rate",
      render: (trainer) => (
        <span>{formatCurrency(trainer.hourlyRateCents ?? trainer.hourlyRateCents ?? 0)}/hr</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (trainer) => (
        <Badge variant={(trainer.isActive ?? trainer.isActive) ? "default" : "secondary"}>
          {(trainer.isActive ?? trainer.isActive) ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (trainer) => canManageTrainers ? (
        <ActionMenu
          onEdit={() => { setSelectedTrainer(trainer); setIsDialogOpen(true); }}
          onDelete={() => setTrainerToDelete(trainer)}
        />
      ) : null,
      className: "text-right",
    },
  ]

  // Create/Update Mutation
  const saveTrainerMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.tenantId) {
        throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
      }

      const data = {
        tenantId: user.tenantId,
        fullName: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        bio: formData.get("bio") as string,
        specialties: (formData.get("specialties") as string).split(",").map((s) => s.trim()),
        hourlyRateCents: Math.round(parseFloat(formData.get("hourly_rate") as string) * 100),
        isActive: true,
      }

      let response;
      if (selectedTrainer) {
        response = await trainersApi.update(selectedTrainer.id, data)
      } else {
        response = await trainersApi.create(data)
      }
      if (response.error) throw response.error
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
      const response = await trainersApi.delete(id)
      if (response.error) throw response.error
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
        <PageHeader title="Trainers" titleClassName="text-3xl font-bold tracking-tight" />
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
      <PageHeader
        title="Trainers"
        titleClassName="text-3xl font-bold tracking-tight"
        actions={canManageTrainers ? (
          <Button onClick={() => { setSelectedTrainer(null); setIsDialogOpen(true); }}>
            Add Trainer
          </Button>
        ) : undefined}
      />

      <DataTable
        columns={columns}
        data={filteredTrainers}
        loading={isLoading}
        searchable
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search trainers..."
        title="Trainers List"
        emptyMessage="No trainers found."
        defaultRowsPerPage={10}
      />

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
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={selectedTrainer?.fullName}
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
                  defaultValue={(selectedTrainer?.hourlyRateCents ?? selectedTrainer?.hourlyRateCents ?? 0) / 100}
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

      <ConfirmDialog
        open={!!trainerToDelete}
        onOpenChange={(open) => !open && setTrainerToDelete(null)}
        title="Confirm Deletion"
        description={`Are you sure you want to delete ${trainerToDelete?.fullName}? This action cannot be undone.`}
        onConfirm={() => trainerToDelete && deleteTrainerMutation.mutate(trainerToDelete.id)}
        loading={deleteTrainerMutation.isPending}
      />
    </div>
  )
}