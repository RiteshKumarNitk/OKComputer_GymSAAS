import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: React.ReactNode
  titleClassName?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, onBack, actions, titleClassName = "text-2xl font-bold text-slate-800 dark:text-white" }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="h-9 px-3 text-xs font-bold border rounded-md gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      )}
      <div>
        <h1 className={titleClassName}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
)