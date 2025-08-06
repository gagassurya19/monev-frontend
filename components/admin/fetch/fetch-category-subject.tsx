"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
    Database,
    Play,
    Activity,
    RefreshCw,
    Clock,
    Loader2,
    AlertTriangle,
    FileText,
    Eye,
    X,
    CheckCircle,
    AlertCircle,
    Info,
    Filter,
    GraduationCap,
    Building2,
    BookOpen,
    Book,
    ChevronRight,
    Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    startFetchCategorySubject,
    getFetchCategorySubjectLogs,
    getFetchCategorySubjectLogDetail,
    streamFetchCategorySubjectLogs,
    getCategorySubjectData
} from '@/lib/api/etl-activity';
import { formatDateTime, formatDuration } from '@/lib/utils/date-formatter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterDropdown } from '@/components/filter-dropdown';

interface FetchCategorySubjectProps { }

interface LogEntry {
    id: number;
    log_id: number;
    level: 'info' | 'error' | 'warning' | 'success' | 'debug';
    message: string;
    progress: number;
    data: any;
    timestamp: string;
}

interface LogDetail {
    id: number;
    type_run: string;
    start_date: string;
    end_date: string;
    duration: string;
    status: string;
    total_records: number;
    offset: number;
    created_at: string;
}

interface CategorySubjectData {
    id: number;
    category_id: string;
    category_name: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    created_at: string;
    updated_at: string;
}

