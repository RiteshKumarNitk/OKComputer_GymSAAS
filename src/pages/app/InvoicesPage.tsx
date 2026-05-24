import React from "react"
import { useQuery } from "@tanstack/react-query"
import { invoicesApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { PageHeader, StatCardsGrid } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Download, Receipt } from "lucide-react"
import { formatDate, formatCurrency, exportToCSV } from "@/lib/utils"

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 border-none",
    sent: "bg-blue-100 text-blue-700 border-none",
    overdue: "bg-amber-100 text-amber-700 border-none",
    draft: "bg-slate-100 text-slate-700 border-none",
    cancelled: "bg-slate-100 text-slate-700 border-none",
    void: "bg-rose-100 text-rose-700 border-none",
  }
  return map[status.toLowerCase()] || "bg-slate-100 text-slate-700 border-none"
}

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", user?.tenantId],
    queryFn: async () => {
      const res = await invoicesApi.list(user?.tenantId || "")
      if (res.error) throw res.error
      return res.data || []
    },
    enabled: !!user?.tenantId,
  })

  const totalBilled = invoices?.reduce((sum: number, inv: any) => sum + (inv.totalPaise || 0), 0) || 0
  const paidCount = invoices?.filter((i: any) => i.status === "paid").length || 0
  const unpaidCount = invoices?.filter((i: any) => i.status !== "paid").length || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Invoices & Billing" subtitle="Track member payments and generate receipts." />

      <StatCardsGrid
        stats={[
          { icon: <Receipt className="h-6 w-6" />, label: "Total Billed", value: formatCurrency(totalBilled), color: "blue" },
          { icon: <Receipt className="h-6 w-6" />, label: "Paid Invoices", value: paidCount, color: "emerald" },
          { icon: <Receipt className="h-6 w-6" />, label: "Pending / Overdue", value: unpaidCount, color: "rose" },
        ]}
      />

      <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center text-lg font-black text-slate-800">
            <Receipt className="mr-2 h-5 w-5 text-indigo-500" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 px-6">Invoice #</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 px-4">Member</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 px-4">Date</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 px-4">Amount</th>
                  <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 px-4">Status</th>
                  <th className="text-right px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16 bg-slate-50/30" /></tr>)
                ) : invoices?.length === 0 ? (
                  <tr><td colSpan={6} className="h-32 text-center text-slate-400 font-medium italic">No invoices found.</td></tr>
                ) : invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-mono text-xs font-bold text-slate-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-5">
                      <div className="font-bold text-sm text-slate-800">{inv.member?.fullName || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400">{inv.member?.memberCode || ""}</div>
                    </td>
                    <td className="px-4 py-5 text-xs font-bold text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-5 font-black text-slate-800">{formatCurrency(inv.totalPaise)}</td>
                    <td className="px-4 py-5">
                      <Badge className={`rounded-lg text-[9px] font-black uppercase px-2.5 py-1 ${statusColor(inv.status)}`}>{inv.status}</Badge>
                    </td>
                    <td className="text-right px-6 py-5">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => alert(`Invoice: ${inv.invoiceNumber}\nTotal: ${formatCurrency(inv.totalPaise)}\nStatus: ${inv.status}`)}><Eye className="h-4 w-4 text-slate-400" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => {
                            const csvData = [{ "Invoice": inv.invoiceNumber, "Amount": inv.totalPaise, "Status": inv.status, "Date": inv.invoiceDate }]
                            exportToCSV(csvData, `${inv.invoiceNumber}.csv`)
                        }}><Download className="h-4 w-4 text-slate-400" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InvoicesPage