"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  getFinalGradesData,
  getFacultiesList,
  getProdisList,
  getCoursesList,
} from "@/lib/api/final-grade";
import {
  FinalGradeData,
  FinalGradeCourse,
  JWTPayload,
  Faculty,
  Prodi,
  KampusItem,
} from "@/lib/types";
import { JWTAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronRight as ChevronRightIcon,
  Plus,
  X,
  Filter,
  GraduationCap,
  Building2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { FilterDropdown } from "@/components/filter-dropdown";

interface AppliedFilters {
  kampus: string;
  kampusId: string;
  fakultas: string;
  fakultasId: string;
  prodi: string;
  prodiId: string;
}

const useUser = () => {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const token = JWTAuth.getStoredToken();
    console.log("JWT Token:", token);
    if (token && !JWTAuth.isTokenExpired(token)) {
      const payload = JWTAuth.decodeToken(token);
      if (payload) {
        if (payload.admin !== undefined && payload.username !== undefined) {
          setUser(payload);
        } else {
          console.error(
            "JWT Payload does not contain 'admin' or 'username' properties."
          );
        }
      } else {
        console.warn("No valid token found, redirecting to login");
        window.location.href = "/login";
      }
    } else {
      console.warn("No valid token found, redirecting to login");
      window.location.href = "/login";
    }
    setIsUserLoading(false);
  }, []);

  return { user, isUserLoading };
};

const calculateBoxplotStats = (data: number[]) => {
  const sortedData = data.slice().sort((a, b) => a - b);
  if (sortedData.length === 0) {
    return { q1: 0, median: 0, q3: 0, min: 0, max: 0, outliers: [] };
  }
  const median = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };
  const q1 = (arr: number[]) =>
    median(arr.slice(0, Math.floor(arr.length / 2)));
  const q3 = (arr: number[]) => median(arr.slice(Math.ceil(arr.length / 2)));
  const q1Value = q1(sortedData);
  const q3Value = q3(sortedData);
  const iqr = q3Value - q1Value;
  const lowerBound = q1Value - 1.5 * iqr;
  const upperBound = q3Value + 1.5 * iqr;
  const nonOutliers = sortedData.filter(
    (value) => value >= lowerBound && value <= upperBound
  );
  const min = nonOutliers.length > 0 ? Math.min(...nonOutliers) : 0;
  const max = nonOutliers.length > 0 ? Math.max(...nonOutliers) : 0;
  return {
    q1: q1Value,
    median: median(sortedData),
    q3: q3Value,
    min: min,
    max: max,
    outliers: [],
  };
};

const formatDataForChart = (apiResponse: any) => {
  // Handle new API response structure with data array containing name and value
  if (apiResponse.data && Array.isArray(apiResponse.data)) {
    return apiResponse.data.map((item: any) => {
      const grades: number[] = Array.isArray(item.value)
        ? (item.value.filter((v: any) => typeof v === "number") as number[])
        : [];
      return {
        course_name: item.name,
        ...calculateBoxplotStats(grades),
      };
    });
  }

  // Fallback for old structure
  const gradesByCourse = apiResponse.reduce((acc: any, item: any) => {
    if (!acc[item.courseId]) acc[item.courseId] = [];
    acc[item.courseId].push(item.grade);
    return acc;
  }, {} as Record<string, number[]>);

  return Object.entries(gradesByCourse).map(([courseId, grades]) => ({
    course_name: courseId,
    ...calculateBoxplotStats(grades as number[]),
  }));
};

const BoxplotBar = (props: any) => {
  const { x, y, width, payload } = props;
  const chartHeight = 400;
  const scaleY = (value: number) => chartHeight - (value / 100) * chartHeight;

  // Ambil data dari payload
  const { q1, q3, median, min, max } = payload;
  return (
    <g>
      <rect
        x={x}
        y={scaleY(q3)}
        width={width}
        height={scaleY(q1) - scaleY(q3)}
        fill="#3d85c6"
        stroke="#000"
      />
      <line
        x1={x}
        y1={scaleY(median)}
        x2={x + width}
        y2={scaleY(median)}
        stroke="#f5e9dc"
        strokeWidth={2}
      />
      <line
        x1={x + width / 2}
        y1={scaleY(q3)}
        x2={x + width / 2}
        y2={scaleY(max)}
        stroke="#6b7280"
        strokeWidth={1}
      />
      <line
        x1={x + width * 0.25}
        y1={scaleY(max)}
        x2={x + width * 0.75}
        y2={scaleY(max)}
        stroke="#6b7280"
        strokeWidth={1}
      />
      <line
        x1={x + width / 2}
        y1={scaleY(q1)}
        x2={x + width / 2}
        y2={scaleY(min)}
        stroke="#6b7280"
        strokeWidth={1}
      />
      <line
        x1={x + width * 0.25}
        y1={scaleY(min)}
        x2={x + width * 0.75}
        y2={scaleY(min)}
        stroke="#6b7280"
        strokeWidth={1}
      />
    </g>
  );
};

