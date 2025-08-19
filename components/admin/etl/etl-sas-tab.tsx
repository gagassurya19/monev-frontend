"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    XCircle,
    AlertCircle,
    Info,
    Filter,
    GraduationCap,
    Building2,
    BookOpen,
    Book,
    ChevronRight,
    Plus,
    Square
} from 'lucide-react';
import { startETLChart, getETLChartLogs, getETLChartLogDetail, streamETLChartLogs, getChartData } from '@/lib/api/etl-activity';
import { formatDateTime, formatDuration } from '@/lib/utils/date-formatter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterDropdown } from '@/components/filter-dropdown';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Globe, 
  Play, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Terminal,
  Trash2,
  ChevronDown,
  Eye 
} from 'lucide-react';
import { ETLLog, ETLLogsResponse, ETLStreamData } from '@/lib/types';

// Helper function to get current time string
const getCurrentTimeString = (): string => {
    return new Date().toLocaleTimeString();
};

export default function ExternalAPIsETLTab() {
    const [logs, setLogs] = useState<ETLLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [startingETL, setStartingETL] = useState(false);
    const [clearingStuck, setClearingStuck] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string>('');
    const [streamingLogs, setStreamingLogs] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamExpanded, setStreamExpanded] = useState(false);
    const [streamCloseFunction, setStreamCloseFunction] = useState<(() => void) | null>(null);
    const [pagination, setPagination] = useState({
        total: "0",
        limit: 5,
        offset: 0,
        current_page: 1,
        total_pages: 1
    });

    // Fetch ETL logs
    const fetchLogs = async (limit: number = 5, offset: number = 0) => {
        try {
            setLoading(true);
            const response = await getETLChartLogs({ limit, offset });
            setLogs(response.data.logs);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching ETL logs:', error);
            toast({
                title: "Error",
                description: "Failed to fetch ETL logs. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Start ETL process
    const handleStartETL = async () => {
        try {
            setStartingETL(true);
            const response = await startETLChart();
            
            if (response.status) {
                toast({
                    title: "ETL Process Started",
                    description: response.message,
                });
                // Refresh logs after starting ETL
                setTimeout(() => {
                    fetchLogs();
                }, 2000);
            }
        } catch (error) {
            console.error('Error starting ETL process:', error);
            toast({
                title: "Error",
                description: "Failed to start ETL process. Please try again.",
                variant: "destructive",
            });
        } finally {
            setStartingETL(false);
        }
    };

    // Clear stuck ETL processes
    const handleClearStuck = async () => {
        try {
            setClearingStuck(true);
            const response = await clearStuckETLChart();
            
            if (response.status) {
                toast({
                    title: "Success",
                    description: response.message,
                });
                // Refresh logs after clearing stuck processes
                setTimeout(() => {
                    fetchLogs();
                }, 1000);
            }
        } catch (error) {
            console.error('Error clearing stuck ETL processes:', error);
            toast({
                title: "Error",
                description: "Failed to clear stuck ETL processes. Please try again.",
                variant: "destructive",
            });
        } finally {
            setClearingStuck(false);
        }
    };

    // Start streaming logs
    const startStreaming = async (logId: string) => {
        if (streamCloseFunction) {
            streamCloseFunction();
        }

        setStreamingLogs([]);
        setIsStreaming(true);
        setStreamExpanded(true);
        setSelectedLogId(logId);

        try {
            const closeFunction = await streamETLChartLogs(
                logId,
                // onMessage callback
                (data: string) => {
                    try {
                        const parsedData = JSON.parse(data);
                        const timestamp = getCurrentTimeString();
                        const logMessage = `[${timestamp}] ${parsedData.message || data}`;
                        setStreamingLogs(prev => [...prev, logMessage]);
                    } catch {
                        // If not JSON, treat as plain text
                        const timestamp = getCurrentTimeString();
                        const logMessage = `[${timestamp}] ${data}`;
                        setStreamingLogs(prev => [...prev, logMessage]);
                    }
                },
                // onError callback
                (error: Error) => {
                    console.error('Streaming error:', error);
                    setIsStreaming(false);
                    toast({
                        title: "Streaming Error",
                        description: "Connection to streaming logs lost.",
                        variant: "destructive",
                    });
                },
                // onOpen callback
                () => {
                    const timestamp = getCurrentTimeString();
                    setStreamingLogs(prev => [...prev, `[${timestamp}] Connected to ETL stream for log ID: ${logId}`]);
                }
            );

            setStreamCloseFunction(() => closeFunction);
        } catch (error) {
            console.error('Failed to start streaming:', error);
            setIsStreaming(false);
            toast({
                title: "Streaming Error",
                description: "Failed to start streaming. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Stop streaming logs
    const stopStreaming = () => {
        if (streamCloseFunction) {
            streamCloseFunction();
            setStreamCloseFunction(null);
        }
        setIsStreaming(false);
        setStreamExpanded(false);
        const timestamp = getCurrentTimeString();
        setStreamingLogs(prev => [...prev, `[${timestamp}] Disconnected from ETL stream`]);
    };

    // Handle view stream button click
    const handleViewStream = async (logId: string) => {
        if (selectedLogId === logId && isStreaming) {
            // If already streaming this log, stop it
            stopStreaming();
        } else {
            // Start streaming for this log
            await startStreaming(logId);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamCloseFunction) {
                streamCloseFunction();
            }
        };
    }, [streamCloseFunction]);

    // Get status badge color and icon
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'finished':
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Finished
                    </Badge>
                );
            case 'running':
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Running
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {status}
                    </Badge>
                );
        }
    };

    // Format date using the utility function
    const formatDate = (dateString: string) => {
        try {
            return formatDateTime(dateString);
        } catch {
            return dateString;
        }
    };

    // Load logs on component mount
    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        Chart Activity ETL
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                            onClick={handleStartETL}
                            disabled={startingETL}
                            className="flex items-center gap-2"
                        >
                            {startingETL ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Starting ETL...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Start ETL Process
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => fetchLogs()}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh Logs
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleClearStuck}
                            disabled={clearingStuck}
                            className="flex items-center gap-2"
                        >
                            {clearingStuck ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Clear Stuck
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ETL Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        ETL Process Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            Loading logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Logs Available</h3>
                            <p className="text-gray-600">
                                No ETL processes have been executed yet. Start your first ETL process to see logs here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>End Time</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Records</TableHead>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <>
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        {getStatusBadge(log.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {formatDate(log.start_date)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.end_date ? formatDate(log.end_date) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            {log.duration}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {parseInt(log.total_records).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {log.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewStream(log.id)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {selectedLogId === log.id && isStreaming ? (
                                                                <>
                                                                    <XCircle className="w-4 h-4" />
                                                                    Stop Stream
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-4 h-4" />
                                                                    View Stream
                                                                </>
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                
                                                {/* Streaming Terminal Accordion - appears directly below this log row */}
                                                {selectedLogId === log.id && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="p-0">
                                                            <div className="border-t bg-gray-50/50">
                                                                <Collapsible open={streamExpanded} onOpenChange={setStreamExpanded}>
                                                                    <CollapsibleTrigger asChild>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-100"
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Terminal className="w-4 h-4" />
                                                                                <span>Real-time Stream for Log ID: {selectedLogId}</span>
                                                                                {isStreaming && (
                                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                                                                        Live
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {isStreaming && (
                                                                                    <Button 
                                                                                        variant="outline" 
                                                                                        size="sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setStreamingLogs([]);
                                                                                        }}
                                                                                        className="flex items-center gap-1"
                                                                                    >
                                                                                        <RefreshCw className="w-3 h-3" />
                                                                                        Clear
                                                                                    </Button>
                                                                                )}
                                                                                <ChevronDown className={`w-4 h-4 transition-transform ${streamExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </Button>
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent>
                                                                        <div className="p-4 pt-0">
                                                                            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                                                                                {streamingLogs.length === 0 ? (
                                                                                    <div className="text-gray-500">
                                                                                        {isStreaming ? "Waiting for stream data..." : "Click 'View Stream' to start monitoring this log."}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="space-y-1">
                                                                                        {streamingLogs.map((log, index) => (
                                                                                            <div key={index} className="whitespace-pre-wrap break-words">
                                                                                                {log}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                                {isStreaming && (
                                                                                    <div className="flex items-center gap-2 mt-2 text-yellow-400">
                                                                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                                                        <span>Streaming active...</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                                </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Info */}
                            {pagination.total_pages > 1 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>
                                            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, parseInt(pagination.total))} of {pagination.total} logs
                                        </span>
                                        <span>
                                            Page {pagination.current_page} of {pagination.total_pages}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 