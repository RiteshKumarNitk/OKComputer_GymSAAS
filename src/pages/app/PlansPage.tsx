import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Membership } from "@/types"
import { Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanForm } from "@/features/memberships/PlanForm"
import { Switch } from "@/components/ui/switch"
import { PageHeader, DataTable, ActionMenu, ConfirmDialog } from "@/components/common"
import type { Column } from "@/components/common"


export const PlansPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Membership | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Membership | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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

  // Toggle activation mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await membershipsApi.update(id, { isActive: !isActive })
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] })
    },
  })

  const confirmDelete = async () => {
    if (planToDelete) {
      await deletePlanMutation.mutateAsync(planToDelete.id)
    }
  }

  const filteredPlans = plans?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const columns: Column<Membership>[] = [
    {
      key: "id",
      label: "ID",
      render: (plan) => (
        <span className="font-mono text-sm text-slate-500">{plan.id.substring(0, 5)}</span>
      ),
    },
    {
      key: "name",
      label: "Package Name",
      render: (plan) => (
        <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide">
          {plan.name}
        </Badge>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (plan) => (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
          {Math.ceil((plan.durationDays ?? 0) / 30)} Months
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (plan) => (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
          {Math.ceil((plan.durationDays ?? 0) / 30) * 30}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (plan) => (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
          ₹{(plan.priceCents ?? 0) / 100}
        </span>
      ),
    },
    {
      key: "status",
      label: "Active / Inactive",
      render: (plan) => (
        <Switch
          checked={plan.isActive}
          onCheckedChange={() => toggleStatusMutation.mutate({ id: plan.id, isActive: plan.isActive })}
          className="data-[state=checked]:bg-emerald-500"
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (plan) => (
        <ActionMenu
          onEdit={() => { setSelectedPlan(plan); setShowPlanForm(true); }}
          onDelete={() => setPlanToDelete(plan)}
        />
      ),
      className: "text-right",
    },
  ]

  // Stats Logic - For demo/mockup, we use categories if they were in the data. 
  // Since we don't have categories, we just filter by name keywords or show some dummy categories
  const categories = [
    { name: 'General Training', count: plans?.filter(p => p.name.toLowerCase().includes('general')).length || 0, color: 'bg-blue-600' },
    { name: 'Personal Training', count: plans?.filter(p => p.name.toLowerCase().includes('personal')).length || 0, color: 'bg-white' },
    { name: 'Complete Fitness', count: plans?.filter(p => p.name.toLowerCase().includes('fitness')).length || 0, color: 'bg-white' },
    { name: 'Group Ex', count: plans?.filter(p => p.name.toLowerCase().includes('group')).length || 0, color: 'bg-white' },
    { name: 'Transformation', count: plans?.filter(p => p.name.toLowerCase().includes('transformation')).length || 0, color: 'bg-white' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Memberships Package"
        actions={
          <Button
            onClick={() => { setSelectedPlan(null); setShowPlanForm(true); }}
            variant="brand"
            className="px-6 rounded-xl font-bold h-11"
          >
            <Plus className="mr-2 h-5 w-5" /> Add Package
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
        {categories.map((cat, idx) => (
          <Card key={cat.name} className={`${idx === 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-slate-900 text-slate-400'} border-none min-w-[200px] flex-1 rounded-2xl group hover:scale-[1.02] transition-all`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 ${idx === 0 ? 'bg-white/20' : 'bg-slate-100'} rounded-xl`}>
                <Users className={`h-6 w-6 ${idx === 0 ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div className="overflow-hidden">
                <p className={`text-2xl font-black ${idx === 0 ? 'text-white' : 'text-slate-700 dark:text-white'}`}>{cat.count}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? 'opacity-90' : 'text-slate-400'}`}>{cat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredPlans}
        loading={isLoading}
        searchable
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        title="Memberships Package"
        emptyMessage="No results found."
        defaultRowsPerPage={10}
      />

      {/* Add/Edit Plan Dialog */}
      <Dialog open={showPlanForm} onOpenChange={(open) => {
        setShowPlanForm(open)
        if (!open) setSelectedPlan(null)
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">{selectedPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
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

      <ConfirmDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${planToDelete?.name}"? This action might affect existing members assigned to it.`}
        onConfirm={confirmDelete}
        loading={deletePlanMutation.isPending}
      />
    </div>
  )
}
