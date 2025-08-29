"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Activity, BarChart3, CheckCircle2, Database, FileText, Loader2, Play, RefreshCw, Trash2, Server, Clock, Info, Layers3 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/config";
import { API_CONFIG } from "@/lib/config";

// Local types for CELOEAPI SAS ETL endpoints
interface CeloeapiSasEtlStatusResponse {
  status: boolean;
  data: {
    last_run: {
      id: number;
      start_time: string;
      end_time: string;
      status: string;
      message: string;
      parameters: {
        trigger: string;
        message: string;
        start_date: string;
        end_date: string;
        concurrency: number;
        days_processed: number;
      };
      duration_seconds: string;
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
}

interface CeloeapiSasEtlRunResponse {
  status: boolean;
  message: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  concurrency: number;
  note: string;
  log_id: number;
}

interface CeloeapiSasEtlCleanResponse {
  status: boolean;
  message: string;
  summary: {
    tables: Record<string, number>;
    total_affected: number;
  };
  timestamp: string;
}

interface CeloeapiSasEtlLogsResponse {
  status: boolean;
  data: Array<{
    id: string;
    process_name: string;
    status: string;
    message: string;
    start_time: string;
    end_time: string;
    duration_seconds: string;
    extraction_date: string;
    parameters: string; // JSON string
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
  };
}

interface CeloeapiSasEtlExportResponse {
  status: boolean;
  data: {
    sas_user_activity_etl?: {
      count: number;
      hasNext: boolean;
      nextOffset: number | null;
      rows: Array<{
        id: string;
        course_id: string;
        num_teachers: string;
        num_students: string;
        file_views: string;
        video_views: string;
        forum_views: string;
        quiz_views: string;
        assignment_views: string;
        url_views: string;
        total_views: string;
        avg_activity_per_student_per_day: string | null;
        active_days: string;
        extraction_date: string;
        created_at: string;
        updated_at: string;
      }>;
    };
    sas_activity_counts_etl?: {
      count: number;
      hasNext: boolean;
      nextOffset: number | null;
      rows: Array<{
        id: string;
        courseid: string;
        file_views: string;
        video_views: string;
        forum_views: string;
        quiz_views: string;
        assignment_views: string;
        url_views: string;
        active_days: string;
        extraction_date: string;
        created_at: string;
        updated_at: string;
      }>;
    };
    sas_user_counts_etl?: {
      count: number;
      hasNext: boolean;
      nextOffset: number | null;
      rows: Array<{
        id: string;
        courseid: string;
        num_students: string;
        num_teachers: string;
        extraction_date: string;
        created_at: string;
        updated_at: string;
      }>;
    };
    sas_courses?: {
      count: number;
      hasNext: boolean;
      nextOffset: number | null;
      rows: Array<{
        course_id: string;
        subject_id: string;
        course_name: string;
        course_shortname: string;
        faculty_id: string;
        program_id: string;
        visible: string;
        created_at: string;
        updated_at: string;
      }>;
    };
  };
  has_next: boolean;
  filters: {
    date: string | null;
    course_id: string | null;
  };
  pagination: {
    limit: number;
    offset: number;
    count: number;
    has_more: boolean;
  };
}

function statusBadgeVariant(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "success") return "bg-green-100 text-green-800";
  if (s === "running" || s === "processing") return "bg-blue-100 text-blue-800";
  if (s === "failed" || s === "error") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

export default function EtlSasCeloeapiPage() {
  const { toast } = useToast();

  // Status
  const [status, setStatus] = useState<CeloeapiSasEtlStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Run / Clean
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastRun, setLastRun] = useState<CeloeapiSasEtlRunResponse | null>(null);
  const [lastClean, setLastClean] = useState<CeloeapiSasEtlCleanResponse | null>(null);
  
  // ETL Run Parameters
  const [startDate, setStartDate] = useState('2025-02-03');
  const [concurrency, setConcurrency] = useState(4);

  // Logs
  const [logs, setLogs] = useState<CeloeapiSasEtlLogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const logsLimit = 50;
  const logsOffset = useMemo(() => (logsPage - 1) * logsLimit, [logsPage]);

  // Export
  const [exp, setExp] = useState<CeloeapiSasEtlExportResponse | null>(null);
  const [expLoading, setExpLoading] = useState(false);
  const [expPage, setExpPage] = useState(1);
  const expLimit = 100;
  const expOffset = useMemo(() => (expPage - 1) * expLimit, [expPage]);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [logsPage]);

