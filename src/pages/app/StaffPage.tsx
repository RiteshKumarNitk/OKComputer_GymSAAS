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
import { UserCog, Plus } from "lucide-react"

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

            // Update Trainer details if role is trainer and trainer obj exists
            if (data.role === "trainer" && data.trainerId) {
                await fetch(`/api/trainers/${data.trainerId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ specialties: data.specialties, hourlyRateCents: Number(data.hourlyRateCents) })
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
        setSelectedStaff(s)
        setEditName(s.fullName || s.full_name || "")
        setEditRole(s.role || "")
        setEditSpecialties(s.trainer?.specialties || "")
        setEditHourlyRate(String(s.trainer?.hourlyRateCents || s.trainer?.hourly_rate_cents || "0"))
        setIsEditOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground">Add and manage your gym staff profiles.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>Create a login profile for your team.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); addStaffMutation.mutate(new FormData(e.currentTarget)) }} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" required placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required placeholder="Min 6 chars" />
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
                            <DialogFooter>
                                <Button type="submit" disabled={addStaffMutation.isPending}>
                                    {addStaffMutation.isPending ? "Creating..." : "Create Account"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit staff Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Profile</DialogTitle>
                        <DialogDescription>Update name, role, and details Node layout.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        updateStaffMutation.mutate({
                            id: selectedStaff?.id,
                            fullName: editName,
                            role: editRole,
                            trainerId: selectedStaff?.trainer?.id,
                            specialties: editSpecialties,
                            hourlyRateCents: editHourlyRate
                        })
                    }} className="space-y-4">
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
                        {editRole === "trainer" && (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="editSpecialties">Specialties</Label>
                                    <Input id="editSpecialties" value={editSpecialties} onChange={(e)=>setEditSpecialties(e.target.value)} placeholder="Cardio, Strength, Nutrition" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="editHourlyRate">Hourly Rate (₹)</Label>
                                    <Input id="editHourlyRate" type="number" value={editHourlyRate} onChange={(e)=>setEditHourlyRate(e.target.value)} placeholder="500" />
                                </div>
                            </>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={updateStaffMutation.isPending}>
                                {updateStaffMutation.isPending ? "Updating..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff?.map((s: any) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center">
                                            <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {s.fullName ?? s.full_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{s.email}</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{s.role}</Badge></TableCell>
                                    <TableCell>{s.isActive ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" className="mr-2" onClick={() => handleEditClick(s)}>Edit</Button>
                                        <Button size="sm" variant="destructive" onClick={() => deactivateStaffMutation.mutate(s.id)}>Deactivate</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staff?.length === 0 && !isLoading && (
                                <TableRow><TableCell colSpan={5} className="text-center py-4">No staff members found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default StaffPage;
