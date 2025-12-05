import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building, UserPlus, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard"
import { Badge } from "@/components/ui/badge"

export const SuperAdminPage: React.FC = () => {
    const [isTenantWizardOpen, setIsTenantWizardOpen] = useState(false)
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Fetch Tenants
    const { data: tenants, isLoading } = useQuery({
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
                            <p className="text-muted-foreground">Manage all gym tenants and system settings.</p>
                        </div>
                        <Button onClick={() => setIsTenantWizardOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Tenant
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tenants?.length || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tenants</CardTitle>
                            <CardDescription>A list of all registered gyms.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Gym Name</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Business Type</TableHead>
                                        <TableHead>Status</TableHead>
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
                                            <TableCell className="capitalize">{tenant.business_type || "Gym"}</TableCell>
                                            <TableCell>
                                                <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                                                    {tenant.subscription_status || 'Trial'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
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
                                                No tenants found. Create your first gym!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
