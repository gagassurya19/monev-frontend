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
} from "lucide-react"

// Database schema interfaces - matching real database structure
interface Course {
  course_id: number
  course_name: string
  kelas: string
  jumlah_aktivitas: number
  jumlah_mahasiswa: number
  dosen_pengampu: string
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

// Debounced search hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
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
    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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

const EmptyStudentsState = () => (
  <div className="py-6 text-center">
    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
      <Users className="w-5 h-5 text-gray-400" />
    </div>
    <p className="text-xs text-gray-500">Belum ada data mahasiswa untuk aktivitas ini</p>
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
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  // Search and filter states
  const [globalSearch, setGlobalSearch] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({
    course_name: "all",
    activity_type: "all",
    dosen_pengampu: "all",
    sortBy: "course_name",
    sortOrder: "asc"
  })

  // Debounced search values
  const debouncedGlobalSearch = useDebounce(globalSearch, 300)

  // API-based data states
  const [coursesData, setCoursesData] = useState<{
    courses: Course[];
    pagination: any;
    total: number;
  }>({ courses: [], pagination: null, total: 0 })
  
  const [activitiesCache, setActivitiesCache] = useState<Map<number, ActivitySummary[]>>(new Map())
  const [studentsCache, setStudentsCache] = useState<Map<string, StudentDisplayData[]>>(new Map())
  const [loadingActivities, setLoadingActivities] = useState<Set<number>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set())
  
