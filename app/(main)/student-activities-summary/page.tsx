'use client'

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { RefreshCw, Plus, X, Filter, GraduationCap, Building2, BookOpen, Book, ChevronDown, ChevronRight, BarChart3, TrendingUp, Sparkles, Users, School, Search, FileText, Video, MessageSquare, HelpCircle, Globe, Calculator, Clock } from "lucide-react";
import { ActivityChart, generateSampleData } from "@/components/activity-chart";
import ClientDate from "@/components/ClientDate";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FilterDropdown } from "@/components/filter-dropdown";
import { getETLSASStatus } from "@/lib/api/activity";

interface AppliedFilters {
  university: string;
  universityCode: string;
  fakultas: string;
  fakultasId: string;
  fakultasName: string;
  prodi: string;
  prodiId: string;
  prodiName: string;
  mataKuliah: string;
  mataKuliahId: string;
  mataKuliahName: string;
}

interface CourseData {
  id: number;
  site: string;
  fakultas: string;
  program_studi: string;
  id_course: number;
  id_number: string;
  num_teacher: number;
  num_student: number;
  subject_code: string;
  subject_name: string;
  class: string;
  file: number;
  video: number;
  forum: number;
  quiz: number;
  assignment: number;
  url: number;
  sum: number;
  avg_activity_per_student_per_day: number;
}

interface ETLStatus {
  status: boolean;
  data: {
    status: string;
    lastRun: {
      id: string;
      start_date: string;
      end_date: string;
      status: string;
      total_records: string;
      offset: string;
    };
    nextRun: string;
    isRunning: boolean;
  };
}

