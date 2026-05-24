import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { SearchBar } from "@/components/common/SearchBar"
import { Pagination } from "@/components/common/Pagination"
import { LoadingTable } from "@/components/common/LoadingTable"
import { usePagination } from "@/components/common/usePagination"
import { EmptyState } from "@/components/common/EmptyState"

export interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
  headClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  pagination?: boolean
  defaultRowsPerPage?: number
  headerClassName?: string
  title?: string
  titleAction?: React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  emptyIcon,
  pagination: showPagination = true,
  defaultRowsPerPage = 10,
  headerClassName = "bg-slate-50/50 dark:bg-slate-800/50",
  title,
  titleAction,
}: DataTableProps<T>) {
  const paginationHook = usePagination(data, defaultRowsPerPage)
  const displayData = showPagination ? paginationHook.paginatedData : data

  return (
    <div className="space-y-4">
      {searchable && onSearchChange && (
        <SearchBar value={searchQuery} onChange={onSearchChange} placeholder={searchPlaceholder} />
      )}

      <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h2>
            {titleAction && <div>{titleAction}</div>}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={headerClassName}>
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`text-[10px] font-black uppercase tracking-wider text-slate-400 py-6 px-4 ${col.headClassName || ""}`}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingTable rows={5} columns={columns.length} />
              ) : displayData.length === 0 ? (
                <EmptyState message={emptyMessage} icon={emptyIcon} />
              ) : (
                displayData.map((item: any, idx: number) => (
                  <TableRow key={item.id || idx} className="hover:bg-slate-50/80 transition-colors border-slate-100 dark:border-slate-800">
                    {columns.map((col) => (
                      <TableCell key={col.key} className={`py-6 px-4 ${col.className || ""}`}>
                        {col.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showPagination && data.length > 0 && (
        <Pagination
          currentPage={paginationHook.currentPage}
          totalPages={paginationHook.totalPages}
          totalEntries={paginationHook.totalEntries}
          rowsPerPage={paginationHook.rowsPerPage}
          showingFrom={paginationHook.showingFrom}
          showingTo={paginationHook.showingTo}
          onPageChange={paginationHook.setCurrentPage}
          onRowsPerPageChange={paginationHook.setRowsPerPage}
        />
      )}
    </div>
  )
}