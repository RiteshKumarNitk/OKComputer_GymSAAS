import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Users, Zap, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Service } from "@/types"

export const ServicesPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("list")
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false) // For Edit only

    // Fetch Services
    const { data: services, isLoading } = useQuery({
        queryKey: ["services", user?.tenant_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("services")
                .select("*")
                .eq("tenant_id", user?.tenant_id)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as Service[]
        },
        enabled: !!user?.tenant_id,
    })

    // Create/Update Mutation
    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenant_id) {
                throw new Error("Tenant ID is missing. Please refresh the page or contact support.")
            }

            const data = {
                tenant_id: user.tenant_id,
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                type: formData.get("type") as string,
                capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
            }

            if (editingService) {
                const { error } = await supabase
                    .from("services")
                    .update(data)
                    .eq("id", editingService.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from("services").insert([data])
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            setIsDialogOpen(false)
            setEditingService(null)
            if (!editingService) {
                setActiveTab("list") // Switch back to list after create
            }
            toast({ title: "Success", description: `Service ${editingService ? "updated" : "created"} successfully` })
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
        if (!confirm("Are you sure you want to delete this service?")) return
        const { error } = await supabase.from("services").delete().eq("id", id)
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } else {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            toast({ title: "Success", description: "Service deleted successfully" })
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "class": return <Users className="h-4 w-4" />
            case "training": return <Dumbbell className="h-4 w-4" />
            default: return <Zap className="h-4 w-4" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                    <p className="text-muted-foreground">Manage classes, facilities, and training types.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">View Services List</TabsTrigger>
                    <TabsTrigger value="create">Create New Service</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Services</CardTitle>
                            <CardDescription>List of services available to members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services?.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <div className="mr-2 p-1 bg-muted rounded-md">
                                                        {getIcon(service.type)}
                                                    </div>
                                                    <div>
                                                        <div>{service.name}</div>
                                                        <div className="text-xs text-muted-foreground">{service.description}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{service.type}</TableCell>
                                            <TableCell>{service.capacity || "Unlimited"}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setEditingService(service)
                                                    setIsDialogOpen(true)
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(service.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {services?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No services found. Add your first service!
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
                            <CardTitle>Add New Service</CardTitle>
                            <CardDescription>Define what your gym offers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Zumba Class" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" defaultValue="class">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="class">Group Class</SelectItem>
                                            <SelectItem value="training">Personal Training</SelectItem>
                                            <SelectItem value="facility">Facility Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity (Optional)</Label>
                                    <Input id="capacity" name="capacity" type="number" placeholder="Max participants" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" name="description" placeholder="Brief description" />
                                </div>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Creating..." : "Create Service"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setEditingService(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Update service details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Service Name</Label>
                            <Input id="edit-name" name="name" defaultValue={editingService?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select name="type" defaultValue={editingService?.type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class">Group Class</SelectItem>
                                    <SelectItem value="training">Personal Training</SelectItem>
                                    <SelectItem value="facility">Facility Access</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-capacity">Capacity (Optional)</Label>
                            <Input id="edit-capacity" name="capacity" type="number" defaultValue={editingService?.capacity || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input id="edit-description" name="description" defaultValue={editingService?.description || ""} />
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
