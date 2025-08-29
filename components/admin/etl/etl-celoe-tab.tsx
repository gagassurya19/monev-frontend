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
    Zap,
    FileText,
    Trash2,
    Eye
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatDuration } from '@/lib/utils/date-formatter';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';

// New interfaces for the updated API
interface CeLOEETLStatus {
  status: boolean;
  data: {
    last_run: {
      id: number;
      start_date: string;
      end_date: string | null;
      status: string;
      status_code: number;
      message: string;
      type: string;
      numrow: number;
      duration_seconds: number | null;
    };
    currently_running: number;
    recent_activity: number;
    watermark: {
      last_extracted_date: string;
      last_extracted_timecreated: string;
      next_extract_date: string;
      updated_at: string;
      service: string;
    };
    service: string;
  };
}

interface CeLOEETLLog {
  id: string;
  offset: string;
  numrow: string;
  type: string;
  message: string;
  requested_start_date: string | null;
  extracted_start_date: string | null;
  extracted_end_date: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  duration_seconds: string | null;
  created_at: string;
}

interface CeLOEETLLogsResponse {
  status: boolean;
  data: CeLOEETLLog[];
  pagination: {
    limit: number;
    offset: number;
  };
}

interface CeLOEETLRunResponse {
  status: boolean;
  message: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  concurrency: number;
  log_id: number;
}

interface CeLOEETLCleanResponse {
  status: boolean;
  message: string;
  log_id: number;
  summary: {
    tables: Record<string, number>;
    total_affected: number;
  };
}

interface CeLOEETLExportResponse {
  success: boolean;
  limit: number;
  offset: number;
  hasNext: boolean;
  tables: Record<string, {
    count: number;
    hasNext: boolean;
    nextOffset: number | null;
    rows: Array<Record<string, any>>;
  }>;
}

