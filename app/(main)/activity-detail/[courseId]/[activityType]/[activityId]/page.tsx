"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourseActivities, getActivityStudents, getActivityDetail, getETLStatus } from "@/lib/api"
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
    Filter,
    Download,
    RefreshCw,
    Activity,
    GraduationCap,
    Eye,
    Calendar,
    Star,
    ArrowLeft,
    User,
    FileCheck,
    Timer,
    Target,
    TrendingUp,
    Award,
    X,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"


// Types
interface ActivitySummary {
    id: number
    course_id: number
    section: number
    activity_id: number
    activity_type: string
    activity_name: string
    accessed_count: number | null
    submission_count: number | null
    graded_count: number | null
    attempted_count: number | null
    created_at: string
    updated_at?: string
}

interface ETLStatus {
    status: {
        status: string
        lastRun: {
            id: number
            start_date: string
            end_date: string
            status: string
            total_records: number
            offset: number
        }
        nextRun: string
        isRunning: boolean
        shouldRun: boolean
    }
}

interface CourseInfo {
    id?: number
    course_id: number
    course_name: string
    kelas: string
    jumlah_aktivitas: number
    jumlah_mahasiswa: number
    dosen_pengampu: string
    created_at?: string
    updated_at?: string
}

// Flexible student data interface that can handle all activity types
interface StudentData {
    id: number
    user_id: number
    nim: string | null
    full_name: string
    program_studi: string | null
    // Common fields
    waktu_aktivitas?: string
    // Resource-specific fields
    waktu_akses?: string
    // Assign-specific fields
    waktu_submit?: string
    durasi_pengerjaan?: string | null
    nilai?: number | null
    // Quiz-specific fields
    progress?: string
    waktu_selesai?: string
    jumlah_dikerjakan?: number
    jumlah_soal?: number
    status_pengerjaan?: string
    // Additional display fields
    email?: string
}

interface ExtendedStudentData extends StudentData {
    activity_type: string
}

