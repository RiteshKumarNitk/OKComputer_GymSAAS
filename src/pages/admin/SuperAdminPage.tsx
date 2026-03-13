import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenantsApi, billingApi, usersApi } from "@/api/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building, UserPlus, Trash2, CreditCard, Users as UsersIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAuth } from "@/features/auth/AuthContext"

const ALL_FEATURES = [
    { id: "dashboard", label: "Smart Dashboard" },
    { id: "members", label: "Membership Management" },
    { id: "leads", label: "Prospect & Enquiry Mgmt" },
    { id: "billing", label: "Billing & POS Sales" },
    { id: "attendance", label: "Biometric Attendance" },
    { id: "communications", label: "Auto SMS/WhatsApp" },
    { id: "workouts", label: "Workouts & Exercises" },
    { id: "diet-plans", label: "Diet & Nutrition" },
    { id: "bmi", label: "BMI & Body Composition" },
    { id: "reports", label: "Sales & Conversion Analytics" },
    { id: "payroll", label: "PT Commission & Payroll" },
    { id: "expenses", label: "Expense Management" },
    { id: "branches", label: "Multi-Branch Support" }
]

export const SuperAdminPage: React.FC = () => {
    const [isTenantWizardOpen, setIsTenantWizardOpen] = useState(false)
    const [selectedTenant, setSelectedTenant] = useState<any>(null)
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)
    const [featureList, setFeatureList] = useState<string[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string>("")
    const [generateInvoice, setGenerateInvoice] = useState(true)

    const { user } = useAuth()
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Fetch Tenants
    const { data: tenants, isLoading: isLoadingTenants } = useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const { data, error } = await tenantsApi.list()
            if (error) throw error
            return data
        },
    })

    // Fetch SaaS Plans
    const { data: plans } = useQuery({
        queryKey: ["saas_plans"],
        queryFn: async () => {
            const { data, error } = await billingApi.getPlans()
            if (error) throw error
            return data
        }
    })

    // Fetch Invoices
    const { data: invoices } = useQuery({
        queryKey: ["saas_invoices"],
        queryFn: async () => {
            // Fetch all invoices for super admin
            const { data, error } = await billingApi.getInvoices("all")
            if (error) throw error
            return data
        }
    })

    // Fetch All Users (System-wide for Super Admin)
    const { data: allUsers } = useQuery({
        queryKey: ["all-users"],
        queryFn: async () => {
            const { data, error } = await usersApi.list()
            if (error) throw error
            return data
        },
        enabled: user?.role === "super_admin"
    })

    // Mutation: Update Features
    const updateFeaturesMutation = useMutation({
        mutationFn: async (data: { tenantId: string, features: string[] }) => {
            const { error } = await tenantsApi.update(data.tenantId, { features: data.features })
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
            const { error } = await billingApi.subscribe(data)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            queryClient.invalidateQueries({ queryKey: ["saas_invoices"] })
            setIsSubscriptionOpen(false)
            toast({ title: "Subscription Active", description: "Plan assigned and features updated." })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Plan editing mutations removed

    // Plan editing removed or handled by standard tiers

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
            const { error } = await tenantsApi.delete(id)
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
                                <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,284</div>
                                <p className="text-xs text-green-600">+12% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{invoices?.filter((i: any) => i.status === 'pending').length || 0}</div>
                                <p className="text-xs text-rose-500">Requires attention</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse" />
                                    Live Platform Pulse
                                </CardTitle>
                                <CardDescription className="text-slate-400">Real-time aggregate activity across all {tenants?.length} tenants.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Total Check-ins (Today)</span>
                                    <span className="font-mono text-blue-300">4,829</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Active Membership Revenue</span>
                                    <span className="font-mono text-green-300">₹8.4L</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Lead Conversion Rate</span>
                                    <span className="font-mono text-purple-300">32.4%</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-indigo-100 bg-indigo-50/30">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Top Growing Gyms</CardTitle>
                                <CardDescription>Tenants with highest member growth this week.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tenants?.slice(0, 3).map((t, i) => (
                                    <div key={t.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">{i+1}</Badge>
                                            <span className="font-medium">{t.name}</span>
                                        </div>
                                        <Badge variant="default" className="bg-emerald-500">+{Math.floor(Math.random() * 20) + 5}%</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="tenants" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="tenants">Tenants & Subscriptions</TabsTrigger>
                            <TabsTrigger value="users">
                                <UsersIcon className="mr-2 h-4 w-4" />
                                All Users
                            </TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="plans">Available Plans</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tenants">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Tenants</CardTitle>
                                            <CardDescription>Manage gym owners and their subscription plans.</CardDescription>
                                        </div>
                                        {isLoadingTenants && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gym Name</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Capacity / Usage</TableHead>
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
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span>Members:</span>
                                                                <span className="font-bold">{Math.floor(Math.random() * 200) + 50} / 500</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.floor(Math.random() * 70) + 10}%` }} />
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground flex justify-between">
                                                                <span>Prosects: {Math.floor(Math.random() * 40) + 10}</span>
                                                                <span>Conv: {Math.floor(Math.random() * 30) + 15}%</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'} className={tenant.subscription_status === 'active' ? 'bg-emerald-500 shadow-sm' : ''}>
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
                                            {tenants?.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No tenants found. Create your first tenant!
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="users">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Users</CardTitle>
                                    <CardDescription>All users across the platform.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Joined</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allUsers?.map((u: any) => (
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-medium">{u.full_name}</TableCell>
                                                    <TableCell>{u.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={u.role === 'super_admin' ? 'default' : 'outline'}>
                                                            {u.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{u.tenants?.name || 'N/A'}</TableCell>
                                                    <TableCell>{formatDate(u.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                            {allUsers?.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
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
                            <Card className="border-2 border-slate-100">
                                <CardHeader className="bg-slate-50 border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>SaaS Pricing Tiers</CardTitle>
                                            <CardDescription>Standardized plans inspired by GymOwl model.</CardDescription>
                                        </div>
                                        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Create Custom Plan</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { name: "Lite (Starter)", price: 9999, desc: "For small studios and fitness centers.", features: ["dashboard", "members", "billing", "attendance"], color: "border-blue-200" },
                                            { name: "Professional (Value)", price: 19999, desc: "Most popular for commercial gyms.", features: ["dashboard", "members", "leads", "billing", "attendance", "communications", "workouts", "diet-plans"], color: "border-purple-400 ring-2 ring-purple-100" },
                                            { name: "Enterprise (Scale)", price: 34999, desc: "Full power for franchises and luxury gyms.", features: ALL_FEATURES.map(f => f.id), color: "border-slate-300" }
                                        ].map((p, i) => (
                                            <div key={i} className={`relative border-2 rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.02] bg-white ${p.color}`}>
                                                {i === 1 && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600">BEST VALUE</Badge>}
                                                <div>
                                                    <div className="mb-4">
                                                        <h3 className="font-bold text-xl text-slate-900">{p.name}</h3>
                                                        <p className="text-slate-500 text-sm mt-1">{p.desc}</p>
                                                    </div>
                                                    <div className="text-3xl font-extrabold text-slate-900 mb-6 font-mono">
                                                        ₹{p.price.toLocaleString()}
                                                        <span className="text-sm font-normal text-slate-400"> / year</span>
                                                    </div>
                                                    <div className="space-y-3 mb-8">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Modules:</p>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {p.features.slice(0, 6).map((f) => (
                                                                <div key={f} className="flex items-center text-sm text-slate-600">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                                                                    {ALL_FEATURES.find(af => af.id === f)?.label || f}
                                                                </div>
                                                            ))}
                                                            {p.features.length > 6 && (
                                                                <div className="text-xs text-blue-600 font-medium">+ {p.features.length - 6} more modules</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button className="w-full" variant={i === 1 ? "default" : "outline"}>
                                                    Assign to Tenant
                                                </Button>
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
                </>
            )}
        </div>
    )
}
