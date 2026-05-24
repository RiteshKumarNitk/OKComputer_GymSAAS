import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: "blue" | "emerald" | "orange" | "rose" | "purple" | "slate"
  subtitle?: string
}

const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
  slate: { bg: "bg-slate-50", text: "text-slate-600", icon: "text-slate-500" },
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = "blue", subtitle }) => {
  const c = colorClasses[color]
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 group hover:shadow-lg transition-all">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`h-14 w-14 ${c.bg} dark:bg-slate-800 rounded-2xl flex items-center justify-center ${c.icon} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className={`text-2xl font-black text-slate-800 dark:text-white ${c.text}`}>
            {value}
          </p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardsGridProps {
  stats: StatCardProps[]
}

export const StatCardsGrid: React.FC<StatCardsGridProps> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
  </div>
)