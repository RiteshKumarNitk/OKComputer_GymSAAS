import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Membership } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {Plus, Pencil, Trash2, ShieldAlert} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanForm } from "@/features/memberships/PlanForm"

export const PlansPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Membership | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Membership | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ["memberships", user?.tenantId],
    queryFn: async () => {
      const response = await membershipsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Membership[]
    },
    enabled: !!user?.tenantId,
  })

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await membershipsApi.delete(id)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] })
      setPlanToDelete(null)
    },
  })

  const handleEditPlan = (plan: Membership) => {
    setSelectedPlan(plan)
    setShowPlanForm(true)
  }

  const handleDeletePlan = (plan: Membership) => {
    setPlanToDelete(plan)
  }

  const confirmDelete = async () => {
    if (planToDelete) {
      await deletePlanMutation.mutateAsync(planToDelete.id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
        <Button onClick={() => { setSelectedPlan(null); setShowPlanForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>
            Manage the subscription plans you offer to your members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{plan.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(plan.priceCents ?? plan.priceCents ?? 0, plan.currency || "INR")}</TableCell>
                    <TableCell>{plan.durationDays ?? plan.durationDays ?? 0} Days</TableCell>
                    <TableCell>
                      <Badge variant={(plan.isActive ?? plan.isActive) ? "default" : "secondary"}>
                        {(plan.isActive ?? plan.isActive) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!plans || plans.length === 0) && (
            <div className="text-center py-8">
              <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No membership plans created yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Plan Dialog */}
      <Dialog open={showPlanForm} onOpenChange={(open) => {
        setShowPlanForm(open)
        if (!open) setSelectedPlan(null)
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? "Update changes to your plan configuration" : "Fill details to introduce a new gym membership level"}
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            plan={selectedPlan}
            onSuccess={() => {
              setShowPlanForm(false)
              setSelectedPlan(null)
            }}
            onCancel={() => {
              setShowPlanForm(false)
              setSelectedPlan(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete **{planToDelete?.name}**? This action might affect existing members assigned to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
