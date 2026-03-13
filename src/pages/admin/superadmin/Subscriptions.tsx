import React from "react"
import { useQuery } from "@tanstack/react-query"
import { billingApi } from "@/api/apiClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Check, 
  X, 
  Users, 
  Zap, 
  HardDrive,
  AlertCircle
} from "lucide-react"

const ALL_MODULES = [
    { id: "dashboard", label: "Smart Dashboard" },
    { id: "members", label: "Membership Mgmt" },
    { id: "leads", label: "Prospect Mgmt" },
    { id: "billing", label: "Billing & POS" },
    { id: "attendance", label: "Biometric Attendance" },
    { id: "comms", label: "Auto SMS/WhatsApp" },
    { id: "workouts", label: "Workouts & Diet" },
    { id: "payroll", label: "Trainer Payroll" },
    { id: "inventory", label: "Inventory Mgmt" }
]

export const SuperAdminSubscriptions: React.FC = () => {
    const { data: plans } = useQuery({
        queryKey: ["saas_plans"],
        queryFn: async () => {
            const { data, error } = await billingApi.getPlans()
            if (error) throw error
            return data
        }
    })

    console.log("Active SaaS Plans:", plans?.length)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Tiers</h1>
                    <p className="text-muted-foreground">Define your SaaS pricing, limits, and product levels.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Custom Plan Creator
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                {/* LITE PLAN */}
                <Card className="flex flex-col border-2 hover:border-blue-200 transition-colors">
                    <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2 text-blue-600 border-blue-200">ENTRY LEVEL</Badge>
                        <CardTitle className="text-2xl font-bold">Lite (Starter)</CardTitle>
                        <CardDescription>Perfect for personal studios and tiny gyms.</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">₹9,999</span>
                            <span className="text-muted-foreground">/year</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center text-sm">
                                <Users className="mr-2 h-4 w-4 text-blue-500" />
                                <span className="font-semibold mr-1">250</span> Active Members
                            </div>
                            <div className="flex items-center text-sm">
                                <Zap className="mr-2 h-4 w-4 text-blue-500" />
                                <span className="font-semibold mr-1">5</span> Staff Accounts
                            </div>
                            <div className="flex items-center text-sm">
                                <HardDrive className="mr-2 h-4 w-4 text-blue-500" />
                                <span className="font-semibold mr-1">1GB</span> Cloud Storage
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Modules</p>
                            {ALL_MODULES.slice(0, 4).map(mod => (
                                <div key={mod.id} className="flex items-center text-sm">
                                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                                    {mod.label}
                                </div>
                            ))}
                            {ALL_MODULES.slice(4).map(mod => (
                                <div key={mod.id} className="flex items-center text-sm text-slate-300">
                                    <X className="mr-2 h-4 w-4" />
                                    {mod.label}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Edit Plan Settings</Button>
                    </CardFooter>
                </Card>

                {/* PROFESSIONAL PLAN */}
                <Card className="flex flex-col border-2 border-indigo-500 shadow-xl relative scale-105 bg-indigo-50/10">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-indigo-600 px-4 py-1">MOST POPULAR</Badge>
                    </div>
                    <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2 text-indigo-600 border-indigo-200">VALUE CHOICE</Badge>
                        <CardTitle className="text-2xl font-bold">Pro (Growth)</CardTitle>
                        <CardDescription>The standard for growing fitness centers.</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight text-indigo-700">₹19,999</span>
                            <span className="text-muted-foreground">/year</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center text-sm">
                                <Users className="mr-2 h-4 w-4 text-indigo-500" />
                                <span className="font-semibold mr-1">Unlimited</span> Members
                            </div>
                            <div className="flex items-center text-sm">
                                <Zap className="mr-2 h-4 w-4 text-indigo-500" />
                                <span className="font-semibold mr-1">25</span> Staff Accounts
                            </div>
                            <div className="flex items-center text-sm">
                                <HardDrive className="mr-2 h-4 w-4 text-indigo-500" />
                                <span className="font-semibold mr-1">10GB</span> Cloud Storage
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-indigo-100">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Included Modules</p>
                            {ALL_MODULES.slice(0, 7).map(mod => (
                                <div key={mod.id} className="flex items-center text-sm">
                                    <Check className="mr-2 h-4 w-4 text-indigo-500" />
                                    {mod.label}
                                </div>
                            ))}
                            {ALL_MODULES.slice(7).map(mod => (
                                <div key={mod.id} className="flex items-center text-sm text-slate-300">
                                    <X className="mr-2 h-4 w-4" />
                                    {mod.label}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Update Master Plan</Button>
                    </CardFooter>
                </Card>

                {/* ENTERPRISE PLAN */}
                <Card className="flex flex-col border-2 hover:border-slate-300 transition-colors">
                    <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2 text-slate-600 border-slate-200">POWER HOUSE</Badge>
                        <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
                        <CardDescription>Multi-branch franchises & luxury chains.</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">₹34,999</span>
                            <span className="text-muted-foreground">/year</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center text-sm">
                                <Users className="mr-2 h-4 w-4 text-slate-500" />
                                <span className="font-semibold mr-1">Unlimited</span> Members
                            </div>
                            <div className="flex items-center text-sm">
                                <Zap className="mr-2 h-4 w-4 text-slate-500" />
                                <span className="font-semibold mr-1">Unlimited</span> Staff
                            </div>
                            <div className="flex items-center text-sm">
                                <HardDrive className="mr-2 h-4 w-4 text-slate-500" />
                                <span className="font-semibold mr-1">Unlimited</span> Storage
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Modules</p>
                            {ALL_MODULES.map(mod => (
                                <div key={mod.id} className="flex items-center text-sm">
                                    <Check className="mr-2 h-4 w-4 text-slate-900" />
                                    {mod.label}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Review Enterprise Tier</Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-4 mt-12 mb-8">
                <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                    <h4 className="font-bold text-yellow-800">Plan Modification Strategy</h4>
                    <p className="text-sm text-yellow-700">Changing these limits will apply to all <b>new</b> gyms. Existing gyms will remain on their current "Grandfathered" terms unless manually upgraded.</p>
                </div>
            </div>
        </div>
    )
}
