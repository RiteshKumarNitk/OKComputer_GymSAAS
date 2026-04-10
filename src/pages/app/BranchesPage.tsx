import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { branchesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Building, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Branch } from "@/types"

export const BranchesPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("list")
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false) // For Edit only

    // Fetch Branches
    const { data: branches } = useQuery({
        queryKey: ["branches", user?.tenantId],
        queryFn: async () => {
             const response = await branchesApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data as Branch[]
        },
        enabled: !!user?.tenantId,
    })

    // Create/Update Mutation
    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const data = {
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                phone: formData.get("phone") as string,
            }
            
            let response;
            if (editingBranch) {
                response = await branchesApi.update(editingBranch.id, data)
            } else {
                response = await branchesApi.create(data)
            }
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches"] })
            setIsDialogOpen(false)
            setEditingBranch(null)
            if (!editingBranch) {
                setActiveTab("list") // Switch back to list after create
            }
            toast({ title: "Success", description: `Branch ${editingBranch ? "updated" : "created"} successfully` })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        mutation.mutate(formData)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this branch?")) return
        const response = await branchesApi.delete(id)
        if (response.error) {
            toast({ title: "Error", description: response.error.message || "Delete failed", variant: "destructive" })
        } else {
            queryClient.invalidateQueries({ queryKey: ["branches"] })
            toast({ title: "Success", description: "Branch deleted successfully" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                    <p className="text-muted-foreground">Manage your gym locations.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">View Branches List</TabsTrigger>
                    <TabsTrigger value="create">Create New Branch</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Branches</CardTitle>
                            <CardDescription>A list of all your gym branches.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branches?.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {branch.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground">
                                                    <MapPin className="mr-2 h-3 w-3" />
                                                    {branch.address || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Phone className="mr-2 h-3 w-3" />
                                                    {branch.phone || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setEditingBranch(branch)
                                                    setIsDialogOpen(true)
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(branch.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {branches?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No branches found. Create your first one!
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
                            <CardTitle>Add New Branch</CardTitle>
                            <CardDescription>Enter the details for this location.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Branch Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Downtown Branch" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" placeholder="Full address" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" placeholder="Contact number" />
                                </div>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Creating..." : "Create Branch"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setEditingBranch(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                        <DialogDescription>Update branch details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Branch Name</Label>
                            <Input id="edit-name" name="name" defaultValue={editingBranch?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address</Label>
                            <Input id="edit-address" name="address" defaultValue={editingBranch?.address || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input id="edit-phone" name="phone" defaultValue={editingBranch?.phone || ""} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
