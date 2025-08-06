"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Database, Activity, Server, BarChart3, Settings, FileText, Play, RefreshCw, Loader2, AlertTriangle, Eye, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import CeLOEETLTab from './etl/etl-celoe-tab';
export default function CeloeBackendCP() {
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
                                <CardTitle className="text-lg">ETL Data Course Performance</CardTitle>
                                <CardDescription>Extract Transform Load data course performance dari MOODLE ke CeloeAPI</CardDescription>
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
                    <CeLOEETLTab />
                )}
            </div>
        </div>
    );
} 