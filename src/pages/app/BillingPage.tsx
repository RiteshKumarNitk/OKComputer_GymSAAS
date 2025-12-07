import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/api/supabase"
import { useAuth } from "@/features/auth/AuthContext"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DollarSign,
  TrendingDown,
  Plus,
  Calendar,
  FileText,
  Search,
  MoreVertical,
  Trash2,
  Edit
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

  // Fetch Expenses
  const { data: expenses } = useQuery({
    queryKey: ["expenses", user?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("tenant_id", user?.tenant_id)
        .order("expense_date", { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!user?.tenant_id,
  })

  // Add Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const amount = parseFloat(formData.get("amount") as string) * 100 // Convert to cents

      const data = {
        tenant_id: user?.tenant_id,
        title: formData.get("title") as string,
        amount_cents: Math.round(amount),
        category: formData.get("category") as string,
        expense_date: formData.get("date") as string,
        notes: formData.get("notes") as string,
      }

      const { error } = await supabase.from("expenses").insert([data])
      if (error) throw error
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
    queryKey: ["recent-payments", user?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, members(full_name)")
        .eq("tenant_id", user?.tenant_id)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: !!user?.tenant_id,
  })

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addExpenseMutation.mutate(formData)
  }

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount_cents, 0) || 0
  const totalIncome = payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0 // This is just recent, but dashboard has full logic

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Finance</h1>
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
                          <p className="font-medium text-sm">{payment.members?.full_name || "Unknown Member"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.paid_at)}</p>
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
                  {expenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.expense_date)}</TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(expense.amount_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}