import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenantsApi } from "@/api/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Building, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Edit3, 
  PauseCircle, 
  PlayCircle, 
  Trash2,
  Filter
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard"
import { formatDate } from "@/lib/utils"

export const SuperAdminTenants: React.FC = () => {
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const { data: tenants, isLoading } = useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const { data, error } = await tenantsApi.list()
            if (error) throw error
            return data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: tenantsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants"] })
            toast({ title: "Tenant Deleted", description: "Successfully removed from platform." })
        }
    })

    const filteredTenants = tenants?.filter((t: any) => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants (Gyms)</h1>
                    <p className="text-muted-foreground">Manage all gym businesses on your platform.</p>
                </div>
                <Button onClick={() => setIsWizardOpen(true)}>
                    <Building className="mr-2 h-4 w-4" />
                    Onboard New Gym
                </Button>
            </div>

            {isWizardOpen ? (
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Tenant Onboarding Wizard</h2>
                        <Button variant="ghost" size="sm" onClick={() => setIsWizardOpen(false)}>Cancel</Button>
                    </div>
                    <TenantOnboardingWizard 
                        onComplete={() => {
                            setIsWizardOpen(false)
                            queryClient.invalidateQueries({ queryKey: ["tenants"] })
                        }}
                        onCancel={() => setIsWizardOpen(false)}
                    />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Gym Directory</CardTitle>
                        <CardDescription>Filter and manage your platform tenants.</CardDescription>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by gym name or owner email..." 
                                    className="pl-10" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gym Information</TableHead>
                                    <TableHead>Location / City</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Members / Trainers</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">Loading tenants...</TableCell>
                                    </TableRow>
                                ) : filteredTenants?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">No gyms found matching your search.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTenants?.map((tenant: any) => (
                                        <TableRow key={tenant.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                        {tenant.logo_url ? <img src={tenant.logo_url} className="w-full h-full object-cover" /> : <Building className="h-5 w-5 text-slate-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{tenant.name}</p>
                                                        <p className="text-xs text-muted-foreground">{tenant.owner_email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{tenant.registered_address ? tenant.registered_address.split(',').pop() : "India"}</p>
                                                <p className="text-xs text-muted-foreground">Pan-India</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}
                                                    className={tenant.subscription_status === 'active' ? 'bg-emerald-500' : ''}
                                                >
                                                    {tenant.subscription_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center text-xs">
                                                        <span className="w-16">Members:</span>
                                                        <span className="font-bold">128</span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <span className="w-16">Trainers:</span>
                                                        <span>12</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{tenant.subscription_expires_at ? formatDate(tenant.subscription_expires_at) : "N/A"}</p>
                                                {tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < new Date() && (
                                                    <span className="text-[10px] text-rose-500 font-bold">EXPIRED</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => window.open(`/dashboard?tenant=${tenant.id}`, '_blank')}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Impersonate (Live)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                            Edit Profile
                                                        </DropdownMenuItem>
                                                        {tenant.subscription_status === 'active' ? (
                                                            <DropdownMenuItem className="text-orange-600">
                                                                <PauseCircle className="mr-2 h-4 w-4" />
                                                                Suspend Gym
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem className="text-emerald-600">
                                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                                Activate Gym
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                if(confirm("Are you sure? This delete the entire gym data branch, members, everything!")) {
                                                                    deleteMutation.mutate(tenant.id)
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Forever
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
