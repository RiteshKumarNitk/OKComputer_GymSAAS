import { TableRow, TableCell } from "@/components/ui/table"

interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, action }) => (
  <TableRow>
    <TableCell colSpan={99} className="h-32 text-center text-slate-400 font-medium italic">
      <div className="flex flex-col items-center justify-center py-8">
        {icon && <div className="mb-4 text-slate-300">{icon}</div>}
        {message}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </TableCell>
  </TableRow>
)