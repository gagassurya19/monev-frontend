"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { 
    Database, 
    CheckCircle, 
    AlertCircle, 
    Lock,
    Activity,
    BookOpen,
    Globe,
    Cloud,
    Layers,
    Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import { ETLStatus, ETLLog } from '@/lib/etl-types';
import CeLOEETLTab from '@/components/admin/etl/etl-celoe-tab';
import ExternalAPIsETLTab from '@/components/admin/etl/etl-external-tab';

export default function AdminETLPage() {
    const { user, isAuthenticated } = useAuth();
    const [etlStatus, setEtlStatus] = useState<ETLStatus | null>(null);
    const [etlLogs, setEtlLogs] = useState<ETLLog[]>([]);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [logLimit, setLogLimit] = useState(5);
    const [logOffset, setLogOffset] = useState(0);
    const [hasConnectionError, setHasConnectionError] = useState(false);

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

    // Fetch ETL Status
    const fetchETLStatus = async () => {
        if (!isAuthenticated || !user?.admin) {
            return;
        }

        setIsLoadingStatus(true);
        try {
            const response = await apiClient.request<ETLStatus>(API_ENDPOINTS.ETL.STATUS, {
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                }
            });
            setEtlStatus(response);
            setHasConnectionError(false); // Reset error state on success
            console.log('Showing toast: Status Updated');
            toast({
                title: "Status Updated",
                description: "ETL status has been refreshed",
            });
        } catch (error: any) {
            setHasConnectionError(true); // Set error state
            // Don't show error toast for 401 errors (authentication issues)
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

    // Fetch ETL Logs
    const fetchETLLogs = async () => {
        if (!isAuthenticated || !user?.admin) {
            return;
        }

        setIsLoadingLogs(true);
        try {
            const response = await apiClient.request<{ status: boolean; data: { logs: ETLLog[] } }>(API_ENDPOINTS.ETL.LOGS, {
                headers: {
                    'Authorization': 'Bearer default-webhook-token-change-this'
                }
            }, {
                limit: logLimit,
                offset: logOffset
            });
            setEtlLogs(response.data?.logs || []);
            toast({
                title: "Logs Updated",
                description: "ETL logs have been refreshed",
            });
        } catch (error: any) {
            // Don't show error toast for 401 errors (authentication issues)
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

    // Auto-refresh status every 30 seconds
    useEffect(() => {
        // Only run if user is authenticated and admin
        if (!isAuthenticated || !user?.admin) {
            return;
        }

        // Add delay to prevent immediate API calls on page load
        const timer = setTimeout(() => {
            fetchETLStatus();
            fetchETLLogs();
        }, 1000);

        const interval = setInterval(() => {
            if (etlStatus?.data?.isRunning) {
                fetchETLStatus();
            }
        }, 30000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [isAuthenticated, user?.admin]); // Add dependencies

    return (
        <div className="p-6 w-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">ETL Management Center</h1>
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

            {/* Connection Error Alert */}
            {hasConnectionError && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <strong>Connection Error:</strong> Tidak dapat terhubung ke endpoint ETL. 
                        Pastikan backend API sudah berjalan dan endpoint ETL tersedia.
                    </AlertDescription>
                </Alert>
            )}

            {/* Main ETL Tabs */}
            <Tabs defaultValue="celoe" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="celoe" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        CeLOE ETL
                    </TabsTrigger>
                    <TabsTrigger value="external" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Chart ETL
                    </TabsTrigger>
                </TabsList>

                {/* CeLOE ETL Tab */}
                <TabsContent value="celoe" className="space-y-6 mt-6">
                    <CeLOEETLTab
                        etlStatus={etlStatus}
                        etlLogs={etlLogs}
                        isLoadingStatus={isLoadingStatus}
                        isLoadingLogs={isLoadingLogs}
                        logLimit={logLimit}
                        setLogLimit={setLogLimit}
                        fetchETLStatus={fetchETLStatus}
                        fetchETLLogs={fetchETLLogs}
                    />
                </TabsContent>

                {/* Chart ETL Tab */}
                <TabsContent value="external" className="space-y-6 mt-6">
                    <ExternalAPIsETLTab />
                </TabsContent>

            </Tabs>
        </div>
    );
} 