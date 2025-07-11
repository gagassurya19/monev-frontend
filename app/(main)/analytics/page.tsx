'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, X, Filter, GraduationCap, Building2, BookOpen, Book, ChevronDown, ChevronRight, BarChart3, TrendingUp, Sparkles, Users, School } from "lucide-react";

interface AppliedFilters {
    university: string;
    fakultas: string;
    prodi: string;
    mataKuliah: string;
}

export default function AnalyticsPage() {
    const [selectedUniversity, setSelectedUniversity] = useState("TEL-U BANDUNG");
    const [selectedFakultas, setSelectedFakultas] = useState("");
    const [selectedProdi, setSelectedProdi] = useState("");
    const [selectedMataKuliah, setSelectedMataKuliah] = useState("");
    const [currentLevel, setCurrentLevel] = useState(1); // 1=kampus, 2=fakultas, 3=prodi, 4=mata kuliah
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
        university: "TEL-U BANDUNG",
        fakultas: "",
        prodi: "",
        mataKuliah: ""
    });
    
    // Load filters from localStorage on component mount
    useEffect(() => {
        const savedFilters = localStorage.getItem('analytics-filters');
        if (savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                setAppliedFilters(parsed);
                setSelectedUniversity(parsed.university);
                setSelectedFakultas(parsed.fakultas);
                setSelectedProdi(parsed.prodi);
                setSelectedMataKuliah(parsed.mataKuliah);
                
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

    const fakultasData = {
        "TEL-U BANDUNG": ["Fakultas Teknik Elektro", "Fakultas Informatika", "Fakultas Ekonomi Bisnis"],
        "TEL-U SURABAYA": ["Fakultas Teknik Industri", "Fakultas Digital Business", "Fakultas Sains"],
        "TEL-U JAKARTA": ["Fakultas Komunikasi", "Fakultas Teknik", "Fakultas Bisnis"],
        "TEL-U PURWOKERTO": ["Fakultas Engineering", "Fakultas Digital Technology", "Fakultas Management"]
    };

    const prodiData = {
        "Fakultas Teknik Elektro": ["Teknik Elektro", "Teknik Telekomunikasi", "Teknik Fisika"],
        "Fakultas Informatika": ["Teknik Informatika", "Sistem Informasi", "Teknologi Informasi"],
        "Fakultas Ekonomi Bisnis": ["Manajemen", "Akuntansi", "Ekonomi Pembangunan"],
        "Fakultas Teknik Industri": ["Teknik Industri", "Teknik Logistik", "Teknik Sistem"],
        "Fakultas Digital Business": ["Digital Business", "E-Commerce", "Digital Marketing"],
        "Fakultas Sains": ["Matematika", "Fisika", "Kimia"],
        "Fakultas Komunikasi": ["Ilmu Komunikasi", "Broadcasting", "Public Relations"],
        "Fakultas Teknik": ["Teknik Sipil", "Teknik Mesin", "Teknik Komputer"],
        "Fakultas Bisnis": ["Bisnis Digital", "Kewirausahaan", "International Business"],
        "Fakultas Engineering": ["Software Engineering", "Computer Engineering", "Network Engineering"],
        "Fakultas Digital Technology": ["Data Science", "Artificial Intelligence", "Cybersecurity"],
        "Fakultas Management": ["Strategic Management", "Human Resource", "Operations Management"]
    };

    const mataKuliahData = {
        // Fakultas Teknik Elektro
        "Teknik Elektro": ["Rangkaian Listrik", "Elektronika Daya", "Sistem Kontrol", "Mesin Listrik"],
        "Teknik Telekomunikasi": ["Sinyal dan Sistem", "Komunikasi Digital", "Antena dan Propagasi", "Jaringan Telekomunikasi"],
        "Teknik Fisika": ["Fisika Modern", "Instrumentasi", "Material Engineering", "Nanoteknologi"],
        
        // Fakultas Informatika
        "Teknik Informatika": ["Algoritma Pemrograman", "Basis Data", "Jaringan Komputer", "Machine Learning"],
        "Sistem Informasi": ["Analisis Sistem", "Manajemen Proyek TI", "Enterprise Architecture", "Business Intelligence"],
        "Teknologi Informasi": ["Cloud Computing", "Internet of Things", "Mobile Development", "Cybersecurity"],
        
        // Fakultas Ekonomi Bisnis
        "Manajemen": ["Manajemen Strategis", "Manajemen Operasi", "Manajemen Keuangan", "Manajemen SDM"],
        "Akuntansi": ["Akuntansi Dasar", "Audit", "Perpajakan", "Akuntansi Manajemen"],
        "Ekonomi Pembangunan": ["Mikroekonomi", "Makroekonomi", "Ekonomi Pembangunan", "Ekonomi Regional"],
        
        // Fakultas Teknik Industri
        "Teknik Industri": ["Sistem Produksi", "Ergonomi", "Penelitian Operasi", "Manajemen Kualitas"],
        "Teknik Logistik": ["Supply Chain Management", "Transportasi", "Warehouse Management", "Distribution"],
        "Teknik Sistem": ["Analisis Sistem", "Optimasi Sistem", "Sistem Dinamik", "System Engineering"],
        
        // Fakultas Digital Business
        "Digital Business": ["E-Business Strategy", "Digital Marketing", "Digital Innovation", "Business Analytics"],
        "E-Commerce": ["Online Marketing", "Payment Systems", "Platform Management", "Customer Experience"],
        "Digital Marketing": ["Social Media Marketing", "SEO/SEM", "Content Marketing", "Marketing Analytics"],
        
        // Fakultas Sains
        "Matematika": ["Kalkulus", "Aljabar Linear", "Statistika", "Matematika Diskrit"],
        "Fisika": ["Mekanika", "Termodinamika", "Elektromagnetik", "Fisika Kuantum"],
        "Kimia": ["Kimia Organik", "Kimia Anorganik", "Kimia Fisik", "Kimia Analitik"],
        
        // Fakultas Komunikasi
        "Ilmu Komunikasi": ["Teori Komunikasi", "Komunikasi Massa", "Public Relations", "Jurnalistik"],
        "Broadcasting": ["Produksi TV", "Radio Broadcasting", "Media Digital", "Multimedia"],
        "Public Relations": ["Strategic PR", "Crisis Management", "Event Management", "Corporate Communication"],
        
        // Fakultas Teknik
        "Teknik Sipil": ["Struktur Bangunan", "Geoteknik", "Hidraulika", "Manajemen Konstruksi"],
        "Teknik Mesin": ["Termodinamika", "Mekanika Fluida", "Material Teknik", "Manufaktur"],
        "Teknik Komputer": ["Arsitektur Komputer", "Embedded Systems", "Digital Design", "Mikroprosesor"],
        
        // Fakultas Bisnis
        "Bisnis Digital": ["Digital Strategy", "E-Business", "Digital Transformation", "Innovation Management"],
        "Kewirausahaan": ["Business Plan", "Startup Management", "Venture Capital", "Innovation"],
        "International Business": ["Global Marketing", "International Trade", "Cross-Cultural Management", "Export-Import"],
        
        // Fakultas Engineering
        "Software Engineering": ["Software Design", "Testing", "Project Management", "Agile Development"],
        "Computer Engineering": ["Computer Architecture", "Embedded Systems", "VLSI Design", "Hardware Design"],
        "Network Engineering": ["Network Design", "Network Security", "Wireless Networks", "Network Management"],
        
        // Fakultas Digital Technology
        "Data Science": ["Statistics", "Machine Learning", "Big Data", "Data Visualization"],
        "Artificial Intelligence": ["Neural Networks", "Deep Learning", "NLP", "Computer Vision"],
        "Cybersecurity": ["Network Security", "Cryptography", "Ethical Hacking", "Security Management"],
        
        // Fakultas Management
        "Strategic Management": ["Corporate Strategy", "Business Planning", "Strategic Analysis", "Leadership"],
        "Human Resource": ["HR Planning", "Recruitment", "Performance Management", "Training & Development"],
        "Operations Management": ["Production Planning", "Quality Control", "Inventory Management", "Process Improvement"]
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
            setSelectedProdi("");
            setSelectedMataKuliah("");
            setCurrentLevel(1);
        } else if (levelToRemove === 3) {
            // Remove prodi and all below
            setSelectedProdi("");
            setSelectedMataKuliah("");
            setCurrentLevel(2);
        } else if (levelToRemove === 4) {
            // Remove mata kuliah
            setSelectedMataKuliah("");
            setCurrentLevel(3);
        }
    };

    const handleUniversityChange = (value: string) => {
        setSelectedUniversity(value);
        // Reset lower levels when university changes
        setSelectedFakultas("");
        setSelectedProdi("");
        setSelectedMataKuliah("");
        setCurrentLevel(1);
    };

    const handleFakultasChange = (value: string) => {
        setSelectedFakultas(value);
        // Reset lower levels when fakultas changes
        setSelectedProdi("");
        setSelectedMataKuliah("");
        setCurrentLevel(2);
    };

    const handleProdiChange = (value: string) => {
        setSelectedProdi(value);
        // Reset lower levels when prodi changes
        setSelectedMataKuliah("");
        setCurrentLevel(3);
    };

    const handleMataKuliahChange = (value: string) => {
        setSelectedMataKuliah(value);
        setCurrentLevel(4);
    };

    const handleRefresh = () => {
        console.log("Refresh button clicked");
    };

    const handleApplyFilter = () => {
        const newFilters = {
            university: selectedUniversity,
            fakultas: selectedFakultas,
            prodi: selectedProdi,
            mataKuliah: selectedMataKuliah
        };
        
        setAppliedFilters(newFilters);
        
        // Save to localStorage
        localStorage.setItem('analytics-filters', JSON.stringify(newFilters));
        
        console.log("Filters applied:", newFilters);
        // Here you can add your filtering logic
    };

    const hasUnappliedChanges = () => {
        return (
            selectedUniversity !== appliedFilters.university ||
            selectedFakultas !== appliedFilters.fakultas ||
            selectedProdi !== appliedFilters.prodi ||
            selectedMataKuliah !== appliedFilters.mataKuliah
        );
    };

    const hasAdditionalFilters = () => {
        return selectedFakultas || selectedProdi || selectedMataKuliah;
    };

    const clearAllFilters = () => {
        setSelectedUniversity("TEL-U BANDUNG");
        setSelectedFakultas("");
        setSelectedProdi("");
        setSelectedMataKuliah("");
        setCurrentLevel(1);
        
        const clearedFilters = {
            university: "TEL-U BANDUNG",
            fakultas: "",
            prodi: "",
            mataKuliah: ""
        };
        
        setAppliedFilters(clearedFilters);
        localStorage.setItem('analytics-filters', JSON.stringify(clearedFilters));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="px-4 sm:px-6 py-4">
                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    {/* Kampus Dropdown */}
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5 text-red-600" strokeWidth={2}/>
                                            <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
                                                <SelectTrigger className="w-auto min-w-[120px] border-none shadow-none text-lg font-bold text-gray-700 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
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
                                                className="h-auto w-auto px-2 py-1 ml-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Fakultas
                                            </Button>
                                        )}
                                    </div>

                                    {/* Fakultas Dropdown */}
                                    {currentLevel >= 2 && (
                                        <div className="flex items-center gap-1">
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                <Select value={selectedFakultas} onValueChange={handleFakultasChange}>
                                                    <SelectTrigger className="w-auto min-w-[140px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                        <SelectValue placeholder="Pilih Fakultas" />
                                                    </SelectTrigger>
                                                <SelectContent>
                                                    {fakultasData[selectedUniversity as keyof typeof fakultasData]?.map((fakultas: string) => (
                                                        <SelectItem key={fakultas} value={fakultas}>
                                                            {fakultas}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            </div>
                                            
                                            {/* Remove Level Button - Fakultas */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveLevel(2)}
                                                className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                            
                                            {/* Add Next Level Button - Fakultas */}
                                            {selectedFakultas && currentLevel === 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleAddNextLevel}
                                                    className="h-auto w-auto px-2 py-1 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Prodi
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Prodi Dropdown */}
                                    {currentLevel >= 3 && (
                                        <div className="flex items-center gap-1">
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                <Select value={selectedProdi} onValueChange={handleProdiChange}>
                                                    <SelectTrigger className="w-auto min-w-[140px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                        <SelectValue placeholder="Pilih Prodi" />
                                                    </SelectTrigger>
                                                <SelectContent>
                                                    {prodiData[selectedFakultas as keyof typeof prodiData]?.map((prodi: string) => (
                                                        <SelectItem key={prodi} value={prodi}>
                                                            {prodi}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            </div>
                                            
                                            {/* Remove Level Button - Prodi */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveLevel(3)}
                                                className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                            
                                            {/* Add Next Level Button - Prodi */}
                                            {selectedProdi && currentLevel === 3 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleAddNextLevel}
                                                    className="h-auto w-auto px-2 py-1 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Mata Kuliah
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Mata Kuliah Dropdown */}
                                    {currentLevel >= 4 && (
                                        <div className="flex items-center gap-1">
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                            <div className="flex items-center gap-2">
                                                <Book className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                <Select value={selectedMataKuliah} onValueChange={handleMataKuliahChange}>
                                                    <SelectTrigger className="w-auto min-w-[160px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                        <SelectValue placeholder="Pilih Mata Kuliah" />
                                                    </SelectTrigger>
                                                <SelectContent>
                                                    {mataKuliahData[selectedProdi as keyof typeof mataKuliahData]?.map((mataKuliah: string) => (
                                                        <SelectItem key={mataKuliah} value={mataKuliah}>
                                                            {mataKuliah}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            </div>
                                            
                                            {/* Remove Level Button - Mata Kuliah */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveLevel(4)}
                                                className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            {hasAdditionalFilters() && (
                                <>
                                    <Button 
                                        variant="default" 
                                        size="sm" 
                                        onClick={handleApplyFilter}
                                        disabled={!hasUnappliedChanges()}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Apply Filter
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={clearAllFilters}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear All
                                    </Button>
                                </>
                            )}
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

                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {/* Kampus Dropdown */}
                                        <div className="flex items-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-5 w-5 text-red-600" strokeWidth={2}/>
                                                <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
                                                    <SelectTrigger className="w-auto min-w-[120px] border-none shadow-none text-lg font-bold text-gray-700 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
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
                                                    className="h-auto w-auto px-2 py-1 ml-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Fakultas
                                                </Button>
                                            )}
                                        </div>

                                        {/* Fakultas Dropdown */}
                                        {currentLevel >= 2 && (
                                            <div className="flex items-center gap-1">
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                    <Select value={selectedFakultas} onValueChange={handleFakultasChange}>
                                                        <SelectTrigger className="w-auto min-w-[140px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                            <SelectValue placeholder="Pilih Fakultas" />
                                                        </SelectTrigger>
                                                    <SelectContent>
                                                        {fakultasData[selectedUniversity as keyof typeof fakultasData]?.map((fakultas: string) => (
                                                            <SelectItem key={fakultas} value={fakultas}>
                                                                {fakultas}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                </div>
                                                
                                                {/* Remove Level Button - Fakultas */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveLevel(2)}
                                                    className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                
                                                {/* Add Next Level Button - Fakultas */}
                                                {selectedFakultas && currentLevel === 2 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleAddNextLevel}
                                                        className="h-auto w-auto px-2 py-1 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Prodi
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Prodi Dropdown */}
                                        {currentLevel >= 3 && (
                                            <div className="flex items-center gap-1">
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                    <Select value={selectedProdi} onValueChange={handleProdiChange}>
                                                        <SelectTrigger className="w-auto min-w-[140px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                            <SelectValue placeholder="Pilih Prodi" />
                                                        </SelectTrigger>
                                                    <SelectContent>
                                                        {prodiData[selectedFakultas as keyof typeof prodiData]?.map((prodi: string) => (
                                                            <SelectItem key={prodi} value={prodi}>
                                                                {prodi}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                </div>
                                                
                                                {/* Remove Level Button - Prodi */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveLevel(3)}
                                                    className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                
                                                {/* Add Next Level Button - Prodi */}
                                                {selectedProdi && currentLevel === 3 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleAddNextLevel}
                                                        className="h-auto w-auto px-2 py-1 ml-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-50 hover:text-gray-700"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Mata Kuliah
                                                    </Button>
                                    )}
                                </div>
                                        )}

                                        {/* Mata Kuliah Dropdown */}
                                        {currentLevel >= 4 && (
                                            <div className="flex items-center gap-1">
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                                <div className="flex items-center gap-2">
                                                    <Book className="h-4 w-4 text-red-600" strokeWidth={2}/>
                                                    <Select value={selectedMataKuliah} onValueChange={handleMataKuliahChange}>
                                                        <SelectTrigger className="w-auto min-w-[160px] border-none shadow-none text-sm font-medium text-gray-600 focus:ring-0 focus:ring-offset-0 p-0 h-auto">
                                                            <SelectValue placeholder="Pilih Mata Kuliah" />
                                                        </SelectTrigger>
                                                    <SelectContent>
                                                        {mataKuliahData[selectedProdi as keyof typeof mataKuliahData]?.map((mataKuliah: string) => (
                                                            <SelectItem key={mataKuliah} value={mataKuliah}>
                                                                {mataKuliah}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                            </div>

                                                {/* Remove Level Button - Mata Kuliah */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveLevel(4)}
                                                    className="h-6 w-6 p-0 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <X className="h-3 w-3" />
                            </Button>
                        </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                        {hasAdditionalFilters() && (
                                    <>
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={handleApplyFilter}
                                    disabled={!hasUnappliedChanges()}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Apply Filter
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={clearAllFilters}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear All
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" size="sm" onClick={handleRefresh}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    )
}