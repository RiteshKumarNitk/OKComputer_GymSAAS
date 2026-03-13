import React from "react"
import { useQuery } from "@tanstack/react-query"
import { billingApi } from "@/api/apiClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Clock,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

export const SuperAdminPayments: React.FC = () => {
    const { data: invoices, isLoading } = useQuery({
        queryKey: ["saas_invoices"],
        queryFn: async () => {
            const { data, error } = await billingApi.getInvoices("all")
            if (error) throw error
            return data
        }
    })

    const totalRevenue = invoices?.reduce((acc: number, curr: any) => acc + (curr.amount_cents || 0), 0) || 0
    const pendingRevenue = invoices?.filter((i: any) => i.status === 'pending').reduce((acc: number, curr: any) => acc + (curr.amount_cents || 0), 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments & Revenue</h1>
                    <p className="text-muted-foreground">Detailed financial breakdown of your SaaS platform.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Financials (CSV)
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Recurring (MRR)</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹2,84,500</div>
                        <div className="flex items-center pt-1 text-xs text-green-600">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            8.4% growth
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Lifetime Sales</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Since launch</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingRevenue)}</div>
                        <p className="text-xs text-muted-foreground">{invoices?.filter((i: any) => i.status === 'pending').length} unpaid invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.2%</div>
                        <p className="text-xs text-muted-foreground">Platform average</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>SaaS Invoice History</CardTitle>
                    <CardDescription>Track all payments received from gym owners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Tenant / Gym</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading payments...</TableCell>
                                </TableRow>
                            ) : invoices?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">No invoices found.</TableCell>
                                </TableRow>
                            ) : (
                                invoices?.map((inv: any) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                        <TableCell className="font-medium text-slate-800">{inv.tenants?.name}</TableCell>
                                        <TableCell className="font-bold">{formatCurrency(inv.amount_cents)}</TableCell>
                                        <TableCell className="text-sm text-slate-600">{formatDate(inv.created_at)}</TableCell>
                                        <TableCell>
                                            <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className={inv.status === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