export default function CeLOEETLTab({ hideControls = false }: { hideControls?: boolean }) {
    const [etlStatus, setEtlStatus] = useState<CeLOEETLStatus | null>(null);
    const [etlLogs, setEtlLogs] = useState<CeLOEETLLog[]>([]);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [logLimit, setLogLimit] = useState(50);
    const [logOffset, setLogOffset] = useState(0);
    const [hasConnectionError, setHasConnectionError] = useState(false);

    const [isRunningETL, setIsRunningETL] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [lastCleanResponse, setLastCleanResponse] = useState<CeLOEETLCleanResponse | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<CeLOEETLLog | null>(null);
    
    // ETL Run Parameters
    const [startDate, setStartDate] = useState('2025-02-03');
    const [concurrency, setConcurrency] = useState(4);

    const handleFetchETLStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const response = await apiClient.get<CeLOEETLStatus>(API_ENDPOINTS.CP.ETL.STATUS);
            setEtlStatus(response);
            setHasConnectionError(false);
        } catch (error: any) {
            setHasConnectionError(true);
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch ETL status",
                    variant: "destructive",
                });
            }
            console.error('ETL Status fetch error:', error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const handleFetchETLLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const response = await apiClient.get<CeLOEETLLogsResponse>(API_ENDPOINTS.CP.ETL.LOGS, { 
                limit: logLimit, 
                offset: logOffset 
            });
            setEtlLogs(response.data);
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to fetch ETL logs",
                    variant: "destructive",
                });
            }
            console.error('ETL Logs fetch error:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleRunETL = async () => {
        setIsRunningETL(true);
        try {
            const requestBody = {
                start_date: startDate,
                concurrency: concurrency
            };
            
            const response = await apiClient.post<CeLOEETLRunResponse>(API_ENDPOINTS.CP.ETL.RUN, requestBody);
            toast({
                title: "ETL Started",
                description: response.message,
            });
            setTimeout(() => handleFetchETLStatus(), 2000);
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to start ETL",
                    variant: "destructive",
                });
            }
            console.error('Run ETL error:', error);
        } finally {
            setIsRunningETL(false);
        }
    };

    const handleCleanETL = async () => {
        setIsCleaning(true);
        try {
            const response = await apiClient.post<CeLOEETLCleanResponse>(API_ENDPOINTS.CP.ETL.CLEAN);
            setLastCleanResponse(response);
            toast({
                title: "ETL Clean Success",
                description: response.message,
            });
            setTimeout(() => handleFetchETLStatus(), 2000);
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to clean ETL data",
                    variant: "destructive",
                });
            }
            console.error('Clean ETL error:', error);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleOpenDetail = (log: CeLOEETLLog) => {
        setSelectedLog(log);
        setIsDetailOpen(true);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case '1': return 'default';      // finished
            case '2': return 'secondary';    // inprogress
            case '3': return 'destructive';  // error
            default: return 'outline';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case '1': return 'Finished';     // finished
            case '2': return 'In Progress';  // inprogress
            case '3': return 'Error';        // error
            default: return 'Unknown';
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'run_cp_backfill': return 'default';
            case 'clear': return 'secondary';
            default: return 'outline';
        }
    };

    useEffect(() => {
        handleFetchETLStatus();
        handleFetchETLLogs();
    }, []);

    return (
        <div className="space-y-6">
            {/* ETL Control Panel */}
            {!hideControls && (
                <div className="grid gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Play className="w-5 h-5 text-green-600" />
                                        CELOE Control Panel
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleFetchETLStatus}
                                    disabled={isLoadingStatus}
                                >
                                    {isLoadingStatus ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Refresh Status
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* ETL Run Parameters */}
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="cp-start-date" className="text-sm font-medium text-gray-700">
                                            Start Date
                                        </label>
                                        <input
                                            id="cp-start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="cp-concurrency" className="text-sm font-medium text-gray-700">
                                            Concurrency
                                        </label>
                                        <input
                                            id="cp-concurrency"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={concurrency}
                                            onChange={(e) => setConcurrency(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={handleRunETL}
                                    disabled={isRunningETL || etlStatus?.data.last_run?.status_code === 2}
                                    className="h-16"
                                >
                                    {isRunningETL ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Database className="w-5 h-5 mr-2" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Run ETL</span>
                                        <span className="text-xs opacity-80">Start data extraction</span>
                                    </div>
                                </Button>

                                <Button
                                    onClick={handleCleanETL}
                                    disabled={isCleaning}
                                    variant="outline"
                                    className="h-16 border-orange-200 hover:bg-orange-50"
                                >
                                    {isCleaning ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Trash2 className="w-5 h-5 mr-2 text-orange-600" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Clean Data</span>
                                        <span className="text-xs opacity-80">Clear all ETL data</span>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Clean Response Alert */}
            {lastCleanResponse && (
                <Alert className="mb-4" variant="default">
                    <AlertTitle>{lastCleanResponse.message}</AlertTitle>
                    <AlertDescription>
                        <div className="mt-2">
                            <div className="text-sm font-medium mb-2">Tables Affected:</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(lastCleanResponse.summary.tables).map(([table, count]) => (
                                    <div key={table} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                        <Database className="w-4 h-4 text-blue-600" />
                                        <div>
                                            <div className="font-medium text-xs">{table}</div>
                                            <div className="text-xs text-gray-600">{count} records</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                Total Affected: {lastCleanResponse.summary.total_affected} records
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* ETL Status Display */}
            <div className="grid gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Status ETL saat ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {etlStatus ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${etlStatus.data.last_run?.status_code === 2 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                            <span className="text-sm font-medium">Status</span>
                                        </div>
                                        <p className="text-lg font-semibold">
                                            {etlStatus.data.last_run?.status_code === 2 ? 'Running' : 'Idle'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {etlStatus.data.last_run?.status_code === 2 ? 'ETL sedang berjalan' : 'ETL tidak aktif'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Last Run</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            {etlStatus.data.last_run ? formatDateTime(etlStatus.data.last_run.start_date) : 'Never'}
                                        </p>
                                        {etlStatus.data.last_run && (
                                            <Badge variant={getStatusBadgeVariant(etlStatus.data.last_run.status_code.toString())} className="mt-1">
                                                {getStatusText(etlStatus.data.last_run.status_code.toString())}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium">Recent Activity</span>
                                        </div>
                                        <p className="text-lg font-semibold">
                                            {etlStatus.data.recent_activity}
                                        </p>
                                        <p className="text-sm text-gray-600">activities</p>
                                    </div>
                                </div>

                                {etlStatus.data.last_run && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Last Run Details</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Type:</span>
                                                <p className="font-medium">{etlStatus.data.last_run.type}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Records:</span>
                                                <p className="font-medium">{etlStatus.data.last_run.numrow}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Duration:</span>
                                                <p className="font-medium">
                                                    {etlStatus.data.last_run.duration_seconds ? 
                                                        `${etlStatus.data.last_run.duration_seconds}s` : 'N/A'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Message:</span>
                                                <p className="font-medium text-xs">{etlStatus.data.last_run.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {etlStatus.data.watermark && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Watermark Info</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Last Extracted:</span>
                                                <p className="font-medium">{etlStatus.data.watermark.last_extracted_date}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Next Extract:</span>
                                                <p className="font-medium">{etlStatus.data.watermark.next_extract_date}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Updated:</span>
                                                <p className="font-medium">{etlStatus.data.watermark.updated_at}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Service:</span>
                                                <p className="font-medium">{etlStatus.data.watermark.service}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No status data available. Click "Refresh Status" to load.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ETL Logs */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Riwayat ETL
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
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
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleFetchETLLogs}
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
                        {etlLogs.length > 0 ? (
                            <div className="space-y-3">
                                {etlLogs.map((log, index) => (
                                    <div key={log.id || index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusBadgeVariant(log.status)}>
                                                    {getStatusText(log.status)}
                                                </Badge>
                                                <Badge variant={getTypeBadgeVariant(log.type)} className="text-xs">
                                                    {log.type}
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
                                                    onClick={() => handleOpenDetail(log)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Details
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Start:</span>
                                                <p className="font-medium">{formatDateTime(log.start_date)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">End:</span>
                                                <p className="font-medium">
                                                    {log.end_date ? formatDateTime(log.end_date) : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Records:</span>
                                                <p className="font-medium">{parseInt(log.numrow || '0').toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Duration:</span>
                                                <p className="font-medium">
                                                    {log.duration_seconds ? `${log.duration_seconds}s` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {log.message && (
                                            <div className="mt-2 pt-2 border-t">
                                                <span className="text-gray-600 text-xs">Message:</span>
                                                <p className="text-xs font-medium">{log.message}</p>
                                            </div>
                                        )}
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
            </div>

            {/* Log Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>ETL Log Details - ID: {selectedLog?.id}</DialogTitle>
                        <DialogDescription>
                            Informasi detail untuk proses ETL ini
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96">
                        {selectedLog ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-600 text-sm">Type:</span>
                                        <Badge variant={getTypeBadgeVariant(selectedLog.type)} className="ml-2">
                                            {selectedLog.type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Status:</span>
                                        <Badge variant={getStatusBadgeVariant(selectedLog.status)} className="ml-2">
                                            {getStatusText(selectedLog.status)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Start Date:</span>
                                        <p className="font-medium">{formatDateTime(selectedLog.start_date)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">End Date:</span>
                                        <p className="font-medium">
                                            {selectedLog.end_date ? formatDateTime(selectedLog.end_date) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Records:</span>
                                        <p className="font-medium">{parseInt(selectedLog.numrow || '0').toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Duration:</span>
                                        <p className="font-medium">
                                            {selectedLog.duration_seconds ? `${selectedLog.duration_seconds}s` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-gray-600 text-sm">Message:</span>
                                        <p className="font-medium text-sm">{selectedLog.message}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Created At:</span>
                                        <p className="font-medium">{formatDateTime(selectedLog.created_at)}</p>
                                    </div>
                                    {selectedLog.requested_start_date && (
                                        <div>
                                            <span className="text-gray-600 text-sm">Requested Start:</span>
                                            <p className="font-medium">{selectedLog.requested_start_date}</p>
                                        </div>
                                    )}
                                    {selectedLog.extracted_start_date && (
                                        <div>
                                            <span className="text-gray-600 text-sm">Extracted Start:</span>
                                            <p className="font-medium">{selectedLog.extracted_start_date}</p>
                                        </div>
                                    )}
                                    {selectedLog.extracted_end_date && (
                                        <div>
                                            <span className="text-gray-600 text-sm">Extracted End:</span>
                                            <p className="font-medium">{selectedLog.extracted_end_date}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No log selected.</p>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Auto-refresh indicator */}
            {etlStatus?.data.last_run?.status_code === 2 && (
                <div className="fixed bottom-4 right-4">
                    <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-800">Auto-refreshing status...</span>
                    </div>
                </div>
            )}
        </div>
    );
}