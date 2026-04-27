import React from "react"
import { useQuery } from "@tanstack/react-query"
import { billingApi, tenantsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { 
    CreditCard, 
    Download, 
    Calendar, 
    CheckCircle2, 
    AlertCircle,
    Clock,
    Receipt,
    ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { generateInvoicePDF } from "@/utils/invoiceGenerator"

export const SaasBillingPage: React.FC = () => {
    const { user } = useAuth()
    const tenantId = user?.tenant_id

    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1)
    const [rowsPerPage, setRowsPerPage] = React.useState(10)

    const { data: tenant, isLoading: isLoadingTenant } = useQuery({
        queryKey: ["tenant", tenantId],
        queryFn: async () => {
            const { data, error } = await tenantsApi.get(tenantId || "")
            if (error) throw error
            return data
        },
        enabled: !!tenantId
    })

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ["saas_invoices", tenantId],
        queryFn: async () => {
            const { data, error } = await billingApi.getInvoices(tenantId || "")
            if (error) throw error
            return data
        },
        enabled: !!tenantId
    })

    // Pagination Logic
    const filteredInvoices = invoices || []
    const totalEntries = filteredInvoices.length
    const totalPages = Math.ceil(totalEntries / rowsPerPage)
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

    const handleDownloadInvoice = (invoice: any) => {
        generateInvoicePDF({
            invoiceNumber: invoice.invoiceNumber,
            date: new Date(invoice.createdAt || invoice.paymentDate),
            items: [
                { description: "Gym SaaS Platform Subscription", amount: invoice.amountInr * 100 }
            ],
            totalAmount: invoice.amountInr * 100,
            currency: tenant?.currency || "INR",
            paymentMethod: "Online/Bank",
            status: invoice.status
        }, {
            name: tenant?.name || "Gym",
            ownerName: tenant?.ownerName || "Owner",
            email: tenant?.ownerEmail || "",
            phone: tenant?.ownerPhone || "",
            address: tenant?.registeredAddress || ""
        })
    }

    if (isLoadingTenant || isLoadingInvoices) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading billing information...</div>
    }

    const isExpired = tenant?.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) < new Date()
    const isActive = tenant?.subscriptionStatus === 'active' || tenant?.status === 'active'

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">SaaS Subscription & Billing</h1>
                <p className="text-muted-foreground">Manage your platform subscription and view invoices.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-600">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold capitalize">{tenant?.subscriptionStatus || 'Active'}</span>
                            {isActive ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-500" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isExpired ? "Subscription expired" : "Your account is in good standing"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Next Renewal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                {tenant?.subscriptionExpiresAt ? formatDate(tenant.subscriptionExpiresAt) : "N/A"}
                            </span>
                            <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                             Annual billing cycle
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Premium Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">Pro Edition</span>
                            <CreditCard className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unlimited members & staff
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>History of your platform subscription payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedInvoices?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedInvoices?.map((invoice: any) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-slate-400" />
                                                {invoice.invoiceNumber || 'INV-0000'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(invoice.createdAt || invoice.paymentDate)}</TableCell>
                                        <TableCell>
                                            {tenant?.currency || 'INR'} {invoice.amountInr?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDownloadInvoice(invoice)}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Integration */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                        <div className="text-xs">
                            Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of <span className="text-slate-900">{totalEntries}</span> entries
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                Rows:
                                <select className="bg-transparent font-bold text-slate-900 focus:outline-none" value={rowsPerPage} onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                                    {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="text-xs font-bold"
                                >
                                    Prev
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="text-xs font-bold"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-slate-50 border rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border shadow-sm">
                        <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Need to upgrade or change your plan?</h3>
                        <p className="text-sm text-muted-foreground">Contact platform support for custom plans and enterprise features.</p>
                    </div>
                </div>
                <Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
                    Contact Support
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
