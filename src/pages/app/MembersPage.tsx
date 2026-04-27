import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersApi, membershipsApi, trainersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership } from "@/types"
import { formatDate } from "@/lib/utils"
import {
  Search,
  Plus,
  Download,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenuSeparator,
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
import { Badge } from "@/components/ui/badge"
import { MemberForm } from "@/features/members/MemberForm"
import { MemberDetails } from "@/features/members/MemberDetails"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
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
       { name: 'General Training', count: getCount('general'), color: 'bg-blue-600' },
       { name: 'Personal Training', count: getCount('personal'), color: 'bg-white' },
       { name: 'Complete Fitness', count: getCount('complete'), color: 'bg-white' },
       { name: 'Group Ex', count: getCount('group'), color: 'bg-white' },
       { name: 'Transformation Package', count: getCount('transformation'), color: 'bg-white' },
       { name: 'Delete Memberships', count: allMembers.filter(m => m.status === 'expired').length, color: 'bg-white' },
    ]
  }, [allMembers])

  // Pagination Logic
  const filteredMembers = members || []
  const totalEntries = filteredMembers.length
  const totalPages = Math.ceil(totalEntries / rowsPerPage)
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

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

    const csvContent = [
      ["Member Code", "Name", "Email", "Phone", "Status", "Membership", "Joined Date"],
      ...members.map((member) => [
        member.memberCode || "",
        member.fullName || "",
        member.email || "",
        member.phone || "",
        member.status,
        member.currentPlan?.name || "No Plan",
        formatDate(member.joinedAt || ""),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `members-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Membership Management</h1>
        <Button 
          onClick={() => navigate("/members/add")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-bold h-11"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Member
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
        {categories.map((cat, idx) => (
          <Card key={cat.name} className={`${idx === 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-slate-900 text-slate-400'} border-none min-w-[200px] flex-1 rounded-2xl transition-all hover:scale-[1.02]`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 ${idx === 0 ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'} rounded-xl`}>
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
          <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white dark:bg-slate-950 font-bold text-slate-500" onClick={exportMembers}>
            <Download className="mr-2 h-5 w-5" /> Generate XLS Report
          </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Memberships</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="w-12 text-center">
                        <Checkbox 
                            checked={selectedMembers.length === members?.length && (members?.length ?? 0) > 0}
                            onCheckedChange={(checked) => {
                                if (checked) setSelectedMembers(members?.map(m => m.id) || [])
                                else setSelectedMembers([])
                            }}
                        />
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Client ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Full Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Mobile Number</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Duration</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Sessions</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Start Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">End Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Assigned Trainer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Add on Days</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 text-right"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedMembers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={12} className="h-32 text-center text-slate-400 font-medium italic">
                            No members found.
                        </TableCell>
                    </TableRow>
                ) : (
                    paginatedMembers.map((member) => {
                        const plan = member.currentPlan
                        const durationMonths = plan ? Math.ceil(plan.durationDays / 30) : 0
                        const trainer = trainers?.find((t: any) => t.id === member.assignedTrainerId)
                        
                        return (
                          <TableRow key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                              <TableCell className="text-center">
                                  <Checkbox 
                                      checked={selectedMembers.includes(member.id)}
                                      onCheckedChange={(checked) => {
                                          if (checked) setSelectedMembers([...selectedMembers, member.id])
                                          else setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                                      }}
                                  />
                              </TableCell>
                               <TableCell className="font-mono text-sm text-slate-500 py-6 px-4">{member.memberCode}</TableCell>
                              <TableCell className="py-6 px-4">
                                  <span 
                                      className="font-bold text-blue-600 cursor-pointer hover:underline uppercase tracking-tight text-xs"
                                      onClick={() => handleViewMember(member)}
                                  >
                                      {member.fullName}
                                  </span>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 font-bold py-6 px-4">+91 {member.phone}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4">{durationMonths} Month</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4">{durationMonths * 30}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4">{formatDate(member.planStartedAt || member.joinedAt)}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4">{formatDate(member.planExpiresAt || member.joinedAt)}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4">{trainer?.fullName || 'unassigned'}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-6 px-4 text-center">0</TableCell>
                              <TableCell className="py-6 px-4">
                                  <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 font-bold text-[10px] uppercase px-3 py-1 rounded-lg">
                                      {member.status}
                                  </Badge>
                              </TableCell>
                              <TableCell className="text-right py-6 px-4">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100">
                                              <MoreVertical className="h-5 w-5 text-slate-400" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 p-2 min-w-[180px]">
                                          <DropdownMenuItem onClick={() => handleViewMember(member)} className="rounded-xl px-4 py-2.5 font-bold text-slate-700">
                                              <Eye className="mr-3 h-4 w-4 text-blue-500" /> View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEditMember(member)} className="rounded-xl px-4 py-2.5 font-bold text-slate-700">
                                              <Edit className="mr-3 h-4 w-4 text-emerald-500" /> Edit Member
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteMember(member)}
                                            className="rounded-xl px-4 py-2.5 font-bold text-red-500"
                                          >
                                            <Trash2 className="mr-3 h-4 w-4" /> Delete Member
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                        )
                    })
                )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination Integration */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800 mt-4">
          <div className="text-xs">
              Showing <span className="text-slate-900 dark:text-white">{showingFrom}</span> to <span className="text-slate-900 dark:text-white">{showingTo}</span> of <span className="text-slate-900 dark:text-white">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs">
                  Rows per page:
                  <Select value={rowsPerPage.toString()} onValueChange={(v) => {setRowsPerPage(parseInt(v)); setCurrentPage(1);}}>
                      <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 dark:border-slate-800 font-bold">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          {[10, 25, 50, 100].map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>

              <div className="flex items-center gap-1">
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-bold rounded-lg px-3"
                  >
                      Previous
                  </Button>
                  <div className="flex items-center">
                      {Array.from({length: Math.min(3, totalPages)}, (_, i) => {
                          const pageNum = i + 1;
                          return (
                              <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`h-8 w-8 text-xs font-bold rounded-lg ${currentPage === pageNum ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white' : ''}`}
                              >
                                  {pageNum}
                              </Button>
                          )
                      })}
                  </div>
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="text-xs font-bold rounded-lg px-3"
                  >
                      Next
                  </Button>
              </div>
          </div>

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

      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600">Confirm Deletion</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Are you sure you want to delete {memberToDelete?.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => setMemberToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold h-11 px-6 bg-rose-600 hover:bg-rose-700"
              onClick={confirmDelete}
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
