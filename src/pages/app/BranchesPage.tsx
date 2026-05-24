import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { branchesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Building } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Branch } from "@/types"
import { PageHeader, DataTable, ActionMenu, ConfirmDialog } from "@/components/common"

export const BranchesPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("list")
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false) // For Edit only
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)

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

    const confirmDeleteBranch = async () => {
        if (!branchToDelete) return
        const response = await branchesApi.delete(branchToDelete.id)
        if (response.error) {
            toast({ title: "Error", description: response.error.message || "Delete failed", variant: "destructive" })
        } else {
            queryClient.invalidateQueries({ queryKey: ["branches"] })
            toast({ title: "Success", description: "Branch deleted successfully" })
        }
        setBranchToDelete(null)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Branches"
                subtitle="Manage your gym locations."
                titleClassName="text-3xl font-bold tracking-tight"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">View Branches List</TabsTrigger>
                    <TabsTrigger value="create">Create New Branch</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <DataTable
                        columns={[
                            {
                                key: "name",
                                label: "Name",
                                render: (branch: Branch) => (
                                    <div className="flex items-center">
                                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {branch.name}
                                    </div>
                                ),
                            },
                            {
                                key: "address",
                                label: "Address",
                                render: (branch: Branch) => (
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="mr-2 h-3 w-3" />
                                        {branch.address || "-"}
                                    </div>
                                ),
                            },
                            {
                                key: "phone",
                                label: "Phone",
                                render: (branch: Branch) => (
                                    <div className="flex items-center text-muted-foreground">
                                        <Phone className="mr-2 h-3 w-3" />
                                        {branch.phone || "-"}
                                    </div>
                                ),
                            },
                            {
                                key: "actions",
                                label: "Actions",
                                headClassName: "text-right",
                                className: "text-right",
                                render: (branch: Branch) => (
                                    <ActionMenu
                                        onEdit={() => {
                                            setEditingBranch(branch)
                                            setIsDialogOpen(true)
                                        }}
                                        onDelete={() => setBranchToDelete(branch)}
                                    />
                                ),
                            },
                        ]}
                        data={branches || []}
                        title="All Branches"
                        emptyMessage="No branches found. Create your first one!"
                        pagination={false}
                    />
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

            <ConfirmDialog
                open={!!branchToDelete}
                onOpenChange={(open) => !open && setBranchToDelete(null)}
                title="Delete Branch"
                description={`Are you sure you want to delete "${branchToDelete?.name}"?`}
                confirmLabel="Delete"
                onConfirm={confirmDeleteBranch}
            />

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
