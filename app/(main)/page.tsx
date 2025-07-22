"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  getCourses,
  getCourseActivities,
  getActivityStudents,
  CoursesFilters,
  ActivitiesFilters,
  StudentsFilters,
  ApiError
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { API_CONFIG, API_ENDPOINTS } from "@/lib/config"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ClientDate from "@/components/ClientDate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import {
  BookOpen,
  Search,
  FileText,
  ClipboardList,
  HelpCircle,
  Users,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  GraduationCap,
  BarChart3,
  Eye,
  Calendar,
  Star,
  X,
  LogOut,
  Shield,
  User,
  Hash,
  Home,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"

// Database schema interfaces - matching real database structure
interface Course {
  course_id: number
  course_name: string
  kelas: string
  jumlah_aktivitas: number
  jumlah_mahasiswa: number
  dosen_pengampu: string
}

interface ETLStatus {
  status: boolean
  data: {
    status: string
    lastRun: {
      id: string
      start_date: string
      end_date: string
      status: string
      total_records: string
      offset: string
    }
    nextRun: string
    isRunning: boolean
  }
}

interface ActivitySummary {
  id: number
  course_id: number
  section: number
  activity_id: number
  activity_type: string
  activity_name: string
  accessed_count: number
  submission_count: number | null   // only for assignment
  graded_count: number | null       // only for assignment
  attempted_count: number | null    // only for quiz
  created_at: string
}

interface StudentQuizDetail {
  id: number
  quiz_id: number
  user_id: number
  nim: string
  full_name: string
  waktu_mulai: string
  waktu_selesai: string
  durasi_pengerjaan: string
  jumlah_soal: number
  jumlah_dikerjakan: number
  nilai: number
}

interface StudentAssignmentDetail {
  id: number
  assignment_id: number
  user_id: number
  nim: string
  full_name: string
  waktu_submit: string
  waktu_pengerjaan: string
  nilai: number
}

interface StudentResourceAccess {
  id: number
  resource_id: number
  user_id: number
  nim: string
  full_name: string
  waktu_akses: string
}

interface StudentProfile {
  user_id: number
  idnumber: string  // NIM
  full_name: string
  email: string
  program_studi: string
}

// Combined student data for display
interface StudentDisplayData {
  user_id: number
  nim: string
  full_name: string
  activity_type: string
  waktu_aktivitas: string
  durasi_pengerjaan?: string
  nilai?: number
  progress?: string
  email?: string
  program_studi?: string
}

interface Filters {
  course_name: string
  activity_type: string
  dosen_pengampu: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

// API-based data loading helpers
const loadCoursesData = async (
  page: number = 1,
  limit: number = 100,
  searchTerm: string = "",
  filters: Filters = {
    course_name: "all",
    activity_type: "all",
    dosen_pengampu: "all",
    sortBy: "course_name",
    sortOrder: "asc"
  }
) => {
  try {
    const response = await getCourses({
      page,
      limit,
      search: searchTerm || undefined,
      dosen_pengampu: filters.dosen_pengampu !== "all" ? filters.dosen_pengampu : undefined,
      activity_type: filters.activity_type !== "all" ? filters.activity_type : undefined,
      sort_by: filters.sortBy as CoursesFilters['sort_by'] || 'course_name',
      sort_order: filters.sortOrder || 'asc'
    });
    return response;
  } catch (error) {
    console.error('Error loading courses:', error);
    throw error;
  }
};

const loadActivitiesForCourse = async (courseId: number, activityType?: string) => {
  try {
    const response = await getCourseActivities(courseId, {
      activity_type: activityType as ActivitiesFilters['activity_type'],
      limit: 50
    });
    return response;
  } catch (error) {
    console.error(`Error loading activities for course ${courseId}:`, error);
    throw error;
  }
};



// Pagination hook
const usePagination = (totalItems: number, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}



// Skeleton components
const SkeletonTableRow = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    <TableCell>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
    </TableCell>
    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
    <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
    <TableCell>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-[100px] ml-auto" />
        <Skeleton className="h-3 w-[90px] ml-auto" />
      </div>
    </TableCell>
  </TableRow>
)

