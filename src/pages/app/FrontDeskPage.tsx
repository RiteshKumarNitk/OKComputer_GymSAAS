import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    UserCheck,
    UserPlus,
    Search,
    RefreshCw,
    Users,
    Timer,
    Calendar,
    ClipboardList,
    Lock,
    CreditCard,
    ShoppingCart,
    MessageSquareWarning,
    User,
    FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffManagement } from "@/features/front-desk/StaffManagement"
import { CheckInDialog } from "@/features/front-desk/CheckInDialog"
import { useToast } from "@/components/ui/use-toast"

export const FrontDeskPage: React.FC = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState("dashboard")
    const [isCheckInOpen, setIsCheckInOpen] = useState(false)

    const handleCardClick = (item: any) => {
        if (item.action === "check-in") {
            setIsCheckInOpen(true)
            return
        }

        if (item.path) {
            navigate(item.path)
        } else {
            toast({
                title: "Coming Soon",
                description: `${item.title} module is under development.`,
            })
        }
    }

    const frontDeskModules = [
        {
            title: "Member Check-In",
            icon: UserCheck,
            description: "Check-in members for workout",
            action: "check-in",
            color: "text-green-500",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Add Member",
            icon: UserPlus,
            description: "Register a new member",
            action: "add-member",
            path: "/members?tab=create",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Member Search",
            icon: Search,
            description: "Find member details",
            action: "search-member",
            path: "/members",
            color: "text-indigo-500",
            bgColor: "bg-indigo-500/10"
        },
        {
            title: "Renew Membership",
            icon: RefreshCw,
            description: "Renew expired memberships",
            action: "renew",
            path: "/renewals",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        },
        {
            title: "Leads / Walk-in Enquiry",
            icon: Users,
            description: "Manage walk-ins and leads",
            action: "leads",
            path: "/leads",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Trial Booking",
            icon: Timer,
            description: "Schedule trial sessions",
            action: "trials",
            path: "/leads",
            color: "text-pink-500",
            bgColor: "bg-pink-500/10"
        },
        {
            title: "Class Booking",
            icon: Calendar,
            description: "Book slots, classes & PT",
            action: "class-booking",
            path: "/schedule",
            color: "text-cyan-500",
            bgColor: "bg-cyan-500/10"
        },
        {
            title: "Today's Attendance",
            icon: ClipboardList,
            description: "View daily attendance log",
            action: "attendance",
            path: "/attendance",
            color: "text-teal-500",
            bgColor: "bg-teal-500/10"
        },
        {
            title: "Locker Assignment",
            icon: Lock,
            description: "Assign and manage lockers",
            action: "lockers",
            path: "/lockers",
            color: "text-slate-500",
            bgColor: "bg-slate-500/10"
        },
        {
            title: "Payments & Billing",
            icon: CreditCard,
            description: "Collect payments and invoices",
            action: "billing",
            path: "/billing",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10"
        },
        {
            title: "POS Sales",
            icon: ShoppingCart,
            description: "Sell products and supplements",
            action: "pos",
            path: "/pos",
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10"
        },
        {
            title: "Complaints / Requests",
            icon: MessageSquareWarning,
            description: "Log member complaints",
            action: "complaints",
            path: "/operations?tab=complaints",
            color: "text-red-500",
            bgColor: "bg-red-500/10"
        },
        {
            title: "Visitor Entry",
            icon: User,
            description: "Log non-member visitors",
            action: "visitors",
            path: "/operations?tab=visitors",
            color: "text-lime-500",
            bgColor: "bg-lime-500/10"
        },
        {
            title: "Manage Trainers",
            icon: User,
            description: "Add, edit, or delete trainers",
            action: "trainers",
            path: "/trainers",
            color: "text-indigo-600",
            bgColor: "bg-indigo-600/10"
        },
        {
            title: "Staff Activity Log",
            icon: FileText,
            description: "View staff actions log",
            action: "staff-log",
            path: "/operations", // Placeholder
            color: "text-stone-500",
            bgColor: "bg-stone-500/10"
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Front Desk</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Operations Dashboard</TabsTrigger>
                    <TabsTrigger value="staff">Manage Staff</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {frontDeskModules.map((item) => (
                            <Card
                                key={item.title}
                                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                                onClick={() => handleCardClick(item)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {item.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-full ${item.bgColor}`}>
                                        <item.icon className={`h-4 w-4 ${item.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        {item.description}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="staff">
                    <StaffManagement />
                </TabsContent>
            </Tabs>

            <CheckInDialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen} />
        </div>
    )
}
