import React, { useState, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersApi, membershipsApi, trainersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership } from "@/types"
import { formatDate, exportToCSV } from "@/lib/utils"
import { Plus, Download, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MemberForm } from "@/features/members/MemberForm"
import { ConfirmDialog, PageHeader, DataTable, ActionMenu } from "@/components/common"
import type { Column } from "@/components/common"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export const MemberDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const prefillData = location.state?.prefill || null

  React.useEffect(() => {
    if (prefillData) setShowMemberForm(true)
  }, [prefillData])

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", searchQuery],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "", searchQuery)
      if (response.error) throw response.error
      return response.data as Member[]
    },
    enabled: !!user?.tenantId,
  })

  const { data: allMembers } = useQuery({
    queryKey: ["all-members-stats", user?.tenantId],
    queryFn: async () => {
      const response = await membersApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Member[]
    },
    enabled: !!user?.tenantId,
  })

  const { data: trainers } = useQuery({
    queryKey: ["trainers", user?.tenantId],
    queryFn: async () => {
      const response = await trainersApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const categories = useMemo(() => {
    if (!allMembers) return []
    const getCount = (kw: string) => allMembers.filter(m => m.currentPlan?.name?.toLowerCase().includes(kw)).length
    return [
      { name: "General Training", count: getCount("general"), color: "blue" },
      { name: "Personal Training", count: getCount("personal"), color: "emerald" },
      { name: "Complete Fitness", count: getCount("complete"), color: "orange" },
      { name: "Group Ex", count: getCount("group"), color: "purple" },
      { name: "Transformation", count: getCount("transformation"), color: "rose" },
      { name: "Expired", count: allMembers.filter(m => m.status === "expired").length, color: "slate" },
    ] as const
  }, [allMembers])

  const filteredMembers = members || []

  const { data: memberships } = useQuery({
    queryKey: ["memberships", user?.tenantId],
    queryFn: async () => {
      const response = await membershipsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Membership[]
    },
    enabled: !!user?.tenantId,
  })

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
    if (member) navigate(`/members/${member.id}`)
  }

  const exportMembers = () => {
    if (!members) return
    const csvData = members.map(m => ({
      "Member Code": m.memberCode || "",
      "Name": m.fullName || "",
      "Email": m.email || "",
      "Phone": m.phone || "",
      "Status": m.status,
      "Membership": m.currentPlan?.name || "No Plan",
      "Joined Date": formatDate(m.joinedAt || ""),
    }))
    exportToCSV(csvData, `members-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const memberColumns: Column<Member>[] = [
    { key: "select", label: "", render: (member: Member) => (
      <Checkbox checked={selectedMembers.includes(member.id)} onCheckedChange={(c) => setSelectedMembers(c ? [...selectedMembers, member.id] : selectedMembers.filter(id => id !== member.id))} />
    )},
    { key: "clientId", label: "Client ID", render: (member: Member) => <span className="font-mono text-sm text-slate-500">{member.memberCode}</span> },
    { key: "name", label: "Full Name", render: (member: Member) => (
      <span className="font-bold text-blue-600 cursor-pointer hover:underline uppercase tracking-tight text-xs" onClick={() => handleViewMember(member)}>{member.fullName}</span>
    )},
    { key: "phone", label: "Mobile", render: (member: Member) => <span className="text-xs text-slate-500 font-bold">+91 {member.phone}</span> },
    { key: "duration", label: "Duration", render: (member: Member) => {
      const plan = member.currentPlan
      const durationMonths = plan ? Math.ceil(plan.durationDays / 30) : 0
      return <span className="text-xs font-bold text-slate-700">{durationMonths}M</span>
    }},
    { key: "startDate", label: "Start Date", render: (member: Member) => <span className="text-xs font-bold text-slate-700">{formatDate(member.planStartedAt || member.joinedAt)}</span> },
    { key: "endDate", label: "End Date", render: (member: Member) => <span className="text-xs font-bold text-slate-700">{formatDate(member.planExpiresAt || member.joinedAt)}</span> },
    { key: "trainer", label: "Trainer", render: (member: Member) => {
      const trainer = trainers?.find((t: any) => t.id === member.assignedTrainerId)
      return <span className="text-xs font-bold text-slate-700">{trainer?.fullName || "unassigned"}</span>
    }},
    { key: "status", label: "Status", render: (member: Member) => (
      <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 font-bold text-[10px] uppercase px-3 py-1 rounded-lg">{member.status}</Badge>
    )},
    { key: "actions", label: "", className: "text-right", render: (member: Member) => (
      <ActionMenu onView={() => handleViewMember(member)} onEdit={() => handleEditMember(member)} onDelete={() => setMemberToDelete(member)} />
    )},
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Membership Management"
        actions={
          <Button variant="brand" onClick={() => navigate("/members/add")} className="px-6 rounded-xl font-bold h-10">
            <Plus className="mr-2 h-5 w-5" /> Add Member
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat, idx) => (
          <Card key={cat.name} className={`${idx === 0 ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white dark:bg-slate-900"} border-none rounded-xl transition-all hover:scale-[1.02]`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 ${idx === 0 ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"} rounded-xl`}>
                <Users className={`h-6 w-6 ${idx === 0 ? "text-white" : "text-slate-400"}`} />
              </div>
              <div className="overflow-hidden">
                <p className={`text-2xl font-bold ${idx === 0 ? "text-white" : "text-slate-700 dark:text-white"}`}>{cat.count}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? "opacity-90" : "text-slate-400"}`}>{cat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={memberColumns}
        data={filteredMembers}
        loading={isLoading}
        searchable
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or ID..."
        title={`Memberships (${filteredMembers.length})`}
        titleAction={
          <Button variant="outline" className="h-10 px-6 rounded-xl border-slate-200 bg-white dark:bg-slate-950 font-bold text-slate-500" onClick={exportMembers}>
            <Download className="mr-2 h-5 w-5" /> Generate CSV Report
          </Button>
        }
        emptyMessage="No members found."
      />

      {/* Edit Member Dialog */}
      <Dialog open={showMemberForm} onOpenChange={(o) => { setShowMemberForm(o); if (!o) setSelectedMember(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Member</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">Update member information and membership details</DialogDescription>
          </DialogHeader>
          <MemberForm member={selectedMember} memberships={memberships || []} onSuccess={() => { setShowMemberForm(false); setSelectedMember(null) }} onCancel={() => { setShowMemberForm(false); setSelectedMember(null) }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog open={!!memberToDelete} onOpenChange={(o) => { if (!o) setMemberToDelete(null) }}
        title="Confirm Deletion"
        itemName={memberToDelete?.fullName}
        onConfirm={() => deleteMemberMutation.mutateAsync(memberToDelete!.id)}
        loading={deleteMemberMutation.isPending}
      />
    </div>
  )
}