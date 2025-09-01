"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getSPModuleTypeSummary, getSPDetail } from "@/lib/api/etl-sp";
import {
  SpEtlModuleTypeSummaryResponse,
  SpEtlDetailResponse,
} from "@/lib/types/student-performance-detail";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  FileText,
  MessageSquare,
  HelpCircle,
  Activity,
  ArrowLeft,
  Home,
  User,
  GraduationCap,
  Calendar,
  Star,
  TrendingUp,
  RefreshCw,
  X,
  Search,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
const EmptyDetailState = () => (
  <EmptyState
    icon={BookOpen}
    title="Tidak Ada Aktivitas"
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

export default function StudentPerformanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const userId = Number(params.userId);
  const courseId = Number(params.courseId);

  const [moduleTypeSummary, setModuleTypeSummary] =
    useState<SpEtlModuleTypeSummaryResponse | null>(null);
  const [detail, setDetail] = useState<SpEtlDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadModuleTypeSummary = useCallback(async () => {
    try {
      console.log(
        `🔄 Loading module type summary for user ${userId}, course ${courseId}...`
      );
      const response = await getSPModuleTypeSummary(userId, courseId);
      setModuleTypeSummary(response);
      console.log("✅ Module type summary loaded successfully");
    } catch (error) {
      console.error("❌ Error loading module type summary:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    }
  }, [userId, courseId]);

  const loadDetail = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        console.log(
          `🔄 Loading detail for user ${userId}, course ${courseId}, page ${page}, limit ${itemsPerPage}, search: "${search}"...`
        );
        const response = await getSPDetail(
          userId,
          courseId,
          page,
          itemsPerPage,
          search
        );
        setDetail(response);
        console.log("✅ Detail loaded successfully");
      } catch (error) {
        console.error("❌ Error loading detail:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      }
    },
    [userId, courseId, itemsPerPage]
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setError(null);
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadModuleTypeSummary(),
        loadDetail(currentPage, searchTerm),
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to refresh data"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [
    loadModuleTypeSummary,
    loadDetail,
    isRefreshing,
    currentPage,
    searchTerm,
  ]);

  // Search functions
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
    // Reload data with cleared search
    loadDetail(1, "");
  }, [loadDetail]);

  const executeSearch = useCallback(() => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
    // Reload data with search term
    loadDetail(1, searchInput);
  }, [searchInput, loadDetail]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        executeSearch();
      }
    },
    [executeSearch]
  );

  // Handle page change
  const handlePageChange = useCallback(
    async (page: number) => {
      if (isLoadingPage) return;

      setIsLoadingPage(true);
      setCurrentPage(page);
      try {
        await loadDetail(page, searchTerm);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [loadDetail, searchTerm, isLoadingPage]
  );

  // Handle limit change
  const handleLimitChange = useCallback(
    async (newLimit: number) => {
      if (isLoadingPage) return;

      setIsLoadingPage(true);
      setItemsPerPage(newLimit);
      setCurrentPage(1); // Reset to first page when changing limit
      try {
        // Use the new limit for the API call
        const response = await getSPDetail(
          userId,
          courseId,
          1,
          newLimit,
          searchTerm
        );
        setDetail(response);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [userId, courseId, searchTerm, isLoadingPage]
  );

  // Use server-side data directly
  const paginatedData = detail?.data || [];
  const totalPages = detail?.pagination?.total_pages || 1;
  const totalRecords = detail?.pagination?.total_records || 0;

  // Generate pagination numbers with ellipsis
  const generatePaginationNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 7; // Show max 7 page numbers

    if (totalPages <= maxVisiblePages) {
      // If total pages is less than max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Show pages 2, 3, 4, 5, 6, 7 + ellipsis + last page
        for (let i = 2; i <= 7; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 7 pages
        pages.push("...");
        for (let i = totalPages - 6; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current page ± 2 + ellipsis + last page
        pages.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadModuleTypeSummary(), loadDetail(1, "")]);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadModuleTypeSummary, loadDetail]);

  if (loading) {
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
          {/* Loading Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-24 bg-gray-300" />
                  <Skeleton className="h-4 w-32 bg-gray-300" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-20 bg-gray-300 mb-2" />
                  <Skeleton className="h-4 w-16 bg-gray-300" />
                </CardContent>
              </Card>
            ))}
          </div>
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
                <BreadcrumbItem className="flex items-center">
                  <BreadcrumbLink
                    href="/student-performance"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" strokeWidth={3} />
                    <span className="text-sm font-medium">
                      Student Performance
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>
              <div className="flex items-center gap-2">
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

        {/* Module Type Summary Cards */}
        {moduleTypeSummary && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Module Performance
                </h2>
                <p className="text-gray-600 mt-1">
                  User ID: {userId} | Course ID: {courseId}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                <Activity className="w-4 h-4 mr-2" />
                Performance Summary
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Assign Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Total Assign
                    </CardTitle>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {moduleTypeSummary.data.total_module_assign || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Assignment Activities
                  </div>
                </CardContent>
              </Card>

              {/* Total Forum Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Total Forum
                    </CardTitle>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {moduleTypeSummary.data.total_module_forum || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Forum Activities
                  </div>
                </CardContent>
              </Card>

              {/* Total Quiz Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Total Quiz
                    </CardTitle>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {moduleTypeSummary.data.total_module_quiz || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Quiz Activities
                  </div>
                </CardContent>
              </Card>

              {/* Total Logs Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Total Logs
                    </CardTitle>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {moduleTypeSummary.data.total_logs?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Activity Logs
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Grade Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Highest Grade:
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {moduleTypeSummary.data.highest_grade || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lowest Grade:</span>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      {moduleTypeSummary.data.lowest_grade || "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      First Activity:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {moduleTypeSummary.data.first_activity
                        ? new Date(
                            moduleTypeSummary.data.first_activity * 1000
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Last Activity:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {moduleTypeSummary.data.last_activity
                        ? new Date(
                            moduleTypeSummary.data.last_activity * 1000
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    Module Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Modules:
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {moduleTypeSummary.data.total_modules?.toLocaleString() ||
                        "0"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Detail Table Section */}
        {detail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Activity Details
              </h2>
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200"
              >
                {totalRecords} activities
              </Badge>
            </div>

            {/* Detail Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="bg-teal-700 text-white">
                <CardTitle className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-lg sm:text-xl">Activity Logs</span>
                  <div className="flex items-center justify-between sm:space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-white text-gray-700 hover:bg-white text-sm"
                    >
                      {paginatedData.length} items
                    </Badge>
                  </div>
                </CardTitle>

                {/* Search Bar */}
                <div className="pt-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari course name atau module name..."
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
              <CardContent>
                {paginatedData.length === 0 ? (
                  <EmptyDetailState />
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                          <TableHead className="w-[50px] text-center text-gray-800 font-semibold">
                            No
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Course Name
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Module Type
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Module Name
                          </TableHead>
                          <TableHead className="text-center text-gray-800 font-semibold">
                            Grade
                          </TableHead>
                          <TableHead className="text-center text-gray-800 font-semibold">
                            Action Type
                          </TableHead>
                          <TableHead className="text-center text-gray-800 font-semibold">
                            Date
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((item, index) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-gray-100 border-b-2 border-gray-200 bg-gradient-to-r from-white to-gray-50"
                          >
                            <TableCell className="p-3 sm:p-4 text-center">
                              <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
                                <span className="text-xs font-medium text-gray-700">
                                  {(currentPage - 1) * itemsPerPage + index + 1}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm sm:text-lg leading-tight text-gray-800">
                                  {item.course_name}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium"
                                  >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Course
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4">
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium ${
                                  item.module_type === "mod_assign"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : item.module_type === "mod_forum"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : item.module_type === "mod_quiz"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                {item.module_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4">
                              <div className="font-medium text-sm text-gray-800">
                                {item.module_name}
                              </div>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4 text-center">
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium ${
                                  parseFloat(item.grade) >= 80
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : parseFloat(item.grade) >= 60
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {item.grade || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4 text-center">
                              <Badge
                                variant="outline"
                                className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium"
                              >
                                {item.action_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-3 sm:p-4 text-center">
                              <div className="text-sm text-gray-600">
                                {item.timecreated
                                  ? new Date(
                                      item.timecreated * 1000
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && paginatedData.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        {/* Items per page selector - LEFT */}
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-700 font-medium">
                            Tampilkan:
                          </span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) =>
                              handleLimitChange(Number(value))
                            }
                            disabled={isLoadingPage}
                          >
                            <SelectTrigger className="w-20 bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">
                            per halaman
                          </span>
                        </div>

                        {/* Pagination controls - CENTER */}
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  handlePageChange(Math.max(1, currentPage - 1))
                                }
                                className={
                                  currentPage <= 1 || isLoadingPage
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                            {generatePaginationNumbers().map((page, index) => (
                              <PaginationItem key={index}>
                                {page === "..." ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    onClick={() =>
                                      handlePageChange(page as number)
                                    }
                                    className={
                                      currentPage === page
                                        ? "bg-teal-700 text-white"
                                        : isLoadingPage
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                    }
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  handlePageChange(
                                    Math.min(totalPages, currentPage + 1)
                                  )
                                }
                                className={
                                  currentPage >= totalPages || isLoadingPage
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>

                        {/* Pagination info - RIGHT */}
                        <div className="text-sm text-gray-700 text-right">
                          {isLoadingPage && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 justify-end">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Loading...
                            </div>
                          )}
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(currentPage * itemsPerPage, totalRecords)}{" "}
                          of {totalRecords} results
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
