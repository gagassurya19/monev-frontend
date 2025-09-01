"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { getSPSummary, getSPSummaryDetail } from "@/lib/api/etl-sp";
import {
  SpEtlSummary,
  SpEtlSummaryResponse,
  Pagination,
  SpEtlSummaryDetailResponse,
} from "@/lib/types/student-performance";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ClientDate from "@/components/ClientDate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Search,
  FileText,
  ClipboardList,
  HelpCircle,
  RefreshCw,
  X,
  Home,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  GraduationCap,
  Star,
  TrendingUp,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const loadStudentData = async (
  page: number = 1,
  limit: number = 5,
  search: string = "",
  sort_by: string = "created_at",
  sort_order: string = "desc"
): Promise<SpEtlSummaryResponse> => {
  try {
    const response = await getSPSummary(
      page,
      limit,
      search,
      sort_by,
      sort_order
    );
    return response;
  } catch (error) {
    console.error("Error loading student data:", error);

    // fallback dengan struktur SpEtlSummaryResponse
    return {
      success: false,
      status: 500,
      message: "Failed to load student data",
      timestamp: new Date().toISOString(),
      data: [],
      pagination: {
        current_page: page,
        total_pages: 0,
        total_records: 0,
        limit,
        has_next_page: false,
        has_prev_page: false,
        next_page: null,
        prev_page: null,
      },
    };
  }
};
const loadStudentCourseData = async (
  user_id: number,
  course_id: number
): Promise<SpEtlSummaryDetailResponse> => {
  try {
    const response = await getSPSummaryDetail(user_id, course_id);
    return response;
  } catch (error) {
    console.error("Error loading student course data:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to load student course data",
      timestamp: new Date().toISOString(),
      data: [],
    };
  }
};

// Skeleton components
const SkeletonTableRow = () => (
  <TableRow className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
    <TableCell className="p-3 sm:p-4">
      <Skeleton className="h-6 w-6 rounded-full bg-gray-300" />
    </TableCell>
    <TableCell className="p-3 sm:p-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-[200px] bg-gray-300" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 bg-gray-300" />
          <Skeleton className="h-5 w-20 bg-gray-300" />
        </div>
      </div>
    </TableCell>
    <TableCell className="p-3 sm:p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[120px] bg-gray-300" />
        <Skeleton className="h-6 w-[100px] bg-gray-300" />
      </div>
    </TableCell>
    <TableCell className="p-3 sm:p-4">
      <Skeleton className="h-6 w-[60px] bg-gray-300" />
    </TableCell>
    <TableCell className="p-3 sm:p-4">
      <div className="text-right space-y-2">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-6 w-6 rounded-full bg-gray-300" />
          <Skeleton className="h-4 w-[80px] bg-gray-300" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-6 w-6 rounded-full bg-gray-300" />
          <Skeleton className="h-4 w-[100px] bg-gray-300" />
        </div>
      </div>
    </TableCell>
  </TableRow>
);

// Empty state components
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
      <Icon className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-sm text-center leading-relaxed">
      {description}
    </p>
    {action}
  </div>
);

const EmptyStudentState = () => (
  <EmptyState
    icon={BookOpen}
    title="Tidak Ada Mata Kuliah"
    description="Belum ada mata kuliah yang tersedia atau sesuai dengan filter pencarian Anda."
    action={
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Muat Ulang
      </Button>
    }
  />
);

const EmptyCourseState = () => (
  <div className="py-6 text-center">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300">
      <FileText className="w-8 h-8 text-gray-400" />
    </div>
    <h4 className="text-sm font-medium text-gray-700 mb-2">
      Tidak Ada Mata Kuliah
    </h4>
    <p className="text-xs text-gray-600">
      Belum ada mata kuliah yang tersedia atau sesuai dengan filter pencarian
      Anda.
    </p>
  </div>
);

