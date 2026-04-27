import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Membership } from "@/types"
import { Plus, MoreVertical, Search, ShieldAlert, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanForm } from "@/features/memberships/PlanForm"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const MembershipPackagesPage: React.FC = () => {
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

  const filteredPlans = plans?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Memberships Package</h1>
        <Button 
          onClick={() => { setSelectedPlan(null); setShowPlanForm(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-bold h-11"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Package
        </Button>
      </div>

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

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none shadow-inner"
        />
      </div>

      {/* Table Card */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Memberships Package</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Package Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Duration</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Sessions</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Price</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Active / Inactive</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                    <TableCell className="font-mono text-sm text-slate-500 py-6 px-4">
                      {plan.id.substring(0, 5)}
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide">
                        {plan.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-6 px-4 uppercase tracking-tighter">
                      {Math.ceil((plan.durationDays ?? 0) / 30)} Months
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-6 px-4 uppercase tracking-tighter">
                      {/* Placeholder for sessions: we use a multiple of months for now to match screenshot style */}
                      {Math.ceil((plan.durationDays ?? 0) / 30) * 30}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300 py-6 px-4 uppercase tracking-tighter">
                      ₹{(plan.priceCents ?? 0) / 100}
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <Switch 
                        checked={plan.isActive} 
                        onCheckedChange={() => toggleStatusMutation.mutate({ id: plan.id, isActive: plan.isActive })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="text-right py-6 px-4 text-slate-400">
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="rounded-xl shadow-xl p-1">
                           <DropdownMenuItem onClick={() => handleEditPlan(plan)} className="rounded-lg font-bold">Edit</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleDeletePlan(plan)} className="rounded-lg font-bold text-rose-500">Delete</DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium italic">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 pt-2">
              Are you sure you want to delete **{planToDelete?.name}**? This action might affect existing members assigned to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => setPlanToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold h-11 px-6 bg-rose-600 hover:bg-rose-700"
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
