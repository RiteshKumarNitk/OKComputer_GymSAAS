import React from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Home, User, Calendar, Dumbbell, Apple } from "lucide-react"

export const MemberLayout: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { icon: Home, label: "Home", path: "/member/dashboard" },
        { icon: Dumbbell, label: "Workouts", path: "/member/workouts" },
        { icon: Apple, label: "Diets", path: "/member/diets" },
        { icon: Calendar, label: "Schedule", path: "/member/schedule" },
        { icon: User, label: "Profile", path: "/member/profile" },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <item.icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
