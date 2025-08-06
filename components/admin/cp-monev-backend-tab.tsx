"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Database, Activity, Server, BarChart3, Settings, FileText, Play, RefreshCw, Loader2, AlertTriangle, Eye, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

export default function MonevBackendCP() {
    const [activeSection, setActiveSection] = useState<'data-activity'>('data-activity');

    return (
        <div className="p-6 w-full space-y-6">
            {/* Header Section */}
            {/* <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">SAS Monev Backend</h1>
                    <p className="text-gray-600 mt-1">Manage and monitor SAS backend data operations</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Backend System
                </Badge>
            </div> */}

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${activeSection === 'data-activity'
                            ? 'ring-2 ring-green-500 bg-green-50'
                            : 'hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveSection('data-activity')}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${activeSection === 'data-activity'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Fetch Data Course Performance</CardTitle>
                                <CardDescription>Fetch data course performance dari CeloeAPI ke MONEV</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Run API backend CeloeAPI</span>
                            <Badge variant={activeSection === 'data-activity' ? 'default' : 'secondary'}>
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Section */}
            <div className="mt-8">
                {activeSection === 'data-activity' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            <h2 className="text-xl font-semibold">Data Activity Management</h2>
                        </div>

                        {/* Placeholder for Data Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-green-600" />
                                    Data Activity Operations
                                </CardTitle>
                                <CardDescription>
                                    This feature is currently under development. Check back soon for data activity management capabilities.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        Data activity management features are being developed. This will include monitoring,
                                        analysis, and management of data activity operations.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
} 