  useEffect(() => {
    refreshExport();
  }, [expPage]);

  async function refreshStatus() {
    try {
      setStatusLoading(true);
      const res = await getStatus();
      setStatus(res);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to fetch status", variant: "destructive" });
    } finally {
      setStatusLoading(false);
    }
  }

  async function refreshLogs() {
    try {
      setLogsLoading(true);
      const res = await getLogs(logsLimit, logsOffset);
      setLogs(res);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  }

  async function refreshExport() {
    try {
      setExpLoading(true);
      const res = await getExport(expLimit, expOffset);
      setExp(res);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to fetch export data", variant: "destructive" });
    } finally {
      setExpLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([refreshStatus(), refreshLogs(), refreshExport()]);
  }

  async function onRun() {
    try {
      setRunning(true);
      const res = await runEtl(startDate, concurrency);
      setLastRun(res);
      toast({ title: "ETL Started", description: res.message });
      await refreshStatus();
      await refreshLogs();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to start ETL", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  async function onClean() {
    try {
      setCleaning(true);
      const res = await cleanEtl();
      setLastClean(res);
      toast({ title: "Clean Completed", description: res.message });
      await refreshExport();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to clean tables", variant: "destructive" });
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-2">
        <Layers3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold">SAS CELOEAPI ETL</h2>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" /> Status
            </CardTitle>
            <CardDescription>Current service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service:</span>
              <Badge variant="outline">{status?.data?.service ?? "-"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Running:</span>
              <Badge variant={status?.data?.currently_running ? "default" : "secondary"}>
                {status?.data?.currently_running ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Activity:</span>
              <Badge variant="outline">{status?.data?.recent_activity ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Last Run
            </CardTitle>
            <CardDescription>Most recent completed task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={statusBadgeVariant(status?.data?.last_run?.status)} variant="outline">
                {status?.data?.last_run?.status ?? "-"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Start:</span>
              <span className="text-sm font-medium">{status?.data?.last_run?.start_time ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">End:</span>
              <span className="text-sm font-medium">{status?.data?.last_run?.end_time ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-green-600" /> Watermark
            </CardTitle>
            <CardDescription>Extraction checkpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Extracted Date:</span>
              <span className="text-sm font-medium">{status?.data?.watermark?.last_extracted_date ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Extract Date:</span>
              <span className="text-sm font-medium">{status?.data?.watermark?.next_extract_date ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Updated At:</span>
              <span className="text-sm font-medium">{status?.data?.watermark?.updated_at ?? "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ETL Run Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600" /> ETL Run Parameters
          </CardTitle>
          <CardDescription>Configure ETL execution parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="concurrency" className="text-sm font-medium text-gray-700">
                Concurrency
              </label>
              <input
                id="concurrency"
                type="number"
                min="1"
                max="10"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onRun} disabled={running} className="flex items-center gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Starting..." : "Run ETL"}
        </Button>
        <Button onClick={onClean} variant="destructive" disabled={cleaning} className="flex items-center gap-2">
          {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {cleaning ? "Cleaning..." : "Clean Tables"}
        </Button>
        <Button onClick={refreshAll} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Feedback alerts */}
      {lastRun && (
        <Alert>
          <AlertDescription className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-medium">{lastRun.message}</span>
            </div>
            <div className="text-sm text-gray-600">Log ID: {lastRun.log_id} | Range: {lastRun.date_range.start_date} → {lastRun.date_range.end_date}</div>
          </AlertDescription>
        </Alert>
      )}
      {lastClean && (
        <Alert>
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="font-medium">{lastClean.message}</span>
            </div>
            <div className="text-sm">Total affected: {lastClean.summary.total_affected}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(lastClean.summary.tables).map(([table, count]) => (
                <div key={table} className="text-xs p-2 bg-gray-50 rounded border">
                  <span className="font-mono">{table}</span>: <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Logs and Export */}
      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Logs</TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Export</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-600" /> ETL Logs</CardTitle>
              <CardDescription>Recent process logs</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs?.data && logs.data.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Process</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Duration (s)</TableHead>
                        <TableHead>Extract Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.data.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">{l.id}</TableCell>
                          <TableCell className="font-medium">{l.process_name}</TableCell>
                          <TableCell>
                            <Badge className={statusBadgeVariant(l.status)} variant="outline">{l.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px] truncate" title={l.message}>{l.message}</TableCell>
                          <TableCell className="text-xs">{l.start_time}</TableCell>
                          <TableCell className="text-xs">{l.end_time}</TableCell>
                          <TableCell className="text-center">{l.duration_seconds}</TableCell>
                          <TableCell className="text-xs">{l.extraction_date}</TableCell>
                          <TableCell className="text-xs">{l.created_at}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setLogsPage(Math.max(1, logsPage - 1))} className={logsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                        </PaginationItem>
                        {[1, 2, 3].map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink onClick={() => setLogsPage(p)} isActive={logsPage === p} className="cursor-pointer">{p}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext onClick={() => setLogsPage(logsPage + 1)} className="cursor-pointer" />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-600">No logs found.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-blue-600" /> Export Snapshot</CardTitle>
              <CardDescription>Latest exported rows summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-blue-50">
                  <div className="text-xs text-blue-700">Rows Count</div>
                  <div className="text-lg font-semibold text-blue-700">{exp?.pagination?.count ?? 0}</div>
                </div>
                <div className="p-3 rounded bg-green-50">
                  <div className="text-xs text-green-700">Limit</div>
                  <div className="text-lg font-semibold text-green-700">{exp?.pagination?.limit ?? 0}</div>
                </div>
                <div className="p-3 rounded bg-purple-50">
                  <div className="text-xs text-purple-700">Offset</div>
                  <div className="text-lg font-semibold text-purple-700">{exp?.pagination?.offset ?? 0}</div>
                </div>
                <div className="p-3 rounded bg-orange-50">
                  <div className="text-xs text-orange-700">Has More</div>
                  <div className="text-lg font-semibold text-orange-700">{exp?.pagination?.has_more ? "Yes" : "No"}</div>
                </div>
              </div>

              {/* Tables */}
              <div className="space-y-6">
                {exp?.data?.sas_user_activity_etl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      <div className="font-medium">sas_user_activity_etl ({exp.data.sas_user_activity_etl.count})</div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Teachers</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Total Views</TableHead>
                          <TableHead>Active Days</TableHead>
                          <TableHead>Extraction Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exp.data.sas_user_activity_etl.rows.map((r) => (
                          <TableRow key={`ua_${r.id}`}>
                            <TableCell className="font-mono text-xs">{r.id}</TableCell>
                            <TableCell>{r.course_id}</TableCell>
                            <TableCell>{r.num_teachers}</TableCell>
                            <TableCell>{r.num_students}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-100 text-purple-800">{r.total_views}</Badge>
                            </TableCell>
                            <TableCell>{r.active_days}</TableCell>
                            <TableCell className="text-xs">{r.extraction_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {exp?.data?.sas_activity_counts_etl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <div className="font-medium">sas_activity_counts_etl ({exp.data.sas_activity_counts_etl.count})</div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead>Video</TableHead>
                          <TableHead>Forum</TableHead>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Assignment</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Active Days</TableHead>
                          <TableHead>Extraction Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exp.data.sas_activity_counts_etl.rows.map((r) => (
                          <TableRow key={`ac_${r.id}`}>
                            <TableCell className="font-mono text-xs">{r.id}</TableCell>
                            <TableCell>{r.courseid}</TableCell>
                            <TableCell>{r.file_views}</TableCell>
                            <TableCell>{r.video_views}</TableCell>
                            <TableCell>{r.forum_views}</TableCell>
                            <TableCell>{r.quiz_views}</TableCell>
                            <TableCell>{r.assignment_views}</TableCell>
                            <TableCell>{r.url_views}</TableCell>
                            <TableCell>{r.active_days}</TableCell>
                            <TableCell className="text-xs">{r.extraction_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {exp?.data?.sas_user_counts_etl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UsersIcon />
                      <div className="font-medium">sas_user_counts_etl ({exp.data.sas_user_counts_etl.count})</div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Teachers</TableHead>
                          <TableHead>Extraction Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exp.data.sas_user_counts_etl.rows.map((r) => (
                          <TableRow key={`uc_${r.id}`}>
                            <TableCell className="font-mono text-xs">{r.id}</TableCell>
                            <TableCell>{r.courseid}</TableCell>
                            <TableCell>{r.num_students}</TableCell>
                            <TableCell>{r.num_teachers}</TableCell>
                            <TableCell className="text-xs">{r.extraction_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {exp?.data?.sas_courses && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookIcon />
                      <div className="font-medium">sas_courses ({exp.data.sas_courses.count})</div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course ID</TableHead>
                          <TableHead>Subject ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Shortname</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Visible</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exp.data.sas_courses.rows.map((r, idx) => (
                          <TableRow key={`c_${idx}`}>
                            <TableCell className="font-mono text-xs">{r.course_id}</TableCell>
                            <TableCell className="font-mono text-xs">{r.subject_id}</TableCell>
                            <TableCell>{r.course_name}</TableCell>
                            <TableCell className="font-mono text-xs">{r.course_shortname}</TableCell>
                            <TableCell>{r.faculty_id}</TableCell>
                            <TableCell>{r.program_id}</TableCell>
                            <TableCell>{r.visible}</TableCell>
                            <TableCell className="text-xs">{r.updated_at}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Export pagination (simple) */}
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setExpPage(Math.max(1, expPage - 1))} className={expPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {[1, 2, 3].map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink onClick={() => setExpPage(p)} isActive={expPage === p} className="cursor-pointer">{p}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setExpPage(expPage + 1)} className="cursor-pointer" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function getStatus(): Promise<CeloeapiSasEtlStatusResponse> {
  const response = await apiClient.getWithCustomBase<CeloeapiSasEtlStatusResponse>(
    API_CONFIG.BASE_URL,
    API_ENDPOINTS.SAS.ETL_CELOEAPI.STATUS
  );
  return response;
}

async function runEtl(startDate: string, concurrency: number): Promise<CeloeapiSasEtlRunResponse> {
  const requestBody = {
    start_date: startDate,
    concurrency: concurrency
  };
  
  const response = await apiClient.postWithCustomBase<CeloeapiSasEtlRunResponse>(
    API_CONFIG.BASE_URL,
    API_ENDPOINTS.SAS.ETL_CELOEAPI.RUN,
    requestBody
  );
  return response;
}

async function cleanEtl(): Promise<CeloeapiSasEtlCleanResponse> {
  const response = await apiClient.postWithCustomBase<CeloeapiSasEtlCleanResponse>(
    API_CONFIG.BASE_URL,
    API_ENDPOINTS.SAS.ETL_CELOEAPI.CLEAN,
    ""
  );
  return response;
}

async function getLogs(limit: number, offset: number): Promise<CeloeapiSasEtlLogsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String(offset));
  
  const endpoint = `${API_ENDPOINTS.SAS.ETL_CELOEAPI.LOGS}?${queryParams.toString()}`;
  
  const response = await apiClient.getWithCustomBase<CeloeapiSasEtlLogsResponse>(
    API_CONFIG.BASE_URL,
    endpoint
  );
  return response;
}

async function getExport(limit: number, offset: number): Promise<CeloeapiSasEtlExportResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String(offset));
  
  const endpoint = `${API_ENDPOINTS.SAS.ETL_CELOEAPI.EXPORT}?${queryParams.toString()}`;
  
  const response = await apiClient.getWithCustomBase<CeloeapiSasEtlExportResponse>(
    API_CONFIG.BASE_URL,
    endpoint
  );
  return response;
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M20 22H6.5A2.5 2.5 0 0 1 4 19.5V5a2 2 0 0 1 2-2H20z" />
    </svg>
  );
}
