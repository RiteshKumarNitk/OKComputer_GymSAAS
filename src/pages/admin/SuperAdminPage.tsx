import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building, UserPlus, Trash2, CreditCard, Banknote, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"

const ALL_FEATURES = [
    { id: "members", label: "Member Management" },
    { id: "trainers", label: "Trainers" },
    { id: "front-desk", label: "Front Desk" },
    { id: "branches", label: "Branches" },
    { id: "services", label: "Services" },
    { id: "attendance", label: "Attendance" },
    { id: "schedule", label: "Class Schedule" },
    { id: "billing", label: "Billing & Payments" },
    { id: "workouts", label: "Workouts" },
    { id: "diet-plans", label: "Diet Plans" },
    { id: "reports", label: "Reports" },
    { id: "analytics", label: "Analytics" }
]

export const SuperAdminPage: React.FC = () => {
    const [isTenantWizardOpen, setIsTenantWizardOpen] = useState(false)
    const [selectedTenant, setSelectedTenant] = useState<any>(null)
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)
    const [featureList, setFeatureList] = useState<string[]>([])
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [selectedPlanId, setSelectedPlanId] = useState<string>("")
    const [generateInvoice, setGenerateInvoice] = useState(true)
    const [isEditPlanOpen, setIsEditPlanOpen] = useState(false)
    const [editPlanForm, setEditPlanForm] = useState({ name: "", description: "", price_inr: 0, features: [] as string[] })

    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Fetch Tenants
    const { data: tenants, isLoading: isLoadingTenants } = useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false })
            if (error) throw error
            return data
        },
    })

    // Fetch SaaS Plans
    const { data: plans } = useQuery({
        queryKey: ["saas_plans"],
        queryFn: async () => {
            const { data, error } = await supabase.from("saas_plans").select("*").eq("is_active", true).order("price_inr")
            if (error) throw error
            return data
        }
    })

    // Fetch Invoices
    const { data: invoices } = useQuery({
        queryKey: ["saas_invoices"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("saas_invoices")
                .select("*, tenants(name)")
                .order("created_at", { ascending: false })
            if (error) throw error
            return data
        }
    })

    // Mutation: Update Features
    const updateFeaturesMutation = useMutation({
        mutationFn: async (data: { tenantId: string, features: string[] }) => {
            const { error } = await supabase
                .from("tenants")
                .update({ features: data.features })
                .eq("id", data.tenantId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            setIsFeaturesOpen(false)
            toast({ title: "Updated", description: "Tenant features updated successfully." })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Mutation: Assign Subscription
    const assignSubscriptionMutation = useMutation({
        mutationFn: async (data: { tenantId: string, planId: string, generateInvoice: boolean }) => {
            // 1. Get Plan Details
            const plan = plans?.find(p => p.id === data.planId)
            if (!plan) throw new Error("Plan not found")

            // 2. Insert Subscription
            const startDate = new Date()
            const endDate = new Date()
            endDate.setDate(startDate.getDate() + (plan.duration_days || 365))

            const { data: subData, error: subError } = await supabase
                .from("saas_subscriptions")
                .insert({
                    tenant_id: data.tenantId,
                    plan_id: data.planId,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    price_paid_inr: plan.price_inr,
                    status: 'active'
                })
                .select()
                .single()

            if (subError) throw subError

            // 3. Update Tenant Features based on plan
            const { error: featuresError } = await supabase
                .from("tenants")
                .update({
                    features: plan.features,
                    subscription_status: 'active',
                    subscription_expires_at: endDate.toISOString()
                })
                .eq("id", data.tenantId)

            if (featuresError) throw featuresError

            // 4. Generate Invoice if requested
            if (data.generateInvoice && plan.price_inr > 0) {
                const { error: invError } = await supabase
                    .from("saas_invoices")
                    .insert({
                        tenant_id: data.tenantId,
                        subscription_id: subData.id,
                        amount_inr: plan.price_inr,
                        amount_cents: plan.price_inr * 100,
                        invoice_number: `INV-SAAS-${Date.now()}`,
                        status: 'pending' // Admin can mark as paid later
                    })
                if (invError) throw invError
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            queryClient.invalidateQueries({ queryKey: ["saas_invoices"] })
            setIsSubscriptionOpen(false)
            toast({ title: "Subscription Active", description: "Plan assigned and features updated." })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Mutation: Update Plan
    const updatePlanMutation = useMutation({
        mutationFn: async (data: { id: string, name: string, description: string, price_inr: number, features: string[] }) => {
            const { error } = await supabase
                .from("saas_plans")
                .update({
                    name: data.name,
                    description: data.description,
                    price_inr: data.price_inr,
                    features: data.features
                })
                .eq("id", data.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saas_plans"] })
            setIsEditPlanOpen(false)
            toast({ title: "Updated", description: "Plan updated successfully." })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    const handleOpenEditPlan = (plan: any) => {
        setSelectedPlan(plan)
        setEditPlanForm({
            name: plan.name,
            description: plan.description || "",
            price_inr: plan.price_inr,
            features: plan.features || []
        })
        setIsEditPlanOpen(true)
    }

    const togglePlanFeature = (id: string) => {
        setEditPlanForm(prev => ({
            ...prev,
            features: prev.features.includes(id)
                ? prev.features.filter(f => f !== id)
                : [...prev.features, id]
        }))
    }

    const handleOpenFeatures = (tenant: any) => {
        const current = tenant.features && Array.isArray(tenant.features) ? tenant.features : ALL_FEATURES.map(f => f.id)
        setFeatureList(current)
        setSelectedTenant(tenant)
        setIsFeaturesOpen(true)
    }

    const handleOpenSubscription = (tenant: any) => {
        setSelectedTenant(tenant)
        setSelectedPlanId("") // Reset or find current plan
        setIsSubscriptionOpen(true)
    }

    const toggleFeature = (id: string) => {
        setFeatureList(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    // Delete Tenant Mutation
    const deleteTenantMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("tenants").delete().eq("id", id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            toast({ title: "Success", description: "Tenant deleted successfully" })
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        },
    })

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
            deleteTenantMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6 p-6">
            {isTenantWizardOpen ? (
                <TenantOnboardingWizard
                    onComplete={() => setIsTenantWizardOpen(false)}
                    onCancel={() => setIsTenantWizardOpen(false)}
                />
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                            <p className="text-muted-foreground">Manage gym subscriptions, billing, and system settings.</p>
                        </div>
                        <Button onClick={() => setIsTenantWizardOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Tenant
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(invoices?.reduce((acc: number, curr: any) => acc + (curr.amount_inr || 0), 0) * 100 || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">From all time sales</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tenants?.filter((t: any) => t.subscription_status === 'active').length || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tenants?.length || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{invoices?.filter((i: any) => i.status === 'pending').length || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="tenants" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="tenants">Tenants & Subscriptions</TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="plans">Available Plans</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tenants">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tenants</CardTitle>
                                    <CardDescription>Manage gym owners and their subscription plans.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gym Name</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Plan Expiry</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tenants?.map((tenant) => (
                                                <TableRow key={tenant.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            {tenant.logo_url && <img src={tenant.logo_url} alt="Logo" className="w-6 h-6 rounded-full" />}
                                                            <span>{tenant.name}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span>{tenant.owner_name || "Pending"}</span>
                                                            <span className="text-xs text-muted-foreground">{tenant.owner_email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                                                            {tenant.subscription_status || 'Trial'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tenant.subscription_expires_at ? formatDate(tenant.subscription_expires_at) : "N/A"}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenSubscription(tenant)} title="Manage Subscription">
                                                            <CreditCard className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenFeatures(tenant)} title="Custom Features">
                                                            <Building className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            const params = new URLSearchParams({
                                                                tenant: tenant.id,
                                                                role: 'gym_owner',
                                                                email: tenant.owner_email || '',
                                                                name: tenant.owner_name || ''
                                                            })
                                                            const inviteLink = `${window.location.origin}/signup?${params.toString()}`
                                                            navigator.clipboard.writeText(inviteLink)
                                                            toast({ title: "Copied!", description: "Invite link copied." })
                                                        }}>
                                                            <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(tenant.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="invoices">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Invoices Generated</CardTitle>
                                    <CardDescription>History of all invoices sent to tenants.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice #</TableHead>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices?.map((inv: any) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                                    <TableCell>{inv.tenants?.name}</TableCell>
                                                    <TableCell>{formatCurrency(inv.amount_inr * 100)}</TableCell>
                                                    <TableCell>{formatDate(inv.created_at)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>{inv.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {invoices?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No invoices found.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="plans">
                            <Card>
                                <CardHeader>
                                    <CardTitle>SaaS Plans</CardTitle>
                                    <CardDescription>Available subscription packages.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {plans?.map((plan: any) => (
                                            <div key={plan.id} className="border rounded-lg p-4 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-lg">{plan.name}</h3>
                                                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                                                    <div className="text-2xl font-bold mb-4">
                                                        {plan.price_inr === 0 ? "Free" : formatCurrency(plan.price_inr * 100)}
                                                        <span className="text-sm font-normal text-muted-foreground"> / year</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <p className="text-sm font-medium">Includes:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.features?.slice(0, 5).map((f: string) => (
                                                            <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                                                        ))}
                                                        {plan.features?.length > 5 && <Badge variant="secondary" className="text-xs">+{plan.features.length - 5} more</Badge>}
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenEditPlan(plan)}>Edit Plan</Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Features Dialog (Custom Control) */}
                    <Dialog open={isFeaturesOpen} onOpenChange={setIsFeaturesOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Custom Features: {selectedTenant?.name}</DialogTitle>
                                <DialogDescription>Manually override module access.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {ALL_FEATURES.map(feature => (
                                    <div key={feature.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={feature.id}
                                            checked={featureList.includes(feature.id)}
                                            onCheckedChange={() => toggleFeature(feature.id)}
                                        />
                                        <Label htmlFor={feature.id}>{feature.label}</Label>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsFeaturesOpen(false)}>Cancel</Button>
                                <Button onClick={() => updateFeaturesMutation.mutate({ tenantId: selectedTenant.id, features: featureList })}>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Subscription Dialog */}
                    <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Subscription: {selectedTenant?.name}</DialogTitle>
                                <DialogDescription>Assign a plan to renew or upgrade this tenant.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Plan</Label>
                                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a plan..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans?.map((p: any) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} - {p.price_inr === 0 ? "Free" : `₹${p.price_inr}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="gen-invoice"
                                        checked={generateInvoice}
                                        onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
                                    />
                                    <Label htmlFor="gen-invoice">Generate Invoice immediately</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsSubscriptionOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={() => assignSubscriptionMutation.mutate({
                                        tenantId: selectedTenant.id,
                                        planId: selectedPlanId,
                                        generateInvoice
                                    })}
                                    disabled={!selectedPlanId}
                                >
                                    Assign Plan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {/* Edit Plan Dialog */}
                    <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Edit Plan: {selectedPlan?.name}</DialogTitle>
                                <DialogDescription>Update pricing and features for this plan.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-name">Plan Name</Label>
                                        <Input
                                            id="plan-name"
                                            value={editPlanForm.name}
                                            onChange={(e) => setEditPlanForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-price">Price (INR)</Label>
                                        <Input
                                            id="plan-price"
                                            type="number"
                                            value={editPlanForm.price_inr}
                                            onChange={(e) => setEditPlanForm(prev => ({ ...prev, price_inr: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-desc">Description</Label>
                                    <Input
                                        id="plan-desc"
                                        value={editPlanForm.description}
                                        onChange={(e) => setEditPlanForm(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Includes Features</Label>
                                    <div className="grid grid-cols-2 gap-3 border p-4 rounded-md h-60 overflow-y-auto">
                                        {ALL_FEATURES.map(feature => (
                                            <div key={feature.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`plan-${feature.id}`}
                                                    checked={editPlanForm.features.includes(feature.id)}
                                                    onCheckedChange={() => togglePlanFeature(feature.id)}
                                                />
                                                <Label htmlFor={`plan-${feature.id}`}>{feature.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>Cancel</Button>
                                <Button onClick={() => updatePlanMutation.mutate({
                                    id: selectedPlan.id,
                                    ...editPlanForm
                                })}>
                                    Update Plan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}
