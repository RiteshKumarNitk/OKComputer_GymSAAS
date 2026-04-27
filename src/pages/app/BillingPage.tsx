import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expensesApi, paymentsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Printer,
  FileText,
  ArrowLeft,
  TrendingDown
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Pagination State (Invoices)
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceRowsPerPage, setInvoiceRowsPerPage] = useState(10)

  // Pagination State (Expenses)
  const [expensePage, setExpensePage] = useState(1)
  const [expenseRowsPerPage, setExpenseRowsPerPage] = useState(10)

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
    mutationFn: async (formData: FormData) => {
      const amount = parseFloat(formData.get("amount") as string) * 100 // Convert to cents

      const data = {
        title: formData.get("title") as string,
        amount_cents: Math.round(amount),
        category: formData.get("category") as string,
        expense_date: formData.get("date") as string,
        notes: formData.get("notes") as string,
      }

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

  // Invoices Pagination Logic
  const filteredInvoices = invoices || []
  const totalInvoices = filteredInvoices.length
  const invoiceTotalPages = Math.ceil(totalInvoices / invoiceRowsPerPage)
  const paginatedInvoices = filteredInvoices.slice((invoicePage - 1) * invoiceRowsPerPage, invoicePage * invoiceRowsPerPage)
  const invoiceShowingFrom = totalInvoices === 0 ? 0 : (invoicePage - 1) * invoiceRowsPerPage + 1
  const invoiceShowingTo = Math.min(invoicePage * invoiceRowsPerPage, totalInvoices)

  // Expenses Pagination Logic
  const filteredExpenses = expenses || []
  const totalExpensesCount = filteredExpenses.length
  const expenseTotalPages = Math.ceil(totalExpensesCount / expenseRowsPerPage)
  const paginatedExpensesList = filteredExpenses.slice((expensePage - 1) * expenseRowsPerPage, expensePage * expenseRowsPerPage)
  const expenseShowingFrom = totalExpensesCount === 0 ? 0 : (expensePage - 1) * expenseRowsPerPage + 1
  const expenseShowingTo = Math.min(expensePage * expenseRowsPerPage, totalExpensesCount)

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addExpenseMutation.mutate(formData)
  }

  const handlePrintInvoice = () => {
    window.print()
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/front-desk")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
             <ArrowLeft className="h-4 w-4" /> Back to Desk
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="text-3xl font-bold tracking-tight">Billing & Finance</h1>
        </div>
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
                  <Select name="category" defaultValue="other">
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
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle>Member Billing History</CardTitle>
              <CardDescription>View and generate invoices for members.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInvoicesLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={6} className="h-12 bg-slate-50" />
                      </TableRow>
                    ))
                  ) : paginatedInvoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id.split('-')[0].toUpperCase()}</TableCell>
                      <TableCell className="font-medium">{inv.member?.fullName || "Unassigned"}</TableCell>
                      <TableCell>{formatDate(inv.paidAt || inv.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(inv.amount_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                          {inv.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedInvoice(inv); setIsInvoiceOpen(true); }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isInvoicesLoading && invoices?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Invoices Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                  <div className="text-xs">
                      Showing <span className="text-slate-900">{invoiceShowingFrom}</span> to <span className="text-slate-900">{invoiceShowingTo}</span> of <span className="text-slate-900">{totalInvoices}</span> entries
                  </div>

                  <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                          Rows per page:
                          <select className="bg-transparent font-bold text-slate-900 focus:outline-none" value={invoiceRowsPerPage} onChange={(e) => {setInvoiceRowsPerPage(Number(e.target.value)); setInvoicePage(1);}}>
                              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                      </div>

                      <div className="flex items-center gap-2">
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setInvoicePage(prev => Math.max(1, prev - 1))}
                              disabled={invoicePage === 1}
                              className="text-xs font-bold"
                          >
                              Prev
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setInvoicePage(prev => Math.min(invoiceTotalPages, prev + 1))}
                              disabled={invoicePage === invoiceTotalPages || invoiceTotalPages === 0}
                              className="text-xs font-bold"
                          >
                              Next
                          </Button>
                      </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Register</CardTitle>
              <CardDescription>Full history of gym operational costs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpensesList.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.expense_date)}</TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(expense.amount_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {totalExpensesCount === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">No expenses recorded.</TableCell></TableRow>}
                </TableBody>
              </Table>

              {/* Expenses Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
                  <div className="text-xs">
                      Showing <span className="text-slate-900">{expenseShowingFrom}</span> to <span className="text-slate-900">{expenseShowingTo}</span> of <span className="text-slate-900">{totalExpensesCount}</span> entries
                  </div>

                  <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                          Rows:
                          <select className="bg-transparent font-bold text-slate-900 focus:outline-none" value={expenseRowsPerPage} onChange={(e) => {setExpenseRowsPerPage(Number(e.target.value)); setExpensePage(1);}}>
                              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                      </div>

                      <div className="flex items-center gap-2">
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                              disabled={expensePage === 1}
                              className="text-xs font-bold"
                          >
                              Prev
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setExpensePage(prev => Math.min(expenseTotalPages, prev + 1))}
                              disabled={expensePage === expenseTotalPages || expenseTotalPages === 0}
                              className="text-xs font-bold"
                          >
                              Next
                          </Button>
                      </div>
                  </div>
              </div>
            </CardContent>
          </Card>
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
                  <TableCell className="text-right font-black text-lg">TOTAL PAID</TableCell>
                  <TableCell className="text-right font-black text-lg">
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