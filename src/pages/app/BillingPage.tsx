import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expensesApi, paymentsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Printer,
  FileText,
  TrendingDown
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader, DataTable } from "@/components/common"
import type { Column } from "@/components/common"


interface Expense {
  id: string
  title: string
  amount_cents: number
  category: string
  expense_date: string
  notes: string
}

export const BillingPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState("other")

  // Fetch Expenses
  const { data: expenses } = useQuery({
    queryKey: ["expenses", user?.tenantId],
    queryFn: async () => {
      const response = await expensesApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data as Expense[]
    },
    enabled: !!user?.tenantId,
  })

  // Add Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (data: { title: string; amount_cents: number; category: string; expense_date: string; notes: string }) => {
      const response = await expensesApi.create(data)
      if (response.error) throw response.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      setIsAddExpenseOpen(false)
      toast({ title: "Success", description: "Expense added successfully" })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  })

  // Fetch Recent Payments (Income)
  const { data: payments } = useQuery({
    queryKey: ["recent-payments", user?.tenantId],
    queryFn: async () => {
      const response = await paymentsApi.list(user?.tenantId || "", undefined, "paid")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  // Fetch Invoices
  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["all-invoices", user?.tenantId],
    queryFn: async () => {
      const response = await paymentsApi.list(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data || []
    },
    enabled: !!user?.tenantId,
  })

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const amount = parseFloat(fd.get("amount") as string) * 100
    addExpenseMutation.mutate({
      title: fd.get("title") as string,
      amount_cents: Math.round(amount),
      category: expenseCategory,
      expense_date: fd.get("date") as string,
      notes: (fd.get("notes") as string) || "",
    })
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const invoiceColumns: Column<any>[] = [
    { key: "invoiceId", label: "Invoice ID", render: (inv: any) => <span className="font-mono text-xs">{inv.id.split('-')[0].toUpperCase()}</span> },
    { key: "member", label: "Member", render: (inv: any) => <span className="font-medium">{inv.member?.fullName || "Unassigned"}</span> },
    { key: "date", label: "Date", render: (inv: any) => <>{formatDate(inv.paidAt || inv.createdAt)}</> },
    { key: "amount", label: "Amount", render: (inv: any) => <>{formatCurrency(inv.amount_cents)}</> },
    { key: "status", label: "Status", render: (inv: any) => <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>{inv.status?.toUpperCase()}</Badge> },
    { key: "action", label: "Action", className: "text-right", render: (inv: any) => (
      <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(inv); setIsInvoiceOpen(true); }}>
        <FileText className="h-4 w-4 mr-2" /> View
      </Button>
    )},
  ]

  const expenseColumns: Column<Expense>[] = [
    { key: "date", label: "Date", render: (expense) => <>{formatDate(expense.expense_date)}</> },
    { key: "title", label: "Title", render: (expense) => <span className="font-medium">{expense.title}</span> },
    { key: "category", label: "Category", render: (expense) => <span className="capitalize">{expense.category}</span> },
    { key: "amount", label: "Amount", className: "text-right font-medium text-red-600", render: (expense) => <>{formatCurrency(expense.amount_cents)}</> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Finance"
        titleClassName="text-3xl font-bold tracking-tight"
        onBack={() => navigate("/front-desk")}
        actions={
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <TrendingDown className="mr-2 h-4 w-4" /> Record Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>Track operational costs like rent, salary, etc.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Expense Title</Label>
                  <Input id="title" name="title" placeholder="e.g., Monthly Rent" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities (Electric/Water)</SelectItem>
                        <SelectItem value="salary">Staff Salary</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="equipment">New Equipment</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addExpenseMutation.isPending}>
                    {addExpenseMutation.isPending ? "Saving..." : "Save Expense"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions (In/Out)</TabsTrigger>
          <TabsTrigger value="invoices">Member Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses Log</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recently Received (Income)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent payments.</p>
                  ) : (
                    payments?.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{payment.member?.fullName || "Unknown Member"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.paidAt || payment.paid_at)}</p>
                        </div>
                        <div className="text-emerald-600 font-bold">
                          +{formatCurrency(payment.amount_cents)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Expenses (Outflow)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses?.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{expense.title}</p>
                        <Badge variant="outline" className="text-xs mt-0.5">{expense.category}</Badge>
                      </div>
                      <div className="text-red-600 font-bold">
                        -{formatCurrency(expense.amount_cents)}
                      </div>
                    </div>
                  ))}
                  {expenses?.length === 0 && <p className="text-muted-foreground text-sm">No expenses recorded.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <DataTable
            columns={invoiceColumns}
            data={invoices || []}
            loading={isInvoicesLoading}
            title="Member Billing History"
            emptyMessage="No invoices found."
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <DataTable
            columns={expenseColumns}
            data={expenses || []}
            title="Expense Register"
            emptyMessage="No expenses recorded."
          />
        </TabsContent>
      </Tabs>

      {/* Invoice View Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="print:hidden">
            <DialogTitle>Tax Invoice</DialogTitle>
          </DialogHeader>
          
          <div id="printable-invoice" className="p-6 bg-white dark:bg-slate-950 rounded-lg">
            <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary">GYM PRO</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  123 Fitness Street, Health Hub<br />
                  contact@gympro.com | +91 98765 43210
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold uppercase">Invoice</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {selectedInvoice?.id.split('-')[0].toUpperCase()}<br />
                  Date: {formatDate(selectedInvoice?.paidAt || selectedInvoice?.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Billed To</p>
                <p className="font-bold">{selectedInvoice?.member?.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {selectedInvoice?.member?.memberCode}<br />
                  {selectedInvoice?.member?.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Payment Info</p>
                <p className="text-sm font-medium">Status: <span className="text-emerald-500 uppercase">{selectedInvoice?.status}</span></p>
                <p className="text-sm text-muted-foreground">Gateway: {selectedInvoice?.paymentMethod || "Digital Transfer"}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">Membership Subscription</p>
                    <p className="text-xs text-muted-foreground">Access period as per active membership plan.</p>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(selectedInvoice?.amount_cents)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-right font-bold pt-6">SUBTOTAL</TableCell>
                  <TableCell className="text-right pt-6">{formatCurrency(selectedInvoice?.amount_cents)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 border-slate-900 dark:border-white">
                  <TableCell className="text-right font-bold text-lg">TOTAL PAID</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(selectedInvoice?.amount_cents)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-12 pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground italic">
                This is a computer generated invoice and does not require a physical signature.
              </p>
              <p className="text-sm font-bold mt-2">Thank you for your business!</p>
            </div>
          </div>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Close</Button>
            <Button onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}