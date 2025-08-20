"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Play, 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Database,
  Clock,
  Activity,
  Server,
  Eye,
  Zap
} from 'lucide-react';
import { 
  getSASETLHistory, 
  runSASETL, 
  getSASETLStatus, 
  testSASAPI 
} from '@/lib/api/etl-activity';
import { 
  SASETLHistoryResponse, 
  SASETLRunResponse, 
  SASETLStatusResponse, 
  SASETLTestAPIResponse 
} from '@/lib/etl-types';
import { useToast } from '@/hooks/use-toast';

export default function FetchStudentActivitySummary() {
  const [history, setHistory] = useState<SASETLHistoryResponse | null>(null);
  const [status, setStatus] = useState<SASETLStatusResponse | null>(null);
  const [testResult, setTestResult] = useState<SASETLTestAPIResponse | null>(null);
  const [etlRunResult, setEtlRunResult] = useState<SASETLRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { toast } = useToast();

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
    fetchStatus();
  }, [currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const response = await getSASETLHistory({ limit: pageSize, offset });
      setHistory(response);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ETL history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await getSASETLStatus();
      setStatus(response);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleRunETL = async () => {
    try {
      setRunning(true);
      const response = await runSASETL();
      setEtlRunResult(response);
      toast({
        title: "Success",
        description: response.message,
      });
      // Refresh data after successful run
      await Promise.all([fetchHistory(), fetchStatus()]);
    } catch (error) {
      console.error('Error running ETL:', error);
      toast({
        title: "Error",
        description: "Failed to run ETL process",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleTestAPI = async () => {
    try {
      setLoading(true);
      const response = await testSASAPI();
      setTestResult(response);
      toast({
        title: "Success",
        description: "API connection test completed",
      });
    } catch (error) {
      console.error('Error testing API:', error);
      toast({
        title: "Error",
        description: "Failed to test API connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-semibold">Student Activity Summary ETL Management</h2>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="w-4 h-4 text-blue-600" />
              ETL Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status:</span>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(status?.status?.status || 'unknown')}
                >
                  {status?.status?.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Running:</span>
                <Badge variant={status?.status?.isRunning ? "default" : "secondary"}>
                  {status?.status?.isRunning ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Run:</span>
                <span className="text-sm font-medium">
                  {status?.status?.nextRun || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-purple-600" />
              Last Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(status?.status?.lastRun?.status || 'unknown')}
                >
                  {status?.status?.lastRun?.status || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Start:</span>
                <span className="text-sm font-medium">
                  {status?.status?.lastRun?.start_date ? 
                    formatDate(status.status.lastRun.start_date) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">End:</span>
                <span className="text-sm font-medium">
                  {status?.status?.lastRun?.end_date ? 
                    formatDate(status.status.lastRun.end_date) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-green-600" />
              History Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Logs:</span>
                <span className="text-sm font-medium">
                  {history?.data?.pagination?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Page:</span>
                <span className="text-sm font-medium">
                  {history?.data?.pagination?.current_page || 1} / {history?.data?.pagination?.total_pages || 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Page Size:</span>
                <span className="text-sm font-medium">
                  {history?.data?.pagination?.limit || pageSize}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleRunETL} 
          disabled={running || status?.status?.isRunning}
          className="flex items-center gap-2"
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? 'Running ETL...' : 'Run ETL Process'}
        </Button>

        <Button 
          onClick={handleTestAPI} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Test API Connection
        </Button>

        <Button 
          onClick={() => Promise.all([fetchHistory(), fetchStatus()])} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Test API Results */}
      {testResult && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">API Test Results:</div>
              <div className="text-sm space-y-1">
                <div>Service: {testResult.data?.data?.status?.data?.service}</div>
                <div>Currently Running: {testResult.data?.data?.status?.data?.currently_running}</div>
                <div>Recent Activity: {testResult.data?.data?.status?.data?.recent_activity}</div>
                <div>Last Extracted: {testResult.data?.data?.status?.data?.watermark?.last_extracted_date}</div>
                <div>Available Tables: {testResult.data?.data?.availableTables?.join(', ')}</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ETL Run Results Table */}
      {etlRunResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              ETL Run Results
            </CardTitle>
            <CardDescription>
              Results from the last ETL process execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {etlRunResult.result.totalRecords}
                  </div>
                  <div className="text-sm text-green-600">Total Records</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {etlRunResult.result.results.length}
                  </div>
                  <div className="text-sm text-blue-600">Tables Processed</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">
                    {new Date(etlRunResult.result.timestamp).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-purple-600">Timestamp</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {etlRunResult.result.success ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-orange-600">Status</div>
                </div>
              </div>

              {/* Table Results */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Database Table</TableHead>
                    <TableHead>Records Processed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etlRunResult.result.results.map((tableResult, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{tableResult.table}</TableCell>
                      <TableCell className="font-mono text-sm">{tableResult.dbTable}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {tableResult.records}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          ✓ Success
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Success Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">ETL Process Completed Successfully</h4>
                    <p className="text-sm text-green-700">{etlRunResult.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETL Export Data Table (from Test API) */}
      {testResult?.data?.data?.export?.data && testResult.data.data.export.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              ETL Export Data
            </CardTitle>
            <CardDescription>
              Data extracted from the last ETL process run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResult.data.data.export.pagination.total_count}
                  </div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {testResult.data.data.export.pagination.count}
                  </div>
                  <div className="text-sm text-green-600">Current Page</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResult.data.data.export.pagination.limit}
                  </div>
                  <div className="text-sm text-purple-600">Page Size</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {testResult.data.data.export.pagination.offset}
                  </div>
                  <div className="text-sm text-orange-600">Offset</div>
                </div>
              </div>

              {/* Data Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Course ID</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>File Views</TableHead>
                    <TableHead>Video Views</TableHead>
                    <TableHead>Forum Views</TableHead>
                    <TableHead>Quiz Views</TableHead>
                    <TableHead>Assignment Views</TableHead>
                    <TableHead>URL Views</TableHead>
                    <TableHead>Total Views</TableHead>
                    <TableHead>Active Days</TableHead>
                    <TableHead>Extraction Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testResult.data.data.export.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.course_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {item.num_teachers}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {item.num_students}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.file_views}</TableCell>
                      <TableCell>{item.video_views}</TableCell>
                      <TableCell>{item.forum_views}</TableCell>
                      <TableCell>{item.quiz_views}</TableCell>
                      <TableCell>{item.assignment_views}</TableCell>
                      <TableCell>{item.url_views}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 font-semibold">
                          {item.total_views}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          {item.active_days}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.extraction_date).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Info */}
              {testResult.data.data.export.pagination.has_more && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Showing {testResult.data.data.export.pagination.count} of {testResult.data.data.export.pagination.total_count} records
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use pagination to view more records
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETL History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            ETL History
          </CardTitle>
          <CardDescription>
            Recent ETL process executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : history?.data?.logs?.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Offset</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>{formatDate(log.start_date)}</TableCell>
                      <TableCell>{formatDate(log.end_date)}</TableCell>
                      <TableCell>{formatDuration(log.duration)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(log.status)}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.offset}</TableCell>
                      <TableCell>{log.total_records}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {history.data.pagination.total_pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: history.data.pagination.total_pages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(history.data.pagination.total_pages, currentPage + 1))}
                          className={currentPage === history.data.pagination.total_pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ETL History</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No ETL processes have been run yet. Use the "Run ETL Process" button to start your first data extraction.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
