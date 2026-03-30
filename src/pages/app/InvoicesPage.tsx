import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/AuthContext"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Receipt } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

export const InvoicesPage: React.FC = () => {
    const { user } = useAuth()

    const { data: invoices, isLoading } = useQuery({
        queryKey: ["invoices", user?.tenant_id],
        queryFn: async () => {
            const token = localStorage.getItem("gym_token")
            const res = await fetch("/api/invoices", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to fetch invoices")
            return await res.json()
        },
        enabled: !!user?.tenant_id
    })

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid": return "bg-emerald-100 text-emerald-700 border-none"
            case "sent": return "bg-blue-100 text-blue-700 border-none"
            case "overdue": return "bg-amber-100 text-amber-700 border-none"
            case "cancelled": return "bg-slate-100 text-slate-700 border-none"
            default: return "bg-slate-100 text-slate-700 border-none"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices & Billing</h1>
                    <p className="text-muted-foreground">Track member payments and generate receipts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Billed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(invoices?.reduce((sum: number, inv: any) => sum + inv.totalPaise, 0) || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Paid Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {invoices?.filter((i: any) => i.status === "paid").length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending/Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {invoices?.filter((i: any) => i.status !== "paid").length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Receipt className="mr-2 h-5 w-5 text-indigo-500" />
                        Recent Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice: any) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{invoice.member?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{invoice.member?.memberCode}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{formatDate(invoice.invoiceDate)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(invoice.totalPaise)}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(invoice.status)}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" title="View PDF">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" title="Download">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoices?.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                        No invoices found for this tenant.
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

export default InvoicesPage;
