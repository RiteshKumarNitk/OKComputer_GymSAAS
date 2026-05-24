import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { servicesApi, membershipsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Users, Zap, Edit, Trash2, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Service, Membership } from "@/types"
import { PageHeader, DataTable, ActionMenu, ConfirmDialog, FormDialog } from "@/components/common"
import type { Column } from "@/components/common"

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
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

    // --- SERVICES LOGIC ---
    const { data: services } = useQuery({
        queryKey: ["services", user?.tenantId],
        queryFn: async () => {
             const response = await servicesApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data as Service[]
        },
        enabled: !!user?.tenantId,
    })

    const serviceMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenantId) throw new Error("Tenant ID Missing")
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

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return
        const response = await servicesApi.delete(serviceToDelete.id)
        if (response.error) toast({ title: "Error", description: response.error.message || "Failed to delete", variant: "destructive" })
        else {
            queryClient.invalidateQueries({ queryKey: ["services"] })
            toast({ title: "Success", description: "Service deleted" })
        }
        setServiceToDelete(null)
    }

    // --- MEMBERSHIP PLANS LOGIC ---
    const { data: memberships } = useQuery({
        queryKey: ["memberships", user?.tenantId],
        queryFn: async () => {
             const response = await membershipsApi.list(user?.tenantId || "")
             if (response.error) throw response.error
             return response.data as Membership[]
        },
        enabled: !!user?.tenantId,
    })

    const membershipMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!user?.tenantId) throw new Error("Tenant ID Missing")

            const price = parseFloat(formData.get("price") as string) * 100 // Convert to cents

            const data = {
                tenantId: user.tenantId,
                name: formData.get("name") as string,
                durationDays: parseInt(formData.get("duration") as string),
                priceCents: Math.round(price),
                currency: "INR", // Force INR
                isActive: true,
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
    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget as HTMLFormElement)
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

    const serviceColumns: Column<Service>[] = [
        {
            key: "name",
            label: "Name",
            render: (service) => (
                <div className="flex items-center">
                    <div className="mr-2 p-1 bg-muted rounded-md">{getIcon(service.type)}</div>
                    <div>
                        <div>{service.name}</div>
                        <div className="text-xs text-muted-foreground">{service.description}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            render: (service) => <span className="capitalize">{service.type}</span>,
        },
        {
            key: "capacity",
            label: "Capacity",
            render: (service) => <span>{service.capacity || "Unlimited"}</span>,
        },
        {
            key: "actions",
            label: "Actions",
            headClassName: "text-right",
            className: "text-right",
            render: (service) => (
                <ActionMenu
                    onEdit={() => { setEditingService(service); setIsServiceDialogOpen(true) }}
                    onDelete={() => setServiceToDelete(service)}
                />
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Services & Pricing"
                subtitle="Manage your membership plans and facility services."
                titleClassName="text-3xl font-bold tracking-tight"
            />

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
                                        <span className="text-xl font-bold text-green-600">{formatCurrency(plan.priceCents ?? plan.priceCents)}</span>
                                    </CardTitle>
                                    <CardDescription>{plan.durationDays ?? plan.durationDays} Days Validity</CardDescription>
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
                    <DataTable
                        columns={serviceColumns}
                        data={services || []}
                        title="Classes & Facilities"
                        emptyMessage="No services found."
                        pagination={false}
                        titleAction={
                            <Button onClick={() => { setEditingService(null); setIsServiceDialogOpen(true) }}>
                                <Zap className="mr-2 h-4 w-4" /> Add Service
                            </Button>
                        }
                    />
                </TabsContent>
            </Tabs>

            {/* --- DIALOGS --- */}

            {/* 1. Edit Service Dialog */}
            <FormDialog
                open={isServiceDialogOpen}
                onOpenChange={(open) => { setIsServiceDialogOpen(open); if (!open) setEditingService(null); }}
                title={editingService ? "Edit Service" : "Add Service"}
                onSubmit={handleServiceSubmit}
                isPending={serviceMutation.isPending}
            >
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
            </FormDialog>

            <ConfirmDialog
                open={!!serviceToDelete}
                onOpenChange={(open) => !open && setServiceToDelete(null)}
                title="Delete Service"
                description={`Are you sure you want to delete "${serviceToDelete?.name}"?`}
                confirmLabel="Delete"
                onConfirm={confirmDeleteService}
            />

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
                                <Input id="m-price" name="price" type="number" placeholder="1000" defaultValue={editingMembership ? (editingMembership.priceCents ?? editingMembership.priceCents) / 100 : ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="m-duration">Duration (Days)</Label>
                                <Input id="m-duration" name="duration" type="number" placeholder="30" defaultValue={editingMembership?.durationDays ?? editingMembership?.durationDays} required />
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
