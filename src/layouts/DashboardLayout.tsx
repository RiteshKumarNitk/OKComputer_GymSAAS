import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import type { UserRole } from "@/types"
import {
  Home,
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Activity,
  Dumbbell,
  Apple,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Building,
  BarChart3,
  QrCode,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles: UserRole[]
  permission?: string
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
    roles: ["super_admin", "gym_owner", "manager", "trainer", "frontdesk"],
  },
  {
    title: "Super Admin",
    href: "/super-admin",
    icon: <Shield className="h-4 w-4" />,
    roles: ["super_admin"],
  },
  {
    title: "Members",
    href: "/members",
    icon: <Users className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "trainer", "frontdesk"],
    permission: "view_members",
  },
  {
    title: "Trainers",
    href: "/trainers",
    icon: <UserCheck className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Front Desk",
    href: "/front-desk",
    icon: <Users className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Branches",
    href: "/branches",
    icon: <Building className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Services",
    href: "/services",
    icon: <Activity className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: <QrCode className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "trainer", "frontdesk"],
    permission: "view_attendance",
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: <Calendar className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "trainer"],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: <CreditCard className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "frontdesk"],
    permission: "view_billing",
  },
  {
    title: "Workouts",
    href: "/workouts",
    icon: <Dumbbell className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "trainer"],
  },
  {
    title: "Diet Plans",
    href: "/diet-plans",
    icon: <Apple className="h-4 w-4" />,
    roles: ["gym_owner", "manager", "trainer"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <FileText className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
    permission: "view_analytics",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["gym_owner", "manager"],
  },
]

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut, hasRole, hasPermission, tenantFeatures } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const filteredNavigation = navigation.filter((item) => {
    const hasRequiredRole = hasRole(item.roles)
    const hasRequiredPermission = !item.permission || hasPermission(item.permission)

    const featureKey = item.href.substring(1)

    // Separate dashboard for Super Admins
    if (user?.role === 'super_admin') {
      return ['super-admin', 'settings'].includes(featureKey)
    }

    if (['dashboard', 'settings', 'super-admin'].includes(featureKey)) return hasRequiredRole && hasRequiredPermission

    if (tenantFeatures === null) return hasRequiredRole && hasRequiredPermission

    const isFeatureEnabled = tenantFeatures.includes(featureKey)

    return hasRequiredRole && hasRequiredPermission && isFeatureEnabled
  })

  const handleSignOut = async () => {
    await signOut()
    navigate("/signin")
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10 bg-slate-900 text-white">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary rounded-lg p-1">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">GymPro</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto bg-slate-900">
            {filteredNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                  location.pathname === item.href
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={cn(
                  "mr-3 p-1 rounded-md transition-colors",
                  location.pathname === item.href ? "bg-white/20" : "bg-transparent group-hover:bg-white/10"
                )}>
                  {item.icon}
                </div>
                <span className="flex-1">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user?.full_name || undefined} />
                    <AvatarFallback>{getInitials(user?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role.replace("_", " ")}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-md border-b lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              {filteredNavigation.find((item) => item.href === location.pathname)?.title || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add any top bar actions here */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}