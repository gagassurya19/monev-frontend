"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    CheckCircle,
    Lock,
    Activity,
    BookOpen,
    Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, RefreshCw, FileText, Clock, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';
import { formatDateTime } from '@/lib/utils/date-formatter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminETLCPPage() {
    const { user, isAuthenticated } = useAuth();
    const [isRunningAll, setIsRunningAll] = useState(false);
    const [step, setStep] = useState<'idle' | 'celoe' | 'monev' | 'done' | 'error'>('idle');
    const stepRef = useRef<'idle' | 'celoe' | 'monev' | 'done' | 'error'>('idle');
    useEffect(() => { stepRef.current = step; }, [step]);
    const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
    const [orchestratorSteps, setOrchestratorSteps] = useState<any[] | null>(null);
    const [orchestrationId, setOrchestrationId] = useState<string | null>(null);
    const [orchestratorInfo, setOrchestratorInfo] = useState<{ message: string; orchestrationId: string | null; steps?: any[] } | null>(null);
    const [stopResult, setStopResult] = useState<{ message: string; stoppedCount: number; stoppedProcesses?: any[] } | null>(null);
    const [isStopping, setIsStopping] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAutoRefreshingRef = useRef<boolean>(false);
    const celoeAttemptsRef = useRef<number>(0);
    const monevAttemptsRef = useRef<number>(0);

    // Unified controls
    const [startDate, setStartDate] = useState('2025-02-03');
    const [concurrency, setConcurrency] = useState(4);

    // CeLOE state
    const [cStatus, setCStatus] = useState<any>(null);
    const [cLoadingStatus, setCLoadingStatus] = useState(false);
    const [cLogs, setCLogs] = useState<any[]>([]);
    const [cLoadingLogs, setCLoadingLogs] = useState(false);
    const [cLimit, setCLimit] = useState(5);
    const [cOffset] = useState(0);

    // Monev state
    const [mStatus, setMStatus] = useState<any>(null);
    const [mLoadingStatus, setMLoadingStatus] = useState(false);
    const [mLogs, setMLogs] = useState<any[]>([]);
    const [mLoadingLogs, setMLoadingLogs] = useState(false);
    const [mLimit, setMLimit] = useState(5);
    const [mOffset, setMOffset] = useState(0);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // CeLOE helpers
    const fetchCeloeStatus = async () => {
        setCLoadingStatus(true);
        try {
            const res = await apiClient.get(API_ENDPOINTS.CP.ETL.STATUS);
            setCStatus(res);
        } finally {
            setCLoadingStatus(false);
        }
    };

    const fetchCeloeLogs = async () => {
        setCLoadingLogs(true);
        try {
            const res: any = await apiClient.get(API_ENDPOINTS.CP.ETL.LOGS, { limit: cLimit, offset: cOffset });
            setCLogs(res?.data ?? []);
        } finally {
            setCLoadingLogs(false);
        }
    };

    const runCeloe = async () => {
        await apiClient.post(API_ENDPOINTS.CP.ETL.RUN, { start_date: startDate, concurrency });
    };

    const pollCeloeUntilFinished = async () => {
        let attempts = 0;
        while (attempts < 180) {
            const status: any = await apiClient.get(API_ENDPOINTS.CP.ETL.STATUS);
            setCStatus(status);
            const code = status?.data?.last_run?.status_code;
            if (code === 1) return; // finished
            if (code === 3) throw new Error('CeLOE ETL failed');
            attempts += 1;
            await sleep(5000);
        }
        throw new Error('CeLOE ETL timeout');
    };

    // Monev helpers
    const fetchMonevStatus = async () => {
        setMLoadingStatus(true);
        try {
            const res = await apiClient.get(API_ENDPOINTS.CP.ETL_CP.STATUS);
            setMStatus(res);
        } finally {
            setMLoadingStatus(false);
        }
    };

    const fetchMonevLogs = async () => {
        setMLoadingLogs(true);
        try {
            const res: any = await apiClient.get(API_ENDPOINTS.CP.ETL_CP.HISTORY, { limit: mLimit, offset: mOffset });
            setMLogs(res?.data?.logs ?? []);
        } finally {
            setMLoadingLogs(false);
        }
    };

    const runMonev = async () => {
        await apiClient.post(API_ENDPOINTS.CP.ETL_CP.RUN);
    };

    const pollMonevUntilFinished = async () => {
        let attempts = 0;
        while (attempts < 180) {
            const status: any = await apiClient.get(API_ENDPOINTS.CP.ETL_CP.STATUS);
            setMStatus(status);
            const isRunning = status?.status?.isRunning;
            const lastStatus = status?.status?.lastRun?.status;
            if (!isRunning && lastStatus) {
                if (lastStatus !== 'finished') throw new Error('Monev ETL failed');
                return;
            }
            attempts += 1;
            await sleep(5000);
        }
        throw new Error('Monev ETL timeout');
    };

    const stopPipeline = async () => {
        if (isStopping) return;
        setIsStopping(true);
        setStopResult(null);
        try {
            const response: any = await apiClient.post(API_ENDPOINTS.CP.ETL.STOP_PIPELINE);
            
            if (response.status === true) {
                setStopResult({
                    message: response.message,
                    stoppedCount: response.stopped_count,
                    stoppedProcesses: response.stopped_processes
                });
                
                // Reset state after stopping
                setStep('idle');
                setOrchestratorError(null);
                setOrchestratorSteps(null);
                setOrchestrationId(null);
                setOrchestratorInfo(null);
                stopPolling();
                stopAutoRefresh();
                
                // Refresh status
                await Promise.all([fetchCeloeStatus(), fetchMonevStatus()]);
            } else {
                setOrchestratorError(response.message || 'Failed to stop pipeline');
            }
        } catch (e: any) {
            console.error('Failed to stop pipeline:', e);
            setOrchestratorError(e?.message || 'Failed to stop pipeline');
        } finally {
            setIsStopping(false);
        }
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const startAutoRefresh = () => {
        if (autoRefreshRef.current) return;
        autoRefreshRef.current = setInterval(async () => {
            if (isAutoRefreshingRef.current) return;
            // Skip if orchestration polling is active
            if (pollingRef.current) return;
            try {
                isAutoRefreshingRef.current = true;
                await Promise.all([
                    fetchCeloeStatus(),
                    fetchMonevStatus(),
                ]);
                // Refresh logs less aggressively by alternating
                await Promise.all([
                    fetchCeloeLogs(),
                    fetchMonevLogs(),
                ]);
            } catch (e) {
                // no-op
            } finally {
                isAutoRefreshingRef.current = false;
            }
        }, 3000); // 3s
    };

    const stopAutoRefresh = () => {
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
            autoRefreshRef.current = null;
        }
    };

    useEffect(() => {
        // Do not auto-refresh on mount. Only enable after Run All is clicked.
        return () => {
            stopPolling();
            stopAutoRefresh();
        };
    }, []);

    const runAll = async () => {
        if (isRunningAll) return;
        setIsRunningAll(true);
        setStep('celoe');
        setOrchestratorError(null);
        setOrchestratorSteps(null);
        setOrchestrationId(null);
        setOrchestratorInfo(null);
        stopPolling();
        stopAutoRefresh();
        celoeAttemptsRef.current = 0;
        monevAttemptsRef.current = 0;
        try {
            // Call new backend orchestrator so it continues if tab closes
            const resp: any = await apiClient.post(API_ENDPOINTS.CP.ETL_CP.ORCHESTRATE, {
                start_date: startDate,
                concurrency,
            });
            if (resp && resp.success === false) {
                setOrchestratorError(resp.error || resp.message || 'Orchestration failed');
                setOrchestratorSteps(resp.steps || null);
                setStep('error');
                // Stop auto-refresh on error state
                stopAutoRefresh();
                return;
            }
            // Orchestration started successfully; save ID and begin polling
            if (resp?.orchestrationId) setOrchestrationId(resp.orchestrationId);
            setOrchestratorInfo({ message: resp?.message || 'Orchestration started', orchestrationId: resp?.orchestrationId || null, steps: resp?.steps });
            await fetchCeloeStatus();
            await fetchMonevStatus();

            // Start polling: first watch CeLOE until finished, then Monev until finished
            pollingRef.current = setInterval(async () => {
                try {
                    const currentStep = stepRef.current;
                    if (currentStep === 'celoe') {
                        // Direct status read avoids stale closure
                        const status: any = await apiClient.get(API_ENDPOINTS.CP.ETL.STATUS);
                        setCStatus(status);
                        // also refresh logs during run
                        await fetchCeloeLogs();
                        const code = status?.data?.last_run?.status_code;
                        if (code === 1) {
                            setStep('monev');
                        } else if (code === 3) {
                            setStep('error');
                            stopPolling();
                            stopAutoRefresh();
                        } else {
                            celoeAttemptsRef.current += 1;
                            if (celoeAttemptsRef.current > 180) {
                                setOrchestratorError('CeLOE ETL timeout');
                                setStep('error');
                                stopPolling();
                                stopAutoRefresh();
                            }
                        }
                    } else if (currentStep === 'monev') {
                        const mStatusNow: any = await apiClient.get(API_ENDPOINTS.CP.ETL_CP.STATUS);
                        setMStatus(mStatusNow);
                        // refresh logs during run
                        await fetchMonevLogs();
                        const isRunning = mStatusNow?.status?.isRunning;
                        const lastStatus = mStatusNow?.status?.lastRun?.status;
                        if (!isRunning && lastStatus) {
                            if (lastStatus === 'finished') {
                                // one more refresh both sides then done
                                await Promise.all([
                                    fetchMonevStatus(),
                                    fetchMonevLogs(),
                                    fetchCeloeStatus(),
                                    fetchCeloeLogs(),
                                ]);
                                setStep('done');
                            } else {
                                setStep('error');
                            }
                            stopPolling();
                            stopAutoRefresh();
                        } else {
                            monevAttemptsRef.current += 1;
                            if (monevAttemptsRef.current > 180) {
                                setOrchestratorError('Monev ETL timeout');
                                setStep('error');
                                stopPolling();
                                stopAutoRefresh();
                            }
                        }
                    }
                } catch (e) {
                    console.error('Polling error', e);
                }
            }, 5000);
        } catch (e: any) {
            setStep('error');
            const message = e?.message || 'Failed to start orchestration';
            setOrchestratorError(message);
            // capture any server-provided details if present
            if (e?.details?.error || e?.details?.message) {
                setOrchestratorError(e?.details?.error || e?.details?.message);
            }
            console.error(e);
            // Stop auto-refresh on error state
            stopAutoRefresh();
        } finally {
            setIsRunningAll(false);
        }
    };

    useEffect(() => {
        fetchCeloeStatus();
        fetchCeloeLogs();
        fetchMonevStatus();
        fetchMonevLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check if user is admin
    if (!isAuthenticated || !user?.admin) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-red-600">Access Denied</CardTitle>
                        <CardDescription>
                            This page is only accessible to admin users
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-gray-600">
                            {!isAuthenticated ? 'Please log in to continue' : 'You do not have admin privileges'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 w-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">ETL & Fetch | Course Performance</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Admin Access
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Activity className="w-3 h-3 mr-1" />
                        Background Process
                    </Badge>
                </div>
            </div>

            {/* Orchestrator (single control area) */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-green-600" />
                        Orchestrator
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {orchestratorInfo && (
                        <Alert className="mb-4">
                            <AlertTitle>{orchestratorInfo.message}</AlertTitle>
                            <AlertDescription>
                                <div className="text-xs text-gray-700">
                                    Orchestration ID: {orchestratorInfo.orchestrationId || '-'}
                                    {orchestratorInfo.steps && orchestratorInfo.steps.length > 0 && (
                                        <div className="mt-2">
                                            Steps:
                                            <ul className="list-disc pl-5">
                                                {orchestratorInfo.steps.map((s: any, idx: number) => (
                                                    <li key={idx}>
                                                        {s.name}: {s.status}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    {orchestratorError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Orchestration Failed</AlertTitle>
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="text-sm">{orchestratorError}</div>
                                    {orchestratorSteps && orchestratorSteps.length > 0 && (
                                        <div className="text-xs text-gray-700">
                                            Steps:
                                            <ul className="list-disc pl-5">
                                                {orchestratorSteps.map((s: any, idx: number) => (
                                                    <li key={idx}>
                                                        {s.name}: {s.status}{s.error ? ` - ${s.error}` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    {stopResult && (
                        <Alert className="mb-4">
                            <AlertTitle>Pipeline Stopped</AlertTitle>
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="text-sm">{stopResult.message}</div>
                                    <div className="text-xs text-gray-700">
                                        Stopped Count: {stopResult.stoppedCount}
                                        {stopResult.stoppedProcesses && stopResult.stoppedProcesses.length > 0 && (
                                            <div className="mt-2">
                                                Stopped Processes:
                                                <ul className="list-disc pl-5">
                                                    {stopResult.stoppedProcesses.map((process: any, idx: number) => (
                                                        <li key={idx}>
                                                            Log ID: {process.log_id} | 
                                                            Started: {process.start_time} | 
                                                            Stopped: {process.stopped_at}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Concurrency</label>
                            <Input type="number" min={1} max={10} value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={runAll} disabled={isRunningAll} className="h-10 flex-1">
                                {isRunningAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                Run All (CeLOE → Monev)
                            </Button>
                            <Button 
                                onClick={stopPipeline} 
                                disabled={isStopping || step === 'idle'} 
                                variant="destructive" 
                                className="h-10 px-4"
                            >
                                {isStopping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                                Stop
                            </Button>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        {step === 'idle' && 'Idle'}
                        {step === 'celoe' && 'Running CeLOE ETL...'}
                        {step === 'monev' && 'Running Monev ETL...'}
                        {step === 'done' && 'All finished'}
                        {step === 'error' && 'Failed. Check logs below.'}
                    </div>
                </CardContent>
            </Card>

            {/* Standardized Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CeLOE */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-semibold">CeLOE Backend</span>
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Status
                                </CardTitle>
                                <Button variant="outline" onClick={fetchCeloeStatus} disabled={cLoadingStatus}>
                                    {cLoadingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {cStatus ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${cStatus.data?.last_run?.status_code === 2 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                            <span className="text-sm font-medium">State</span>
                                        </div>
                                        <p className="text-lg font-semibold">{cStatus.data?.last_run?.status_code === 2 ? 'Running' : 'Idle'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Last Run</span>
                                        </div>
                                        <div className="text-sm">
                                            {cStatus.data?.last_run ? formatDateTime(cStatus.data.last_run.start_date) : 'Never'}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium">Records</span>
                                        </div>
                                        <div className="text-lg font-semibold">{cStatus.data?.last_run?.numrow ?? 0}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600">No status. Click Refresh.</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Logs
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Limit</label>
                                    <Input className="w-20" type="number" min={1} max={100} value={cLimit} onChange={(e) => setCLimit(Number(e.target.value))} />
                                    <Button variant="outline" onClick={fetchCeloeLogs} disabled={cLoadingLogs}>
                                        {cLoadingLogs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {cLogs?.length ? (
                                <div className="space-y-3">
                                    {cLogs.map((log: any) => (
                                        <div key={log.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={log.status === '1' ? 'default' : log.status === '3' ? 'destructive' : 'secondary'}>
                                                        {log.status === '1' ? 'Finished' : log.status === '2' ? 'In Progress' : log.status === '3' ? 'Error' : 'Unknown'}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">ID: {log.id}</span>
                                                    <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Start</span>
                                                    <p className="font-medium">{formatDateTime(log.start_date)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">End</span>
                                                    <p className="font-medium">{log.end_date ? formatDateTime(log.end_date) : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Records</span>
                                                    <p className="font-medium">{parseInt(log.numrow || '0').toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Duration</span>
                                                    <p className="font-medium">{log.duration_seconds ? `${log.duration_seconds}s` : 'N/A'}</p>
                                                </div>
                                            </div>
                                            {/* {log.message && (
                                                <div className="mt-2 pt-2 border-t text-xs text-gray-700">{log.message}</div>
                                            )} */}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No log data.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Monev */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-semibold">Monev Backend</span>
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Status
                                </CardTitle>
                                <Button variant="outline" onClick={fetchMonevStatus} disabled={mLoadingStatus}>
                                    {mLoadingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {mStatus ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${mStatus.status?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                            <span className="text-sm font-medium">State</span>
                                        </div>
                                        <p className="text-lg font-semibold">{mStatus.status?.isRunning ? 'Running' : 'Idle'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Last Run</span>
                                        </div>
                                        <div className="text-sm">
                                            {mStatus.status?.lastRun ? formatDateTime(mStatus.status.lastRun.end_date) : 'Never'}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium">Records</span>
                                        </div>
                                        <div className="text-lg font-semibold">{mStatus.status?.lastRun?.total_records ?? 0}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600">No status. Click Refresh.</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Logs
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Limit</label>
                                    <Input className="w-20" type="number" min={1} max={100} value={mLimit} onChange={(e) => setMLimit(Number(e.target.value))} />
                                    <Button variant="outline" onClick={fetchMonevLogs} disabled={mLoadingLogs}>
                                        {mLoadingLogs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {mLogs?.length ? (
                                <div className="space-y-3">
                                    {mLogs.map((log: any) => (
                                        <div key={log.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={log.status === 'finished' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                                                        {log.status}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">ID: {log.id}</span>
                                                    <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Start</span>
                                                    <p className="font-medium">{formatDateTime(log.start_date)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">End</span>
                                                    <p className="font-medium">{formatDateTime(log.end_date)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Duration</span>
                                                    <p className="font-medium">{log.duration}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Records</span>
                                                    <p className="font-medium">{log.total_records?.toLocaleString?.() ?? 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No log data.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}