import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import type { Member, Membership } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  MoreVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberForm } from "@/features/members/MemberForm"
import { MemberDetails } from "@/features/members/MemberDetails"
import { Skeleton } from "@/components/ui/skeleton"

export const MembersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberForm, setShowMemberForm] = useState(false) // For Edit only
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      case "expired":
        return "outline"
      default:
        return "default"
    }
  }

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setShowMemberForm(true)
  }

  const handleViewMember = (member: Member) => {
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
    // Implement CSV export
    if (!members) return

    const csvContent = [
      ["Member Code", "Name", "Email", "Phone", "Status", "Membership", "Joined Date"],
      ...members.map((member) => [
        member.memberCode ?? member.memberCode,
        member.fullName ?? member.fullName,
        member.email || "",
        member.phone || "",
        member.status,
        member.currentPlan?.name || "No Plan",
        formatDate(member.joinedAt ?? member.joinedAt),
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
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
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/front-desk")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
             <ArrowLeft className="h-4 w-4" /> Back to Desk
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportMembers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">View Members List</TabsTrigger>
          <TabsTrigger value="create">Add New Member</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Inactive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspended</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("expired")}>Expired</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage your gym members and their memberships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members?.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.memberCode ?? member.memberCode}</TableCell>
                        <TableCell>{member.fullName ?? member.fullName}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>
                          {member.currentPlan?.name || "No Plan"}
                          {member.currentPlan && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(member.currentPlan?.priceCents ?? 0, member.currentPlan?.currency || "INR")} / {member.currentPlan?.durationDays ?? 0} days
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(member.joinedAt ?? member.joinedAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewMember(member)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteMember(member)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {members?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Member</CardTitle>
              <CardDescription>
                Create a new member account and assign a membership plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberForm
                memberships={memberships || []}
                onSuccess={() => {
                  setActiveTab("list")
                }}
                onCancel={() => {
                  setActiveTab("list")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={showMemberForm} onOpenChange={(open) => {
        setShowMemberForm(open)
        if (!open) setSelectedMember(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
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

      {/* Member Details Dialog */}
      <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {memberToDelete?.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
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