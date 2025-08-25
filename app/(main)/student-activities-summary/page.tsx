'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Plus, X, Filter, GraduationCap, Building2, BookOpen, Book, ChevronRight, Clock } from "lucide-react";
import { ChartSection, StatsCards, SummaryTable, DistributionPie } from "@/components/student-activities-summary";
import ClientDate from "@/components/ClientDate";
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

interface ETLStatus {
  status: {
    status: string;
    lastRun: {
      id: number;
      start_date: string;
      end_date: string;
      status: string;
      offset: number;
    };
    nextRun: string;
    isRunning: boolean;
    shouldRun: boolean;
  };
}

export default function StudentActivitesSummaryPage() {
  const [selectedUniversity, setSelectedUniversity] = useState("Semua Kampus");
  const [selectedFakultas, setSelectedFakultas] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedMataKuliah, setSelectedMataKuliah] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1); // 1=kampus, 2=fakultas, 3=prodi, 4=mata kuliah
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    university: "",
    universityCode: "",
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
  const [hasApplied, setHasApplied] = useState(false);
  const canFetch = hasApplied;

  // ETL status state
  const [etlStatus, setEtlStatus] = useState<ETLStatus | null>(null);

  // Fetch ETL Status
  const fetchETLStatus = async () => {
    try {
      const data = await getETLSASStatus()
      setEtlStatus(data)
    } catch (error) {
      console.error('Error fetching ETL status:', error)
    }
  }

  // Load ETL status on component mount
  useEffect(() => {
    fetchETLStatus()
  }, [])

  // Load filters from localStorage on component mount (do not auto-apply)
  // IMPORTANT: This only loads UI state, does NOT trigger any API calls
  useEffect(() => {
    const savedFilters = localStorage.getItem('analytics-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
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
        
        // NOTE: hasApplied remains false, so no API calls will be made
        // User must click Apply button to trigger data fetching
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
      }
    }
  }, []);

  const universities = [
    "Semua Kampus",
    "TEL-U BANDUNG",
    "TEL-U SURABAYA",
    "TEL-U JAKARTA",
    "TEL-U PURWOKERTO"
  ];

  // Get kampus code for API
  const getKampusCode = (university: string) => {
    switch (university) {
      case "Semua Kampus": return "";
      case "TEL-U BANDUNG": return "bdg";
      case "TEL-U SURABAYA": return "sby";
      case "TEL-U JAKARTA": return "jkt";
      case "TEL-U PURWOKERTO": return "pwt";
      default: return "";
    }
  };

  const handleAddNextLevel = () => {
    if (currentLevel < 4) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handleRemoveLevel = (levelToRemove: number) => {
    if (levelToRemove === 2) {
      // Remove fakultas and all below
      setSelectedFakultas("");
      setSelectedFakultasId("");
      setSelectedProdi("");
      setSelectedProdiId("");
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(1);
    } else if (levelToRemove === 3) {
      // Remove prodi and all below
      setSelectedProdi("");
      setSelectedProdiId("");
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(2);
    } else if (levelToRemove === 4) {
      // Remove mata kuliah
      setSelectedMataKuliah("");
      setSelectedMataKuliahId("");
      setCurrentLevel(3);
    }
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
  };

  const handleProdiChange = (value: string, displayName?: string) => {
    setSelectedProdiId(value);
    setSelectedProdi(displayName || value);
    // Reset lower levels when prodi changes
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(3);
  };

  const handleMataKuliahChange = (value: string, displayName?: string) => {
    setSelectedMataKuliahId(value);
    setSelectedMataKuliah(displayName || value);
    setCurrentLevel(4);
  };

  const handleRefresh = () => {
    console.log("Refresh button clicked");
    // Refresh ETL status and data
    fetchETLStatus();
  };

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
    setHasApplied(true);
  };

  // Check if there are any additional filters beyond university
  const hasAdditionalFiltersApplied = () => {
    return appliedFilters.fakultas || appliedFilters.prodi || appliedFilters.mataKuliah;
  };

  const clearAllFilters = () => {
    setSelectedUniversity("Semua Kampus");
    setSelectedFakultas("");
    setSelectedFakultasId("");
    setSelectedProdi("");
    setSelectedProdiId("");
    setSelectedMataKuliah("");
    setSelectedMataKuliahId("");
    setCurrentLevel(1);

    // When clearing all filters, reset to empty state
    const clearedFilters = {
      university: "",
      universityCode: "",
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
    setHasApplied(false);
  };

  // Generate chart subtitle based on applied filters
  const getChartSubtitle = () => {
    const parts = [];
    if (appliedFilters.university && appliedFilters.university !== "Semua Kampus" && appliedFilters.university !== "") parts.push(appliedFilters.university);
    if (appliedFilters.fakultas) parts.push(appliedFilters.fakultas);
    if (appliedFilters.prodi) parts.push(appliedFilters.prodi);
    if (appliedFilters.mataKuliah) parts.push(appliedFilters.mataKuliah);
    
    return parts.length > 0 ? parts.join(' > ') : '';
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

            <Button
                variant="default"
                size="sm"
                onClick={handleApplyFilter}
              >
                Apply
              </Button>
            </div>
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
          {etlStatus && etlStatus.status && etlStatus.status.lastRun && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm mt-4">
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
              </div>
            </div>
          )}
        </div>

        {!canFetch ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Card className="mb-8 w-full max-w-xl">
              <CardContent className="py-10 text-center">
                <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Filter diperlukan</h3>
                <p className="text-sm text-gray-600">Silakan pilih filter yang diinginkan lalu klik <span className="font-semibold">Apply</span> untuk memuat data.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Chart Section (API-driven) */}
            <div className="mb-8">
              <ChartSection
                title={appliedFilters.university === "Semua Kampus" ? "Semua Kampus TEL-U" : appliedFilters.university || "Semua Kampus TEL-U"}
                subtitle={getChartSubtitle()}
                params={{
                  ...(appliedFilters.universityCode && { university: appliedFilters.universityCode }),
                  ...(appliedFilters.fakultasId && { fakultas_id: appliedFilters.fakultasId }),
                  ...(appliedFilters.prodiId && { prodi_id: appliedFilters.prodiId }),
                  ...(appliedFilters.mataKuliahId && { subject_ids: appliedFilters.mataKuliahId }),
                  group_by: appliedFilters.mataKuliahId
                    ? 'subject'
                    : appliedFilters.prodiId
                    ? 'subject'
                    : appliedFilters.fakultasId
                    ? 'prodi'
                    : appliedFilters.universityCode
                    ? 'fakultas'
                    : 'kampus',
                }}
                className="shadow-lg"
              />
            </div>

            {/* Stats Overview Section */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              {/* Left Side - Stats Cards (API-driven) */}
              <div className="lg:w-1/2">
                <StatsCards params={{
                  ...(appliedFilters.universityCode && { university: appliedFilters.universityCode }),
                  ...(appliedFilters.fakultasId && { fakultas_id: appliedFilters.fakultasId }),
                  ...(appliedFilters.prodiId && { prodi_id: appliedFilters.prodiId }),
                  ...(appliedFilters.mataKuliahId && { subject_ids: appliedFilters.mataKuliahId }),
                }} />
              </div>

              {/* Right Side - Activity Distribution Pie Chart (API-driven) */}
              <div className="lg:w-1/2">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Activity Distribution</h3>
                    <p className="text-sm text-gray-600">Breakdown by activity type</p>
                  </div>
                  <DistributionPie params={{
                    ...(appliedFilters.universityCode && { university: appliedFilters.universityCode }),
                    ...(appliedFilters.fakultasId && { fakultas_id: appliedFilters.fakultasId }),
                    ...(appliedFilters.prodiId && { prodi_id: appliedFilters.prodiId }),
                    ...(appliedFilters.mataKuliahId && { subject_ids: appliedFilters.mataKuliahId }),
                  }} />
                </div>
              </div>
            </div>

            {/* Course Data Table (API-driven) */}
            <Card>
              <CardContent className="p-0">
                <SummaryTable params={{
                  ...(appliedFilters.universityCode && { university: appliedFilters.universityCode }),
                  ...(appliedFilters.fakultasId && { fakultas_id: appliedFilters.fakultasId }),
                  ...(appliedFilters.prodiId && { prodi_id: appliedFilters.prodiId }),
                  ...(appliedFilters.mataKuliahId && { subject_ids: appliedFilters.mataKuliahId }),
                }} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}