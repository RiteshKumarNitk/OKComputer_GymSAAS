import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PERMISSIONS = {
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

export const AccessControlsPage: React.FC = () => {
    const navigate = useNavigate()
    const [selectedRole, setSelectedRole] = useState("")

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(-1)}
                    className="h-9 px-3 text-xs font-bold border rounded-md gap-1"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <h1 className="text-xl font-bold text-slate-800">Access Controls</h1>
            </div>

            {/* Info and Role Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        Gym Name: <span className="font-bold text-slate-900 uppercase">GYMOWL FITNESS</span>
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                        Gym Branch Name:
                    </p>
                </div>
                <div className="space-y-1.5 md:max-w-xs md:ml-auto w-full">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Role</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                            <SelectValue placeholder="Select Role" />
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

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 pt-4">
                {Object.entries(PERMISSIONS).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Checkbox id={`cat-${category}`} className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600" />
                             <label className="text-xs font-black text-slate-700 uppercase tracking-widest">{category}</label>
                        </div>
                        <div className="ml-6 space-y-3">
                            {items.map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <Checkbox id={`${category}-${item}`} className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-600" />
                                    <label htmlFor={`${category}-${item}`} className="text-xs font-medium text-slate-500 lowercase cursor-pointer hover:text-slate-900 transition-colors">
                                        {item}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Save Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 px-10 rounded-xl shadow-xl shadow-orange-600/20">
                    Save Access Rules
                </Button>
            </div>
        </div>
    )
}

export default AccessControlsPage
