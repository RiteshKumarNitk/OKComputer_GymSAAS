import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersApi, membershipsApi, trainersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership } from "@/types"
import { formatDate, exportToCSV } from "@/lib/utils"
import {
  Search,
  Plus,
  Download,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MemberForm } from "@/features/members/MemberForm"
import { MemberDetails } from "@/features/members/MemberDetails"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader, DataTable, ActionMenu, ConfirmDialog, CategoryStatsGrid } from "@/components/common"
import type { Column } from "@/components/common"

export const MembersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  
  // Filter States
  const [statusFilter] = useState<string>("all")
  
  // Selection State
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const prefillData = location.state?.prefill || null

  React.useEffect(() => {
    if (prefillData) {
      setShowMemberForm(true)
    }
  }, [prefillData])

  // Fetch members
  const { data: members, isLoading } = useQuery({
    queryKey: ["members", searchQuery, statusFilter],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "", searchQuery, statusFilter)
      if (response.error) throw response.error
      return response.data as Member[]
    },
    enabled: !!user?.tenantId,
  })

  // Full Members list for Stats Calculation
  const { data: allMembers } = useQuery({
    queryKey: ["all-members-stats", user?.tenantId],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Member[]
    },
    enabled: !!user?.tenantId,
  })

  // Fetch trainers for lookup
  const { data: trainers } = useQuery({
    queryKey: ["trainers", user?.tenantId],
    queryFn: async () => {
        const response = await trainersApi.list(user?.tenantId || "")
        if (response.error) throw response.error
        return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  // Calculate Real-time Stats by plan keyword (mocking categories from screenshot)
  const categories = React.useMemo(() => {
    if (!allMembers) return []
    const getCount = (kw: string) => allMembers.filter(m => m.currentPlan?.name.toLowerCase().includes(kw)).length
    return [
       { label: 'General Training', count: getCount('general'), icon: <Users className="h-6 w-6" /> },
       { label: 'Personal Training', count: getCount('personal'), icon: <Users className="h-6 w-6" /> },
       { label: 'Complete Fitness', count: getCount('complete'), icon: <Users className="h-6 w-6" /> },
       { label: 'Group Ex', count: getCount('group'), icon: <Users className="h-6 w-6" /> },
       { label: 'Transformation Package', count: getCount('transformation'), icon: <Users className="h-6 w-6" /> },
       { label: 'Delete Memberships', count: allMembers.filter(m => m.status === 'expired').length, icon: <Users className="h-6 w-6" /> },
    ]
  }, [allMembers])

  // Fetch memberships for form
  const { data: memberships } = useQuery({
    queryKey: ["memberships", user?.tenantId],
    queryFn: async () => {
      const response = await membershipsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Membership[]
    },
    enabled: !!user?.tenantId,
  })

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await membersApi.delete(memberId)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setMemberToDelete(null)
    },
  })

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setShowMemberForm(true)
  }

  const handleViewMember = (member: Member) => {
    if (!member) return
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member)
  }

  const confirmDelete = async () => {
    if (memberToDelete) {
      await deleteMemberMutation.mutateAsync(memberToDelete.id)
    }
  }

  const exportMembers = () => {
    if (!members) return
    const csvData = members.map((member) => ({
      "Member Code": member.memberCode || "",
      "Name": member.fullName || "",
      "Email": member.email || "",
      "Phone": member.phone || "",
      "Status": member.status,
      "Membership": member.currentPlan?.name || "No Plan",
      "Joined Date": formatDate(member.joinedAt || ""),
    }))
    exportToCSV(csvData, `members-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const columns: Column<Member>[] = [
    {
      key: "select",
      label: "",
      render: (member) => (
        <Checkbox 
          checked={selectedMembers.includes(member.id)}
          onCheckedChange={(checked) => {
            if (checked) setSelectedMembers([...selectedMembers, member.id])
            else setSelectedMembers(selectedMembers.filter(id => id !== member.id))
          }}
        />
      ),
      className: "w-12 text-center",
      headClassName: "w-12 text-center",
    },
    {
      key: "memberCode",
      label: "Client ID",
      render: (member) => (
        <span className="font-mono text-sm text-slate-500">{member.memberCode}</span>
      ),
    },
    {
      key: "fullName",
      label: "Full Name",
      render: (member) => (
        <span 
          className="font-bold text-blue-600 cursor-pointer hover:underline uppercase tracking-tight text-xs"
          onClick={() => handleViewMember(member)}
        >
          {member.fullName}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Mobile Number",
      render: (member) => (
        <span className="text-xs text-slate-500 font-bold">+91 {member.phone}</span>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (member) => {
        const plan = member.currentPlan
        const durationMonths = plan ? Math.ceil(plan.durationDays / 30) : 0
        return <span className="text-xs font-bold text-slate-700">{durationMonths} Month</span>
      },
    },
    {
      key: "sessions",
      label: "Sessions",
      render: (member) => {
        const plan = member.currentPlan
        const durationMonths = plan ? Math.ceil(plan.durationDays / 30) : 0
        return <span className="text-xs font-bold text-slate-700">{durationMonths * 30}</span>
      },
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (member) => (
        <span className="text-xs font-bold text-slate-700">{formatDate(member.planStartedAt || member.joinedAt)}</span>
      ),
    },
    {
      key: "endDate",
      label: "End Date",
      render: (member) => (
        <span className="text-xs font-bold text-slate-700">{formatDate(member.planExpiresAt || member.joinedAt)}</span>
      ),
    },
    {
      key: "trainer",
      label: "Assigned Trainer",
      render: (member) => {
        const trainer = trainers?.find((t: any) => t.id === member.assignedTrainerId)
        return <span className="text-xs font-bold text-slate-700">{trainer?.fullName || 'unassigned'}</span>
      },
    },
    {
      key: "addOnDays",
      label: "Add on Days",
      render: () => <span className="text-xs font-bold text-slate-700">0</span>,
      className: "text-center",
      headClassName: "text-center",
    },
    {
      key: "status",
      label: "Status",
      render: (member) => (
        <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 font-bold text-[10px] uppercase px-3 py-1 rounded-lg">
          {member.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (member) => (
        <ActionMenu
          onView={() => handleViewMember(member)}
          onEdit={() => handleEditMember(member)}
          onDelete={() => handleDeleteMember(member)}
        />
      ),
      headClassName: "text-right",
      className: "text-right",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Membership Management"
        actions={
          <Button
            onClick={() => navigate("/members/add")}
            variant="brand"
            className="px-6 rounded-xl font-bold h-11"
          >
            <Plus className="mr-2 h-5 w-5" /> Add Member
          </Button>
        }
      />

      {/* Stats Grid */}
      {categories.length > 0 && <CategoryStatsGrid items={categories} />}

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3">
            {selectedMembers.length > 0 && (
              <span className="text-sm font-bold text-slate-500">{selectedMembers.length} selected</span>
            )}
            <Checkbox 
              checked={selectedMembers.length === members?.length && (members?.length ?? 0) > 0}
              onCheckedChange={(checked) => {
                if (checked) setSelectedMembers(members?.map(m => m.id) || [])
                else setSelectedMembers([])
              }}
            />
            <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white dark:bg-slate-950 font-bold text-slate-500" onClick={exportMembers}>
              <Download className="mr-2 h-5 w-5" /> Generate XLS Report
            </Button>
          </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={members || []}
        loading={isLoading}
        searchable={false}
        title="Memberships"
      />

      {/* Dialogs */}
      <Dialog open={showMemberForm} onOpenChange={(open) => {
        setShowMemberForm(open)
        if (!open) setSelectedMember(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Edit Member</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Update member information and membership details
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            member={selectedMember}
            memberships={memberships || []}
            onSuccess={() => {
              setShowMemberForm(false)
              setSelectedMember(null)
            }}
            onCancel={() => {
              setShowMemberForm(false)
              setSelectedMember(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Member Details</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              View complete member information, attendance history, and progress
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <MemberDetails
              member={selectedMember}
              onClose={() => {
                setShowMemberDetails(false)
                setSelectedMember(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Confirm Deletion"
        itemName={memberToDelete?.fullName}
        onConfirm={confirmDelete}
        loading={deleteMemberMutation.isPending}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  )
}
