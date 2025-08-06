"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Database, 
    CheckCircle, 
    Lock,
    Activity,
    BarChart3,
    Settings,
    Shield,
    AlertTriangle,
    Clock,
    Server,
    Cpu,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getHealthStatus, HealthResponse } from '@/lib/api/health';

export default function AdminPage() {
    const { user, isAuthenticated } = useAuth();
    const [healthData, setHealthData] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch health data
    useEffect(() => {
        const fetchHealthData = async () => {
            try {
                setLoading(true);
                const data = await getHealthStatus();
                setHealthData(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch system health data');
                console.error('Health API error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && user?.admin) {
            fetchHealthData();
        }
    }, [isAuthenticated, user?.admin]);

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

    // Format uptime from seconds to human readable
    const formatUptime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    // System stats based on health data
    const getSystemStats = () => {
        if (!healthData) return [];

        return [
            {
                title: "System Status",
                value: healthData.status === 'healthy' ? 'Online' : 'Offline',
                change: healthData.checks.database.status,
                icon: healthData.status === 'healthy' ? CheckCircle : AlertTriangle,
                color: healthData.status === 'healthy' ? "text-emerald-600" : "text-red-600",
                bgColor: healthData.status === 'healthy' ? "bg-emerald-50" : "bg-red-50"
            },
            {
                title: "Uptime",
                value: formatUptime(healthData.uptime),
                change: `v${healthData.version}`,
                icon: Clock,
                color: "text-blue-600",
                bgColor: "bg-blue-50"
            },
            {
                title: "Database",
                value: healthData.checks.database.status === 'healthy' ? 'Connected' : 'Disconnected',
                change: healthData.checks.database.message || '',
                icon: Database,
                color: healthData.checks.database.status === 'healthy' ? "text-green-600" : "text-red-600",
                bgColor: healthData.checks.database.status === 'healthy' ? "bg-green-50" : "bg-red-50"
            },
            {
                title: "Memory Usage",
                value: healthData.checks.memory.usage.heapUsed,
                change: healthData.checks.memory.status,
                icon: Cpu,
                color: healthData.checks.memory.status === 'healthy' ? "text-purple-600" : "text-orange-600",
                bgColor: healthData.checks.memory.status === 'healthy' ? "bg-purple-50" : "bg-orange-50"
            }
        ];
    };

    const quickActions = [
        {
            title: "Transform Data Course Performance",
            description: "Course Perfomance data transformation from Moodle to Celoeapi | Celoeapi to Monev",
            href: "/admin/etl-cp",
            icon: Database,
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Transform Data Student Activities Summary",
            description: "Student Activities Summary data transformation from Moodle to Celoeapi | Celoeapi to Monev",
            href: "/admin/etl-sas",
            icon: Database,
            color: "text-red-600",
            bgColor: "bg-red-50"
        },
        {
            title: "Token Generator",
            description: "Generate JWT tokens user access",
            href: "/token-generator",
            icon: Shield,
            color: "text-gray-600",
            bgColor: "bg-gray-50"
        },
    ];

    if (loading) {
        return (
            <div className="p-6 w-full">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading system health data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 w-full">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <CardTitle className="text-red-600">Connection Error</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button onClick={() => window.location.reload()}>
                                Retry Connection
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 w-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">System administration and monitoring center</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Admin Access
                    </Badge>
                    <Badge 
                        variant="outline" 
                        className={healthData?.status === 'healthy' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                    >
                        <Activity className="w-3 h-3 mr-1" />
                        {healthData?.status === 'healthy' ? 'System Online' : 'System Offline'}
                    </Badge>
                    {healthData && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Server className="w-3 h-3 mr-1" />
                            {healthData.service} v{healthData.version}
                        </Badge>
                    )}
                </div>
            </div>

            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {getSystemStats().map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.change}</p>
                                </div>
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview Monev Backend
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Quick Actions
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="w-5 h-5" />
                                    System Status
                                </CardTitle>
                                <CardDescription>
                                    Current system health and performance metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Service Status</span>
                                    <Badge 
                                        variant="outline" 
                                        className={healthData?.status === 'healthy' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                    >
                                        {healthData?.status || 'Unknown'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Database Status</span>
                                    <Badge 
                                        variant="outline" 
                                        className={healthData?.checks.database.status === 'healthy' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                    >
                                        {healthData?.checks.database.status || 'Unknown'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Environment</span>
                                    <span className="text-sm text-gray-500">{healthData?.environment || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Last Check</span>
                                    <span className="text-sm text-gray-500">
                                        {healthData ? new Date(healthData.timestamp).toLocaleString() : 'Unknown'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Memory Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="w-5 h-5" />
                                    Memory Usage
                                </CardTitle>
                                <CardDescription>
                                    System memory and resource utilization
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">RSS Memory</span>
                                    <span className="text-sm font-medium">{healthData?.checks.memory.usage.rss || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Heap Total</span>
                                    <span className="text-sm font-medium">{healthData?.checks.memory.usage.heapTotal || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Heap Used</span>
                                    <span className="text-sm font-medium">{healthData?.checks.memory.usage.heapUsed || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">External Memory</span>
                                    <span className="text-sm font-medium">{healthData?.checks.memory.usage.external || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Quick Actions Tab */}
                <TabsContent value="actions" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quickActions.map((action, index) => (
                            <Card key={index} className="hover:shadow-lg transition-all duration-200">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                                            <action.icon className={`w-5 h-5 ${action.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{action.title}</CardTitle>
                                            <CardDescription>{action.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={action.href}>
                                            Access {action.title}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
