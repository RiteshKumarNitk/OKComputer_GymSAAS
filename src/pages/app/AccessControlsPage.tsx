import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, Search, Save, User, Shield } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const DEFAULT_PERMISSIONS = {
    REPORTS: [
        "attendance report",
        "balance due report",
        "due membership report",
        "pt report",
        "sales report",
        "sms report"
    ],
    ANALYTICS: ["Analytics"],
    BIOMETRIC: ["Biometric", "Add"],
    EMPLOYEES: [
        "employees",
        "Add",
        "Add to biometric",
        "Block biometric",
        "Delete",
        "Edit",
        "Unblock Biometric",
        "Update Status",
        "View QR"
    ],
    ENQUIRIES: [
        "enquiries",
        "Call not Connected",
        "Close Enquiry",
        "Edit Enquiry",
        "Generate Report",
        "Not Interested Enquiry",
        "Open Enquiry",
        "Sale Enquiry",
        "Schedule Follow up",
        "Send SMS"
    ],
    "EXPENSE MANAGEMENT": [
        "expense management",
        "Add",
        "Delete",
        "Edit",
        "Generate Report"
    ],
    "EXPIRED MEMBER REPORT": ["expired member report"],
    "MEMBERS WORKOUT CARD": ["members workout card", "Assign", "Create", "Delete", "Edit"],
    "MEMBERS REPORT CARD": ["members report card"],
    "MEMBERSHIP ANALYTICS": ["membership analytics", "Generate Report"],
    "MEMBERSHIP": ["membership", "Add Client ID", "Add on days", "Change Start Date", "Generate Report", "View Invoice"],
    "PAYMENTS": ["payments", "Change Invoice Date", "Change payment Date"],
    "MEMBERSHIP PACKAGE": ["membership package"],
    "CONFIGURATION": ["configuration"]
}

const ROLE_LABELS: Record<string, string> = {
    manager: "Branch Manager",
    consultant: "Diet Consultant",
    lead: "Fitness Lead",
    trainer: "Trainer",
}

const ROLE_BADGE_COLORS: Record<string, string> = {
    manager: "bg-blue-100 text-blue-600",
    consultant: "bg-green-100 text-green-600",
    lead: "bg-purple-100 text-purple-600",
    trainer: "bg-amber-100 text-amber-600",
    frontdesk: "bg-slate-100 text-slate-600",
    gym_owner: "bg-orange-100 text-orange-600",
}

