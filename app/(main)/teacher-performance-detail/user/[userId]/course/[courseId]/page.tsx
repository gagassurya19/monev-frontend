"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getTPEtlDetailSummary, getTPEtlDetail } from "@/lib/api/etl-tp";
import {
  TpEtlDetailSummary,
  TpEtlDetail,
} from "@/lib/types/teacher-performance";
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
  Users,
  CheckCircle,
  Target,
  Component,
  Clock,
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
    description="Belum ada aktivitas yang tersedia atau sesuai dengan filter pencarian Anda."
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

export default function TeacherPerformanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const userId = Number(params.userId);
  const courseId = Number(params.courseId);

  const [summaryData, setSummaryData] = useState<TpEtlDetailSummary | null>(
    null
  );
  const [detailData, setDetailData] = useState<TpEtlDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadSummaryData = useCallback(async () => {
    try {
      console.log(
        `🔄 Loading summary data for user ${userId}, course ${courseId}...`
      );
      const response = await getTPEtlDetailSummary(userId, courseId);
      setSummaryData(response.data);
      // Set initial total records from summary
      setTotalRecords(response.data.total_activities || 0);
      console.log("✅ Summary data loaded successfully");
    } catch (error) {
      console.error("❌ Error loading summary data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    }
  }, [userId, courseId]);

  const loadDetailData = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        console.log(
          `🔄 Loading detail data for user ${userId}, course ${courseId}, page ${page}, limit ${itemsPerPage}, search: "${search}"...`
        );
        const response = await getTPEtlDetail(
          page,
          itemsPerPage,
          search,
          "id",
          "desc",
          userId,
          courseId
        );
        setDetailData(response.data);
        // Update total records from pagination
        if (response.pagination) {
          setTotalRecords(response.pagination.total_records);
        } else {
          setTotalRecords(response.data.length);
        }
        console.log("✅ Detail data loaded successfully");
      } catch (error) {
        console.error("❌ Error loading detail data:", error);
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
        loadSummaryData(),
        loadDetailData(currentPage, searchTerm),
      ]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to refresh data"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSummaryData, loadDetailData, isRefreshing, currentPage, searchTerm]);

  // Search functions
  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
    // Reload data with cleared search
    loadDetailData(1, "");
  }, [loadDetailData]);

  const executeSearch = useCallback(() => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
    // Reload data with search term
    loadDetailData(1, searchInput);
  }, [searchInput, loadDetailData]);

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
        await loadDetailData(page, searchTerm);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [loadDetailData, searchTerm, isLoadingPage]
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
        const response = await getTPEtlDetail(
          1,
          newLimit,
          searchTerm,
          "id",
          "desc",
          userId,
          courseId
        );
        setDetailData(response.data);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [userId, courseId, searchTerm, isLoadingPage]
  );

  // Group activities by type
  const groupedActivities = useMemo(() => {
    return detailData.reduce((acc, activity) => {
      const type = activity.component;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(activity);
      return acc;
    }, {} as Record<string, TpEtlDetail[]>);
  }, [detailData]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

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
        await Promise.all([loadSummaryData(), loadDetailData(1, "")]);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadSummaryData, loadDetailData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-300 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
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
                    href="/teacher-performance"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    <Users className="w-4 h-4" strokeWidth={3} />
                    <span className="text-sm font-medium">
                      Teacher Performance
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
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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

        {/* Summary Cards */}
        {summaryData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Teacher Performance Summary
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>
                    Teacher: {summaryData.firstname} {summaryData.lastname} (@
                    {summaryData.username})
                  </span>
                  <span>|</span>
                  <span>
                    Course: {summaryData.course_name} (
                    {summaryData.course_shortname})
                  </span>
                  <span>|</span>
                  <span>
                    User ID: {userId} | Course ID: {courseId}
                  </span>
                </div>
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
              {/* Total Activities Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Total Activities
                    </CardTitle>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {summaryData.total_activities?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    All Activities
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Activities Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Quiz Activities
                    </CardTitle>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {summaryData.quiz_logs?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Quiz Logs
                  </div>
                </CardContent>
              </Card>

              {/* Forum Activities Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Forum Activities
                    </CardTitle>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {summaryData.forum_logs?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Forum Logs
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Activities Card */}
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Assignment Activities
                    </CardTitle>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {summaryData.assign_logs?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Assignment Logs
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Detail Table Section */}
        {detailData.length > 0 && (
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
                      {detailData.length} items
                    </Badge>
                  </div>
                </CardTitle>

                {/* Search Bar */}
                <div className="pt-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari component, action, atau target..."
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
                {detailData.length === 0 ? (
                  <EmptyDetailState />
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                          <TableHead className="w-[50px] text-center text-gray-800 font-semibold">
                            No
                          </TableHead>
                          <TableHead className="text-center text-gray-800 font-semibold">
                            Component
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Action
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Target
                          </TableHead>
                          <TableHead className="text-left text-gray-800 font-semibold">
                            Activity Date
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.map((activity, index) => {
                          // Format activity_date to readable format
                          const activityDate = new Date(activity.activity_date);
                          const formattedDate = activityDate.toLocaleDateString(
                            "en-CA",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          );

                          return (
                            <TableRow
                              key={activity.id}
                              className="hover:bg-gray-100 border-b-2 border-gray-200 bg-gradient-to-r from-white to-gray-50"
                            >
                              <TableCell className="p-3 sm:p-4 text-center">
                                <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
                                  <span className="text-xs font-medium text-gray-700">
                                    {(currentPage - 1) * itemsPerPage +
                                      index +
                                      1}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4 text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {activity.component}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  {activity.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-gray-500" />
                                  {activity.target}
                                </div>
                              </TableCell>
                              <TableCell className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-mono text-sm">
                                    {formattedDate}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
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
