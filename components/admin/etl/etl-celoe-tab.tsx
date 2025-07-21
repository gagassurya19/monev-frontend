"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { 
    Database, 
    Play, 
    Activity,
    RefreshCw,
    Clock,
    Settings,
    Loader2,
    AlertTriangle,
    Zap,
    Bug,
    FileText
} from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import { ETLStatus, ETLLog, ETLDebugData } from '@/lib/etl-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CeLOEETLTabProps {
    etlStatus: ETLStatus | null;
    etlLogs: ETLLog[];
    isLoadingStatus: boolean;
    isLoadingLogs: boolean;
    logLimit: number;
    setLogLimit: (limit: number) => void;
    fetchETLStatus: () => void;
    fetchETLLogs: () => void;
}

export default function CeLOEETLTab({
    etlStatus,
    etlLogs,
    isLoadingStatus,
    isLoadingLogs,
    logLimit,
    setLogLimit,
    fetchETLStatus,
    fetchETLLogs
}: CeLOEETLTabProps) {
    const [isRunningFullETL, setIsRunningFullETL] = useState(false);
    const [isRunningIncrementalETL, setIsRunningIncrementalETL] = useState(false);
    const [isClearingStuck, setIsClearingStuck] = useState(false);
    const [isForceClearingAll, setIsForceClearingAll] = useState(false);
    const [lastClearStuckResponse, setLastClearStuckResponse] = useState<{
        status: boolean;
        message?: string;
        result?: { action?: string; message?: string };
    } | null>(null);

    // Run Full ETL
    const runFullETL = async () => {
        setIsRunningFullETL(true);
        try {
            const response = await apiClient.request(API_ENDPOINTS.ETL.RUN, {
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                },
                method: 'POST'
            });
            toast({
                title: "ETL Started",
                description: "Full ETL process has been started in background",
            });
            // Refresh status after starting
            setTimeout(() => fetchETLStatus(), 2000);
        } catch (error: any) {
            // Don't show error toast for 401 errors (authentication issues)
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to start full ETL",
                    variant: "destructive",
                });
            }
            console.error('Run Full ETL error:', error);
        } finally {
            setIsRunningFullETL(false);
        }
    };

    // Run Incremental ETL
    const runIncrementalETL = async () => {
        setIsRunningIncrementalETL(true);
        try {
            const response = await apiClient.request(API_ENDPOINTS.ETL.RUN_INCREMENTAL, {
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                },
                method: 'POST'
            });
            toast({
                title: "ETL Started",
                description: "Incremental ETL process has been started in background",
            });
            // Refresh status after starting
            setTimeout(() => fetchETLStatus(), 2000);
        } catch (error: any) {
            // Don't show error toast for 401 errors (authentication issues)  
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to start incremental ETL",
                    variant: "destructive",
                });
            }
            console.error('Run Incremental ETL error:', error);
        } finally {
            setIsRunningIncrementalETL(false);
        }
    };

    // Clear Stuck ETL Processes
    const clearStuckETL = async () => {
        setIsClearingStuck(true);
        try {
            const response: {
                status: boolean;
                message?: string;
                result?: { action?: string; message?: string };
            } = await apiClient.request(API_ENDPOINTS.ETL.CLEAR_STUCK, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                }
            });
            // toast({
            //     title: response.message || "Success",
            //     description: response.result?.message || "",
            //     variant: response.status ? "default" : "destructive",
            // });
            setLastClearStuckResponse(response);
            // Refresh status after clearing
            setTimeout(() => fetchETLStatus(), 2000);
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to clear stuck ETL processes",
                    variant: "destructive",
                });

            setLastClearStuckResponse(error.response);
            }
            console.error('Clear stuck ETL error:', error);
        } finally {
            setIsClearingStuck(false);
        }
    };

    // Force Clear All InProgress ETL Processes
    const forceClearAllETL = async () => {
        setIsForceClearingAll(true);
        try {
            const response: {
                status: boolean;
                message?: string;
                result?: { action?: string; message?: string };
            } = await apiClient.request(API_ENDPOINTS.ETL.FORCE_CLEAR, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                }
            });
            // toast({
            //     title: "Success",
            //     description: "All inprogress ETL processes cleared successfully",
            // });
            setLastClearStuckResponse(response);
            // Refresh status after clearing
            setTimeout(() => fetchETLStatus(), 2000);
        } catch (error: any) {
            if (error.status !== 401) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to force clear all ETL processes",
                    variant: "destructive",
                });
            }
            console.error('Force clear all ETL error:', error);
        } finally {
            setIsForceClearingAll(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ETL Control Panel */}
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
                                onClick={fetchETLStatus}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={runFullETL}
                                disabled={isRunningFullETL || etlStatus?.data?.isRunning}
                                className="h-16"
                            >
                                {isRunningFullETL ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Database className="w-5 h-5 mr-2" />
                                )}
                                <div className="flex flex-col">
                                    <span className="font-semibold">Run Full ETL</span>
                                    <span className="text-xs opacity-80">Complete data extraction</span>
                                </div>
                            </Button>

                            <Button
                                onClick={runIncrementalETL}
                                disabled={isRunningIncrementalETL || etlStatus?.data?.isRunning}
                                variant="secondary"
                                className="h-16"
                            >
                                {isRunningIncrementalETL ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Activity className="w-5 h-5 mr-2" />
                                )}
                                <div className="flex flex-col">
                                    <span className="font-semibold">Run Incremental ETL</span>
                                    <span className="text-xs opacity-80">Update recent changes</span>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ETL Maintenance Panel */}
            <div className="grid gap-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        onClick={clearStuckETL}
                        disabled={isClearingStuck}
                        variant="outline"
                        className="h-16 border-orange-200 hover:bg-orange-50"
                    >
                        {isClearingStuck ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                        )}
                        <div className="flex flex-col">
                            <span className="font-semibold">Clear Stuck Processes</span>
                            <span className="text-xs opacity-80">Clear processes that are stuck</span>
                        </div>
                    </Button>

                    <Button
                        onClick={forceClearAllETL}
                        disabled={isForceClearingAll}
                        variant="outline"
                        className="h-16 border-red-200 hover:bg-red-50"
                    >
                        {isForceClearingAll ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Zap className="w-5 h-5 mr-2 text-red-600" />
                        )}
                        <div className="flex flex-col">
                            <span className="font-semibold">Force Clear All</span>
                            <span className="text-xs opacity-80">Clear all inprogress processes</span>
                        </div>
                    </Button>
                </div>
                {lastClearStuckResponse && (
                    <Alert className="mt-4" variant={lastClearStuckResponse.status ? "default" : "destructive"}>
                        <AlertTitle>{lastClearStuckResponse.message}</AlertTitle>
                        <AlertDescription>
                        {lastClearStuckResponse.result?.message}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

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
                                            <div className={`w-3 h-3 rounded-full ${etlStatus.data.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                            <span className="text-sm font-medium">Status</span>
                                        </div>
                                        <p className="text-lg font-semibold">
                                            {etlStatus.data.isRunning ? 'Running' : etlStatus.data.status || 'Idle'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Last Run</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            {etlStatus.data.lastRun?.start_date || 'Never'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium">Records Processed</span>
                                        </div>
                                        <p className="text-lg font-semibold">
                                            {etlStatus.data.lastRun?.total_records ? 
                                                parseInt(etlStatus.data.lastRun.total_records).toLocaleString() : '0'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {etlStatus.data.lastRun && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Last Run Details</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Start:</span>
                                                <p className="font-medium">{etlStatus.data.lastRun.start_date}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">End:</span>
                                                <p className="font-medium">{etlStatus.data.lastRun.end_date}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <Badge variant={etlStatus.data.lastRun.status === 'finished' ? 'default' : 'secondary'}>
                                                    {etlStatus.data.lastRun.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Offset:</span>
                                                <p className="font-medium">{parseInt(etlStatus.data.lastRun.offset || '0').toLocaleString()}</p>
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
                                    Riwayat
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
                                    onClick={fetchETLLogs}
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
                                                <Badge variant={log.status === 'finished' ? 'default' : 'secondary'}>
                                                    {log.status}
                                                </Badge>
                                                <span className="text-sm text-gray-600">ID: {log.id}</span>
                                                <span className="text-xs text-gray-500">({log.created_at})</span>
                                            </div>
                                            <span className="text-sm text-gray-500">{log.start_date}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Duration:</span>
                                                <p className="font-medium">
                                                    {log.duration || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Records:</span>
                                                <p className="font-medium">{parseInt(log.total_records || '0').toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Offset:</span>
                                                <p className="font-medium">{parseInt(log.offset || '0').toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">End:</span>
                                                <p className="font-medium">{log.end_date || 'N/A'}</p>
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
            </div>

            {/* Auto-refresh indicator */}
            {etlStatus?.data?.isRunning && (
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