export default function FinalGradesPage() {
  const [rawData, setRawData] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    kampus: "TEL-U BANDUNG",
    kampusId: "bdg",
    fakultas: "",
    fakultasId: "",
    prodi: "",
    prodiId: "",
  });
  const [selectedKampus, setSelectedKampus] = useState("TEL-U BANDUNG");
  const [selectedFakultasId, setSelectedFakultasId] = useState("");
  const [selectedFakultas, setSelectedFakultas] = useState("");
  const [selectedProdiId, setSelectedProdiId] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kampuses, setKampuses] = useState<KampusItem[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const { user, isUserLoading } = useUser();

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const isStudent = user.username && user.username.length > 0 && !user.admin;
    return user.admin === 1 || isStudent;
  }, [user]);

  const kampusesStatic: KampusItem[] = [
    { id: "bdg", name: "TEL-U BANDUNG" },
    { id: "sby", name: "TEL-U SURABAYA" },
    { id: "jkt", name: "TEL-U JAKARTA" },
    { id: "pwt", name: "TEL-U PURWOKERTO" },
  ];

  const getKampusCode = (kampus: string) => {
    switch (kampus) {
      case "TEL-U BANDUNG":
        return "bdg";
      case "TEL-U SURABAYA":
        return "sby";
      case "TEL-U JAKARTA":
        return "jkt";
      case "TEL-U PURWOKERTO":
        return "pwt";
      default:
        return "bdg";
    }
  };

  useEffect(() => {
    console.log("Initial appliedFilters:", appliedFilters);
    const savedFilters = localStorage.getItem("final-grade-filters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        console.log("Loaded filters from localStorage:", parsed);
        const newFilters = {
          kampus:
            parsed.kampus && typeof parsed.kampus === "string"
              ? parsed.kampus
              : "TEL-U BANDUNG",
          kampusId:
            parsed.kampusId && typeof parsed.kampusId === "string"
              ? parsed.kampusId
              : "bdg",
          fakultas:
            parsed.fakultas && typeof parsed.fakultas === "string"
              ? parsed.fakultas
              : "",
          fakultasId:
            parsed.fakultasId && typeof parsed.fakultasId === "string"
              ? parsed.fakultasId
              : "",
          prodi:
            parsed.prodi && typeof parsed.prodi === "string"
              ? parsed.prodi
              : "",
          prodiId:
            parsed.prodiId && typeof parsed.prodiId === "string"
              ? parsed.prodiId
              : "",
        };
        setAppliedFilters(newFilters);
        setSelectedKampus(newFilters.kampus);
        setSelectedFakultas(newFilters.fakultas);
        setSelectedFakultasId(newFilters.fakultasId);
        setSelectedProdi(newFilters.prodi);
        setSelectedProdiId(newFilters.prodiId);
        if (newFilters.prodiId) setCurrentLevel(3);
        else if (newFilters.fakultasId) setCurrentLevel(2);
        else setCurrentLevel(1);
      } catch (error) {
        console.error("Error loading filters from localStorage:", error);
        const defaultFilters = {
          kampus: "TEL-U BANDUNG",
          kampusId: "bdg",
          fakultas: "",
          fakultasId: "",
          prodi: "",
          prodiId: "",
        };
        setAppliedFilters(defaultFilters);
        setSelectedKampus(defaultFilters.kampus);
        setSelectedFakultas("");
        setSelectedFakultasId("");
        setSelectedProdi("");
        setSelectedProdiId("");
        setCurrentLevel(1);
      }
    }
  }, []);

  useEffect(() => {
    // Set static kampus data instead of fetching from API
    setKampuses(kampusesStatic);
  }, []);

  const handleKampusChange = (value: string) => {
    const kampus =
      (Array.isArray(kampuses)
        ? kampuses.find((k) => k.id === value)
        : undefined) || kampusesStatic.find((k) => k.id === value);
    console.log("Selected kampus:", { value, kampus });
    if (!kampus) {
      console.error("Kampus not found for id:", value);
      setError("Kampus tidak ditemukan. Silakan coba lagi.");
      return;
    }
    setSelectedKampus(kampus.name);
    setSelectedFakultas("");
    setSelectedFakultasId("");
    setSelectedProdi("");
    setSelectedProdiId("");
    setCurrentLevel(1);

    const newFilters = {
      kampus: kampus.name,
      kampusId: value,
      fakultas: "",
      fakultasId: "",
      prodi: "",
      prodiId: "",
    };
    console.log("New filters:", newFilters);
    setAppliedFilters(newFilters);
    localStorage.setItem("final-grade-filters", JSON.stringify(newFilters));
    setHasApplied(true);
  };

  const handleFakultasChange = (value: string, displayName?: string) => {
    setSelectedFakultasId(value);
    setSelectedFakultas(displayName || value);
    setSelectedProdi("");
    setSelectedProdiId("");
    setCurrentLevel(2);

    const newFilters = {
      kampus: selectedKampus,
      kampusId: getKampusCode(selectedKampus),
      fakultas: displayName || value,
      fakultasId: value,
      prodi: "",
      prodiId: "",
    };
    console.log("New filters:", newFilters);
    setAppliedFilters(newFilters);
    localStorage.setItem("final-grade-filters", JSON.stringify(newFilters));
    setHasApplied(true);
  };

  const handleProdiChange = (value: string, displayName?: string) => {
    setSelectedProdiId(value);
    setSelectedProdi(displayName || value);
    setCurrentLevel(3);

    const newFilters = {
      kampus: selectedKampus,
      kampusId: getKampusCode(selectedKampus),
      fakultas: selectedFakultas,
      fakultasId: selectedFakultasId,
      prodi: displayName || value,
      prodiId: value,
    };
    console.log("New filters:", newFilters);
    setAppliedFilters(newFilters);
    localStorage.setItem("final-grade-filters", JSON.stringify(newFilters));
    setHasApplied(true);
  };

  const handleAddNextLevel = () => {
    if (currentLevel < 3) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handleRemoveLevel = (levelToRemove: number) => {
    const newFilters = { ...appliedFilters };
    if (levelToRemove === 2) {
      setSelectedFakultas("");
      setSelectedFakultasId("");
      setSelectedProdi("");
      setSelectedProdiId("");
      newFilters.fakultas = "";
      newFilters.fakultasId = "";
      newFilters.prodi = "";
      newFilters.prodiId = "";
      setCurrentLevel(1);
    } else if (levelToRemove === 3) {
      setSelectedProdi("");
      setSelectedProdiId("");
      newFilters.prodi = "";
      newFilters.prodiId = "";
      setCurrentLevel(2);
    }
    console.log("New filters after remove:", newFilters);
    setAppliedFilters(newFilters);
    localStorage.setItem("final-grade-filters", JSON.stringify(newFilters));
    setHasApplied(true);
  };

  const clearAllFilters = () => {
    const newFilters = {
      kampus: "TEL-U BANDUNG",
      kampusId: "bdg",
      fakultas: "",
      fakultasId: "",
      prodi: "",
      prodiId: "",
    };
    console.log("Clearing all filters:", newFilters);
    setSelectedKampus("TEL-U BANDUNG");
    setSelectedFakultas("");
    setSelectedFakultasId("");
    setSelectedProdi("");
    setSelectedProdiId("");
    setAppliedFilters(newFilters);
    setCurrentLevel(1);
    localStorage.setItem("final-grade-filters", JSON.stringify(newFilters));
    setHasApplied(false);
  };

  const hasAdditionalFiltersApplied = () => {
    return appliedFilters.fakultas || appliedFilters.prodi;
  };

  const hasMinimumFilterApplied = () => {
    return appliedFilters.kampusId && appliedFilters.kampusId !== "";
  };

  useEffect(() => {
    const fetchFinalGrades = async () => {
      // Hanya fetch jika minimal kampusId ada
      if (appliedFilters.kampusId) {
        setIsLoading(true);
        setError(null);
        try {
          // Buat parameter berdasarkan level filter
          const params: any = {
            kampusId: appliedFilters.kampusId,
          };

          // Tambahkan facultyId jika ada
          if (appliedFilters.fakultasId) {
            params.facultyId = appliedFilters.fakultasId;
          }

          // Tambahkan prodiId jika ada
          if (appliedFilters.prodiId) {
            params.prodiId = appliedFilters.prodiId;
          }

          console.log("Fetching final grades with params:", params);
          const response = await getFinalGradesData(params);
          console.log("Final grades response:", response);
          if (response.status) {
            console.log("Setting rawData:", response);
            setRawData(response);
          } else {
            console.error("Final grades request failed:", response);
            setRawData(null);
          }
        } catch (err: any) {
          console.error("Failed to fetch final grades:", err.message);
          setError(`Gagal mengambil data nilai akhir: ${err.message}`);
          setRawData(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("No kampusId provided, setting rawData to null");
        setRawData(null);
      }
    };

    if (!isUserLoading && isAuthorized && hasMinimumFilterApplied()) {
      fetchFinalGrades();
    }
  }, [
    appliedFilters.kampusId,
    appliedFilters.fakultasId,
    appliedFilters.prodiId,
    isUserLoading,
    isAuthorized,
    hasApplied,
  ]);

  const chartData = useMemo(
    () => (rawData ? formatDataForChart(rawData) : []),
    [rawData]
  );

  if (isUserLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Memverifikasi hak akses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
            <CardDescription>
              Anda tidak memiliki izin untuk melihat halaman ini.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nilai Akhir</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-red-600" />
                Data Filters
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {hasAdditionalFiltersApplied() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <GraduationCap
                  className="h-5 w-5 text-red-600"
                  strokeWidth={2}
                />
                <Select
                  value={appliedFilters.kampusId}
                  onValueChange={handleKampusChange}
                >
                  <SelectTrigger className="w-auto min-w-[120px] border-gray-300 shadow-sm text-sm font-medium text-gray-700 focus:ring-red-500 focus:border-red-500">
                    <SelectValue placeholder="Pilih Kampus" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(kampuses) && kampuses.length > 0
                      ? kampuses.map((kampus) => (
                          <SelectItem key={kampus.id} value={kampus.id}>
                            {kampus.name}
                          </SelectItem>
                        ))
                      : kampusesStatic.map((kampus) => (
                          <SelectItem key={kampus.id} value={kampus.id}>
                            {kampus.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedKampus && currentLevel === 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddNextLevel}
                  className="h-auto w-auto px-3 py-2 ml-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Fakultas
                </Button>
              )}
            </div>

            {currentLevel >= 2 && (
              <div className="flex items-center gap-1">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-red-600" strokeWidth={2} />
                  <FilterDropdown
                    type="fakultas"
                    value={selectedFakultasId}
                    onValueChange={handleFakultasChange}
                    placeholder="Pilih Fakultas"
                    kampus={getKampusCode(selectedKampus)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLevel(2)}
                  className="h-8 w-8 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>
                {selectedFakultasId && currentLevel === 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddNextLevel}
                    className="h-auto w-auto px-3 py-2 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Prodi
                  </Button>
                )}
              </div>
            )}

            {currentLevel >= 3 && selectedFakultasId && (
              <div className="flex items-center gap-1">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-red-600" strokeWidth={2} />
                  <FilterDropdown
                    type="prodi"
                    value={selectedProdiId}
                    onValueChange={handleProdiChange}
                    placeholder="Pilih Prodi"
                    fakultasId={selectedFakultasId}
                    kampus={getKampusCode(selectedKampus)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLevel(3)}
                  className="h-8 w-8 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 rounded-lg p-3 text-sm mt-4 text-red-600">
              {error}
            </div>
          )}
        </div>

        {!hasMinimumFilterApplied() ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Card className="mb-8 w-full max-w-xl">
              <CardContent className="py-10 text-center">
                <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Filter diperlukan
                </h3>
                <p className="text-sm text-gray-600">
                  Silakan pilih minimal{" "}
                  <span className="font-semibold">Kampus</span> untuk memuat
                  data.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Student's Final Grades</CardTitle>
              <CardDescription>
                Final grade distribution for {appliedFilters.kampus}
                {appliedFilters.fakultas && ` > ${appliedFilters.fakultas}`}
                {appliedFilters.prodi && ` > ${appliedFilters.prodi}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64 text-red-500">
                  <p>{error}</p>
                </div>
              ) : chartData.length > 0 ? (
                <ChartContainer config={{}} className="min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={chartData}
                      // margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="course_name"
                        tickFormatter={(name) => name.split(" ")[0]}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="median"
                        shape={BoxplotBar}
                        fill="transparent"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">
                    Tidak ada data yang tersedia untuk pilihan ini.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