export default function StudentPerformance() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // state payload get summary
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder] = useState("desc");

  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<SpEtlSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Drilldown state management
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(
    new Set()
  );
  const [courseDataCache, setCourseDataCache] = useState<Map<number, any[]>>(
    new Map()
  );
  const [loadingCourses, setLoadingCourses] = useState<Set<number>>(new Set());

  // Method untuk load initial data
  const loadInitialData = useCallback(async () => {
    // Prevent multiple initial loads
    if (isLoading || isInitialLoadComplete) return;

    console.log("🔄 Loading initial data...");
    setError(null);
    setIsLoading(true);
    try {
      const data = await loadStudentData(1, 5, "", "created_at", "desc");
      console.log("✅ Initial data loaded successfully");
      setStudentData(data.data);
      setIsInitialLoadComplete(true);
    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isInitialLoadComplete]);

  // Method untuk refresh data (dengan parameter current)
  const handleRefresh = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) return;

    setError(null);
    setIsRefreshing(true);
    loadStudentData(currentPage, limit, search, sortBy, sortOrder)
      .then((data) => {
        setStudentData(data.data);
      })
      .catch(setError)
      .finally(() => setIsRefreshing(false));
  }, [currentPage, limit, search, sortBy, sortOrder, isRefreshing]);

  const clearSearch = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) return;

    setSearch("");
    setCurrentPage(1);
    // Reload data with empty search immediately
    setError(null);
    setIsRefreshing(true);
    try {
      const data = await loadStudentData(1, limit, "", sortBy, sortOrder);
      setStudentData(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsRefreshing(false);
    }
  }, [limit, sortBy, sortOrder, isRefreshing]);

  const executeSearch = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) return;

    // Trigger search immediately without calling handleSearch to avoid infinite loop
    setCurrentPage(1);
    // Delay refresh to ensure currentPage is updated first
    setTimeout(() => {
      handleRefresh();
    }, 0);
  }, [handleRefresh, isRefreshing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        executeSearch();
      }
    },
    [executeSearch]
  );

  // Load initial data - HANYA SATU KALI
  useEffect(() => {
    loadInitialData();
  }, []); // Only run once on mount

  // Paginated data
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return studentData.slice(startIndex, endIndex);
  }, [studentData, currentPage, limit]);

  // Toggle student drilldown
  const toggleStudent = useCallback(
    async (userId: number) => {
      setExpandedStudents((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);

          // Load course data if not already cached
          if (!courseDataCache.has(userId)) {
            // Prevent multiple simultaneous calls for the same user
            if (loadingCourses.has(userId)) return newSet;

            console.log(`🔄 Loading course data for student ${userId}...`);
            setLoadingCourses((prev) => new Set(prev).add(userId));

            // Load course data for this student
            loadStudentCourseData(userId, 0) // course_id 0 means get all courses
              .then((response) => {
                console.log(`✅ Course data loaded for student ${userId}`);
                setCourseDataCache((prev) =>
                  new Map(prev).set(userId, response.data)
                );
              })
              .catch((err) => {
                console.error(
                  `❌ Failed to load course data for student ${userId}:`,
                  err
                );
              })
              .finally(() => {
                setLoadingCourses((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(userId);
                  return newSet;
                });
              });
          }
        }
        return newSet;
      });
    },
    [courseDataCache, loadingCourses]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MONEV</h1>
                <p className="text-sm text-gray-600">Telkom University</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Loading Table */}
          <Card>
            <CardHeader className="bg-gray-700 text-white">
              <Skeleton className="h-8 w-[300px] bg-gray-600" />
              <Skeleton className="h-10 w-full bg-gray-600" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="w-[50px] text-gray-800 font-semibold"></TableHead>
                    <TableHead className="text-gray-800 font-semibold">
                      Nama Mahasiswa
                    </TableHead>
                    <TableHead className="text-gray-800 font-semibold">
                      Total Course
                    </TableHead>
                    <TableHead className="text-gray-800 font-semibold">
                      Total Login
                    </TableHead>
                    <TableHead className="text-right text-gray-800 font-semibold">
                      Total Aktifitas
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Breadcrumb className="items-center gap-2 hidden sm:flex">
                <BreadcrumbItem className="flex items-center">
                  <BreadcrumbLink
                    href="/"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4" strokeWidth={3} />
                    <span className="text-sm font-medium">Dashboard</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 sm:hidden" />
                <Separator
                  orientation="vertical"
                  className="block sm:hidden h-6 bg-gray-300"
                />
              </div>

              <div className="sm:hidden flex items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-2">
                    MONEV
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing ? "animate-spin" : ""
                  } sm:mr-2`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-red-800 font-semibold text-lg">Error</span>
            </div>
            <p className="text-red-700 text-sm leading-relaxed mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="bg-teal-800 text-white">
          <CardTitle className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-lg sm:text-xl">Course Performance</span>
            <div className="flex items-center justify-between sm:space-x-2">
              <Badge
                variant="secondary"
                className="bg-white text-gray-700 hover:bg-white text-sm"
              >
                {studentData.length} mahasiswa
              </Badge>
            </div>
          </CardTitle>

          {/* Search Bar */}
          <div className="pt-3">
            <div className="relative flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari Nama Mahasiswa (Enter untuk cari)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 bg-white text-gray-900 focus-visible:ring-0 h-10"
                />
                {search && (
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
                className="bg-white text-gray-700 hover:bg-gray-800 hover:text-white font-semibold focus-visible:ring-0 h-10 px-4 shadow-sm transition-all duration-200"
                size="default"
              >
                <Search className="w-4 h-4 mr-2" strokeWidth={3} />
                Cari
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {studentData.length === 0 ? (
            <EmptyStudentState />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="w-[50px] text-center text-gray-800 font-semibold">
                      No
                    </TableHead>
                    <TableHead className="text-left text-gray-800 font-semibold">
                      Nama Mahasiswa
                    </TableHead>
                    <TableHead className="text-center text-gray-800 font-semibold">
                      Total Course
                    </TableHead>
                    <TableHead className="text-center text-gray-800 font-semibold">
                      Total Login
                    </TableHead>
                    <TableHead className="text-center text-gray-800 font-semibold">
                      Total Aktivitas
                    </TableHead>
                    <TableHead className="text-center text-gray-800 font-semibold">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student, index) => {
                    const isExpanded = expandedStudents.has(student.user_id);
                    const studentCourses =
                      courseDataCache.get(student.user_id) || [];
                    const isLoadingStudentCourses = loadingCourses.has(
                      student.user_id
                    );

                    return (
                      <React.Fragment key={student.id}>
                        {/* Student Row with Drilldown */}
                        <TableRow
                          className="cursor-pointer hover:bg-gray-100 border-b-2 border-gray-200 bg-gradient-to-r from-white to-gray-50"
                          onClick={() => toggleStudent(student.user_id)}
                        >
                          <TableCell className="p-3 sm:p-4">
                            <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-700" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-sm sm:text-lg leading-tight text-gray-800">
                                {student.firstname} {student.lastname}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-700 border-gray-300 text-xs font-medium"
                                >
                                  <User className="w-3 h-3 mr-1" />@
                                  {student.username}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {student.total_course.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Course
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {student.total_login.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Login
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {student.total_activities.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Aktivitas
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4">
                            <div className="flex justify-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Course Data Rows */}
                        {isExpanded && isLoadingStudentCourses && (
                          <TableRow
                            key={`loading-courses-${student.user_id}`}
                            className="bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-l-gray-300"
                          >
                            <TableCell className="pl-8 sm:pl-12 p-3 sm:p-4">
                              <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                            </TableCell>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <RefreshCw className="w-4 h-4 animate-spin text-gray-600" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">
                                  Loading course data...
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {isExpanded &&
                          !isLoadingStudentCourses &&
                          studentCourses.length === 0 && (
                            <TableRow
                              key={`empty-courses-${student.user_id}`}
                              className="bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-l-gray-300"
                            >
                              <TableCell className="pl-8 sm:pl-12 p-3 sm:p-4">
                                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                              </TableCell>
                              <TableCell colSpan={5} className="p-0">
                                <div className="py-6 px-4">
                                  <EmptyCourseState />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        {isExpanded &&
                          !isLoadingStudentCourses &&
                          studentCourses.length > 0 &&
                          studentCourses.map((course, courseIndex) => (
                            <TableRow
                              key={`${student.user_id}-${course.course_id}-${courseIndex}`}
                              className="hover:bg-gray-100 bg-gradient-to-r from-gray-50 to-transparent border-l-4 border-l-gray-300"
                            >
                              <TableCell className="pl-8 sm:pl-12 p-3 sm:p-4">
                                <div className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full p-1">
                                  <BookOpen className="w-3 h-3 text-gray-600" />
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 border-0 text-xs font-medium shadow-sm">
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      Course
                                    </Badge>
                                  </div>
                                  <div className="pl-2 border-l-2 border-gray-300">
                                    <div className="font-semibold text-sm leading-tight text-gray-800">
                                      {course.course_name}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 font-medium flex items-center gap-1">
                                      <GraduationCap className="w-3 h-3" />
                                      Mata Kuliah
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-600">
                                    {course.total_modules?.toLocaleString() ||
                                      "0"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Total Modules
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-orange-600">
                                    {course.total_logs?.toLocaleString() || "0"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Total Logs
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="text-center space-y-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full text-purple-700 text-xs font-medium">
                                        <Star className="w-3 h-3" />
                                        {course.highest_grade || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Last:{" "}
                                    {course.last_updated
                                      ? new Date(
                                          course.last_updated
                                        ).toLocaleDateString("id-ID", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                {/* Action Button for Course */}
                                <div className="flex justify-center mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/student-performance-detail/${student.user_id}/${course.course_id}`
                                      );
                                    }}
                                    className="h-7 px-3 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200"
                                  >
                                    <Eye className="w-3 h-4 mr-1" />
                                    Detail
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {studentData.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium">
                  Tampilkan:
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={async (value) => {
                    const newLimit = Number(value);

                    // Prevent multiple simultaneous calls
                    if (isRefreshing) return;

                    setLimit(newLimit);
                    setCurrentPage(1);

                    // Reload data with new limit
                    if (newLimit !== 5 && isInitialLoadComplete) {
                      setError(null);
                      setIsRefreshing(true);
                      try {
                        const data = await loadStudentData(
                          1,
                          newLimit,
                          search,
                          sortBy,
                          sortOrder
                        );
                        setStudentData(data.data);
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : "Failed to load data"
                        );
                      } finally {
                        setIsRefreshing(false);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-20 bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">per halaman</span>
              </div>

              {/* Pagination info */}
              <div className="text-sm text-gray-700 font-medium">
                Menampilkan {(currentPage - 1) * limit + 1} -{" "}
                {Math.min(currentPage * limit, studentData.length)} dari{" "}
                {studentData.length} mahasiswa
              </div>

              {/* Pagination controls */}
              {Math.ceil(studentData.length / limit) > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage <= 1}
                    className="px-3 py-2 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700 px-3 py-2">
                    {currentPage} / {Math.ceil(studentData.length / limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          Math.ceil(studentData.length / limit),
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(studentData.length / limit)
                    }
                    className="px-3 py-2 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
