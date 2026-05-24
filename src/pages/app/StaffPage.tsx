import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { SearchBar, PageHeader } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, QrCode, ShieldCheck, UserCog, Trash2, KeyRound } from "lucide-react"

const STAFF_ROLES = ["manager", "trainer", "frontdesk"]

export const StaffPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newRole, setNewRole] = useState("trainer")

  const { data: staff, isLoading } = useQuery({
    queryKey: ["users", user?.tenantId],
    queryFn: async () => {
      const res = await usersApi.list(user?.tenantId || "")
      if (res.error) throw res.error
      return (res.data || []).filter((u: any) => STAFF_ROLES.includes(u.role))
    },
    enabled: !!user?.tenantId,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await usersApi.update(id, { isActive: !isActive })
      if (res.error) throw res.error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; phone: string; role: string }) => {
      const res = await usersApi.create({ ...data, tenantId: user?.tenantId, password: "Welcome@123" })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setIsAddOpen(false)
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole("trainer")
      toast({ title: "Employee added", description: "Default password: Welcome@123" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await usersApi.delete(id)
      if (res.error) throw res.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({ title: "Employee removed" })
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  })

  const filteredStaff = (staff || []).filter((s: any) =>
    (s.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const roleBadgeClass = (role: string) => {
    const map: Record<string, string> = {
      manager: "bg-blue-100 text-blue-600 border-blue-200",
      trainer: "bg-amber-100 text-amber-600 border-amber-200",
      frontdesk: "bg-purple-100 text-purple-600 border-purple-200",
    }
    return map[role] || "bg-slate-100 text-slate-600"
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <PageHeader
        title="Employee Management"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold text-xs gap-2" onClick={() => navigate("/settings/access-control")}>
              <ShieldCheck className="h-4 w-4" /> Access Control
            </Button>
            <Button variant="brand" className="h-10 rounded-xl font-bold px-6 gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </div>
        }
      />

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search employees..." />

      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Employees ({filteredStaff.length})</h2>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1 text-slate-400" onClick={() => setIsQrOpen(true)}>
            <QrCode className="h-3.5 w-3.5" /> View Gym QR
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/30">
              <tr>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-5 px-6">Emp ID</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-5 px-4">Name</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-5 px-4">Contact</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-5 px-4">Role</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-5 px-4">Status</th>
                <th className="text-right px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16 bg-slate-50/30" /></tr>)
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan={6} className="h-32 text-center text-slate-400 font-medium italic">No employees found.</td></tr>
              ) : filteredStaff.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 text-xs font-mono text-slate-500">{s.id.substring(0, 8)}</td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><UserCog className="h-4 w-4" /></div>
                      <span className="text-sm font-bold text-slate-800">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-xs font-medium text-slate-600">{s.email}</p>
                    {s.phone && <p className="text-[10px] text-slate-400">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-5">
                    <Badge className={`text-[10px] font-bold uppercase border rounded-lg px-2.5 py-1 ${roleBadgeClass(s.role)}`}>{s.role}</Badge>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${s.isActive ? "bg-green-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch checked={s.isActive} onCheckedChange={() => toggleStatusMutation.mutate({ id: s.id, isActive: s.isActive })} className="data-[state=checked]:bg-green-600" />
                    </div>
                  </td>
                  <td className="text-right px-6 py-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem onClick={() => navigate(`/profile?id=${s.id}`)} className="text-xs"><UserCog className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { usersApi.update(s.id, { password: "Welcome@123" }); toast({ title: "Password reset to Welcome@123" }); }} className="text-xs"><KeyRound className="mr-2 h-3.5 w-3.5" /> Reset Password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { if (confirm("Remove this employee?")) deleteEmployeeMutation.mutate(s.id); }} className="text-xs text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="john@gym.com" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="frontdesk">Front Desk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-400">Default password: <span className="font-mono">Welcome@123</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addEmployeeMutation.mutate({ fullName: newName, email: newEmail, phone: newPhone, role: newRole })} disabled={!newName || !newEmail || addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Gym QR Code</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="h-48 w-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
              QR placeholder<br/>(configure in settings)
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">Scan to check-in. Configure QR URL in Business Settings.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsQrOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffPage