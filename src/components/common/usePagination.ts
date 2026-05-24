import { useState, useMemo } from "react"

export function usePagination<T>(data: T[], defaultRowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)

  const totalEntries = data.length
  const totalPages = Math.ceil(totalEntries / rowsPerPage)

  const paginatedData = useMemo(
    () => data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [data, currentPage, rowsPerPage]
  )

  const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const showingTo = Math.min(currentPage * rowsPerPage, totalEntries)

  return {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalEntries,
    totalPages,
    paginatedData,
    showingFrom,
    showingTo,
  }
}