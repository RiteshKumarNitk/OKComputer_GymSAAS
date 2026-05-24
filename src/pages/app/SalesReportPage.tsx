import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/AuthContext"
import { invoicesApi } from "@/api/apiClient"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Download,
  Calendar,
  CreditCard,
  Wallet,
  Banknote,
  MoreHorizontal
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader, DataTable } from "@/components/common"
import type { Column } from "@/components/common"
export const SalesReportPage: React.FC = () => {
    const { user } = useAuth()
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    const { data: invoices, isLoading } = useQuery({
        queryKey: ["sales-invoices", user?.tenantId],
        queryFn: async () => {
            const { data, error } = await invoicesApi.list(user?.tenantId || "")
            if (error) throw error
            return data || []
        },
        enabled: !!user?.tenantId
    })

    const salesData = useMemo(() => {
        if (!invoices) return []
        let filtered = [...invoices]
        if (fromDate) filtered = filtered.filter((i: any) => new Date(i.invoiceDate || i.createdAt) >= new Date(fromDate))
        if (toDate) {
            const end = new Date(toDate)
            end.setHours(23, 59, 59)
            filtered = filtered.filter((i: any) => new Date(i.invoiceDate || i.createdAt) <= end)
        }
        return filtered.map((inv: any) => ({
            id: inv.id,
            name: inv.member?.fullName || "Unknown",
            phone: inv.member?.phone || "-",
            membershipType: [inv.member?.membership?.type || "Standard"],
            planName: [inv.member?.plan?.name || "N/A"],
            startDate: formatDate(inv.invoiceDate || inv.createdAt),
            duration: ["-"],
            invoiceNo: inv.invoiceNumber || inv.id.split('-')[0].toUpperCase(),
            paidAmount: (inv.totalPaise || 0) / 100,
            sgst: inv.taxPaise ? (inv.taxPaise / 2) / 100 : 0,
            cgst: inv.taxPaise ? (inv.taxPaise / 2) / 100 : 0,
            paymentMode: inv.payment?.method || (inv.status === 'paid' ? 'Paid' : 'Pending'),
            totalAmount: (inv.totalPaise || 0) / 100,
            status: inv.status
        }))
    }, [invoices, fromDate, toDate])

    const stats = useMemo(() => {
        const total = salesData.reduce((s, r) => s + r.totalAmount, 0)
        const paid = salesData.reduce((s, r) => s + (r.status === 'paid' ? r.totalAmount : 0), 0)
        const tax = salesData.reduce((s, r) => s + r.sgst + r.cgst, 0)
        const online = salesData.filter(r => r.paymentMode === 'Online' || r.paymentMode === 'Debit Card').reduce((s, r) => s + r.totalAmount, 0)
        const cash = salesData.filter(r => r.paymentMode === 'Cash').reduce((s, r) => s + r.totalAmount, 0)
        return {
            invoiceCount: salesData.length,
            totalAmount: total,
            paidAmount: paid,
            balance: total - paid,
            taxAmount: tax,
            online,
            cash,
            other: total - online - cash
        }
    }, [salesData])

    const salesColumns: Column<any>[] = [
        { key: "name", label: "Name & Number", render: (item: any) => <div><div className="text-[11px] font-bold text-blue-600 uppercase">{item.name}</div><div className="text-[10px] text-slate-500 font-medium">{item.phone}</div></div> },
        { key: "invoiceNo", label: "Invoice No", render: (item: any) => <span className="text-[10px] font-bold text-blue-500 uppercase">{item.invoiceNo}</span> },
        { key: "date", label: "Date", render: (item: any) => <span className="text-[10px] font-medium text-slate-600">{item.startDate}</span> },
        { key: "paid", label: "Paid", render: (item: any) => <span className="text-[11px] font-bold text-slate-700">₹{item.paidAmount.toFixed(2)}</span> },
        { key: "tax", label: "Tax", render: (item: any) => <span className="text-[11px] font-medium text-slate-500">₹{(item.sgst + item.cgst).toFixed(2)}</span> },
        { key: "mode", label: "Mode", render: (item: any) => <span className="text-[10px] font-bold text-slate-600">{item.paymentMode}</span> },
        { key: "total", label: "Total", render: (item: any) => <span className="text-[11px] font-bold text-slate-900">₹{item.totalAmount.toFixed(2)}</span> },
    ]

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Sales Report"
                actions={
                    <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold gap-2">
                        <Download className="h-4 w-4" /> Export XLS
                    </Button>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Invoice Generated", value: String(stats.invoiceCount), icon: <CreditCard className="h-4 w-4" />, prefix: "" },
                    { label: "Total Amount", value: stats.totalAmount.toFixed(2), icon: <Wallet className="h-4 w-4" />, prefix: "₹" },
                    { label: "Paid Amount", value: stats.paidAmount.toFixed(2), icon: <Banknote className="h-4 w-4" />, prefix: "₹" },
                    { label: "Balance", value: stats.balance.toFixed(2), icon: <CreditCard className="h-4 w-4" />, prefix: "₹" },
                    { label: "Tax Amount", value: stats.taxAmount.toFixed(2), icon: <Calendar className="h-4 w-4" />, prefix: "₹" },
                    { label: "Online", value: stats.online.toFixed(2), icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, prefix: "₹" },
                    { label: "Wallet", value: "0.00", icon: <Wallet className="h-4 w-4" />, prefix: "₹" },
                    { label: "Cash", value: stats.cash.toFixed(2), icon: <Banknote className="h-4 w-4" />, prefix: "₹" },
                    { label: "Cheque", value: "0.00", icon: <CreditCard className="h-4 w-4" />, prefix: "₹" },
                    { label: "Other", value: stats.other.toFixed(2), icon: <MoreHorizontal className="h-4 w-4" />, prefix: "₹" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-100 shadow-sm bg-slate-50/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-800">{stat.prefix}{stat.value}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 shadow-none bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="pl-9 h-10 border-slate-200 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="pl-9 h-10 border-slate-200 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tax Type</label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-10 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Taxes</SelectItem>
                                    <SelectItem value="gst">GST 18%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Membership</label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-10 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Every Membership</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sale Type</label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-10 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Direct & Renewal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex items-end">
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button variant="brand" className="font-bold h-10" onClick={() => {}}>Apply</Button>
                                <Button variant="outline" className="font-bold h-10" onClick={() => { setFromDate(""); setToDate("") }}>Clear</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DataTable
                columns={salesColumns}
                data={salesData}
                loading={isLoading}
                title="Sales Records"
                emptyMessage="No sales records found"
            />
        </div>
    )
}
