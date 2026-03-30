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
import { UserCog, Plus, Calendar, Clock, Briefcase, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatCurrency } from "@/lib/utils"

export const StaffPage: React.FC = () => {
    const { user, signUp } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)

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
    const { data: staffProfiles, isLoading: profilesLoading } = useQuery({
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

    // Import usersApi, trainersApi implicitly if not on screen, but they are defined in apiClient.ts 
    // We can fetch them safely inside mutation calls
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

    const deactivateStaffMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = localStorage.getItem("gym_token")
            await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ isActive: false })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["staff"] })
             toast({ title: "Deactivated", description: "Account disabled" })
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff & HR Management</h1>
                    <p className="text-muted-foreground">Manage your team, shifts, and leaves.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
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
                                    {staff?.map((s: any) => {
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
                                                        <Calendar className="mr-2 h-3 w-3" />
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
                                    })}
                                    {staff?.length === 0 && !isLoading && (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No staff members found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
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
