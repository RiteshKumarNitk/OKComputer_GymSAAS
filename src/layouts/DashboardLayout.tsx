import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { tenantsApi, membersApi } from "@/api/apiClient"
import type { UserRole } from "@/types"
import {
  LayoutGrid,
  Users,
  RotateCcw,
  MessageSquareWarning,
  MessageCircle,
  BarChart3,
  Utensils,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
  Search,
  Building,
  CreditCard,
  Banknote,
  Settings,
  Dumbbell,
  Fingerprint,
  Info,
  Circle,
  CalendarRange,
  ChevronLeft,
  Plus,
  History,
  FileText,
  Upload,
  Activity,
  Edit
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
  icon?: React.ReactNode
  roles: UserRole[]
  permission?: string
  children?: Omit<NavItem, "icon">[]
  isHeader?: boolean
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutGrid className="h-5 w-5" />,
    roles: ["super_admin", "gym_owner", "manager", "frontdesk", "trainer"],
  },
  {
    title: "Enquiries",
    href: "/leads",
    icon: <Users className="h-5 w-5" />, // Replaced icon to match person-style
    roles: ["gym_owner", "manager", "frontdesk"],
    permission: "view_leads",
  },
  {
    title: "Follow Ups",
    href: "/follow-ups",
    icon: <RotateCcw className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "frontdesk"],
    permission: "view_leads",
  },
  {
    title: "Members",
    href: "/members",
    icon: <Users className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "frontdesk"],
    permission: "view_members",
    children: [
      { title: "Member", href: "/members", roles: ["gym_owner", "manager", "frontdesk"] },
      { title: "Membership Packages", href: "/members/packages", roles: ["gym_owner"] },
      { title: "Memberships", href: "/members/subscriptions", roles: ["gym_owner", "manager"] },
      { title: "Members Workout Card", href: "/members/workouts", roles: ["gym_owner", "trainer"] },
      { title: "Membership Analytics", href: "/members/analytics", roles: ["gym_owner", "manager"] },
      { title: "Members Attendance", href: "/members/attendance", roles: ["gym_owner", "manager", "frontdesk"] },
      { title: "Members Renewals", href: "/members/renewals", roles: ["gym_owner", "manager", "frontdesk"] },
    ]
  },
  {
    title: "Feedback Management",
    href: "/feedback",
    icon: <MessageSquareWarning className="h-5 w-5" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["gym_owner", "manager"],
    children: [
      { title: "Balance Due Reports", href: "/reports/balance-due", roles: ["gym_owner", "manager"] },
      { title: "Sales Reports", href: "/reports/sales", roles: ["gym_owner", "manager"] },
      { title: "Expired Member Report", href: "/reports/expired", roles: ["gym_owner", "manager"] },
      { title: "Members Report Card", href: "/reports/member-card", roles: ["gym_owner", "manager"] },
      { title: "Due Membership Report", href: "/reports/due-membership", roles: ["gym_owner", "manager"] },
      { title: "SMS Report", href: "/reports/sms", roles: ["gym_owner", "manager"] },
    ]
  },
  {
    title: "DietPlan Management",
    href: "/diet-plans",
    icon: <Utensils className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "trainer"],
  },
  {
    title: "Business Setting",
    href: "#",
    isHeader: true,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Employee Management",
    href: "/staff",
    icon: <Users className="h-5 w-5" />,
    roles: ["gym_owner", "manager"],
    children: [
      { title: "Employee Directory", href: "/staff", roles: ["gym_owner", "manager"] },
      { title: "Access Control", href: "/settings/access-control", roles: ["gym_owner"] },
    ]
  },
  {
    title: "Payments",
    href: "/invoices",
    icon: <CreditCard className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "frontdesk"],
  },
  {
    title: "Expense Management",
    href: "/expenses",
    icon: <Banknote className="h-5 w-5" />,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "WhatsApp Web",
    href: "https://web.whatsapp.com",
    icon: <MessageCircle className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "frontdesk"],
  },
  {
    title: "Slot Management",
    href: "/schedule",
    icon: <CalendarRange className="h-5 w-5" />,
    roles: ["gym_owner", "manager", "trainer"],
  },
  {
    title: "Setting",
    href: "#",
    isHeader: true,
    roles: ["gym_owner", "manager"],
  },
  {
    title: "Biometric",
    href: "/settings/biometric",
    icon: <Fingerprint className="h-5 w-5" />,
    roles: ["gym_owner"],
  },
  {
    title: "Gym Details",
    href: "/settings",
    icon: <Info className="h-5 w-5" />,
    roles: ["gym_owner"],
  },
  // Super Admin Section
  {
    title: "Platform Admin",
    href: "/super-admin",
    isHeader: true,
    roles: ["super_admin"],
  },
  {
    title: "Platform Pulse",
    href: "/super-admin",
    icon: <Shield className="h-5 w-5" />,
    roles: ["super_admin"],
    children: [
      { title: "Tenants (Gyms)", href: "/super-admin/tenants", roles: ["super_admin"] },
      { title: "SaaS Plans", href: "/super-admin/subscriptions", roles: ["super_admin"] },
      { title: "SaaS Revenue", href: "/super-admin/payments", roles: ["super_admin"] },
      { title: "Platform Settings", href: "/super-admin/settings", roles: ["super_admin"] },
    ]
  },
]

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const { user, signOut, hasRole, hasPermission, tenantFeatures } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Detect Member Context
  const memberMatch = location.pathname.match(/^\/members\/([^\/]+)/)
  const memberId = memberMatch && !['packages', 'subscriptions', 'workouts', 'analytics', 'attendance', 'renewals', 'add'].includes(memberMatch[1]) ? memberMatch[1] : null
  const isMemberContext = !!memberId

  const { data: member } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
        const response = await membersApi.get(memberId!)
        if (response.error) throw response.error
        return response.data
    },
    enabled: !!memberId,
  })

  // Member Sidebar Items (adapted from MemberProfilePage)
  const memberNavItems = [
    { id: "edit", title: "Edit Profile", icon: <Edit className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "memberships", title: "Memberships", icon: <Users className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "followups", title: "Follow Ups", icon: <History className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "payments", title: "Payment History", icon: <CreditCard className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "reportcard", title: "Report Card", icon: <FileText className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "workouts", title: "Workout History", icon: <Dumbbell className="h-5 w-5" />, roles: ["gym_owner", "trainer"] },
    { id: "diet", title: "Diet History", icon: <Utensils className="h-5 w-5" />, roles: ["gym_owner", "trainer"] },
    { id: "documents", title: "Upload Documents", icon: <Upload className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "attendance", title: "Attendance", icon: <CalendarRange className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
    { id: "biometric", title: "Biometric", icon: <Fingerprint className="h-5 w-5" />, roles: ["gym_owner"] },
    { id: "health", title: "Health Assessment", icon: <Activity className="h-5 w-5" />, roles: ["gym_owner", "manager"] },
  ]

  const { data: tenant } = useQuery({
    queryKey: ["tenant", user?.tenantId],
    queryFn: async () => {
      const response = await tenantsApi.get(user?.tenantId || "")
      if (response.error) throw response.error
      return response.data
    },
    enabled: !!user?.tenantId && user?.role !== "super_admin",
  })

  const filteredNavigation = navigation.filter((item) => {
    const hasRequiredRole = hasRole(item.roles)

    // Super Admin view logic
    if (user?.role === 'super_admin') {
      return item.href.startsWith('/super-admin') || item.href === '/dashboard'
    }

    // Gym owners should see everything their role is assigned to
    if (user?.role === 'gym_owner' && hasRequiredRole) return true

    const hasRequiredPermission = !item.permission || hasPermission(item.permission)
    if (!hasRequiredRole || !hasRequiredPermission) return false

    // If tenant features are not loaded yet or are null, show all role-appropriate items
    if (tenantFeatures === null) return true

    const featureKey = item.href.substring(1).split('?')[0]

    // Core features always visible if role matches
    if (['dashboard', 'settings', 'staff', 'invoices', 'feedback', 'profile', 'billing', 'members', 'leads'].includes(featureKey)) return true

    // Check against tenant enabled features
    const isFeatureEnabled = tenantFeatures.includes(featureKey) ||
      (featureKey === 'leads' && tenantFeatures.includes('crm')) ||
      (featureKey === 'front-desk' && tenantFeatures.includes('operations'))

    return isFeatureEnabled || true
  })

  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const handleSignOut = async () => {
    await signOut()
    navigate("/signin")
  }

  const toggleMenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-8 bg-white dark:bg-slate-900">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="bg-orange-500 rounded-xl p-2 shadow-lg shadow-orange-200 dark:shadow-orange-950/20 group-hover:scale-105 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">GymOWL</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {isMemberContext ? (
                /* Member-Specific Sidebar */
                <div className="space-y-6">
                    <div className="px-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/members")} className="text-slate-400 font-bold hover:text-slate-600 mb-6 p-0 group">
                            <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Members
                        </Button>
                        
                        {member && (
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-12 w-12 border-2 border-slate-50 dark:border-slate-800 rounded-2xl shadow-sm">
                                    <AvatarImage src={member.photo_url || ""} />
                                    <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                        {member.fullName?.charAt(0) || member.full_name?.charAt(0) || "M"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <h2 className="text-sm font-black text-slate-800 dark:text-white truncate lowercase tracking-tight">{member.fullName || member.full_name}</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">ID: {member.memberCode || member.member_code}</p>
                                </div>
                            </div>
                        )}

                        <Button className="w-full h-10 bg-[#FF6B3D] hover:bg-[#E85A2C] text-white rounded-xl font-black shadow-lg shadow-orange-500/20 mb-6 transition-all flex items-center justify-center gap-2 text-xs">
                            <Plus className="h-4 w-4" /> New Sale
                        </Button>
                    </div>

                    <div className="space-y-1">
                        {memberNavItems.filter(item => hasRole(item.roles)).map((item) => {
                            const isActive = location.search.includes(`tab=${item.id}`) || (item.id === 'memberships' && !location.search.includes('tab='));
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(`/members/${memberId}?tab=${item.id}`)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all",
                                        isActive 
                                            ? "bg-slate-50 dark:bg-slate-800/50 text-[#FF6B3D] shadow-sm font-black" 
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold"
                                    )}
                                >
                                    <div className={isActive ? "text-[#FF6B3D]" : "text-slate-400"}>
                                        {item.icon}
                                    </div>
                                    <span className="text-sm">{item.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Standard Sidebar Navigation */
                filteredNavigation.map((item) => {
                    const itemPath = item.href.split('?')[0]
                    const itemQuery = item.href.split('?')[1] || ""
                    const isActive = location.pathname === itemPath && (!itemQuery || location.search.includes(itemQuery))
                    const hasChildren = item.children && item.children.length > 0
                    const isMenuOpen = openMenus.includes(item.title)

                    if (item.isHeader) {
                        return (
                            <div key={item.title} className="pt-6 pb-2 px-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                                {item.title}
                                </p>
                            </div>
                        )
                    }

                    if (hasChildren) {
                        return (
                            <div key={item.title} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.title)}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group",
                                        isActive || isMenuOpen
                                        ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "mr-4 p-1.5 rounded-lg transition-colors",
                                        isActive ? "text-slate-900 dark:text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <span className="flex-1 text-left">{item.title}</span>
                                    {isMenuOpen ? (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                </button>
                                {isMenuOpen && (
                                    <div className="ml-8 mt-1 space-y-1">
                                        {item.children?.filter(child => hasRole(child.roles)).map((child) => {
                                        const isChildActive = location.pathname === child.href
                                        return (
                                            <Link
                                            key={child.href}
                                            to={child.href}
                                            className={cn(
                                                "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                                isChildActive
                                                ? "text-orange-600 bg-orange-50/50 dark:bg-orange-950/20"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            )}
                                            >
                                            <Circle className={cn(
                                                "h-2 w-2 mr-3 transition-all",
                                                isChildActive ? "fill-orange-600 text-orange-600" : "text-slate-300 dark:text-slate-700 group-hover:text-slate-400"
                                            )} />
                                            <span className="flex-1">{child.title}</span>
                                            </Link>
                                        )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group",
                            isActive
                            ? item.title === "Dashboard"
                                ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                        )}
                        onClick={() => setSidebarOpen(false)}
                        >
                        <div className={cn(
                            "mr-4 p-1.5 rounded-lg transition-colors",
                            isActive
                            ? item.title === "Dashboard" ? "text-orange-600" : "text-slate-900 dark:text-white"
                            : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        )}>
                            {item.icon}
                        </div>
                        <span className="flex-1">{item.title}</span>
                        </Link>
                    )
                })
            )}
          </nav>

        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between h-20 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 lg:px-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-slate-600 dark:text-slate-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden md:flex items-center px-4 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-80 group focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20">
              <Bell className="h-6 w-6" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">GYM</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px]">
                            {tenant?.gymName || tenant?.name || "GYMOWL FIT..."}
                        </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 lowercase">
                        {user?.fullName || "sonu verma"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 p-2 dark:bg-slate-900 mt-2">
                <div className="px-3 py-2 border-b dark:border-slate-800 mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-tight">{user?.full_name || "sonu verma"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || "vsonu26@gmail.com"}</p>
                </div>
                
                <div className="px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Theme</p>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="theme" 
                                checked={theme === 'light'} 
                                onChange={() => setTheme('light')}
                                className="h-4 w-4 text-orange-600 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 transition-colors">Light</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="theme" 
                                checked={theme === 'dark'} 
                                onChange={() => setTheme('dark')}
                                className="h-4 w-4 text-orange-600 border-slate-300 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 transition-colors">Dark</span>
                        </label>
                    </div>
                </div>

                <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate("/analytics")} className="rounded-xl px-3 py-2.5 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Analytics</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-xl px-3 py-2.5 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Configurations</span>
                    </DropdownMenuItem>
                </div>

                <div className="px-3 py-3 border-t dark:border-slate-800 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Device Offline (P)</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight transition-all">
                                {new Date().toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                }).replace(/\//g, '-')}{' '}
                                {new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-1 border-t dark:border-slate-800 mt-1">
                    <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="rounded-xl px-3 py-3 focus:bg-orange-50 dark:focus:bg-orange-950/20 text-orange-600 font-bold flex items-center gap-2 cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-10 bg-[#F8FAFC] dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