  // Load initial courses data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await loadCoursesData(1, 100, debouncedGlobalSearch, filters)
        setCoursesData({
          courses: response.data,
          pagination: response.pagination,
          total: response.pagination.total_items
        })
      } catch (err) {
        const apiError = err as ApiError
        setError(`Failed to load courses: ${apiError.message}`)
        console.error('Error loading courses:', apiError)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadInitialData()
  }, [debouncedGlobalSearch, filters])

  // Computed stats from API data
  const stats = useMemo(() => {
    const totalCourses = coursesData.total
    
    // Calculate total activities from cache
    const totalActivities = Array.from(activitiesCache.values())
      .flat()
      .length
    
    // Calculate total students and average from cache
    const allStudents = Array.from(studentsCache.values()).flat()
    const totalStudents = allStudents.length
    const studentsWithGrades = allStudents.filter(s => s.nilai)
    const avgGrade = studentsWithGrades.length > 0 
      ? studentsWithGrades.reduce((acc, student) => acc + (student.nilai || 0), 0) / studentsWithGrades.length
      : 0
    
    return { totalCourses, totalActivities, totalStudents, avgGrade }
  }, [coursesData.total, activitiesCache, studentsCache])

  // Chart data
  const chartData = useMemo(() => [
    { name: "Minggu 1", courses: 45, activities: 123, students: 890 },
    { name: "Minggu 2", courses: 52, activities: 145, students: 920 },
    { name: "Minggu 3", courses: 48, activities: 156, students: 950 },
    { name: "Minggu 4", courses: 61, activities: 178, students: 1020 },
  ], [])

  // Use API data directly (filtering/sorting is handled by API)
  const filteredAndSortedData = coursesData.courses
  const pagination = usePagination(filteredAndSortedData.length, 10)
  const paginatedCourses = useMemo(() => {
    return filteredAndSortedData.slice(pagination.startIndex, pagination.endIndex)
  }, [filteredAndSortedData, pagination.startIndex, pagination.endIndex])

  // Load activities when course is expanded
  const toggleCourse = useCallback(async (courseId: number) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
        // Close all activities of this course
        const courseActivities = activitiesCache.get(courseId) || []
        courseActivities.forEach((activity, index) => {
          setExpandedActivities(prevActivities => {
            const newActivitySet = new Set(prevActivities)
            newActivitySet.delete(`${courseId}-${index}`)
            return newActivitySet
          })
        })
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

  // Load students when activity is expanded - using index-based unique keys
  const toggleActivity = useCallback(async (courseId: number, activityIndex: number, activityId: number, activityType: string) => {
    const uniqueActivityKey = `${courseId}-${activityIndex}`
    setExpandedActivities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(uniqueActivityKey)) {
        newSet.delete(uniqueActivityKey)
      } else {
        newSet.add(uniqueActivityKey)
        
        // Load students if not already cached (using unique key for cache)
        if (!studentsCache.has(uniqueActivityKey)) {
          setLoadingStudents(prev => new Set(prev).add(uniqueActivityKey))
          
          getActivityStudents(activityId, activityType as StudentsFilters['activity_type'], {
            sort_by: 'nilai' as StudentsFilters['sort_by'],
            sort_order: 'desc',
            limit: 50,
            activity_type: activityType as StudentsFilters['activity_type']
          })
            .then(response => {
              setStudentsCache(prev => new Map(prev).set(uniqueActivityKey, response.data))
            })
            .catch(err => {
              console.error(`Failed to load students for activity ${activityId}:`, err)
            })
            .finally(() => {
              setLoadingStudents(prev => {
                const newSet = new Set(prev)
                newSet.delete(uniqueActivityKey)
                return newSet
              })
            })
        }
      }
      return newSet
    })
  }, [studentsCache])

  const handleSearch = useCallback((value: string) => {
    setGlobalSearch(value)
    if (value.trim() && !recentSearches.includes(value.trim())) {
      setRecentSearches(prev => [value.trim(), ...prev.slice(0, 4)])
    }
  }, [recentSearches])

  const clearFilters = useCallback(() => {
    setFilters({
      course_name: "all",
      activity_type: "all",
      dosen_pengampu: "all",
      sortBy: "course_name",
      sortOrder: "asc"
    })
    setGlobalSearch("")
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      // Clear caches
      setActivitiesCache(new Map())
      setStudentsCache(new Map())
      setExpandedCourses(new Set())
      setExpandedActivities(new Set())
      
      // Reload courses data
      const response = await loadCoursesData(1, 100, debouncedGlobalSearch, filters)
      setCoursesData({
        courses: response.data,
        pagination: response.pagination,
        total: response.pagination.total_items
      })
    } catch (err) {
      const apiError = err as ApiError
      setError(`Failed to refresh data: ${apiError.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }, [debouncedGlobalSearch, filters])

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
    switch (type) {
      case "resource": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "assign": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      case "quiz": return "bg-red-100 text-red-800 hover:bg-red-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }



  // Enhanced student display component for different activity types
  const StudentActivityRow = ({ 
    student, 
    activityType, 
    courseId, 
    activityIndex, 
    studentIndex 
  }: {
    student: StudentDisplayData;
    activityType: string;
    courseId: number;
    activityIndex: number;
    studentIndex: number;
  }) => {
    const renderStudentDetails = () => {
      switch (activityType.toLowerCase()) {
        case 'quiz':
          return (
            <>
              <TableCell className="pl-12"></TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.nim}</div>
                  {student.program_studi && (
                    <div className="text-xs text-blue-600">{student.program_studi}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Quiz
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div className="text-green-600">Mulai: <ClientDate dateString={student.waktu_aktivitas} /></div>
                  {student.durasi_pengerjaan && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Durasi: {student.durasi_pengerjaan}</span>
                    </div>
                  )}
                  {(student as any).waktu_selesai && (
                    <div className="text-red-600">Selesai: <ClientDate dateString={(student as any).waktu_selesai} /></div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  {student.nilai !== undefined && student.nilai !== null && (
                    <Badge
                      variant={
                        Number(student.nilai) >= 80
                          ? "default"
                          : Number(student.nilai) >= 70
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {Number(student.nilai).toFixed(2)}
                    </Badge>
                  )}
                  {(student as any).jumlah_dikerjakan && (student as any).jumlah_soal && (
                    <div className="text-xs text-gray-500">
                      {(student as any).jumlah_dikerjakan}/{(student as any).jumlah_soal} soal
                    </div>
                  )}
                </div>
              </TableCell>
            </>
          );

        case 'assign':
          return (
            <>
              <TableCell className="pl-12"></TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.nim}</div>
                  {student.program_studi && (
                    <div className="text-xs text-blue-600">{student.program_studi}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  Assignment
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div className="text-blue-600">Submit: <ClientDate dateString={student.waktu_aktivitas} /></div>
                  {student.durasi_pengerjaan && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Durasi: {student.durasi_pengerjaan}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  {student.nilai !== undefined && student.nilai !== null && (
                    <Badge
                      variant={
                        Number(student.nilai) >= 80
                          ? "default"
                          : Number(student.nilai) >= 70
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {Number(student.nilai).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </>
          );

        case 'resource':
          return (
            <>
              <TableCell className="pl-12"></TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.nim}</div>
                  {student.program_studi && (
                    <div className="text-xs text-blue-600">{student.program_studi}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Resource
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div className="text-teal-600">Akses: <ClientDate dateString={student.waktu_aktivitas} /></div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Eye className="w-3 h-3" />
                    Viewed
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    Accessed
                  </Badge>
                </div>
              </TableCell>
            </>
          );

        default:
          // Fallback to original format
          return (
            <>
              <TableCell className="pl-12"></TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.nim}</div>
                  {student.program_studi && (
                    <div className="text-xs text-blue-600">{student.program_studi}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  {student.activity_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div><ClientDate dateString={student.waktu_aktivitas} /></div>
                  {student.durasi_pengerjaan && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {student.durasi_pengerjaan}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  {student.nilai !== undefined && student.nilai !== null && (
                    <Badge
                      variant={
                        Number(student.nilai) >= 80
                          ? "default"
                          : Number(student.nilai) >= 70
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {Number(student.nilai).toFixed(2)}
                    </Badge>
                  )}
                  {student.progress && (
                    <div className="text-xs text-gray-500">
                      {student.progress}
                    </div>
                  )}
                </div>
              </TableCell>
            </>
          );
      }
    };

    return (
      <TableRow key={`student-${courseId}-${activityIndex}-${studentIndex}`} className="bg-gray-50">
        {renderStudentDetails()}
      </TableRow>
    );
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">
        Menampilkan {pagination.startIndex + 1}-{pagination.endIndex} dari {filteredAndSortedData.length} mata kuliah
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">
          {pagination.currentPage} / {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
          disabled={!pagination.hasNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
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
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MONEV</h1>
                <p className="text-sm text-gray-600">CeLOE Monitoring System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <User className="h-6 w-6 text-blue-600 bg-blue-100 rounded-full p-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || user.username}
                      </p>
                    </div>
                    {user.admin && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut} className="text-red-600 hover:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
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

        {/* Main Table with Advanced Filtering */}
        <Card>
          <CardHeader className="bg-teal-700 text-white">
            <CardTitle className="flex items-center justify-between">
              Data Mata Kuliah, Aktivitas & Mahasiswa
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white text-teal-700 hover:bg-white">
                  {filteredAndSortedData.length} mata kuliah
                </Badge>
                                 {(filters.course_name !== "all" || filters.dosen_pengampu !== "all" || filters.activity_type !== "all" || globalSearch) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white hover:bg-teal-600 hover:text-white">
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardTitle>
            
            {/* Search Bar */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari mata kuliah, dosen, atau kelas..."
                  value={globalSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white text-gray-900"
                />
              </div>
              
              {/* Recent Searches */}
              {/* {recentSearches.length > 0 && !globalSearch && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Pencarian terbaru:</span>
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => setGlobalSearch(search)}
                      className="text-white hover:bg-teal-600 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {search}
                    </Button>
                  ))}
                </div>
              )} */}
              
              {/* Advanced Filters */}
              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                 <Select value={filters.activity_type} onValueChange={(value) => setFilters(prev => ({ ...prev, activity_type: value }))}>
                   <SelectTrigger className="bg-white text-gray-900">
                     <SelectValue placeholder="Tipe Aktivitas" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Semua Aktivitas</SelectItem>
                     <SelectItem value="resource">Resource</SelectItem>
                     <SelectItem value="assign">Assignment</SelectItem>
                     <SelectItem value="quiz">Quiz</SelectItem>
                   </SelectContent>
                 </Select>
                
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="bg-white text-gray-900">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course_name">Nama Mata Kuliah</SelectItem>
                    <SelectItem value="jumlah_mahasiswa">Jumlah Mahasiswa</SelectItem>
                    <SelectItem value="jumlah_aktivitas">Jumlah Aktivitas</SelectItem>
                    <SelectItem value="dosen_pengampu">Dosen Pengampu</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  className="text-white hover:bg-teal-600"
                >
                  {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
                
                <Button variant="ghost" size="sm" className="text-white hover:bg-teal-600">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div> */}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Status</TableHead>
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
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-lg">{course.course_name}</div>
                              <div className="text-sm text-gray-500">{course.kelas}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{course.dosen_pengampu}</div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Mata Kuliah
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Aktif</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm">
                              <div>{course.jumlah_aktivitas} aktivitas</div>
                              <div className="text-gray-500">{course.jumlah_mahasiswa} mahasiswa</div>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Activities Rows */}
                        {isExpanded && isLoadingCourseActivities && (
                          <TableRow key={`loading-activities-${course.course_id}`}>
                            <TableCell className="pl-8"></TableCell>
                            <TableCell colSpan={4} className="text-center py-4">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Loading activities...
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {isExpanded && !isLoadingCourseActivities && courseActivities.length === 0 && (
                          <TableRow key={`empty-activities-${course.course_id}`}>
                            <TableCell className="pl-8"></TableCell>
                            <TableCell colSpan={4} className="p-0">
                              <EmptyActivitiesState />
                            </TableCell>
                          </TableRow>
                        )}
                        {isExpanded && !isLoadingCourseActivities && courseActivities.length > 0 && courseActivities.map((activity, activityIndex) => {
                          const isActivityExpanded = expandedActivities.has(`${course.course_id}-${activityIndex}`)
                          const uniqueActivityKey = `${course.course_id}-${activityIndex}`
                          const activityStudents = studentsCache.get(uniqueActivityKey) || []
                          const isLoadingActivityStudents = loadingStudents.has(uniqueActivityKey)
                          
                          return (
                            <React.Fragment key={`${course.course_name}-${course.course_id}-${activityIndex}`}>
                              {/* Activity Row */}
                              <TableRow 
                                className="cursor-pointer hover:bg-gray-50 bg-gray-25"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActivity(course.course_id, activityIndex, activity.activity_id, activity.activity_type);
                                }}
                              >
                                <TableCell className="pl-8">
                                  {isActivityExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRightIcon className="w-4 h-4" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getActivityColor(activity.activity_type)} border-0 text-xs`}>
                                      {getActivityIcon(activity.activity_type)}
                                      {activity.activity_type}
                                    </Badge>
                                    <div>
                                      <div className="font-medium">{activity.activity_name}</div>
                                      <div className="text-xs text-gray-500">
                                        Section {activity.section}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                    Aktivitas
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Eye className="w-3 h-3" />
                                    {activity.accessed_count} akses
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="text-sm">
                                    {activity.submission_count && <div>{activity.submission_count} submit</div>}
                                    {activity.attempted_count && <div className="text-gray-500">{activity.attempted_count} attempt</div>}
                                    {activity.graded_count && <div className="text-green-600">{activity.graded_count} graded</div>}
                                  </div>
                                </TableCell>
                              </TableRow>
                              
                              {/* Students Rows */}
                              {isActivityExpanded && isLoadingActivityStudents && (
                                <TableRow key={`loading-students-${course.course_id}-${activityIndex}`} className="bg-gray-50">
                                  <TableCell className="pl-12"></TableCell>
                                  <TableCell colSpan={4} className="text-center py-2">
                                    <div className="flex items-center justify-center gap-2 text-sm">
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Loading students...
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                              {isActivityExpanded && !isLoadingActivityStudents && activityStudents.length === 0 && (
                                <TableRow key={`empty-students-${course.course_id}-${activityIndex}`} className="bg-gray-50">
                                  <TableCell className="pl-12"></TableCell>
                                  <TableCell colSpan={4} className="p-0">
                                    <EmptyStudentsState />
                                  </TableCell>
                                </TableRow>
                              )}
                              {isActivityExpanded && !isLoadingActivityStudents && activityStudents.length > 0 && activityStudents.slice(0, 10).map((student, studentIndex) => (
                                <StudentActivityRow 
                                  key={`student-${course.course_id}-${activityIndex}-${studentIndex}`}
                                  student={student} 
                                  activityType={activity.activity_type} 
                                  courseId={course.course_id} 
                                  activityIndex={activityIndex} 
                                  studentIndex={studentIndex} 
                                />
                              ))}
                              
                              {/* Load More Students */}
                              {isActivityExpanded && !isLoadingActivityStudents && activityStudents.length > 10 && (
                                <TableRow key={`load-more-${course.course_id}-${activityIndex}`} className="bg-gray-50">
                                  <TableCell className="pl-12"></TableCell>
                                  <TableCell colSpan={4} className="text-center">
                                    <Button variant="ghost" size="sm" className="text-teal-600">
                                      Lihat {activityStudents.length - 10} mahasiswa lainnya
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
            
            <div className="p-4 border-t">
              <PaginationControls />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

