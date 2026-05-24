import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
}

interface ActionMenuProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  options?: ActionMenuItem[]
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onView, onEdit, onDelete, options }) => {
  const items: ActionMenuItem[] = []
  if (onView) items.push({ label: "View", icon: <Eye className="mr-3 h-4 w-4 text-blue-500" />, onClick: onView })
  if (onEdit) items.push({ label: "Edit", icon: <Edit className="mr-3 h-4 w-4 text-emerald-500" />, onClick: onEdit })
  if (options) items.push(...options)
  if (onDelete) items.push({ label: "Delete", icon: <Trash2 className="mr-3 h-4 w-4 text-red-500" />, onClick: onDelete, danger: true })

  if (items.length === 0) return null

  const hasMultipleSections = onDelete && (onView || onEdit)
  const viewEditItems = items.filter(i => !i.danger)
  const dangerItems = items.filter(i => i.danger)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100">
          <MoreVertical className="h-5 w-5 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-slate-200 p-2 min-w-[180px]">
        {viewEditItems.map((item, i) => (
          <DropdownMenuItem key={i} onClick={item.onClick} className="rounded-xl px-4 py-2.5 font-bold text-slate-700 cursor-pointer">
            {item.icon} {item.label}
          </DropdownMenuItem>
        ))}
        {hasMultipleSections && <DropdownMenuSeparator />}
        {dangerItems.map((item, i) => (
          <DropdownMenuItem key={i} onClick={item.onClick} className="rounded-xl px-4 py-2.5 font-bold text-red-500 cursor-pointer">
            {item.icon} {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
