import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { frontDeskApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import {
    Search,
    Edit,
    Trash2,
    MoreVertical,
    Mail,
    Phone,
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { UserRole } from "@/types"

interface FrontDeskStaff {
    id: string
    fullName?: string
    email: string
    phone: string
    isActive?: boolean
}

export const StaffManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("list")
    const [isDialogOpen, setIsDialogOpen] = useState(false) // For Edit only
    const [selectedStaff, setSelectedStaff] = useState<FrontDeskStaff | null>(null)
    const [staffToDelete, setStaffToDelete] = useState<FrontDeskStaff | null>(null)
    const { user, hasRole } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const canManageStaff = hasRole(["gym_owner", "manager"] as UserRole[])

    // Fetch Front Desk Staff
    const { data: staffList } = useQuery({
        queryKey: ["front_desk", user?.tenantId],
        queryFn: async () => {
             const response = await frontDeskApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data as FrontDeskStaff[]
        },
        enabled: !!user?.tenantId,
    })

    // Create/Update Mutation
    const saveStaffMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenantId) {
                throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
            }

            const data = {
                fullName: formData.get("fullName") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
                isActive: true,
            }

            if (selectedStaff) {
                const response = await frontDeskApi.update(selectedStaff.id, data)
                if (response.error) throw response.error
            } else {
                const response = await frontDeskApi.create(data)
                if (response.error) throw response.error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["front_desk"] })
            setIsDialogOpen(false)
            setSelectedStaff(null)
            if (!selectedStaff) {
                setActiveTab("list") // Switch back to list after create
            }
            toast({ title: "Success", description: `Staff ${selectedStaff ? "updated" : "added"} successfully` })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
    })

    // Delete Mutation
    const deleteStaffMutation = useMutation({
        mutationFn: async (id: string) => {
             const response = await frontDeskApi.delete(id)
             if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["front_desk"] })
            setStaffToDelete(null)
            toast({ title: "Success", description: "Staff deleted successfully" })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        saveStaffMutation.mutate(formData)
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">View Staff List</TabsTrigger>
                    {canManageStaff && <TabsTrigger value="create">Add New Staff</TabsTrigger>}
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Staff List</CardTitle>
                            <CardDescription>Manage your front desk team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        {canManageStaff && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffList?.map((staff) => (
                                        <TableRow key={staff.id}>
                                            <TableCell className="font-medium">{staff.fullName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1 text-sm">
                                                    <div className="flex items-center">
                                                        <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                                                        {staff.email}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                                                        {staff.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={staff.isActive ? "default" : "secondary"}>
                                                    {staff.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            {canManageStaff && (
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setSelectedStaff(staff); setIsDialogOpen(true); }}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setStaffToDelete(staff)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {staffList?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No staff found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="create" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Staff</CardTitle>
                            <CardDescription>Add a new front desk staff member.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" disabled={saveStaffMutation.isPending}>
                                    {saveStaffMutation.isPending ? "Adding..." : "Add Staff"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff</DialogTitle>
                        <DialogDescription>
                            Update staff details
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-fullName">Full Name</Label>
                                <Input
                                    id="edit-fullName"
                                    name="fullName"
                                    defaultValue={selectedStaff?.fullName}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        name="email"
                                        type="email"
                                        defaultValue={selectedStaff?.email || ""}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">Phone</Label>
                                    <Input
                                        id="edit-phone"
                                        name="phone"
                                        defaultValue={selectedStaff?.phone || ""}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saveStaffMutation.isPending}>
                                {saveStaffMutation.isPending ? "Saving..." : "Save Staff"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {staffToDelete?.fullName}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStaffToDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => staffToDelete && deleteStaffMutation.mutate(staffToDelete.id)}
                            disabled={deleteStaffMutation.isPending}
                        >
                            {deleteStaffMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
