import { Card, CardContent } from "@/components/ui/card"

interface CategoryStatItem {
  label: string
  count: number
  icon: React.ReactNode
}

interface CategoryStatsGridProps {
  items: CategoryStatItem[]
}

export const CategoryStatsGrid: React.FC<CategoryStatsGridProps> = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {items.map((item, idx) => (
      <Card key={idx} className={`border-none rounded-xl overflow-hidden ${
        idx === 0
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white dark:bg-slate-900 shadow-sm"
      }`}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            idx === 0 ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
          }`}>
            <div className={`h-6 w-6 ${idx === 0 ? "text-white" : "text-slate-400 dark:text-slate-500"}`}>
              {item.icon}
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black ${
              idx === 0 ? "text-white" : "text-slate-800 dark:text-white"
            }`}>
              {item.count}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              idx === 0 ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
            }`}>
              {item.label}
            </p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)
