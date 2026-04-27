import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Calendar as CalendarIcon, Search, BadgeCheck, UserCog, Plus, Clock, Briefcase } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"

export const StaffPage: React.FC = () => {
    const { user, signUp } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [staffSearch, setStaffSearch] = useState("")

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Form inputs for editing
    const [editName, setEditName] = useState("")
    const [editRole, setEditRole] = useState("")
    const [editSpecialties, setEditSpecialties] = useState("")
    const [editHourlyRate, setEditHourlyRate] = useState("")
    const [editJoiningDate, setEditJoiningDate] = useState("")
    const [editResignationDate, setEditResignationDate] = useState("")
    const [editShift, setEditShift] = useState("morning")
    const [editSalary, setEditSalary] = useState("0")

    // Fetch Staff using profiles API
    const { data: staffProfiles } = useQuery({
        queryKey: ["staff-profiles", user?.tenant_id],
        queryFn: async () => {
             const token = localStorage.getItem("gym_token")
             const res = await fetch(`/api/staff/profiles`, {
                 headers: { "Authorization": `Bearer ${token}` }
             })
             if (!res.ok) throw new Error("Failed to fetch staff profiles")
             return await res.json()
        },
        enabled: !!user?.tenant_id
    })

    const { data: leaves, isLoading: leavesLoading } = useQuery({
        queryKey: ["staff-leaves", user?.tenant_id],
        queryFn: async () => {
             const token = localStorage.getItem("gym_token")
             const res = await fetch(`/api/staff/leaves`, {
                 headers: { "Authorization": `Bearer ${token}` }
             })
             if (!res.ok) throw new Error("Failed to fetch leaves")
             return await res.json()
        },
        enabled: !!user?.tenant_id
    })

    // Fetch Staff using generic API or list users
    const { data: staff, isLoading } = useQuery({
        queryKey: ["staff", user?.tenant_id],
        queryFn: async () => {
             const token = localStorage.getItem("gym_token")
             const res = await fetch(`/api/users`, {
                 headers: { "Authorization": `Bearer ${token}` }
             })
             if (!res.ok) throw new Error("Failed to fetch staff")
             const items = await res.json()
             // Filter for managers, trainers, frontdesk
             return items.filter((u: any) => ["manager", "trainer", "frontdesk"].includes(u.role))
        },
        enabled: !!user?.tenant_id
    })

    const addStaffMutation = useMutation({
        mutationFn: async (formData: FormData) => {
             const email = formData.get("email") as string
             const password = formData.get("password") as string
             const fullName = formData.get("fullName") as string
             const role = formData.get("role") as string

             await signUp(email, password, fullName, role)
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["staff"] })
             setIsAddOpen(false)
             toast({ title: "Success", description: "Staff created successfully" })
        },
        onError: (err: any) => {
             toast({ title: "Error", description: err.message || "Failed to create", variant: "destructive" })
        }
    })

    const updateStaffMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem("gym_token")
            // Update User Profile
            const userRes = await fetch(`/api/users/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ fullName: data.fullName, role: data.role })
            })
            if (!userRes.ok) throw new Error("Failed to update user Profile")

            // Update Trainer details if role is trainer and trainerId exists
            if (data.role === "trainer" && data.trainerId) {
                await fetch(`/api/trainers/${data.trainerId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ specialties: data.specialties, hourlyRateCents: Number(data.hourlyRateCents) })
                })
            }

            // Update Staff Profile (Joining date, Shift, etc.)
            const profile = staffProfiles?.find((p: any) => p.userId === data.id)
            if (profile) {
                await fetch(`/api/staff/profiles/${profile.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        joiningDate: data.joiningDate,
                        resignationDate: data.resignationDate || null,
                        shift: data.shift,
                        salaryPerMonth: Number(data.salary) * 100
                    })
                })
            }
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["staff"] })
             setIsEditOpen(false)
             toast({ title: "Success", description: "Staff updated successfully" })
        },
         onError: (err: any) => {
             toast({ title: "Error", description: err.message || "Update failed", variant: "destructive" })
        }
    })

    const handleEditClick = (s: any) => {
        const profile = staffProfiles?.find((p: any) => p.userId === s.id)
        setSelectedStaff(s)
        setEditName(s.fullName || s.full_name || "")
        setEditRole(s.role || "")
        setEditSpecialties(s.trainer?.specialties || "")
        setEditHourlyRate(String(s.trainer?.hourlyRateCents || s.trainer?.hourly_rate_cents || "0"))
        
        setEditJoiningDate(profile?.joiningDate?.split("T")[0] || "")
        setEditResignationDate(profile?.resignationDate?.split("T")[0] || "")
        setEditShift(profile?.shift || "morning")
        setEditSalary(String((profile?.salaryPerMonth || 0) / 100))
        setIsEditOpen(true)
    }

    const filteredStaff = staff?.filter((s: any) => 
        (s.fullName || s.full_name || "").toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(staffSearch.toLowerCase())
    ) || []

    // Pagination Logic
    const totalEntries = filteredStaff.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedStaff = filteredStaff.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff & HR Management</h1>
                    <p className="text-muted-foreground">Manage your team, shifts, and leaves.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search team members..."
                            className="pl-9"
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Staff Member</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Staff Member</DialogTitle>
                                <DialogDescription>Create a login profile for your team.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); addStaffMutation.mutate(new FormData(e.currentTarget)) }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input id="fullName" name="fullName" required placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" defaultValue="trainer">
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="trainer">Trainer</SelectItem>
                                                <SelectItem value="frontdesk">Front Desk</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required placeholder="Min 6 chars" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full" disabled={addStaffMutation.isPending}>
                                        {addStaffMutation.isPending ? "Creating..." : "Create Account"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="staff" className="space-y-6">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="staff">Staff Directory</TabsTrigger>
                    <TabsTrigger value="leaves">Leave Management</TabsTrigger>
                </TabsList>

                <TabsContent value="staff" className="space-y-6">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff Info</TableHead>
                                        <TableHead>Batch/Shift</TableHead>
                                        <TableHead>Joining Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                         Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse">
                                                <TableCell colSpan={5} className="h-16 bg-slate-50/50 mb-2 rounded-xl" />
                                            </TableRow>
                                         ))
                                    ) : paginatedStaff.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                                                No staff members found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedStaff.map((s: any) => {
                                        const profile = staffProfiles?.find((p: any) => p.userId === s.id)
                                        return (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center">
                                                        <div className="bg-slate-100 p-2 rounded-full mr-3 text-slate-500">
                                                            <UserCog className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{s.fullName ?? s.full_name}</div>
                                                            <div className="text-xs text-muted-foreground capitalize">{s.role} • {s.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize flex items-center w-fit">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {profile?.shift || "Morning"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {profile?.joiningDate ? formatDate(profile.joiningDate) : "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {s.isActive ? 
                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Active</Badge> : 
                                                        <Badge variant="destructive">Inactive</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="ghost" className="mr-2" onClick={() => handleEditClick(s)}>
                                                        <Briefcase className="h-4 w-4 mr-1" /> Edit HR
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination Integration */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                        <div className="text-xs">
                            Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of <span className="text-slate-900">{totalEntries}</span> entries
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                Rows per page:
                                <Select value={rowsPerPage.toString()} onValueChange={(v) => {setRowsPerPage(parseInt(v)); setCurrentPage(1);}}>
                                    <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map(n => (
                                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                                className={`h-8 w-8 text-xs font-bold rounded-lg ${currentPage === pageNum ? 'bg-slate-900 text-white' : ''}`}
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
                    </div>
                </TabsContent>

                <TabsContent value="leaves">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaves?.map((l: any) => (
                                        <TableRow key={l.id}>
                                            <TableCell className="font-medium">{l.staff?.user?.fullName || "Staff"}</TableCell>
                                            <TableCell><Badge variant="outline" className="capitalize">{l.leaveType}</Badge></TableCell>
                                            <TableCell className="text-sm">{formatDate(l.startDate)} - {formatDate(l.endDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant={l.status === "approved" ? "default" : l.status === "pending" ? "secondary" : "destructive"}>
                                                    {l.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground italic">{l.reason || "No reason provided"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {leaves?.length === 0 && !leavesLoading && (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No leave records found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit staff Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit HR Details</DialogTitle>
                        <DialogDescription>Manage joining dates, salary, and shifts.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        updateStaffMutation.mutate({
                            id: selectedStaff?.id,
                            fullName: editName,
                            role: editRole,
                            trainerId: selectedStaff?.trainer?.id,
                            specialties: editSpecialties,
                            hourlyRateCents: editHourlyRate,
                            joiningDate: editJoiningDate,
                            resignationDate: editResignationDate,
                            shift: editShift,
                            salary: editSalary
                        })
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="editName">Full Name</Label>
                                <Input id="editName" value={editName} onChange={(e)=>setEditName(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="editRole">Role</Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="trainer">Trainer</SelectItem>
                                        <SelectItem value="frontdesk">Front Desk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-1">
                                <Label>Joining Date</Label>
                                <Input type="date" value={editJoiningDate} onChange={(e)=>setEditJoiningDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>Shift / Batch</Label>
                                <Select value={editShift} onValueChange={setEditShift}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morning">Morning Batch</SelectItem>
                                        <SelectItem value="evening">Evening Batch</SelectItem>
                                        <SelectItem value="both">All Day (Double)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Salary (₹/mo)</Label>
                                <Input type="number" value={editSalary} onChange={(e)=>setEditSalary(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>Resignation Date</Label>
                                <Input type="date" value={editResignationDate} onChange={(e)=>setEditResignationDate(e.target.value)} placeholder="If applicable" />
                            </div>
                        </div>
                        
                        {editRole === "trainer" && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="space-y-1">
                                    <Label htmlFor="editSpecialties">Trainer Specialties</Label>
                                    <Input id="editSpecialties" value={editSpecialties} onChange={(e)=>setEditSpecialties(e.target.value)} placeholder="Cardio, Strength, Nutrition" />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={updateStaffMutation.isPending}>
                                {updateStaffMutation.isPending ? "Updating..." : "Save HR Record"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default StaffPage;
