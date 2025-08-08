"use client";

import React, { useCallback, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/config";
import { useApiQuery, useApiMutation } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { formatDateTime, formatDuration } from "@/lib/utils/date-formatter";
import { Play, RefreshCw, Loader2, AlertCircle, FileText, Eye, CheckCircle, X, BarChart3 } from "lucide-react";

// Types for ETL Monev responses
interface ETLMonevLog {
  id: number;
  start_date: string;
  end_date: string;
  duration: string;
  status: string;
  total_records: number;
  offset: number;
  created_at: string;
}

interface ETLMonevHistoryResponse {
  status: boolean;
  message: string;
  data: {
    logs: ETLMonevLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      current_page: number;
      total_pages: number;
    };
  };
}

interface ETLMonevRunResponse {
  message: string;
  result: {
    success: boolean;
    message: string;
    timestamp: string;
  };
}

interface ETLMonevStatusResponse {
  status: {
    status: string;
    lastRun: ETLMonevLog;
    nextRun: string;
    isRunning: boolean;
    shouldRun: boolean;
  };
}

interface ETLMonevTestResponse {
  status: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    data: {
      tables: string[];
      totalRecords: number;
    };
  };
}

export default function FetchCoursePerformance() {
  const { token } = useAuth();
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ETLMonevLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create stable query functions
  const fetchHistoryQuery = useCallback(() => 
    apiClient.get<ETLMonevHistoryResponse>(API_ENDPOINTS.CP.ETL_MONEV.HISTORY, { limit, offset }), 
    [limit, offset]
  );

  // Fetch status using mutation instead of query with enabled: false
  const {
    data: statusData,
    isLoading: isStatusLoading,
    error: statusError,
    mutate: fetchStatus,
  } = useApiMutation<ETLMonevStatusResponse, void>(
    () => apiClient.get(API_ENDPOINTS.CP.ETL_MONEV.STATUS),
    {
      onSuccess: (data) => {
        toast({
          title: "Status Retrieved",
          description: "ETL status has been updated",
        });
      },
      onError: (err) => {
        toast({
          title: "Status Check Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    }
  );

  // Run ETL
  const {
    data: runData,
    isLoading: isRunLoading,
    error: runError,
    mutate: runETL,
  } = useApiMutation<ETLMonevRunResponse, void>(
    () => apiClient.post(API_ENDPOINTS.CP.ETL_MONEV.RUN),
    {
      onSuccess: (data) => {
        toast({
          title: "ETL Run Success",
          description: data.result.message,
        });
        // Delay refetch to allow server to process
        setTimeout(() => refetchHistory(), 1000);
      },
      onError: (err) => {
        toast({
          title: "ETL Run Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    }
  );

  // Test API
  const {
    data: testData,
    isLoading: isTestLoading,
    error: testError,
    mutate: testAPI,
  } = useApiMutation<ETLMonevTestResponse, void>(
    () => apiClient.get(API_ENDPOINTS.CP.ETL_MONEV.TRIGGER),
    {
      onSuccess: (data) => {
        toast({
          title: "API Test Success",
          description: data.data.message,
        });
      },
      onError: (err) => {
        toast({
          title: "API Test Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    }
  );

  // Fetch history
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useApiQuery<ETLMonevHistoryResponse>(
    fetchHistoryQuery,
    [limit, offset]
  );

  // Handlers
  const handleOpenDetail = (log: ETLMonevLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleRefreshHistory = () => {
    refetchHistory();
    toast({
      title: "Refreshing",
      description: "Fetching latest logs...",
    });
  };

  const handleCheckStatus = () => {
    fetchStatus();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold">ETL Monev - Fetch Course Performance</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runETL()} disabled={isRunLoading} className="h-10">
            {isRunLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run ETL
          </Button>
          <Button onClick={handleCheckStatus} disabled={isStatusLoading} variant="secondary" className="h-10">
            {isStatusLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check Status
          </Button>
          <Button onClick={() => testAPI()} disabled={isTestLoading} variant="outline" className="h-10">
            {isTestLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Test API
          </Button>
        </div>
      </div>

      {/* Status Result */}
      {statusData && (
        <Alert className="mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle>Status: {statusData.status.status}</AlertTitle>
          <AlertDescription>
            {statusData.status.isRunning ? (
              <Badge variant="default">Running</Badge>
            ) : (
              <Badge variant="secondary">Idle</Badge>
            )}
            <span className="ml-2">Next Run: {statusData.status.nextRun}</span>
          </AlertDescription>
        </Alert>
      )}
      {statusError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{statusError.message}</AlertDescription>
        </Alert>
      )}

      {/* Test API Result */}
      {testData && (
        <Alert className="mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle>API Test</AlertTitle>
          <AlertDescription>
            <span className="mr-2">{testData.data.message}</span>
            <Badge variant={testData.data.success ? "default" : "destructive"}>
              {testData.data.success ? "Connected" : "Failed"}
            </Badge>
            <span className="ml-2">Total Records: {testData.data.data.totalRecords}</span>
          </AlertDescription>
        </Alert>
      )}
      {testError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{testError.message}</AlertDescription>
        </Alert>
      )}

      {/* Run ETL Result */}
      {runData && (
        <Alert className="mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle>ETL Run Result</AlertTitle>
          <AlertDescription>
            <Badge variant={runData.result.success ? "default" : "destructive"}>
              {runData.result.success ? "Success" : "Failed"}
            </Badge>
            <span className="ml-2">{runData.result.message}</span>
            <span className="ml-2">{formatDateTime(runData.result.timestamp)}</span>
          </AlertDescription>
        </Alert>
      )}
      {runError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{runError.message}</AlertDescription>
        </Alert>
      )}

      {/* History Table Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Fetch Logs History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="limit" className="text-sm">Limit:</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="w-20"
                min={1}
                max={100}
              />
              <Label htmlFor="offset" className="text-sm">Offset:</Label>
              <Input
                id="offset"
                type="number"
                value={offset}
                onChange={e => setOffset(Number(e.target.value))}
                className="w-20"
                min={0}
              />
              <Button
                variant="outline"
                onClick={handleRefreshHistory}
                disabled={isHistoryLoading}
              >
                {isHistoryLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : historyError ? (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{historyError.message}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {historyData?.data.logs.length ? (
                historyData.data.logs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={log.status === "finished" ? "default" : "secondary"}>{log.status}</Badge>
                        <span className="text-sm text-gray-600">ID: {log.id}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
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
                        <p className="font-medium">{formatDateTime(log.end_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{log.duration}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Records:</span>
                        <p className="font-medium">{log.total_records?.toLocaleString() ?? 0}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No log data available. Click "Refresh Logs" to load.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Log Details - ID: {selectedLog?.id}</DialogTitle>
            <DialogDescription>
              Informasi detail untuk proses ETL ini
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            {selectedLog ? (
              <div className="space-y-2">
                <div className="flex gap-4">
                  <div>
                    <span className="text-gray-600">Start:</span>
                    <p className="font-medium">{formatDateTime(selectedLog.start_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">End:</span>
                    <p className="font-medium">{formatDateTime(selectedLog.end_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">{selectedLog.duration}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Records:</span>
                    <p className="font-medium">{selectedLog.total_records?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={selectedLog.status === "finished" ? "default" : "secondary"} className="ml-2">
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Created At:</span>
                  <p className="font-medium">{formatDateTime(selectedLog.created_at)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No log selected.</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
