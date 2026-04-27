import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter,
  Calendar,
  CreditCard,
  Wallet,
  Banknote,
  MoreHorizontal
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface SalesRecord {
    clientId: string
    name: string
    phone: string
    membershipType: string[]
    planName: string[]
    startDate: string
    duration: string[]
    invoiceNo: string
    paidAmount: number
    sgst: number
    cgst: number
    paymentMode: string
    totalAmount: number
}

const dummySales: SalesRecord[] = [
    {
        clientId: "",
        name: "ARUN KUMAR",
        phone: "8107800370",
        membershipType: ["General Training"],
        planName: ["Monthly"],
        startDate: "14-04-2026",
        duration: ["1 Months"],
        invoiceNo: "UTURN/2026-27/7",
        paidAmount: 6000.00,
        sgst: 0.00,
        cgst: 0.00,
        paymentMode: "Cash",
        totalAmount: 7000.00
    },
    {
        clientId: "",
        name: "shashi niraj",
        phone: "9620955591",
        membershipType: ["General Training", "Personal Training"],
        planName: ["3 months gold", "GYM WORKOUT DASHING"],
        startDate: "14-04-2026, 14-04-2026",
        duration: ["3 Months", "3 Months"],
        invoiceNo: "UTURN/2026-27/6",
        paidAmount: 25000.00,
        sgst: 0.00,
        cgst: 0.00,
        paymentMode: "Cash",
        totalAmount: 29000.00
    },
    {
        clientId: "",
        name: "Anchal Rajput",
        phone: "8595297526",
        membershipType: ["General Training"],
        planName: ["SPECIAL OFFER"],
        startDate: "13-04-2026",
        duration: ["12 Months"],
        invoiceNo: "UTURN/2026-27/5",
        paidAmount: 9000.00,
        sgst: 0.00,
        cgst: 0.00,
        paymentMode: "Cash",
        totalAmount: 10000.00
    },
    {
        clientId: "",
        name: "GIRISH NANDREK",
        phone: "8296405666",
        membershipType: ["General Training"],
        planName: ["SPECIAL OFFER"],
        startDate: "12-04-2026",
        duration: ["12 Months"],
        invoiceNo: "UTURN/2026-27/4",
        paidAmount: 24000.00,
        sgst: 0.00,
        cgst: 0.00,
        paymentMode: "Debit Card",
        totalAmount: 26000.00
    }
]

export const SalesReportPage: React.FC = () => {
    const [rowsPerPage, setRowsPerPage] = useState(10)

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4">Sales Report</h1>
                <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold gap-2">
                    <Download className="h-4 w-4" /> Export XLS
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Invoice Generated", value: "7", icon: <CreditCard className="h-4 w-4" />, color: "slate" },
                    { label: "Total Amount", value: "100000.00", icon: <Wallet className="h-4 w-4" />, color: "slate" },
                    { label: "Paid Amount", value: "100000.00", icon: <Banknote className="h-4 w-4" />, color: "slate" },
                    { label: "Paid Balance", value: "0.00", icon: <CreditCard className="h-4 w-4" />, color: "slate" },
                    { label: "Tax Amount", value: "0.00", icon: <Calendar className="h-4 w-4" />, color: "slate" },
                    { label: "Online", value: "24000.00", icon: <div className="h-4 w-4 rounded-full border-2 border-current" />, color: "slate" },
                    { label: "Wallet", value: "0.00", icon: <Wallet className="h-4 w-4" />, color: "slate" },
                    { label: "Cash", value: "76000.00", icon: <Banknote className="h-4 w-4" />, color: "slate" },
                    { label: "Cheque", value: "0.00", icon: <CreditCard className="h-4 w-4" />, color: "slate" },
                    { label: "Other", value: "0.00", icon: <MoreHorizontal className="h-4 w-4" />, color: "slate" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-100 shadow-sm bg-slate-50/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-800">{stat.label === "Invoice Generated" ? stat.value : `₹${stat.value}`}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Section */}
            <Card className="border-slate-200 shadow-none bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input type="date" defaultValue="2026-04-01" className="pl-9 h-10 border-slate-200 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input type="date" defaultValue="2026-04-14" className="pl-9 h-10 border-slate-200 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tax Type</label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-10 border-slate-200">
                                    <SelectValue placeholder="Select Tax Type" />
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
                                    <SelectValue placeholder="Select Membership" />
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
                                    <SelectValue placeholder="Select Sale Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Direct & Renewal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex items-end">
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button className="bg-orange-500 hover:bg-orange-600 font-bold h-10">Apply</Button>
                                <Button variant="outline" className="font-bold h-10">Clear</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Section */}
            <Card className="border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Sales Records
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 font-medium mr-2">Rows per page:</div>
                        <Select value={rowsPerPage.toString()} onValueChange={(v) => setRowsPerPage(parseInt(v))}>
                            <SelectTrigger className="h-8 w-16 border-slate-200 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 25, 50].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-6 py-4">Client Id</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Name & Number</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Membership Type</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Plan Name</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Start Date</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Duration</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Invoice No</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Paid</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Tax</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Mode</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 uppercase px-4 py-4">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dummySales.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-slate-50/50">
                                    <TableCell className="px-6 py-5 text-xs text-slate-500 font-medium italic">--</TableCell>
                                    <TableCell className="px-4 py-5">
                                        <div className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer uppercase">{item.name}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{item.phone}</div>
                                    </TableCell>
                                    <TableCell className="px-4 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {item.membershipType.map((t, i) => (
                                                <Badge key={i} variant="outline" className="bg-orange-50/50 border-orange-100 text-[#B8860B] rounded-md px-2 py-0.5 text-[9px] font-bold whitespace-nowrap">{t}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {item.planName.map((p, i) => (
                                                <Badge key={i} variant="outline" className="bg-orange-50/50 border-orange-100 text-[#B8860B] rounded-md px-2 py-0.5 text-[9px] font-bold whitespace-nowrap">{p}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-5 text-[10px] font-medium text-slate-600">{item.startDate}</TableCell>
                                    <TableCell className="px-4 py-5 text-[10px] font-medium text-slate-600">{item.duration.join(", ")}</TableCell>
                                    <TableCell className="px-4 py-5">
                                        <span className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer uppercase">{item.invoiceNo}</span>
                                    </TableCell>
                                    <TableCell className="px-4 py-5 text-[11px] font-bold text-slate-700">₹{item.paidAmount.toFixed(2)}</TableCell>
                                    <TableCell className="px-4 py-5 text-[11px] font-medium text-slate-500">₹{(item.sgst + item.cgst).toFixed(2)}</TableCell>
                                    <TableCell className="px-4 py-5 text-[10px] font-bold text-slate-600 whitespace-nowrap">{item.paymentMode}</TableCell>
                                    <TableCell className="px-4 py-5 text-[11px] font-bold text-slate-900">₹{item.totalAmount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="text-xs font-medium text-slate-500">
                        Showing 1 to {dummySales.length} of {dummySales.length} entries
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 text-xs bg-slate-800">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
