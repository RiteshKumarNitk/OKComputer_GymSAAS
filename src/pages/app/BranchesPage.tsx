import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MapPin, Phone, Building } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Branch } from "@/types"

export const BranchesPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

    // Fetch Branches
    const { data: branches, isLoading } = useQuery({
        queryKey: ["branches", user?.tenant_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("branches")
                .select("*")
                .eq("tenant_id", user?.tenant_id)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as Branch[]
        },
        enabled: !!user?.tenant_id,
    })

    // Create/Update Mutation
    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const data = {
                tenant_id: user?.tenant_id,
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                phone: formData.get("phone") as string,
            }

            if (editingBranch) {
                const { error } = await supabase
                    .from("branches")
                    .update(data)
                    .eq("id", editingBranch.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from("branches").insert([data])
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches"] })
            setIsDialogOpen(false)
            setEditingBranch(null)
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
        const { error } = await supabase.from("branches").delete().eq("id", id)
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
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
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingBranch(null)
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                            <DialogDescription>Enter the details for this location.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Branch Name</Label>
                                <Input id="name" name="name" defaultValue={editingBranch?.name} required placeholder="e.g. Downtown Branch" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" defaultValue={editingBranch?.address || ""} placeholder="Full address" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={editingBranch?.phone || ""} placeholder="Contact number" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : "Save Branch"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

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
                                        }}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(branch.id)}>Delete</Button>
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
        </div>
    )
}