// Empty state components
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ComponentType<{ className?: string }>,
  title: string,
  description: string,
  action?: React.ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 max-w-sm">{description}</p>
    {action}
  </div>
)

const EmptyCoursesState = () => (
  <EmptyState
    icon={BookOpen}
    title="Tidak Ada Mata Kuliah"
    description="Belum ada mata kuliah yang tersedia atau sesuai dengan filter pencarian Anda."
    action={
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Muat Ulang
      </Button>
    }
  />
)

const EmptyActivitiesState = () => (
  <div className="py-8 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <FileText className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm text-gray-500">Tidak ada aktivitas dalam mata kuliah ini</p>
  </div>
)



export default function OptimizedDashboard() {
  // Auth state
  const { user, signOut } = useAuth()

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State management for expanded items
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())

  // Search and filter states
  const [searchInput, setSearchInput] = useState("") // For input field value
  const [globalSearch, setGlobalSearch] = useState("") // For actual search that triggers fetch
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({
    course_name: "all",
    activity_type: "all",
    dosen_pengampu: "all",
    sortBy: "keaktifan",
    sortOrder: "desc"
  })

  // API-based data states
  const [coursesData, setCoursesData] = useState<{
    courses: Course[];
    pagination: any;
    total: number;
  }>({ courses: [], pagination: null, total: 0 })

  const [activitiesCache, setActivitiesCache] = useState<Map<number, ActivitySummary[]>>(new Map())
  const [loadingActivities, setLoadingActivities] = useState<Set<number>>(new Set())
  const [etlStatus, setEtlStatus] = useState<ETLStatus | null>(null)
  const [etlLoading, setEtlLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch ETL Status
  const fetchETLStatus = async () => {
    try {
      setEtlLoading(true)
      // ETL endpoint uses special webhook token, not auth token
      const response = await fetch(API_CONFIG.BASE_URL + API_ENDPOINTS.ETL.STATUS, {
        headers: {
          'Authorization': 'Bearer default-webhook-token-change-this'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setEtlStatus(data)
    } catch (error) {
      console.error('Error fetching ETL status:', error)
    } finally {
      setEtlLoading(false)
    }
  }

  // Load ETL status on component mount
  useEffect(() => {
    fetchETLStatus()
  }, [])

  // Load initial courses data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await loadCoursesData(currentPage, itemsPerPage, globalSearch, filters)
        setCoursesData({
          courses: response.data,
          pagination: response.pagination,
          total: response.pagination.total_items
        })

        // Update pagination info
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages)
          setTotalItems(response.pagination.total_items)
          setCurrentPage(response.pagination.current_page)
          setItemsPerPage(response.pagination.items_per_page)
        }
      } catch (err) {
        const apiError = err as ApiError
        setError(`Failed to load courses: ${apiError.message}`)
        console.error('Error loading courses:', apiError)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [globalSearch, filters, currentPage, itemsPerPage])

  // Computed stats from API data
  const stats = useMemo(() => {
    const totalCourses = coursesData.total

    // Calculate total activities from cache
    const totalActivities = Array.from(activitiesCache.values())
      .flat()
      .length

    return { totalCourses, totalActivities }
  }, [coursesData.total, activitiesCache])

  // Chart data
  const chartData = useMemo(() => [
    { name: "Minggu 1", courses: 45, activities: 123, students: 890 },
    { name: "Minggu 2", courses: 52, activities: 145, students: 920 },
    { name: "Minggu 3", courses: 48, activities: 156, students: 950 },
    { name: "Minggu 4", courses: 61, activities: 178, students: 1020 },
  ], [])

  // Use API data directly (filtering/sorting/pagination is handled by API)
  const paginatedCourses = coursesData.courses

  // Load activities when course is expanded
  const toggleCourse = useCallback(async (courseId: number) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)

        // Load activities if not already cached
        if (!activitiesCache.has(courseId)) {
          setLoadingActivities(prev => new Set(prev).add(courseId))

          loadActivitiesForCourse(courseId, filters.activity_type !== "all" ? filters.activity_type : undefined)
            .then(response => {
              setActivitiesCache(prev => new Map(prev).set(courseId, response.data))
            })
            .catch(err => {
              console.error(`Failed to load activities for course ${courseId}:`, err)
            })
            .finally(() => {
              setLoadingActivities(prev => {
                const newSet = new Set(prev)
                newSet.delete(courseId)
                return newSet
              })
            })
        }
      }
      return newSet
    })
  }, [activitiesCache, filters.activity_type])

  const handleSearch = useCallback((value: string) => {
    setGlobalSearch(value)
    setCurrentPage(1) // Reset to first page on search
    if (value.trim() && !recentSearches.includes(value.trim())) {
      setRecentSearches(prev => [value.trim(), ...prev.slice(0, 4)])
    }
  }, [recentSearches])

  const executeSearch = useCallback(() => {
    handleSearch(searchInput)
  }, [searchInput, handleSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch()
    }
  }, [executeSearch])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const clearSearch = useCallback(() => {
    setSearchInput("")
    setGlobalSearch("")
    setCurrentPage(1) // Reset to first page when clearing search
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      course_name: "all",
      activity_type: "all",
      dosen_pengampu: "all",
      sortBy: "course_name",
      sortOrder: "asc"
    })
    setSearchInput("")
    setGlobalSearch("")
    setCurrentPage(1) // Reset to first page when clearing filters
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      // Clear caches
      setActivitiesCache(new Map())
      setExpandedCourses(new Set())

      // Reload courses data with current pagination
      const response = await loadCoursesData(currentPage, itemsPerPage, globalSearch, filters)
      setCoursesData({
        courses: response.data,
        pagination: response.pagination,
        total: response.pagination.total_items
      })

      // Update pagination info
      if (response.pagination) {
        setTotalPages(response.pagination.total_pages)
        setTotalItems(response.pagination.total_items)
        setCurrentPage(response.pagination.current_page)
        setItemsPerPage(response.pagination.items_per_page)
      }

      // Also refresh ETL status
      await fetchETLStatus()
    } catch (err) {
      const apiError = err as ApiError
      setError(`Failed to refresh data: ${apiError.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }, [globalSearch, filters, currentPage, itemsPerPage])

  // Utility functions
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "resource": return <FileText className="w-4 h-4" />
      case "assign": return <ClipboardList className="w-4 h-4" />
      case "quiz": return <HelpCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'quiz':
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
      case 'assign':
        return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
      case 'resource':
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
    }
  }

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Items per page selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Tampilkan:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => handleItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700">
          per halaman
        </span>
      </div>

      {/* Pagination info */}
      <div className="text-sm text-gray-700">
        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} mata kuliah
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {/* First page */}
            {currentPage > 2 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(1)
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {/* Previous page */}
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage - 1)
                  }}
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Current page */}
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(e) => e.preventDefault()}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>

            {/* Next page */}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage + 1)
                  }}
                >
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Last page */}
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(totalPages)
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) handlePageChange(currentPage + 1)
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MONEV</h1>
                <p className="text-sm text-gray-600">Telkom University</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Loading Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-6 w-[60px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div> */}

          {/* Loading Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, i) => <SkeletonTableRow key={i} />)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Breadcrumb className="items-center gap-2 hidden sm:flex">
                <BreadcrumbItem className="flex items-center">
                  <BreadcrumbLink href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" strokeWidth={3}/>
                    <span className="text-sm font-medium">Dashboard</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 sm:hidden" />
                <Separator orientation="vertical" className="block sm:hidden h-6" />
              </div>
              
              <div className="sm:hidden flex items-center">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 ml-2">MONEV</h1>
                </div>
                  </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="px-3 py-2">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Simple Data Update Info */}
        {etlStatus && (
          <div className="bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Terakhir update: <ClientDate dateString={etlStatus.data.lastRun?.end_date} /></span>
              {etlStatus.data.isRunning && (
                <div className="flex items-center gap-1 ml-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  <span className="text-blue-600 text-xs">Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mata Kuliah</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Aktivitas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalActivities.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mahasiswa</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata Nilai</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgGrade.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Charts */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Aktivitas Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  activities: { label: "Aktivitas", color: "#DC2626" },
                  students: { label: "Mahasiswa", color: "#EA580C" },
                }}
                className="h-48"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="activities" stroke="var(--color-activities)" strokeWidth={2} />
                    <Line type="monotone" dataKey="students" stroke="var(--color-students)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Tipe Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Jumlah", color: "#DC2626" },
                }}
                className="h-48"
              >
                                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                     { name: "Resource", count: 40 },
                     { name: "Assignment", count: 35 },
                     { name: "Quiz", count: 25 },
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                     <XAxis dataKey="name" stroke="#666" fontSize={12} />
                     <YAxis stroke="#666" fontSize={12} />
                     <ChartTooltip content={<ChartTooltipContent />} />
                     <Bar dataKey="count" fill="var(--color-count)" />
                   </BarChart>
                 </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div> */}

        {/* status data update */}
        {/* curl -X GET "http://localhost:8888/celoeapi/index.php/api/etl/status" \
  -H "Authorization: Bearer default-webhook-token-change-this"
  {"status":true,"data":{"status":"active","lastRun":{"id":"21","start_date":"2025-07-09 10:41:00","end_date":"2025-07-09 10:41:00","status":"finished","total_records":"15","offset":"0"},"nextRun":"Every hour at minute 0","isRunning":false}}%  */}

        {/* Main Content */}
        <Card>
          <CardHeader className="bg-teal-700 text-white">
            <CardTitle className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-lg sm:text-xl">Data Mata Kuliah & Aktivitas</span>
              <div className="flex items-center justify-between sm:space-x-2">
                <Badge variant="secondary" className="bg-white text-teal-700 hover:bg-white text-sm">
                  {totalItems} mata kuliah
                </Badge>
                {/* {(filters.course_name !== "all" || filters.dosen_pengampu !== "all" || filters.activity_type !== "all" || globalSearch) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white hover:bg-teal-600 hover:text-white ml-2">
                    <X className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )} */}
              </div>
            </CardTitle>

            {/* Search Bar */}
            <div className="pt-3">
              <div className="relative flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari mata kuliah, dosen, atau kelas... (Enter untuk cari)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 bg-white text-gray-900 focus-visible:ring-0 h-10"
                  />
                  {(searchInput || globalSearch) && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                      type="button"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={executeSearch}
                  className="bg-white text-teal-700 hover:bg-teal-800 hover:text-white font-semibold focus-visible:ring-0 h-10 px-4"
                  size="default"
                >
                  <Search className="w-4 h-4 mr-2" strokeWidth={3}/>
                  Cari
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="hidden sm:table-cell">Dosen</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRefreshing ? (
                    [...Array(5)].map((_, i) => <SkeletonTableRow key={i} />)
                  ) : paginatedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyCoursesState />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCourses.map((course) => {
                      const isExpanded = expandedCourses.has(course.course_id)
                      const courseActivities = activitiesCache.get(course.course_id) || []
                      const isLoadingCourseActivities = loadingActivities.has(course.course_id)

                      return (
                        <React.Fragment key={course.course_id}>
                          {/* Course Row */}
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50 border-b-2"
                            onClick={() => toggleCourse(course.course_id)}
                          >
                            <TableCell className="p-3 sm:p-4">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                              )}
                            </TableCell>
                            <TableCell className="p-3 sm:p-4">
                              <div className="space-y-1.5">
                                <div className="font-medium text-sm sm:text-lg leading-tight">{course.course_name}</div>
                                <div className="text-xs sm:text-sm text-gray-500">{course.kelas}</div>
                                {/* Mobile: Show dosen here */}
                                <div className="sm:hidden text-xs text-gray-600 font-medium flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {course.dosen_pengampu}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell p-3 sm:p-4">
                              <div className="space-y-1">
                                <div className="font-medium">{course.dosen_pengampu}</div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Mata Kuliah
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell p-3 sm:p-4">
                              <Badge variant="secondary">Aktif</Badge>
                            </TableCell>
                            <TableCell className="text-right p-3 sm:p-4">
                              <div className="text-xs sm:text-sm space-y-1">
                                <div className="font-medium">{course.jumlah_aktivitas} aktivitas</div>
                                <div className="text-gray-500">{course.jumlah_mahasiswa} mahasiswa</div>
                                {/* Mobile: Show status here */}
                                <div className="sm:hidden mt-2">
                                  <Badge variant="secondary" className="text-xs">Aktif</Badge>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Activities Rows */}
                          {isExpanded && isLoadingCourseActivities && (
                            <TableRow key={`loading-activities-${course.course_id}`}>
                              <TableCell className="pl-6 sm:pl-8 p-3 sm:p-4"></TableCell>
                              <TableCell colSpan={4} className="text-center py-6">
                                <div className="flex items-center justify-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                                  <span className="text-sm text-gray-600">Loading activities...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {isExpanded && !isLoadingCourseActivities && courseActivities.length === 0 && (
                            <TableRow key={`empty-activities-${course.course_id}`}>
                              <TableCell className="pl-6 sm:pl-8 p-3 sm:p-4"></TableCell>
                              <TableCell colSpan={4} className="p-0">
                                <EmptyActivitiesState />
                              </TableCell>
                            </TableRow>
                          )}
                          {isExpanded && !isLoadingCourseActivities && courseActivities.length > 0 && courseActivities.map((activity, activityIndex) => {
                            return (
                              <React.Fragment key={`${course.course_name}-${course.course_id}-${activityIndex}`}>
                                {/* Activity Row */}
                                <TableRow className="hover:bg-gray-50 bg-gray-25">
                                  <TableCell className="pl-6 sm:pl-8 p-3 sm:p-4">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      {getActivityIcon(activity.activity_type)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-3 sm:p-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center">
                                        <Badge className={`${getActivityColor(activity.activity_type)} border-0 text-xs`}>
                                          {getActivityIcon(activity.activity_type)}
                                          {activity.activity_type}
                                        </Badge>
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm leading-tight">{activity.activity_name}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Section {activity.section}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell p-3 sm:p-4">
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                      Aktivitas
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell p-3 sm:p-4">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Eye className="w-3 h-3" />
                                      {activity.accessed_count} akses
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right p-3 sm:p-4">
                                    <div className="space-y-2">
                                      <div className="text-xs sm:text-sm space-y-1">
                                        {/* Mobile: Show access count here */}
                                        <div className="sm:hidden flex items-center justify-end gap-1 text-xs text-gray-600 mb-2">
                                          <Eye className="w-3 h-3" />
                                          {activity.accessed_count} akses
                                        </div>
                                        {activity.submission_count && (
                                          <div className="text-blue-600">{activity.submission_count} submit</div>
                                        )}
                                        {activity.attempted_count && (
                                          <div className="text-orange-600">{activity.attempted_count} attempt</div>
                                        )}
                                        {activity.graded_count && (
                                          <div className="text-green-600">{activity.graded_count} graded</div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-3 text-xs w-full sm:w-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`/activity-detail/${course.course_id}/${activity.activity_type}/${activity.activity_id}`, '_blank');
                                        }}
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Lihat Detail</span>
                                        <span className="sm:hidden">Detail</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                              </React.Fragment>
                            )
                          })}
                        </React.Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 border-t">
              <PaginationControls />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