export default function ActivityDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const courseId = Number(params.courseId)
    const activityType = params.activityType as 'resource' | 'assign' | 'quiz'
    const activityId = Number(params.activityId)

    const [activity, setActivity] = useState<ActivitySummary | null>(null)
    const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
    const [students, setStudents] = useState<ExtendedStudentData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchInput, setSearchInput] = useState("") // For input field value
    const [searchTerm, setSearchTerm] = useState("") // For actual search that triggers fetch
    const [filterType, setFilterType] = useState("all")
    const [sortBy, setSortBy] = useState("full_name")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
    const [etlStatus, setEtlStatus] = useState<ETLStatus | null>(null)
    const [etlLoading, setEtlLoading] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState<any>(null)

    // Fetch ETL Status
    const fetchETLStatus = async () => {
        try {
            setEtlLoading(true)
            const response = await getETLStatus()
            setEtlStatus(response)
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

    // Load activity and student data
    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Load activity info using the new getActivityDetail function
            const activityResponse = await getActivityDetail(courseId, activityId, activityType, 50)
            
            if (!activityResponse.info || !activityResponse.info.activity) {
                throw new Error(`Activity with ID ${activityId} and type ${activityType} not found in course ${courseId}`)
            }

            // Set activity data from the new structure
            const activityData = activityResponse.info.activity
            setActivity({
                ...activityData,
                updated_at: (activityData as any).updated_at || activityData.created_at || ''
            })
            
            // Set course info from the new structure
            if (activityResponse.info.course) {
                const courseData = activityResponse.info.course
                setCourseInfo({
                    id: (courseData as any).id || 0,
                    course_id: courseData.course_id,
                    course_name: courseData.course_name,
                    kelas: courseData.kelas,
                    jumlah_aktivitas: courseData.jumlah_aktivitas || 0,
                    jumlah_mahasiswa: courseData.jumlah_mahasiswa || 0,
                    dosen_pengampu: courseData.dosen_pengampu || '',
                    created_at: (courseData as any).created_at || '',
                    updated_at: (courseData as any).updated_at || (courseData as any).created_at || ''
                })
            }

            // Use student data directly from activitiesResponse
            if (activityResponse.students && activityResponse.students.data) {
                // Handle single student object or array
                const studentData = Array.isArray(activityResponse.students.data) 
                    ? activityResponse.students.data 
                    : [activityResponse.students.data];
                
                // Add activity_type to each student record and map to ExtendedStudentData
                const extendedStudentData: ExtendedStudentData[] = studentData.map(student => {
                    const baseStudent: StudentData = {
                        id: student.id,
                        user_id: student.user_id,
                        nim: student.nim,
                        full_name: student.full_name,
                        program_studi: student.program_studi
                    };

                    let extended: ExtendedStudentData;
                    if (activityType === 'resource') {
                        extended = {
                            ...baseStudent,
                            activity_type: activityType,
                            waktu_akses: student.waktu_akses || '',
                            waktu_aktivitas: student.waktu_aktivitas || '',
                            durasi_pengerjaan: '',
                            nilai: undefined,
                            progress: '',
                            email: '',
                            waktu_selesai: '',
                            jumlah_dikerjakan: 0,
                            jumlah_soal: 0,
                            status_pengerjaan: ''
                        };
                    } else if (activityType === 'assign') {
                        extended = {
                            ...baseStudent,
                            activity_type: activityType,
                            waktu_submit: student.waktu_submit || '',
                            durasi_pengerjaan: student.durasi_pengerjaan || null,
                            nilai: student.nilai || null,
                            waktu_aktivitas: student.waktu_aktivitas || '',
                            email: '',
                            waktu_selesai: '',
                            jumlah_dikerjakan: 0,
                            jumlah_soal: 0,
                            status_pengerjaan: ''
                        };
                    } else if (activityType === 'quiz') {
                        extended = {
                            ...baseStudent,
                            activity_type: activityType,
                            waktu_aktivitas: student.waktu_aktivitas || '',
                            durasi_pengerjaan: student.durasi_pengerjaan || undefined,
                            nilai: student.nilai || undefined,
                            progress: student.progress || undefined,
                            waktu_selesai: student.waktu_selesai || undefined,
                            jumlah_dikerjakan: student.jumlah_dikerjakan || undefined,
                            jumlah_soal: student.jumlah_soal || undefined,
                            status_pengerjaan: student.status_pengerjaan || undefined
                        };
                    } else {
                        extended = {
                            ...baseStudent,
                            activity_type: activityType,
                            waktu_aktivitas: '',
                            durasi_pengerjaan: '',
                            nilai: undefined,
                            progress: '',
                            email: '',
                            waktu_selesai: '',
                            jumlah_dikerjakan: 0,
                            jumlah_soal: 0,
                            status_pengerjaan: ''
                        };
                    }
                    return extended;
                });
                
                setStudents(extendedStudentData)
                
                // Update pagination info from the new structure
                if (activityResponse.students.pagination) {
                    setPaginationInfo(activityResponse.students.pagination)
                    setTotalPages(activityResponse.students.pagination.total_pages)
                    setTotalItems(activityResponse.students.pagination.total_items)
                    setCurrentPage(activityResponse.students.pagination.current_page)
                    setItemsPerPage(activityResponse.students.pagination.items_per_page)
                }
            }

            // Also refresh ETL status
            await fetchETLStatus()

        } catch (error) {
            console.error("Error loading activity detail:", error)
            setError(error instanceof Error ? error.message : "Failed to load activity details")
        } finally {
            setLoading(false)
        }
    }, [courseId, activityType, activityId, currentPage, itemsPerPage, searchTerm, sortBy, sortOrder])

    // Load activity and student data
    useEffect(() => {
        if (courseId && activityType && activityId) {
            loadData()
        }
    }, [loadData])

    // Since API handles filtering and sorting, we use students directly
    const filteredAndSortedStudents = students

    // Statistics - use total counts from pagination and API
    const stats = React.useMemo(() => {
        // Use total items from pagination for accurate counts
        const totalStudents = totalItems || students.length

        // For current page statistics (visible data)
        const currentPageCompleted = students.filter(s => s.nilai !== undefined && s.nilai !== null).length
        const currentPageAverageScore = students
            .filter(s => s.nilai !== undefined && s.nilai !== null)
            .reduce((sum, s) => sum + (Number(s.nilai) || 0), 0) / (currentPageCompleted || 1)
        const currentPageHighScorers = students.filter(s => (Number(s.nilai) || 0) >= 8).length

        // Activity-specific stats from activity summary
        const accessedCount = activity?.accessed_count || 0
        const submissionCount = activity?.submission_count || 0
        const gradedCount = activity?.graded_count || 0
        const attemptedCount = activity?.attempted_count || 0

        // Calculate completion rate based on activity type
        let completedStudents = 0
        let completionRate = 0

        switch (activity?.activity_type?.toLowerCase()) {
            case 'resource':
                completedStudents = accessedCount || 0
                completionRate = totalStudents > 0 ? ((accessedCount || 0) / totalStudents) * 100 : 0
                break
            case 'assign':
                completedStudents = gradedCount || 0
                completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0
                break
            case 'quiz':
                completedStudents = gradedCount || currentPageCompleted
                completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0
                break
            default:
                completedStudents = currentPageCompleted
                completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0
        }

        return {
            totalStudents,
            completedStudents,
            pendingStudents: totalStudents - completedStudents,
            averageScore: currentPageCompleted > 0 ? currentPageAverageScore : 0,
            highScorers: currentPageHighScorers,
            completionRate,
            // Activity metrics from API
            accessedCount,
            submissionCount,
            gradedCount,
            attemptedCount
        }
    }, [students, activity, totalItems])

    const getActivityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'quiz':
                return <HelpCircle className="w-4 h-4 mr-1" />
            case 'assign':
                return <FileText className="w-4 h-4 mr-1" />
            case 'resource':
                return <BookOpen className="w-4 h-4 mr-1" />
            default:
                return <Activity className="w-4 h-4 mr-1" />
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

    const getScoreBadgeVariant = (score: number) => {
        if (score >= 8) return "default"
        if (score >= 7) return "secondary"
        return "destructive"
    }

    // Get statistics cards based on activity type
    const getStatisticsCards = () => {
        const baseCard = (
            <Card key="total-students">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Mahasiswa</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )

        switch (activity?.activity_type?.toLowerCase()) {
            case 'resource':
                return [
                    baseCard,
                    <Card key="accessed">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Diakses</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.accessedCount}</p>
                                    <p className="text-xs text-gray-500">Kali diakses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="accessed-students">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Mahasiswa Diakses</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedStudents}</p>
                                    <p className="text-xs text-gray-500">{stats.completionRate.toFixed(1)}% diakses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="not-accessed">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                                    <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Tidak Diakses</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendingStudents}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ]

            case 'assign':
                return [
                    baseCard,
                    <Card key="submissions">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Submisi</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.submissionCount}</p>
                                    <p className="text-xs text-gray-500">Total submisi</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="graded">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Penilaian</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.gradedCount}</p>
                                    <p className="text-xs text-gray-500">Telah di nilai</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="average-score">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Rata-rata Nilai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "N/A"}
                                    </p>
                                    <p className="text-xs text-gray-500">{stats.highScorers} mahasiswa nilai ≥ 8</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ]

            case 'quiz':
                return [
                    baseCard,
                    <Card key="attempted">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Mengerjakan</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.attemptedCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="completed">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Selesai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedStudents}</p>
                                    <p className="text-xs text-gray-500">{stats.completionRate.toFixed(1)}% selesai</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="average-score">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Rata-rata Nilai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "N/A"}
                                    </p>
                                    <p className="text-xs text-gray-500">{stats.highScorers} nilai ≥ 8</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ]

            default:
                return [
                    baseCard,
                    <Card key="completed">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Selesai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedStudents}</p>
                                    <p className="text-xs text-gray-500">{stats.completionRate.toFixed(1)}% selesai</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="pending">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                                    <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Tidak Selesai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendingStudents}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>,
                    <Card key="average-score">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Rata-rata Nilai</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "N/A"}
                                    </p>
                                    <p className="text-xs text-gray-500">{stats.highScorers} mahasiswa dengan nilai ≥8</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ]
        }
    }

    // Handle search execution
    const executeSearch = useCallback(() => {
        setSearchTerm(searchInput)
        setCurrentPage(1) // Reset to first page on search
    }, [searchInput])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeSearch()
        }
    }, [executeSearch])

    const clearSearch = useCallback(() => {
        setSearchInput("")
        setSearchTerm("")
        setCurrentPage(1) // Reset to first page when clearing search
    }, [])

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Handle items per page change
    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items)
        setCurrentPage(1) // Reset to first page when changing items per page
    }

    // Handle sorting
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setCurrentPage(1) // Reset to first page on sort
    }

    // Refresh data function
    const handleRefresh = async () => {
        if (courseId && activityType && activityId) {
            await loadData()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    if (error || !activity) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="text-red-600 mb-4">
                                <Activity className="w-12 h-12 mx-auto" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                {error || "Activity not found"}
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Unable to load activity details. Please try again.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={() => router.replace(`/`)} variant="outline">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali
                                </Button>
                                <Button onClick={handleRefresh} variant="default">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Coba Lagi
                                </Button>
                            </div>
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
                <div className="px-4 sm:px-6 py-4">
                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                                        {activity.activity_name}
                                    </h1>
                                    <Badge className={`${getActivityColor(activity.activity_type)} border text-sm flex-shrink-0 max-w-[100px]`}>
                                        {getActivityIcon(activity.activity_type)}
                                        {activity.activity_type}
                                    </Badge>
                                </div>

                                {/* Course Information */}
                                <div className="flex items-center space-x-3 mb-2 text-sm">
                                    {courseInfo ? (
                                        <>
                                            <span className="font-medium text-gray-700 truncate">
                                                {courseInfo.course_name}
                                            </span>
                                            <span className="text-gray-500 flex-shrink-0">•</span>
                                            <span className="text-blue-600 font-medium flex-shrink-0">
                                                {courseInfo.kelas}
                                            </span>
                                            <span className="text-gray-500 flex-shrink-0">•</span>
                                            <span className="text-gray-500 flex-shrink-0">
                                                Section {activity.section}
                                            </span>
                                            {courseInfo.dosen_pengampu && (
                                                <>
                                                    <span className="text-gray-500 flex-shrink-0">•</span>
                                                    <span className="text-gray-500 flex-shrink-0">
                                                        Dosen: {courseInfo.dosen_pengampu}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-gray-500">
                                                Course ID: {courseId}
                                            </span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-gray-500">
                                                Section {activity.section}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="h-4" />
                            </div>

                            {/* Course Information */}
                            <div className="flex-1 px-2 min-w-0">
                                <div className="text-xs text-gray-600">
                                    {courseInfo ? (
                                        <div className="text-center">
                                            <div className="font-medium text-gray-700 truncate">
                                                {courseInfo.course_name}
                                            </div>
                                            <div className="flex items-center justify-center space-x-1">
                                                <span className="text-blue-600 font-medium">
                                                    {courseInfo.kelas}
                                                </span>
                                                <span>•</span>
                                                <span>Section {activity.section}</span>
                                            </div>
                                            {courseInfo.dosen_pengampu && (
                                                <div className="text-gray-500 text-xs mt-1">
                                                    Dosen: {courseInfo.dosen_pengampu}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div>Course ID: {courseId}</div>
                                            <div>Section {activity.section}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button variant="outline" size="sm" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <h1 className="text-lg font-bold text-gray-900 truncate flex-1 max-w-[300px]">
                                    {activity.activity_name}
                                </h1>
                                <Badge className={`${getActivityColor(activity.activity_type)} border text-xs flex-shrink-0`}>
                                    {getActivityIcon(activity.activity_type)}
                                    {activity.activity_type}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {getStatisticsCards()}
                </div>

                {/* Simple Data Update Info */}
                {etlStatus && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                                Terakhir update: <ClientDate dateString={etlStatus.status.lastRun.end_date} />
                            </span>
                            {etlStatus.status.isRunning && (
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-blue-600 text-xs">Updating...</span>
                                </div>
                            )}
                            {etlStatus.status.status === 'paused' && (
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    <Clock className="w-3 h-3 text-yellow-600" />
                                    <span className="text-yellow-600 text-xs">Paused</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Student Data Table */}
                <Card>
                    <CardHeader className="bg-teal-700 text-white">
                        {/* Search Bar */}
                        <div className="pt-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Cari nama atau NIM mahasiswa..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="pl-10 pr-10 bg-white text-gray-900 focus-visible:ring-0 h-10"
                                    />
                                    {(searchInput || searchTerm) && (
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
                                    className="bg-white text-teal-700 hover:bg-teal-800 hover:text-white font-semibold focus-visible:ring-0 h-10 px-4 flex-shrink-0"
                                    size="default"
                                >
                                    <Search className="w-4 h-4 sm:mr-2" strokeWidth={3} />
                                    <span className="hidden sm:inline">Cari</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table className="w-full table-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center px-2 sm:px-4">No</TableHead>
                                    <TableHead className="px-2 sm:px-4">
                                        <button
                                            onClick={() => handleSort("full_name")}
                                            className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                                        >
                                            Student
                                            {sortBy === "full_name" && (
                                                <span className="text-xs">
                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                </span>
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="px-2 sm:px-4">
                                        <button
                                            onClick={() => handleSort("waktu_aktivitas")}
                                            className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                                        >
                                            Activity Details
                                            {sortBy === "waktu_aktivitas" && (
                                                <span className="text-xs">
                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                </span>
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Status</TableHead>
                                    <TableHead className="text-right px-2 sm:px-4">
                                        <button
                                            onClick={() => handleSort("nilai")}
                                            className="flex items-center gap-1 hover:text-gray-300 transition-colors ml-auto text-xs sm:text-sm"
                                        >
                                            Score
                                            {sortBy === "nilai" && (
                                                <span className="text-xs">
                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                </span>
                                            )}
                                        </button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <div className="text-gray-500">
                                                <Users className="w-8 h-8 mx-auto mb-2" />
                                                <p className="font-medium">Tidak ada data mahasiswa</p>
                                                <p className="text-sm">Tidak ada mahasiswa yang ditemukan atau belum ada aktivitas</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedStudents.map((student, index) => (
                                        <TableRow key={`${courseId}-${activityId}-${student.user_id}-${student.nim}-${index}`} className="hover:bg-gray-50">
                                            <TableCell className="p-2 sm:p-4 text-center">
                                                <div className="font-medium text-xs sm:text-sm text-gray-600">
                                                    {((currentPage - 1) * itemsPerPage) + index + 1}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2 sm:p-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-xs sm:text-sm">{student.full_name}</div>
                                                    {student.nim && (
                                                        <div className="text-xs text-gray-500">{student.nim}</div>
                                                    )}
                                                    {student.program_studi && (
                                                        <div className="text-xs text-blue-600">{student.program_studi}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2 sm:p-4">
                                                <div className="space-y-1 sm:space-y-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                        <span>
                                                            <ClientDate dateString={student.waktu_aktivitas || student.waktu_akses || student.waktu_submit || ''} />
                                                        </span>
                                                    </div>
                                                    {student.durasi_pengerjaan && (
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                                            <span>Duration: {student.durasi_pengerjaan}</span>
                                                        </div>
                                                    )}
                                                    {student.waktu_selesai && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                                            <span>Finished: <ClientDate dateString={student.waktu_selesai} /></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2 sm:p-4">
                                                <div className="space-y-1 text-xs">
                                                    {student.durasi_pengerjaan ? (
                                                        <Badge variant="outline" className="text-xs border-teal-200 text-teal-600 bg-teal-50">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Submitted
                                                    </Badge>
                                                    ):(
                                                        <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600 bg-yellow-50">
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            View Activity
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right p-2 sm:p-4">
                                                <div className="flex justify-end">
                                                    {student.nilai !== undefined && student.nilai !== null ? (
                                                        <Badge
                                                            variant={getScoreBadgeVariant(Number(student.nilai))}
                                                            className="text-xs"
                                                        >
                                                            <Award className="w-3 h-3 mr-1" />
                                                            <span className="hidden sm:inline">{Number(student.nilai).toFixed(2)}</span>
                                                            <span className="sm:hidden">{Number(student.nilai).toFixed(1)}</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs">
                                                            <span className="hidden sm:inline">No Score</span>
                                                            <span className="sm:hidden">-</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        <div className="p-4 border-t">
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
                                        <span className="hidden sm:inline">per halaman</span>
                                        <span className="sm:hidden">/hal</span>
                                    </span>
                                </div>

                                {/* Pagination info */}
                                <div className="text-sm text-gray-700 text-center">
                                    <span className="hidden sm:inline">
                                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} mahasiswa
                                    </span>
                                    <span className="sm:hidden">
                                        {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems}
                                    </span>
                                </div>

                                {/* Pagination controls */}
                                {totalPages > 1 && (
                                    <Pagination>
                                        <PaginationContent className="flex-wrap gap-1">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (currentPage > 1) handlePageChange(currentPage - 1)
                                                    }}
                                                    className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : ""} text-xs sm:text-sm px-2 sm:px-3`}
                                                />
                                            </PaginationItem>

                                            {/* First page */}
                                            {currentPage > 2 && (
                                                <>
                                                    <PaginationItem className="hidden sm:block">
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handlePageChange(1)
                                                            }}
                                                            className="text-xs sm:text-sm px-2 sm:px-3"
                                                        >
                                                            1
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                    {currentPage > 3 && (
                                                        <PaginationItem className="hidden sm:block">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )}
                                                </>
                                            )}

                                            {/* Previous page */}
                                            {currentPage > 1 && (
                                                <PaginationItem className="hidden sm:block">
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            handlePageChange(currentPage - 1)
                                                        }}
                                                        className="text-xs sm:text-sm px-2 sm:px-3"
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
                                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                                >
                                                    {currentPage}
                                                </PaginationLink>
                                            </PaginationItem>

                                            {/* Next page */}
                                            {currentPage < totalPages && (
                                                <PaginationItem className="hidden sm:block">
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            handlePageChange(currentPage + 1)
                                                        }}
                                                        className="text-xs sm:text-sm px-2 sm:px-3"
                                                    >
                                                        {currentPage + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )}

                                            {/* Last page */}
                                            {currentPage < totalPages - 1 && (
                                                <>
                                                    {currentPage < totalPages - 2 && (
                                                        <PaginationItem className="hidden sm:block">
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )}
                                                    <PaginationItem className="hidden sm:block">
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handlePageChange(totalPages)
                                                            }}
                                                            className="text-xs sm:text-sm px-2 sm:px-3"
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
                                                    className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""} text-xs sm:text-sm px-2 sm:px-3`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 