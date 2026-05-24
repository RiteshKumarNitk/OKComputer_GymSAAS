import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalEntries: number
  rowsPerPage: number
  showingFrom: number
  showingTo: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
  rowsPerPageOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalEntries,
  rowsPerPage,
  showingFrom,
  showingTo,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4 text-slate-500 font-bold border-t border-slate-100 mt-4">
    <div className="text-xs">
      Showing <span className="text-slate-900">{showingFrom}</span> to <span className="text-slate-900">{showingTo}</span> of{" "}
      <span className="text-slate-900">{totalEntries}</span> entries
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        Rows per page:
        <Select
          value={rowsPerPage.toString()}
          onValueChange={(v) => { onRowsPerPageChange(parseInt(v)); onPageChange(1) }}
        >
          <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 font-bold text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rowsPerPageOptions.map((n) => (
              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="text-xs font-bold rounded-lg px-3"
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
          const pageNum = i + 1
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 text-xs font-bold rounded-lg ${
                currentPage === pageNum ? "bg-slate-900 text-white" : ""
              }`}
            >
              {pageNum}
            </Button>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="text-xs font-bold rounded-lg px-3"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
)