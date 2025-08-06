"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Database,
    CheckCircle,
    Lock,
    Activity,
    BookOpen,
    Globe,
} from 'lucide-react';
import CeloeBackendSAS from '@/components/admin/sas-celoe-backend-tab';
import MonevBackendSAS from '@/components/admin/sas-monev-backend-tab';

export default function AdminETLSASPage() {
    const { user, isAuthenticated } = useAuth();

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
                        <h1 className="text-3xl font-bold text-gray-900">ETL & Fetch | Student Activities Summary</h1>
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

            {/* Main ETL Tabs */}
            <Tabs defaultValue="celoe" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="celoe" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        CeLOE Backend
                    </TabsTrigger>
                    <TabsTrigger value="external" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Monev Backend
                    </TabsTrigger>
                </TabsList>

                {/* CeLOE ETL Tab */}
                <TabsContent value="celoe" className="space-y-6 mt-6">
                    <CeloeBackendSAS />
                </TabsContent>

                {/* Chart ETL Tab */}
                <TabsContent value="external" className="space-y-6 mt-6">
                    <MonevBackendSAS />
                </TabsContent>

            </Tabs>
        </div>
    );
}