export default function StudentActivitesSummaryPage() {
  const [selectedUniversity, setSelectedUniversity] = useState("TEL-U BANDUNG");
  const [selectedFakultas, setSelectedFakultas] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedMataKuliah, setSelectedMataKuliah] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1); // 1=kampus, 2=fakultas, 3=prodi, 4=mata kuliah
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    university: "TEL-U BANDUNG",
    universityCode: "bdg",
    fakultas: "",
    fakultasId: "",
    fakultasName: "",
    prodi: "",
    prodiId: "",
    prodiName: "",
    mataKuliah: "",
    mataKuliahId: "",
    mataKuliahName: ""
  });
  
  // API-based filter state
  const [selectedFakultasId, setSelectedFakultasId] = useState("");
  const [selectedProdiId, setSelectedProdiId] = useState("");
  const [selectedMataKuliahId, setSelectedMataKuliahId] = useState("");

  // Table state
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("subject_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ETL status state
  const [etlStatus, setEtlStatus] = useState<ETLStatus | null>(null);
  const [etlLoading, setEtlLoading] = useState(false);

  // Fetch ETL Status
  const fetchETLStatus = async () => {
    try {
      setEtlLoading(true)
      const data = await getETLSASStatus()
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

  // Load filters from localStorage on component mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('analytics-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setAppliedFilters(parsed);
        setSelectedUniversity(parsed.university);
        setSelectedFakultas(parsed.fakultasName || parsed.fakultas);
        setSelectedFakultasId(parsed.fakultasId || parsed.fakultas);
        setSelectedProdi(parsed.prodiName || parsed.prodi);
        setSelectedProdiId(parsed.prodiId || parsed.prodi);
        setSelectedMataKuliah(parsed.mataKuliahName || parsed.mataKuliah);
        setSelectedMataKuliahId(parsed.mataKuliahId || parsed.mataKuliah);

        // Set current level based on applied filters
        if (parsed.mataKuliah) setCurrentLevel(4);
        else if (parsed.prodi) setCurrentLevel(3);
        else if (parsed.fakultas) setCurrentLevel(2);
        else setCurrentLevel(1);
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
      }
    }
  }, []);

  const universities = [
    "TEL-U BANDUNG",
    "TEL-U SURABAYA",
    "TEL-U JAKARTA",
    "TEL-U PURWOKERTO"
  ];

  // Get kampus code for API
  const getKampusCode = (university: string) => {
    switch (university) {
      case "TEL-U BANDUNG": return "bdg";
      case "TEL-U SURABAYA": return "sby";
      case "TEL-U JAKARTA": return "jkt";
      case "TEL-U PURWOKERTO": return "pwt";
      default: return "bdg";
    }
  };

  const handleAddNextLevel = () => {
    if (currentLevel < 4) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handleRemoveLevel = (levelToRemove: number) => {
    let newFilters = { ...appliedFilters };

    if (levelToRemove === 2) {
      // Remove fakultas and all below
      setSelectedFakultas("");
      setSelectedFakultasId("");
      setSelectedProdi("");
      setSelectedProdiId("");
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(1);
      
      // Auto-apply kampus filter when removing fakultas
      newFilters = {
        university: selectedUniversity,
        universityCode: getKampusCode(selectedUniversity),
        fakultas: "",
        fakultasId: "",
        fakultasName: "",
        prodi: "",
        prodiId: "",
        prodiName: "",
        mataKuliah: "",
        mataKuliahId: "",
        mataKuliahName: ""
      };
    } else if (levelToRemove === 3) {
      // Remove prodi and all below
      setSelectedProdi("");
      setSelectedProdiId("");
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(2);

      // Auto-apply current filters up to fakultas level
      newFilters = {
        university: selectedUniversity,
        universityCode: getKampusCode(selectedUniversity),
        fakultas: selectedFakultas,
        fakultasId: selectedFakultasId,
        fakultasName: selectedFakultas,
        prodi: "",
        prodiId: "",
        prodiName: "",
        mataKuliah: "",
        mataKuliahId: "",
        mataKuliahName: ""
      };
    } else if (levelToRemove === 4) {
      // Remove mata kuliah
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(3);

      // Auto-apply current filters up to prodi level
      newFilters = {
        university: selectedUniversity,
        universityCode: getKampusCode(selectedUniversity),
        fakultas: selectedFakultas,
        fakultasId: selectedFakultasId,
        fakultasName: selectedFakultas,
        prodi: selectedProdi,
        prodiId: selectedProdiId,
        prodiName: selectedProdi,
        mataKuliah: "",
        mataKuliahId: "",
        mataKuliahName: ""
      };
    }

    // Apply the filters automatically
    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
  };

  const handleUniversityChange = (value: string) => {
    setSelectedUniversity(value);
    // Reset lower levels when university changes
    setSelectedFakultas("");
    setSelectedFakultasId("");
    setSelectedProdi("");
    setSelectedProdiId("");
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(1);

    // Auto-apply the university filter
    const newFilters = {
      university: value,
      universityCode: getKampusCode(value),
      fakultas: "",
      fakultasId: "",
      fakultasName: "",
      prodi: "",
      prodiId: "",
      prodiName: "",
      mataKuliah: "",
      mataKuliahId: "",
      mataKuliahName: ""
    };

    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
  };

  const handleFakultasChange = (value: string, displayName?: string) => {
    setSelectedFakultasId(value);
    setSelectedFakultas(displayName || value);
    // Reset lower levels when fakultas changes
    setSelectedProdi("");
    setSelectedProdiId("");
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(2);

    // Auto-apply the filters up to fakultas level
    const newFilters = {
      university: selectedUniversity,
      universityCode: getKampusCode(selectedUniversity),
      fakultas: displayName || value,
      fakultasId: value,
      fakultasName: displayName || value,
      prodi: "",
      prodiId: "",
      prodiName: "",
      mataKuliah: "",
      mataKuliahId: "",
      mataKuliahName: ""
    };

    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
  };

  const handleProdiChange = (value: string, displayName?: string) => {
    setSelectedProdiId(value);
    setSelectedProdi(displayName || value);
    // Reset lower levels when prodi changes
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(3);

    // Auto-apply the filters up to prodi level
    const newFilters = {
      university: selectedUniversity,
      universityCode: getKampusCode(selectedUniversity),
      fakultas: selectedFakultas,
      fakultasId: selectedFakultasId,
      fakultasName: selectedFakultas,
      prodi: displayName || value,
      prodiId: value,
      prodiName: displayName || value,
      mataKuliah: "",
      mataKuliahId: "",
      mataKuliahName: ""
    };

    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
  };

  const handleMataKuliahChange = (value: string, displayName?: string) => {
    setSelectedMataKuliahId(value);
    setSelectedMataKuliah(displayName || value);
    setCurrentLevel(4);

    // Auto-apply all filters including mata kuliah
    const newFilters = {
      university: selectedUniversity,
      universityCode: getKampusCode(selectedUniversity),
      fakultas: selectedFakultas,
      fakultasId: selectedFakultasId,
      fakultasName: selectedFakultas,
      prodi: selectedProdi,
      prodiId: selectedProdiId,
      prodiName: selectedProdi,
      mataKuliah: displayName || value,
      mataKuliahId: value,
      mataKuliahName: displayName || value
    };

    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
  };

  const handleRefresh = () => {
    console.log("Refresh button clicked");
    // Refresh ETL status and data
    fetchETLStatus();
    
    // Regenerate course data
    const data = generateCourseData();
    setCourseData(data);
    setCurrentPage(1);
  };

  // Since filters are now auto-applied, we don't need manual apply
  // But we keep this for backwards compatibility if needed
  const handleApplyFilter = () => {
    const newFilters = {
      university: selectedUniversity,
      universityCode: getKampusCode(selectedUniversity),
      fakultas: selectedFakultas,
      fakultasId: selectedFakultasId,
      fakultasName: selectedFakultas,
      prodi: selectedProdi,
      prodiId: selectedProdiId,
      prodiName: selectedProdi,
      mataKuliah: selectedMataKuliah,
      mataKuliahId: selectedMataKuliahId,
      mataKuliahName: selectedMataKuliah
    };

    setAppliedFilters(newFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
    console.log("Filters applied:", newFilters);
  };

  // Check if there are any additional filters beyond university
  const hasAdditionalFiltersApplied = () => {
    return appliedFilters.fakultas || appliedFilters.prodi || appliedFilters.mataKuliah;
  };

  const hasAdditionalFilters = () => {
    return selectedFakultas || selectedProdi || selectedMataKuliah;
  };

  const clearAllFilters = () => {
    setSelectedUniversity("TEL-U BANDUNG");
    setSelectedFakultas("");
    setSelectedFakultasId("");
    setSelectedProdi("");
    setSelectedProdiId("");
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(1);

    // When clearing all filters, automatically apply the default kampus filter
    const clearedFilters = {
      university: "TEL-U BANDUNG",
      universityCode: "bdg",
      fakultas: "",
      fakultasId: "",
      fakultasName: "",
      prodi: "",
      prodiId: "",
      prodiName: "",
      mataKuliah: "",
      mataKuliahId: "",
      mataKuliahName: ""
    };

    setAppliedFilters(clearedFilters);
    localStorage.setItem('analytics-filters', JSON.stringify(clearedFilters));
  };

  // Generate chart subtitle based on applied filters
  const getChartSubtitle = () => {
    const parts = [];
    if (appliedFilters.university) parts.push(appliedFilters.university);
    if (appliedFilters.fakultas) parts.push(appliedFilters.fakultas);
    if (appliedFilters.prodi) parts.push(appliedFilters.prodi);
    if (appliedFilters.mataKuliah) parts.push(appliedFilters.mataKuliah);
    
    return parts.length > 1 ? parts.slice(1).join(' > ') : '';
  };

  // Generate sample course data
  const generateCourseData = (): CourseData[] => {
    const sampleData: CourseData[] = [
      {
        id: 1,
        site: "TEL-U BANDUNG",
        fakultas: "Fakultas Informatika",
        program_studi: "Teknik Informatika",
        id_course: 12345,
        id_number: "TIF001",
        num_teacher: 3,
        num_student: 45,
        subject_code: "IF101",
        subject_name: "Algoritma Pemrograman",
        class: "TIF-A",
        file: 12,
        video: 8,
        forum: 5,
        quiz: 4,
        assignment: 6,
        url: 3,
        sum: 38,
        avg_activity_per_student_per_day: 2.1
      },
      {
        id: 2,
        site: "TEL-U BANDUNG",
        fakultas: "Fakultas Informatika",
        program_studi: "Sistem Informasi",
        id_course: 12346,
        id_number: "SI001",
        num_teacher: 2,
        num_student: 38,
        subject_code: "SI201",
        subject_name: "Basis Data",
        class: "SI-B",
        file: 15,
        video: 10,
        forum: 7,
        quiz: 6,
        assignment: 8,
        url: 4,
        sum: 50,
        avg_activity_per_student_per_day: 3.2
      },
      {
        id: 3,
        site: "TEL-U SURABAYA",
        fakultas: "Fakultas Teknik Industri",
        program_studi: "Teknik Industri",
        id_course: 12347,
        id_number: "TI001",
        num_teacher: 4,
        num_student: 52,
        subject_code: "TI301",
        subject_name: "Sistem Produksi",
        class: "TI-A",
        file: 8,
        video: 12,
        forum: 3,
        quiz: 5,
        assignment: 7,
        url: 2,
        sum: 37,
        avg_activity_per_student_per_day: 1.8
      },
      {
        id: 4,
        site: "TEL-U JAKARTA",
        fakultas: "Fakultas Komunikasi",
        program_studi: "Ilmu Komunikasi",
        id_course: 12348,
        id_number: "IK001",
        num_teacher: 2,
        num_student: 41,
        subject_code: "IK101",
        subject_name: "Teori Komunikasi",
        class: "IK-C",
        file: 10,
        video: 6,
        forum: 8,
        quiz: 3,
        assignment: 5,
        url: 6,
        sum: 38,
        avg_activity_per_student_per_day: 2.4
      },
      {
        id: 5,
        site: "TEL-U PURWOKERTO",
        fakultas: "Fakultas Engineering",
        program_studi: "Software Engineering",
        id_course: 12349,
        id_number: "SE001",
        num_teacher: 3,
        num_student: 35,
        subject_code: "SE201",
        subject_name: "Software Design",
        class: "SE-A",
        file: 14,
        video: 9,
        forum: 4,
        quiz: 7,
        assignment: 9,
        url: 3,
        sum: 46,
        avg_activity_per_student_per_day: 2.8
      }
    ];

    // Generate more data based on filters
    const baseData = [...sampleData];
    for (let i = 0; i < 15; i++) {
      const base = sampleData[i % sampleData.length];
      baseData.push({
        ...base,
        id: base.id + (i + 1) * 10,
        id_course: base.id_course + (i + 1) * 100,
        id_number: `${base.id_number}_${i + 1}`,
        class: `${base.class}-${String.fromCharCode(65 + (i % 4))}`,
        num_student: base.num_student + Math.floor(Math.random() * 20) - 10,
        file: Math.floor(Math.random() * 20) + 5,
        video: Math.floor(Math.random() * 15) + 3,
        forum: Math.floor(Math.random() * 10) + 2,
        quiz: Math.floor(Math.random() * 8) + 2,
        assignment: Math.floor(Math.random() * 12) + 3,
        url: Math.floor(Math.random() * 8) + 1,
        sum: 0,
        avg_activity_per_student_per_day: Math.random() * 3 + 1
      });
      // Calculate sum
      const lastItem = baseData[baseData.length - 1];
      lastItem.sum = lastItem.file + lastItem.video + lastItem.forum + lastItem.quiz + lastItem.assignment + lastItem.url;
    }

    return baseData;
  };

  // Load course data when filters change
  useEffect(() => {
    const data = generateCourseData();
    setCourseData(data);
    setCurrentPage(1); // Reset to first page when data changes
  }, [appliedFilters]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = courseData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.program_studi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fakultas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortBy as keyof CourseData];
      const bValue = b[sortBy as keyof CourseData];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [courseData, searchTerm, sortBy, sortOrder]);

  // Pagination calculations
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Search handlers
  const executeSearch = useCallback(() => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  }, [executeSearch]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SidebarTrigger className="-ml-1 block sm:hidden" />
              <Separator orientation="vertical" className="h-4 block sm:hidden" />
              <h1 className="text-lg font-semibold text-gray-900">Student Activities Summary</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-red-600" />
                Data Filters
              </h2>
              {/* <p className="text-sm text-gray-600 mt-1">
                Filter analytics data by university, faculty, program, and course
              </p> */}
            </div>
            {hasAdditionalFiltersApplied() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Kampus Dropdown */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-red-600" strokeWidth={2} />
                <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
                  <SelectTrigger className="w-auto min-w-[120px] border-gray-300 shadow-sm text-sm font-medium text-gray-700 focus:ring-red-500 focus:border-red-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university} value={university}>
                        {university}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Next Level Button - Kampus */}
              {selectedUniversity && currentLevel === 1 && (
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

            {/* Fakultas Dropdown */}
            {currentLevel >= 2 && (
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-red-600" strokeWidth={2} />
                  <FilterDropdown
                    type="fakultas"
                    value={selectedFakultasId}
                    onValueChange={handleFakultasChange}
                    placeholder="Pilih Fakultas"
                    kampus={getKampusCode(selectedUniversity)}
                  />
                </div>

                {/* Remove Level Button - Fakultas */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLevel(2)}
                  className="h-8 w-8 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Add Next Level Button - Fakultas */}
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

            {/* Prodi Dropdown */}
            {currentLevel >= 3 && (
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-red-600" strokeWidth={2} />
                  <FilterDropdown
                    type="prodi"
                    value={selectedProdiId}
                    onValueChange={handleProdiChange}
                    placeholder="Pilih Prodi"
                    fakultasId={selectedFakultasId}
                    kampus={getKampusCode(selectedUniversity)}
                  />
                </div>

                {/* Remove Level Button - Prodi */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLevel(3)}
                  className="h-8 w-8 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Add Next Level Button - Prodi */}
                {selectedProdiId && currentLevel === 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddNextLevel}
                    className="h-auto w-auto px-3 py-2 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Mata Kuliah
                  </Button>
                )}
              </div>
            )}

            {/* Mata Kuliah Dropdown */}
            {currentLevel >= 4 && (
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-red-600" strokeWidth={2} />
                  <FilterDropdown
                    type="matkul"
                    value={selectedMataKuliahId}
                    onValueChange={handleMataKuliahChange}
                    placeholder="Pilih Mata Kuliah"
                    prodiId={selectedProdiId}
                  />
                </div>

                {/* Remove Level Button - Mata Kuliah */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLevel(4)}
                  className="h-8 w-8 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* ETL Status */}
          {etlStatus && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Terakhir update: <ClientDate dateString={etlStatus.data.lastRun.end_date} />
                </span>
                {etlStatus.data.isRunning && (
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                    <span className="text-blue-600 text-xs">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="mb-8">
          <ActivityChart 
            data={generateSampleData()} 
            title={appliedFilters.university}
            subtitle={getChartSubtitle()}
            className="shadow-lg"
          />
        </div>

        {/* Stats Overview Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left Side - Stats Cards */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Activities</p>
                    <p className="text-3xl font-bold text-gray-900">2,547</p>
                  </div>
                  <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  <span className="text-green-600 font-medium">+12%</span> from last week
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">3.2</p>
                  </div>
                  <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  <span className="text-green-600 font-medium">+5%</span> improvement
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">1,234</p>
                  </div>
                  <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  <span className="text-green-600 font-medium">+8%</span> this month
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">87%</p>
                  </div>
                  <div className="h-16 w-16 bg-orange-100 rounded-lg flex items-center justify-center">
                    <School className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  <span className="text-green-600 font-medium">+3%</span> from target
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Activity Distribution Pie Chart */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Activity Distribution</h3>
                <p className="text-sm text-gray-600">Breakdown by activity type</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Quiz', value: 532, color: '#1e3a8a' },
                        { name: 'Assignment', value: 687, color: '#ea580c' },
                        { name: 'Video', value: 423, color: '#16a34a' },
                        { name: 'Forum', value: 345, color: '#0ea5e9' },
                        { name: 'URL', value: 560, color: '#9333ea' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Quiz', value: 532, color: '#1e3a8a' },
                        { name: 'Assignment', value: 687, color: '#ea580c' },
                        { name: 'Video', value: 423, color: '#16a34a' },
                        { name: 'Forum', value: 345, color: '#0ea5e9' },
                        { name: 'URL', value: 560, color: '#9333ea' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value, 'Activities']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontWeight: 'bold' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Course Data Table */}
        <Card>
          <CardHeader className="bg-teal-700 text-white">
            {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Course Analytics Data</h3>
                <p className="text-sm text-teal-100 mt-1">
                  Detailed analytics for all courses and activities
                </p>
              </div>
            </div> */}
            
            {/* Search Bar */}
            <div className="pt-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari mata kuliah, kode, program studi, atau kelas..."
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
            <div className="overflow-x-auto">
              <Table className="w-full table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center px-2 sm:px-4 w-16">No</TableHead>
                    <TableHead className="px-2 sm:px-4 min-w-[120px]">
                      <button
                        onClick={() => handleSort("site")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                      >
                        Site
                        {sortBy === "site" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 min-w-[140px]">
                      <button
                        onClick={() => handleSort("fakultas")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                      >
                        Fakultas
                        {sortBy === "fakultas" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 min-w-[140px]">
                      <button
                        onClick={() => handleSort("program_studi")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                      >
                        Program Studi
                        {sortBy === "program_studi" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    {/* <TableHead className="px-2 sm:px-4 min-w-[100px]">
                      <button
                        onClick={() => handleSort("id_course")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                      >
                        ID Course
                        {sortBy === "id_course" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 min-w-[100px]">ID Number</TableHead> */}
                    <TableHead className="px-2 sm:px-4 text-center min-w-[80px]">
                      <button
                        onClick={() => handleSort("num_teacher")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm mx-auto"
                      >
                        Teachers
                        {sortBy === "num_teacher" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[80px]">
                      <button
                        onClick={() => handleSort("num_student")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm mx-auto"
                      >
                        Students
                        {sortBy === "num_student" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    {/* <TableHead className="px-2 sm:px-4 min-w-[100px]">Subject Code</TableHead>
                    <TableHead className="px-2 sm:px-4 min-w-[140px]">
                      <button
                        onClick={() => handleSort("subject_name")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm"
                      >
                        Subject Name
                        {sortBy === "subject_name" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead> */}
                    {/* <TableHead className="px-2 sm:px-4 min-w-[80px]">Class</TableHead> */}
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <div title="File">
                        <FileText className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <div title="Video">
                        <Video className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <div title="Forum">
                        <MessageSquare className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <div title="Quiz">
                        <HelpCircle className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[80px]">
                      <div title="Assignment">
                        <BookOpen className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <div title="URL">
                        <Globe className="w-4 h-4 mx-auto" />
                      </div>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[60px]">
                      <button
                        onClick={() => handleSort("sum")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm mx-auto"
                      >
                        Sum
                        {sortBy === "sum" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="px-2 sm:px-4 text-center min-w-[100px]">
                      <button
                        onClick={() => handleSort("avg_activity_per_student_per_day")}
                        className="flex items-center gap-1 hover:text-gray-300 transition-colors text-xs sm:text-sm mx-auto"
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        AVG/Day
                        {sortBy === "avg_activity_per_student_per_day" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={18} className="text-center py-8">
                        <div className="text-gray-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-medium">Tidak ada data course</p>
                          <p className="text-sm">Tidak ada data yang sesuai dengan filter yang dipilih</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((course, index) => (
                      <TableRow key={course.id} className="hover:bg-gray-50">
                        <TableCell className="p-2 sm:p-4 text-center">
                          <div className="font-medium text-xs sm:text-sm text-gray-600">
                            {startIndex + index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <Badge variant="outline" className="text-xs">
                            {course.site}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {course.fakultas}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="text-xs sm:text-sm text-blue-600">
                            {course.program_studi}
                          </div>
                        </TableCell>
                        {/* <TableCell className="p-2 sm:p-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {course.id_course}
                          </code>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {course.id_number}
                          </code>
                        </TableCell> */}
                        <TableCell className="p-2 sm:p-4 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {course.num_teacher}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {course.num_student}
                          </Badge>
                        </TableCell>
                        {/* <TableCell className="p-2 sm:p-4">
                          <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {course.subject_code}
                          </code>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-[140px] truncate" title={course.subject_name}>
                            {course.subject_name}
                          </div>
                        </TableCell> */}
                        {/* <TableCell className="p-2 sm:p-4">
                          <Badge variant="outline" className="text-xs">
                            {course.class}
                          </Badge>
                        </TableCell> */}
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.file}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.video}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.forum}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.quiz}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.assignment}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium">{course.url}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <Badge 
                            variant={course.sum > 40 ? "default" : course.sum > 30 ? "secondary" : "destructive"} 
                            className="text-xs"
                          >
                            {course.sum}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-center">
                          <span className="text-xs sm:text-sm font-medium text-green-600">
                            {course.avg_activity_per_student_per_day.toFixed(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

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
                    Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} course
                  </span>
                  <span className="sm:hidden">
                    {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems}
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
      </main>
    </div>
  )
}