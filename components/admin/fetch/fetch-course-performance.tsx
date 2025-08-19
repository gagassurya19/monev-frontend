"use client";

import React, { useCallback, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/utils/date-formatter";
import { Play, RefreshCw, Loader2, AlertCircle, FileText, Eye, CheckCircle, BarChart3, Table } from "lucide-react";

// Types for ETL CP responses
interface ETLCPLog {
  id: number;
  start_date: string;
  end_date: string;
  duration: string;
  status: string;
  total_records: number;
  offset: number;
  created_at: string;
}

interface ETLCPHistoryResponse {
  status: boolean;
  message: string;
  data: {
    logs: ETLCPLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      current_page: number;
      total_pages: number;
    };
  };
}

interface ETLCPRunResponse {
  message: string;
  result: {
    success: boolean;
    message: string;
    timestamp: string;
    totalRecords: number;
    results: Array<{
      table: string;
      dbTable: string;
      records: number;
    }>;
  };
}

interface ETLCPStatusResponse {
  status: {
    status: string;
    lastRun: {
      id: number;
      start_date: string;
      end_date: string;
      status: string;
      total_records: number;
      offset: number;
    };
    nextRun: string;
    isRunning: boolean;
    shouldRun: boolean;
  };
}

interface ETLCPTestResponse {
  status: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    data: {
      status: {
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
          };
          service: string;
        };
      };
      export: {
        success: boolean;
        limit: number;
        offset: number;
        hasNext: boolean;
        tables: Record<string, {
          count: number;
          hasNext: boolean;
          nextOffset: number;
          rows: Array<Record<string, any>>;
          debug: {
            totalCount: number;
            filteredCount: number | null;
          };
        }>;
        debug: {
          database: string;
        };
      };
      availableTables: string[];
    };
  };
}

export default function FetchCoursePerformance() {
  const { token } = useAuth();
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ETLCPLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create stable query functions
  const fetchHistoryQuery = useCallback(() => 
    apiClient.get<ETLCPHistoryResponse>(API_ENDPOINTS.CP.ETL_CP.HISTORY, { limit, offset }), 
    [limit, offset]
  );

  // Fetch status using mutation
  const {
    data: statusData,
    isLoading: isStatusLoading,
    error: statusError,
    mutate: fetchStatus,
  } = useApiMutation<ETLCPStatusResponse, void>(
    () => apiClient.get(API_ENDPOINTS.CP.ETL_CP.STATUS),
    {
      onSuccess: (data) => {
        toast({
          title: "Status Retrieved",
          description: "ETL CP status has been updated",
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
  } = useApiMutation<ETLCPRunResponse, void>(
    () => apiClient.post(API_ENDPOINTS.CP.ETL_CP.RUN),
    {
      onSuccess: (data) => {
        toast({
          title: "ETL CP Run Success",
          description: data.result.message,
        });
        setTimeout(() => refetchHistory(), 1000);
      },
      onError: (err) => {
        toast({
          title: "ETL CP Run Failed",
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
  } = useApiMutation<ETLCPTestResponse, void>(
    () => apiClient.get(API_ENDPOINTS.CP.ETL_CP.TEST_API),
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
  } = useApiQuery<ETLCPHistoryResponse>(
    fetchHistoryQuery,
    [limit, offset]
  );

  // Handlers
  const handleOpenDetail = (log: ETLCPLog) => {
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
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">ETL CP - Fetch Course Performance</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runETL()} disabled={isRunLoading} className="h-10">
            {isRunLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run ETL CP
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
            <div className="flex items-center gap-2 mt-2">
              {statusData.status.isRunning ? (
                <Badge variant="default">Running</Badge>
              ) : (
                <Badge variant="secondary">Idle</Badge>
              )}
              <span>Next Run: {statusData.status.nextRun}</span>
              {statusData.status.status === 'paused' && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Paused
                </Badge>
              )}
            </div>
            {statusData.status.lastRun && (
              <div className="mt-2 text-sm text-gray-600">
                Last Run: {formatDateTime(statusData.status.lastRun.end_date)} • 
                Records: {statusData.status.lastRun.total_records} • 
                Status: <Badge variant={statusData.status.lastRun.status === 'finished' ? 'default' : 'destructive'} className="ml-1">
                  {statusData.status.lastRun.status}
                </Badge>
              </div>
            )}
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{testData.data.message}</span>
                <Badge variant={testData.data.success ? "default" : "destructive"}>
                  {testData.data.success ? "Connected" : "Failed"}
                </Badge>
              </div>
              {testData.data.data.export && (
                <div className="text-sm text-gray-600">
                  <div>Database: {testData.data.data.export.debug.database}</div>
                  <div>Available Tables: {testData.data.data.availableTables.join(', ')}</div>
                </div>
              )}
            </div>
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
          <AlertTitle>ETL CP Run Result</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={runData.result.success ? "default" : "destructive"}>
                  {runData.result.success ? "Success" : "Failed"}
                </Badge>
                <span>{runData.result.message}</span>
                <span className="text-sm text-gray-600">{formatDateTime(runData.result.timestamp)}</span>
              </div>
              {runData.result.success && (
                <div className="text-sm">
                  <div className="font-medium mb-2">Tables Processed:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {runData.result.results.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Table className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-xs">{result.table}</div>
                          <div className="text-xs text-gray-600">{result.records} records</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Total Records: {runData.result.totalRecords}
                  </div>
                </div>
              )}
            </div>
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
              ETL CP Logs History
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
                        <Badge 
                          variant={log.status === "finished" ? "default" : log.status === "failed" ? "destructive" : "secondary"}
                        >
                          {log.status}
                        </Badge>
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
            <DialogTitle>ETL CP Log Details - ID: {selectedLog?.id}</DialogTitle>
            <DialogDescription>
              Informasi detail untuk proses ETL CP ini
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Start:</span>
                    <p className="font-medium">{formatDateTime(selectedLog.start_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">End:</span>
                    <p className="font-medium">{formatDateTime(selectedLog.end_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Duration:</span>
                    <p className="font-medium">{selectedLog.duration}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Records:</span>
                    <p className="font-medium">{selectedLog.total_records?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 text-sm">Status:</span>
                    <Badge 
                      variant={selectedLog.status === "finished" ? "default" : selectedLog.status === "failed" ? "destructive" : "secondary"} 
                      className="ml-2"
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Created At:</span>
                    <p className="font-medium">{formatDateTime(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Offset:</span>
                    <p className="font-medium">{selectedLog.offset}</p>
                  </div>
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
