"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/config";

type SummaryRow = {
  id: number
  site: string
  fakultas: string
  program_studi: string
  course_name: string
  course_shortname: string
  num_teacher: number
  num_student: number
  file: number
  video: number
  forum: number
  quiz: number
  assignment: number
  url: number
  sum: number
  avg_activity_per_student_per_day: number
}

type TableApiResponse = {
  data: SummaryRow[]
  pagination: {
    current_page: number
    items_per_page: number
    total_items: number
    total_pages: number
  }
  sorting: { sort_by: string; sort_order: 'asc' | 'desc' }
}

export type SummaryTableProps = {
  params?: Record<string, string>
}

export function SummaryTable({ params }: SummaryTableProps) {
  const [rows, setRows] = React.useState<SummaryRow[]>([])
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [totalPages, setTotalPages] = React.useState(1)
  const [sortBy, setSortBy] = React.useState('sum')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState('')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [appliedParams, setAppliedParams] = React.useState<SummaryTableProps['params'] | undefined>(undefined)

  const buildQuery = () => {
    const qp = new URLSearchParams()
    qp.set('page', String(page))
    qp.set('limit', String(limit))
    qp.set('sort_by', sortBy)
    qp.set('sort_order', sortOrder)
    if (searchTerm) qp.set('search', searchTerm)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (k === 'show_all') return // do not forward to backend
        if (v) qp.set(k, v)
      })
    }
    return `?${qp.toString()}`
  }

  const fetchRows = React.useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(appliedParams && Object.fromEntries(
          Object.entries(appliedParams).filter(([k, v]) => k !== 'show_all' && v)
        ))
      };
      const json: TableApiResponse = await apiClient.get(API_ENDPOINTS.SAS.SUMMARY.TABLE, queryParams);
      setRows(json.data)
      setTotalPages(json.pagination.total_pages)
    } catch {
      setRows([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, sortOrder, appliedParams, searchTerm])

  React.useEffect(() => {
    if (!params) return;
    const allow = params.prodi_id || params.show_all === 'true'
    if (!allow) return;
    setAppliedParams(params)
  }, [params])

  React.useEffect(() => {
    if (!appliedParams) return;
    fetchRows()
  }, [appliedParams, fetchRows])

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const onSearch = () => {
    setSearchTerm(searchInput)
    setPage(1)
  }

  const onClear = () => {
    setSearchInput('')
    setSearchTerm('')
    setPage(1)
  }

  // Remove auto-search debouncing - search only triggers on button click or Enter
  // React.useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     if (searchInput !== searchTerm) {
  //       setSearchTerm(searchInput)
  //       setPage(1)
  //     }
  //   }, 500) // Debounce search by 500ms

  //   return () => clearTimeout(timeoutId)
  // }, [searchInput, searchTerm])

  const prodiMissing = !params || (!params.prodi_id && params.show_all !== 'true');

  return (
    <div>
      <div className="mb-3 bg-teal-700 text-white p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
            <Input
              placeholder="Cari nama course, kode, program studi, atau fakultas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
              className="pl-10 pr-10 h-10 bg-white text-gray-900 focus-visible:ring-0"
            />
            {(searchInput || searchTerm) && (
              <button
                onClick={onClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                type="button"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button onClick={onSearch} className="h-10 bg-white text-teal-700 hover:bg-teal-800 hover:text-white font-semibold focus-visible:ring-0">
            <Search className="w-4 h-4 mr-2" />
            Cari
          </Button>
        </div>
      </div>
      {prodiMissing && null}
      <div className="overflow-x-auto">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">No</TableHead>
              <TableHead onClick={() => toggleSort('site')} className="cursor-pointer">Site</TableHead>
              <TableHead onClick={() => toggleSort('fakultas')} className="cursor-pointer">Fakultas</TableHead>
              <TableHead onClick={() => toggleSort('program_studi')} className="cursor-pointer">Program Studi</TableHead>
              <TableHead onClick={() => toggleSort('course_name')} className="cursor-pointer">Course</TableHead>
              <TableHead onClick={() => toggleSort('num_teacher')} className="text-center cursor-pointer">Teachers</TableHead>
              <TableHead onClick={() => toggleSort('num_student')} className="text-center cursor-pointer">Students</TableHead>
              <TableHead className="text-center">File</TableHead>
              <TableHead className="text-center">Video</TableHead>
              <TableHead className="text-center">Forum</TableHead>
              <TableHead className="text-center">Quiz</TableHead>
              <TableHead className="text-center">Assignment</TableHead>
              <TableHead className="text-center">URL</TableHead>
              <TableHead onClick={() => toggleSort('sum')} className="text-center cursor-pointer">Sum</TableHead>
              <TableHead onClick={() => toggleSort('avg_activity_per_student_per_day')} className="text-center cursor-pointer">AVG/Day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8 text-gray-500">
                  {loading ? 'Loading…' : 'No data'}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell className="text-center">{(page - 1) * limit + idx + 1}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{row.site}</Badge></TableCell>
                <TableCell>{row.fakultas}</TableCell>
                <TableCell className="text-blue-600">{row.program_studi}</TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="font-medium text-gray-900 text-sm">{row.course_name}</div>
                    <div className="text-xs text-gray-500">({row.course_shortname})</div>
                  </div>
                </TableCell>
                <TableCell className="text-center"><Badge variant="secondary" className="text-xs">{row.num_teacher}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="secondary" className="text-xs">{row.num_student}</Badge></TableCell>
                <TableCell className="text-center">{row.file}</TableCell>
                <TableCell className="text-center">{row.video}</TableCell>
                <TableCell className="text-center">{row.forum}</TableCell>
                <TableCell className="text-center">{row.quiz}</TableCell>
                <TableCell className="text-center">{row.assignment}</TableCell>
                <TableCell className="text-center">{row.url}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={row.sum > 40 ? 'default' : row.sum > 30 ? 'secondary' : 'destructive'} className="text-xs">
                    {row.sum}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-green-600">{row.avg_activity_per_student_per_day.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const p = Math.min(Math.max(1, page - 1), Math.max(1, totalPages - 2)) + i
                return (
                  <PaginationItem key={p}>
                    <PaginationLink onClick={() => setPage(p)} isActive={page === p} className="cursor-pointer">{p}</PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export default SummaryTable


