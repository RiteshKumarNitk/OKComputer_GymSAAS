import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { servicesApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Users, Zap, Edit, Trash2, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
// Ensure Membership type is imported or defined
// If your type index has Membership, import it. 
import { Service, Membership } from "@/types"

export const ServicesPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("memberships") // Default to memberships as it's critical
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [editingMembership, setEditingMembership] = useState<Membership | null>(null)

    // Dialog States
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
    const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false)
    const [isCreateMembershipOpen, setIsCreateMembershipOpen] = useState(false)

    // --- SERVICES LOGIC ---
    const { data: services } = useQuery({
        queryKey: ["services", user?.tenant_id],
        queryFn: async () => {
             const response = await servicesApi.list(user?.tenant_id || "")
             if (response.error) throw response.error
             return response.data as Service[]
        },
        enabled: !!user?.tenant_id,
    })

    const serviceMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenant_id) throw new Error("Tenant ID Missing")
            const data = {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                type: formData.get("type") as string,
                capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
            }
            let response;
            if (editingService) {
                response = await servicesApi.update(editingService.id, data)
            } else {
                response = await servicesApi.create(data)
            }
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            setIsServiceDialogOpen(false)
            setEditingService(null)
            toast({ title: "Success", description: "Service saved" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    const deleteService = async (id: string) => {
        if (!confirm("Delete this service?")) return
        const response = await servicesApi.delete(id)
        if (response.error) toast({ title: "Error", description: response.error.message || "Failed to delete", variant: "destructive" })
        else {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            toast({ title: "Success", description: "Service deleted" })
        }
    }

    // --- MEMBERSHIP PLANS LOGIC ---
    const { data: memberships } = useQuery({
        queryKey: ["memberships", user?.tenant_id],
        queryFn: async () => {
             const response = await membershipsApi.list(user?.tenant_id || "")
             if (response.error) throw response.error
             return response.data as Membership[]
        },
        enabled: !!user?.tenant_id,
    })

    const membershipMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenant_id) throw new Error("Tenant ID Missing")

            const price = parseFloat(formData.get("price") as string) * 100 // Convert to cents

            const data = {
                tenant_id: user.tenant_id,
                name: formData.get("name") as string,
                duration_days: parseInt(formData.get("duration") as string),
                price_cents: Math.round(price),
                currency: "INR", // Force INR
                is_active: true,
                description: formData.get("description") as string,
            }

            let response;
            if (editingMembership) {
                response = await membershipsApi.update(editingMembership.id, data)
            } else {
                response = await membershipsApi.create(data)
            }
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["memberships"] })
            setIsMembershipDialogOpen(false)
            setIsCreateMembershipOpen(false)
            setEditingMembership(null)
            toast({ title: "Success", description: "Membership plan saved" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    const deleteMembership = async (id: string) => {
        if (!confirm("Delete this membership plan? Existing members on this plan will NOT be affected, but new members cannot select it.")) return
        const response = await membershipsApi.update(id, { isActive: false })
        if (response.error) toast({ title: "Error", description: response.error.message || "Failed to deactivate", variant: "destructive" })
        else {
            queryClient.invalidateQueries({ queryKey: ["memberships"] })
            toast({ title: "Success", description: "Membership plan deactivated" })
        }
    }


    // --- HANDLERS ---
    const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        serviceMutation.mutate(formData)
    }

    const handleMembershipSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        membershipMutation.mutate(formData)
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
                    <h1 className="text-3xl font-bold tracking-tight">Services & Pricing</h1>
                    <p className="text-muted-foreground">Manage your membership plans and facility services.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="memberships">Membership Plans</TabsTrigger>
                    <TabsTrigger value="services">Services & Classes</TabsTrigger>
                    {/* <TabsTrigger value="create">Add New</TabsTrigger> */}
                </TabsList>

                {/* --- MEMBERSHIP PLANS TAB --- */}
                <TabsContent value="memberships" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => { setEditingMembership(null); setIsCreateMembershipOpen(true); }}>
                            <CreditCard className="mr-2 h-4 w-4" /> Create Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {memberships?.map((plan) => (
                            <Card key={plan.id} className="relative group hover:shadow-md transition-all">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>{plan.name}</span>
                                        <span className="text-xl font-bold text-green-600">{formatCurrency(plan.priceCents ?? plan.price_cents)}</span>
                                    </CardTitle>
                                    <CardDescription>{plan.durationDays ?? plan.duration_days} Days Validity</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">{plan.description || "No description provided."}</p>
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="sm" onClick={() => { setEditingMembership(plan); setIsMembershipDialogOpen(true); }}>
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => deleteMembership(plan.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {memberships?.length === 0 && (
                            <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
                                <h3 className="text-lg font-medium">No Membership Plans Found</h3>
                                <p className="text-muted-foreground mb-4">You need to create plans (e.g., Monthly, Yearly) for members to join.</p>
                                <Button onClick={() => setIsCreateMembershipOpen(true)}>Create Your First Plan</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- SERVICES TAB --- */}
                <TabsContent value="services" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => { setEditingService(null); setIsServiceDialogOpen(true) }}>
                            <Zap className="mr-2 h-4 w-4" /> Add Service
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Classes & Facilities</CardTitle>
                            <CardDescription>Extra services like Personal Training, Zumba, etc.</CardDescription>
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
                                                    <div className="mr-2 p-1 bg-muted rounded-md">{getIcon(service.type)}</div>
                                                    <div>
                                                        <div>{service.name}</div>
                                                        <div className="text-xs text-muted-foreground">{service.description}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{service.type}</TableCell>
                                            <TableCell>{service.capacity || "Unlimited"}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingService(service); setIsServiceDialogOpen(true) }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteService(service.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {services?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No services found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- DIALOGS --- */}

            {/* 1. Edit Service Dialog */}
            <Dialog open={isServiceDialogOpen} onOpenChange={(open) => { setIsServiceDialogOpen(open); if (!open) setEditingService(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleServiceSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="s-name">Name</Label>
                            <Input id="s-name" name="name" defaultValue={editingService?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="s-type">Type</Label>
                            <Select name="type" defaultValue={editingService?.type || "class"}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class">Group Class</SelectItem>
                                    <SelectItem value="training">Personal Training</SelectItem>
                                    <SelectItem value="facility">Facility Access</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="s-capacity">Capacity</Label>
                            <Input id="s-capacity" name="capacity" type="number" defaultValue={editingService?.capacity || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="s-desc">Description</Label>
                            <Input id="s-desc" name="description" defaultValue={editingService?.description || ""} />
                        </div>
                        <DialogFooter><Button type="submit">{serviceMutation.isPending ? "Saving..." : "Save"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2. Create/Edit Membership Dialog */}
            <Dialog open={isCreateMembershipOpen || isMembershipDialogOpen} onOpenChange={(open) => {
                setIsCreateMembershipOpen(open);
                setIsMembershipDialogOpen(open);
                if (!open) setEditingMembership(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMembership ? "Edit Membership Plan" : "Create Membership Plan"}</DialogTitle>
                        <DialogDescription>Define a plan like "Monthly Gold" or "Yearly Basic".</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMembershipSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="m-name">Plan Name</Label>
                            <Input id="m-name" name="name" placeholder="e.g. Gold Monthly" defaultValue={editingMembership?.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="m-price">Price (₹)</Label>
                                <Input id="m-price" name="price" type="number" placeholder="1000" defaultValue={editingMembership ? (editingMembership.priceCents ?? editingMembership.price_cents) / 100 : ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="m-duration">Duration (Days)</Label>
                                <Input id="m-duration" name="duration" type="number" placeholder="30" defaultValue={editingMembership?.durationDays ?? editingMembership?.duration_days} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="m-desc">Description / Perks</Label>
                            <Input id="m-desc" name="description" placeholder="Includes cardio and lockers..." defaultValue={editingMembership?.description || ""} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">{membershipMutation.isPending ? "Saving..." : "Save Plan"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