export const AccessControlsPage: React.FC = () => {
    const navigate = useNavigate()
    const { user: authUser } = useAuth()
    const queryClient = useQueryClient()
    const [selectedUserId, setSelectedUserId] = useState("")
    const [selectedRole, setSelectedRole] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [permissions, setPermissions] = useState<Record<string, string[]>>({})

    const { data: users } = useQuery({
        queryKey: ["users", authUser?.tenantId],
        queryFn: async () => {
            const res = await usersApi.list(authUser?.tenantId || "")
            if (res.error) throw res.error
            return res.data || []
        },
        enabled: !!authUser?.tenantId && authUser?.role === "gym_owner",
    })

    const selectedUser = users?.find((u: any) => u.id === selectedUserId)

    useEffect(() => {
        if (selectedUserId) {
            const saved = localStorage.getItem(`access_controls_${selectedUserId}`)
            if (saved) {
                try { setPermissions(JSON.parse(saved)); return } catch {}
            }
        }
        setPermissions({})
    }, [selectedUserId])

    const filteredUsers = (users || []).filter((u: any) => {
        const name = (u.fullName || "").toLowerCase()
        const email = (u.email || "").toLowerCase()
        const q = searchQuery.toLowerCase()
        return name.includes(q) || email.includes(q) || (u.role || "").includes(q)
    })

    const saveMutation = useMutation({
        mutationFn: async () => {
            const allPermissions = Object.entries(DEFAULT_PERMISSIONS).reduce((acc, [cat, items]) => {
                const selected = permissions[cat] || []
                acc[cat] = items.filter(item => selected.includes(item))
                return acc
            }, {} as Record<string, string[]>)

            localStorage.setItem(`access_controls_${selectedUserId}`, JSON.stringify(allPermissions))
            await new Promise(r => setTimeout(r, 300))
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["access-controls"] })
        },
    })

    const togglePermission = (category: string, item: string) => {
        setPermissions(prev => {
            const allSelected = prev[category] || []
            const exists = allSelected.includes(item)
            const updated = exists
                ? allSelected.filter(i => i !== item)
                : [...allSelected, item]
            return { ...prev, [category]: updated }
        })
    }

    const toggleCategory = (category: string) => {
        setPermissions(prev => {
            const items = DEFAULT_PERMISSIONS[category as keyof typeof DEFAULT_PERMISSIONS] || []
            const current = prev[category] || []
            const allChecked = items.every(i => current.includes(i))
            return { ...prev, [category]: allChecked ? [] : [...items] }
        })
    }

    const isItemChecked = (category: string, item: string) => {
        return (permissions[category] || []).includes(item)
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-9 px-3 text-xs font-bold border rounded-md gap-1">
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <h1 className="text-xl font-bold text-slate-800">Access Controls</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - User Selection */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <User className="h-4 w-4" /> Select User
                            </h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-9 h-10 rounded-xl border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 max-h-[500px] overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-8 italic">No users found. Create staff users first from Employee Management.</p>
                                ) : filteredUsers.map((u: any) => (
                                    <button
                                        key={u.id}
                                        onClick={() => { setSelectedUserId(u.id); setSelectedRole("") }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedUserId === u.id ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <Avatar className="h-9 w-9 rounded-xl">
                                            <AvatarFallback className="bg-slate-100 text-xs font-bold">
                                                {(u.fullName || 'U').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{u.fullName || 'Unknown'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                        </div>
                                        <Badge className={`rounded-lg text-[9px] font-black uppercase px-2 py-0.5 ${ROLE_BADGE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                            {ROLE_LABELS[u.role] || u.role}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Permissions */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedUserId ? (
                        <Card className="border-slate-100 shadow-sm rounded-3xl bg-white">
                            <CardContent className="p-16 text-center">
                                <Shield className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Select a User</h3>
                                <p className="text-sm text-slate-400 mt-2">Choose a user from the left panel to configure their access permissions.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* User & Role Info */}
                            <Card className="border-slate-100 shadow-sm rounded-3xl bg-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 rounded-2xl">
                                                <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-lg">
                                                    {(selectedUser?.fullName || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">{selectedUser?.fullName}</h3>
                                                <p className="text-xs text-slate-400">{selectedUser?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Role Template</label>
                                                <Select value={selectedRole} onValueChange={(val) => {
                                                    setSelectedRole(val)
                                                    const rolePresets: Record<string, string[]> = {
                                                        manager: ["attendance report", "balance due report", "due membership report", "pt report", "sales report", "sms report", "Analytics", "membership", "Add Client ID", "Add on days", "Change Start Date", "Generate Report", "View Invoice", "payments", "Change Invoice Date", "Change payment Date", "membership package", "enquiries", "Call not Connected", "Close Enquiry", "Edit Enquiry", "Generate Report", "Not Interested Enquiry", "Open Enquiry", "Sale Enquiry", "Schedule Follow up", "Send SMS", "expense management", "Add", "Delete", "Edit", "Generate Report", "expired member report", "members report card", "membership analytics", "configuration", "members workout card", "Assign", "Create", "Edit"],
                                                        trainer: ["pt report", "members workout card", "Assign", "Create", "Edit", "Biometric"],
                                                        consultant: ["pt report"],
                                                        lead: ["members workout card", "Assign", "Create", "Edit"],
                                                    }
                                                    const preset = rolePresets[val] || []
                                                    const newPerms: Record<string, string[]> = {}
                                                    Object.entries(DEFAULT_PERMISSIONS).forEach(([cat, items]) => {
                                                        newPerms[cat] = items.filter(i => preset.includes(i))
                                                    })
                                                    setPermissions(newPerms)
                                                }}>
                                                    <SelectTrigger className="h-10 rounded-xl border-slate-200 w-[180px]">
                                                        <SelectValue placeholder="Apply Template" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                        <SelectItem value="manager">Branch Manager</SelectItem>
                                                        <SelectItem value="consultant">Diet Consultant</SelectItem>
                                                        <SelectItem value="lead">Fitness Lead</SelectItem>
                                                        <SelectItem value="trainer">Trainer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Permissions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                {Object.entries(DEFAULT_PERMISSIONS).map(([category, items]) => {
                                    const categoryPerms = permissions[category] || []
                                    const allChecked = items.every(i => categoryPerms.includes(i))
                                    return (
                                        <div key={category} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`cat-${category}`}
                                                    checked={allChecked}
                                                    onCheckedChange={() => toggleCategory(category)}
                                                    className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600"
                                                />
                                                <label htmlFor={`cat-${category}`} className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">{category}</label>
                                            </div>
                                            <div className="ml-6 space-y-2.5">
                                                {items.map((item) => (
                                                    <div key={item} className="flex items-center gap-3">
                                                        <Checkbox
                                                            id={`${category}-${item}`}
                                                            checked={isItemChecked(category, item)}
                                                            onCheckedChange={() => togglePermission(category, item)}
                                                            className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600"
                                                        />
                                                        <label htmlFor={`${category}-${item}`} className="text-xs font-medium text-slate-500 lowercase cursor-pointer hover:text-slate-900 transition-colors">
                                                            {item}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => saveMutation.mutate()}
                                    disabled={saveMutation.isPending}
                                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 px-10 rounded-xl shadow-xl shadow-orange-600/20 flex items-center gap-2"
                                >
                                    <Save className="h-5 w-5" />
                                    {saveMutation.isPending ? 'Saving...' : 'Save Access Rules'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AccessControlsPage