export default function FetchCategorySubject({ }: FetchCategorySubjectProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isRunningFetch, setIsRunningFetch] = useState(false);
    const [logLimit, setLogLimit] = useState(5);
    const [logOffset, setLogOffset] = useState(0);
    const [hasConnectionError, setHasConnectionError] = useState(false);

    // Log detail modal state
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [logDetail, setLogDetail] = useState<LogDetail | null>(null);
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Realtime streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamMessages, setStreamMessages] = useState<string[]>([]);
    const [streamProgress, setStreamProgress] = useState(0);
    const [closeStream, setCloseStream] = useState<(() => void) | null>(null);

    // Run fetch response state
    const [runResponse, setRunResponse] = useState<any>(null);
    const [showResponse, setShowResponse] = useState(false);

    // Filter and data testing state
    const [categorySubjectData, setCategorySubjectData] = useState<CategorySubjectData[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [dataLimit, setDataLimit] = useState(10);
    const [dataOffset, setDataOffset] = useState(0);

    // Filter state
    const [selectedUniversity, setSelectedUniversity] = useState('TEL-U BANDUNG');
    const [selectedFakultasId, setSelectedFakultasId] = useState('');
    const [selectedProdiId, setSelectedProdiId] = useState('');
    const [selectedMataKuliahId, setSelectedMataKuliahId] = useState('');
    const [currentLevel, setCurrentLevel] = useState(1);

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

    const handleUniversityChange = (value: string) => {
        setSelectedUniversity(value);
        setSelectedFakultasId('');
        setSelectedProdiId('');
        setSelectedMataKuliahId('');
        setCurrentLevel(1);
    };

    const handleFakultasChange = (value: string) => {
        setSelectedFakultasId(value);
        setSelectedProdiId('');
        setSelectedMataKuliahId('');
        setCurrentLevel(2);
    };

    const handleProdiChange = (value: string) => {
        setSelectedProdiId(value);
        setSelectedMataKuliahId('');
        setCurrentLevel(3);
    };

    const handleMataKuliahChange = (value: string) => {
        setSelectedMataKuliahId(value);
        setCurrentLevel(4);
    };

    const handleAddNextLevel = () => {
        setCurrentLevel(prev => prev + 1);
    };

    const handleRemoveLevel = (level: number) => {
        if (level === 2) {
            setSelectedFakultasId('');
            setSelectedProdiId('');
            setSelectedMataKuliahId('');
            setCurrentLevel(1);
        } else if (level === 3) {
            setSelectedProdiId('');
            setSelectedMataKuliahId('');
            setCurrentLevel(2);
        } else if (level === 4) {
            setSelectedMataKuliahId('');
            setCurrentLevel(3);
        }
    };

    const hasAdditionalFiltersApplied = () => {
        return selectedFakultasId || selectedProdiId || selectedMataKuliahId;
    };

    const clearAllFilters = () => {
        setSelectedFakultasId('');
        setSelectedProdiId('');
        setSelectedMataKuliahId('');
        setCurrentLevel(1);
    };

    const handleFetchCategorySubjectData = async () => {
        setIsLoadingData(true);
        try {
            const params: any = {
                limit: dataLimit,
                offset: dataOffset
            };

            if (searchTerm) {
                params.search = searchTerm;
            }
            if (selectedCategoryId) {
                params.category_id = selectedCategoryId;
            }
            if (selectedSubjectId) {
                params.subject_id = selectedSubjectId;
            }

            const response = await getCategorySubjectData(params);
            setCategorySubjectData(response.data || []);
            toast({
                title: "Data Loaded",
                description: `Found ${response.data?.length || 0} category-subject records`,
            });
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch category subject data",
                    variant: "destructive",
                });
            }
            console.error('Fetch category subject data error:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleFetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const response = await getFetchCategorySubjectLogs({
                limit: logLimit,
                offset: logOffset
            });
            setLogs(response.data.logs || []);
            setHasConnectionError(false);
        } catch (error: any) {
            setHasConnectionError(true);
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch logs",
                    variant: "destructive",
                });
            }
            console.error('Fetch logs error:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleRunFetch = async () => {
        setIsRunningFetch(true);
        try {
            const response = await startFetchCategorySubject();
            setRunResponse(response);
            setShowResponse(true);
            toast({
                title: "Fetch Started",
                description: response.message || "Category subject fetch process has been started in background",
            });
            // Refresh logs after a short delay
            setTimeout(() => handleFetchLogs(), 2000);
        } catch (error: any) {
            setRunResponse(error);
            setShowResponse(true);
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to start fetch process",
                    variant: "destructive",
                });
            }
            console.error('Run fetch error:', error);
        } finally {
            setIsRunningFetch(false);
        }
    };

    const handleViewLogDetail = async (logId: string) => {
        setSelectedLogId(logId);
        setIsDetailModalOpen(true);
        setIsLoadingDetail(true);

        try {
            const response = await getFetchCategorySubjectLogDetail(logId, {
                limit: 100,
                offset: 0
            });

            if (response.data) {
                setLogDetail(response.data.logs);
                setLogEntries(response.data.logs || []);
            }
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch log details",
                    variant: "destructive",
                });
            }
            console.error('Fetch log detail error:', error);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleStartStreaming = async (logId: string) => {
        if (isStreaming) {
            // Stop current stream
            if (closeStream) {
                closeStream();
            }
            setIsStreaming(false);
            setStreamMessages([]);
            setStreamProgress(0);
            return;
        }

        setIsStreaming(true);
        setStreamMessages([]);
        setStreamProgress(0);

        const closeStreamFn = await streamFetchCategorySubjectLogs(
            logId,
            (data: string) => {
                try {
                    const parsed = JSON.parse(data);
                    setStreamMessages(prev => [...prev, data]);

                    if (parsed.progress !== undefined) {
                        setStreamProgress(parsed.progress);
                    }

                    if (parsed.type === 'completion') {
                        setIsStreaming(false);
                        toast({
                            title: "Process Completed",
                            description: "The fetch process has completed successfully",
                        });
                    }
                } catch (error) {
                    console.error('Error parsing stream data:', error);
                }
            },
            (error: Error) => {
                console.error('Stream error:', error);
                setIsStreaming(false);
                toast({
                    title: "Stream Error",
                    description: error.message,
                    variant: "destructive",
                });
            },
            () => {
                console.log('Stream connected');
            }
        );

        setCloseStream(() => closeStreamFn);
    };

    // Auto-start streaming for running processes
    const handleAutoStream = (log: any) => {
        if (log.status === 'running' && !isStreaming) {
            handleStartStreaming(log.id.toString());
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'info':
                return <Info className="w-4 h-4 text-blue-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'debug':
                return <Activity className="w-4 h-4 text-gray-500" />;
            default:
                return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    const getLevelBadgeVariant = (level: string) => {
        switch (level) {
            case 'info':
                return 'default';
            case 'error':
                return 'destructive';
            case 'warning':
                return 'secondary';
            case 'success':
                return 'default';
            case 'debug':
                return 'outline';
            default:
                return 'default';
        }
    };

    useEffect(() => {
        handleFetchLogs();
    }, []);

    // Auto-start streaming for running processes
    useEffect(() => {
        const runningLog = logs.find(log => log.status === 'running');
        if (runningLog && !isStreaming) {
            // Auto-start streaming for running processes
            setTimeout(() => {
                handleStartStreaming(runningLog.id.toString());
            }, 1000); // Small delay to ensure logs are loaded
        }
    }, [logs, isStreaming]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">Category & Subject Management</h2>
                </div>
                <Button
                    onClick={handleRunFetch}
                    disabled={isRunningFetch}
                    className="h-12"
                >
                    {isRunningFetch ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <Play className="w-5 h-5 mr-2" />
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold">Run Fetch</span>
                        <span className="text-xs opacity-80">Start category subject fetch process</span>
                    </div>
                </Button>
            </div>

            {/* Data Testing Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-purple-600" />
                        Test Fetched Data
                    </CardTitle>
                    <CardDescription>
                        Filter and test the category-subject data that has been fetched from the ETL process
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Filter Section */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Filter className="h-5 w-5 text-red-600" />
                                        Data Filters
                                    </h3>
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
                        </div>
                    </div>
                </CardContent>
            </Card>
            

            {/* Run Response Display */}
            {showResponse && runResponse && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-600" />
                                Run Fetch Response
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowResponse(false)}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Close
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Response Data */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant={runResponse.status ? "default" : "destructive"}>
                                        {runResponse.status ? "Success" : "Error"}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                        {new Date().toLocaleString()}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {runResponse.message && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Message:</span>
                                            <p className="text-sm text-gray-900 mt-1">{runResponse.message}</p>
                                        </div>
                                    )}
                                    {runResponse.data && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Data:</span>
                                            <div className="bg-black text-green-400 font-mono text-xs rounded p-3 mt-1 overflow-auto">
                                                <pre>{JSON.stringify(runResponse.data, null, 2)}</pre>
                                            </div>
                                        </div>
                                    )}
                                    {runResponse.error && (
                                        <div>
                                            <span className="text-sm font-medium text-red-700">Error:</span>
                                            <p className="text-sm text-red-600 mt-1">{runResponse.error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Stream Display */}
                            {isStreaming && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">Live Stream</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (closeStream) closeStream();
                                                setIsStreaming(false);
                                                setStreamMessages([]);
                                                setStreamProgress(0);
                                            }}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Stop Stream
                                        </Button>
                                    </div>

                                    {streamProgress > 0 && (
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-green-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
                                                style={{ width: `${streamProgress}%` }}
                                            >
                                                <span className="text-white text-xs font-medium">{streamProgress}%</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 h-48 overflow-auto">
                                        <div className="space-y-1">
                                            {streamMessages.length > 0 ? (
                                                streamMessages.map((message, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <span className="text-gray-500 mr-2">[{index + 1}]</span>
                                                        <span className="text-gray-400 mr-2">
                                                            {new Date().toLocaleTimeString()}
                                                        </span>
                                                        <span className="text-white break-all">{message}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500">
                                                    Waiting for stream data...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Logs Display */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Fetch Logs History
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="logLimit" className="text-sm">Limit:</Label>
                            <Input
                                id="logLimit"
                                type="number"
                                value={logLimit}
                                onChange={(e) => setLogLimit(Number(e.target.value))}
                                className="w-20"
                                min="1"
                                max="100"
                            />
                            <Button
                                variant="outline"
                                onClick={handleFetchLogs}
                                disabled={isLoadingLogs}
                            >
                                {isLoadingLogs ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Refresh Logs
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {logs.length > 0 ? (
                        <div className="space-y-4">
                            {logs.map((log, index) => (
                                <div key={log.id || index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge variant={log.status === 'finished' ? 'default' : 'secondary'}>
                                                {log.status}
                                            </Badge>
                                            <span className="text-sm text-gray-600">ID: {log.id}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDateTime(log.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewLogDetail(log.id.toString())}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Details
                                            </Button>
                                            {log.status === 'running' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStartStreaming(log.id.toString())}
                                                    disabled={isStreaming}
                                                    className="border-green-200 hover:bg-green-50"
                                                >
                                                    {isStreaming ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                    ) : (
                                                        <Activity className="w-4 h-4 mr-1 text-green-600" />
                                                    )}
                                                    {isStreaming ? 'Stop' : 'Monitor'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Start:</span>
                                            <p className="font-medium">
                                                {formatDateTime(log.start_date)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">End:</span>
                                            <p className="font-medium">
                                                {formatDateTime(log.end_date)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Duration:</span>
                                            <p className="font-medium">
                                                {formatDuration(log.duration)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Records:</span>
                                            <p className="font-medium">
                                                {log.total_records ? log.total_records.toLocaleString() : '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No log data available. Click "Refresh Logs" to load.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Log Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Log Details - ID: {selectedLogId}</DialogTitle>
                        <DialogDescription>
                            Detailed information and progress logs for this fetch operation
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetail ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 h-96 overflow-auto">
                                <div className="space-y-1">
                                    {logEntries.map((entry, index) => (
                                        <div key={entry.id || index} className="flex items-start">
                                            <span className="text-gray-500 mr-2">[{index + 1}]</span>
                                            <span className="text-gray-400 mr-2">
                                                {new Date(entry.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className={`mr-2 ${entry.level === 'error' ? 'text-red-400' :
                                                entry.level === 'warning' ? 'text-yellow-400' :
                                                    entry.level === 'success' ? 'text-green-400' :
                                                        entry.level === 'debug' ? 'text-blue-400' :
                                                            'text-white'
                                                }`}>
                                                [{entry.level.toUpperCase()}]
                                            </span>
                                            {entry.progress > 0 && (
                                                <span className="text-cyan-400 mr-2">
                                                    [{entry.progress}%]
                                                </span>
                                            )}
                                            <span className="text-white">{entry.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>



            {/* Connection Error Alert */}
            {hasConnectionError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                        Unable to connect to the server. Please check your connection and try again.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
