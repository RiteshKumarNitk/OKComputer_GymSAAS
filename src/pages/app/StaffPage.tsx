import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreVertical, Plus, QrCode, ShieldCheck } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"

interface Employee {
    id: string
    name: string
    mobile: string
    activities: string
    role: string
    isActive: boolean
}

const initialEmployees: Employee[] = [
    { id: "652726", name: "varsha", mobile: "7397820988", activities: "", role: "Trainer, Personal trainer", isActive: true },
    { id: "440881", name: "EMPLYEE", mobile: "8540013434", activities: "", role: "Sales consultant, Branch Manager, Receptionist", isActive: true },
    { id: "361700", name: "navya", mobile: "6767898990", activities: "", role: "Trainer", isActive: true },
]

export const StaffPage: React.FC = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees)

    const toggleStatus = (id: string) => {
        setEmployees(prev => prev.map(emp => 
            emp.id === id ? { ...emp, isActive: !emp.isActive } : emp
        ))
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4">Employee Management</h1>
                <Button className="bg-[#FF6B3D] hover:bg-[#E85A2C] text-white rounded-md font-bold px-6 h-10 shadow-lg shadow-orange-500/10 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Employee
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-md border-slate-200 bg-[#F4F4F5] text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
            </div>

            {/* Table Card */}
            <Card className="border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700">Employees</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-9 bg-orange-600/10 border-orange-600/20 text-orange-600 hover:bg-orange-600/20 rounded-md text-xs font-bold gap-2">
                            <QrCode className="h-3.5 w-3.5" /> View Gym QR
                        </Button>
                        <Button 
                            onClick={() => navigate("/settings/access-control")}
                            className="h-9 bg-[#FF6B3D] hover:bg-[#E85A2C] text-white rounded-md text-xs font-bold gap-2 shadow-sm"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" /> Access Control
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30 hover:bg-transparent">
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-6 py-4">Emp ID</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-4 py-4">Emp Name</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-4 py-4">Mobile Number</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-4 py-4">Activities</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-4 py-4">Role</TableHead>
                                <TableHead className="text-[11px] font-bold text-slate-500 uppercase px-4 py-4">Active / Inactive</TableHead>
                                <TableHead className="text-right px-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-slate-50/50">
                                    <TableCell className="px-6 py-5 text-xs text-slate-600 font-medium">{emp.id}</TableCell>
                                    <TableCell className="px-4 py-5 text-xs text-slate-800 font-bold">{emp.name}</TableCell>
                                    <TableCell className="px-4 py-5 text-xs text-slate-600 font-medium">{emp.mobile}</TableCell>
                                    <TableCell className="px-4 py-5 text-xs text-slate-500 italic">--</TableCell>
                                    <TableCell className="px-4 py-5 text-xs text-slate-700 font-bold max-w-[200px] truncate">{emp.role}</TableCell>
                                    <TableCell className="px-4 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${emp.isActive ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {emp.isActive ? 'On' : 'Off'}
                                            </div>
                                            <Switch 
                                                checked={emp.isActive} 
                                                onCheckedChange={() => toggleStatus(emp.id)} 
                                                className="data-[state=checked]:bg-green-600"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                            <MoreVertical className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

export default StaffPage;
