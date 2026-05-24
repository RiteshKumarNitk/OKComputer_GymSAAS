import { TableRow, TableCell } from "@/components/ui/table"

interface LoadingTableProps {
  rows?: number
  columns?: number
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ rows = 5, columns = 6 }) => (
  <>
    {Array(rows).fill(0).map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell colSpan={columns} className="h-16 bg-slate-50/30 mb-2 rounded-xl" />
      </TableRow>
    ))}
  </>
)