"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ExternalAPIsETLTab() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-600" />
                            External APIs ETL
                        </CardTitle>
                        <CardDescription>
                            ETL processes for external API data sources
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                External API ETL processes will be available here. This section will handle data extraction from third-party APIs and services.
                            </p>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">REST APIs</h4>
                                    <p className="text-sm text-gray-600">HTTP/HTTPS API endpoints</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">GraphQL</h4>
                                    <p className="text-sm text-gray-600">GraphQL API integration</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">WebSocket</h4>
                                    <p className="text-sm text-gray-600">Real-time data streams</p>
                                </div>
                            </div>
                            <div className="mt-8">
                                <Button 
                                    onClick={() => {
                                        toast({
                                            title: "Feature Coming Soon",
                                            description: "External API ETL integration is under development",
                                        });
                                    }}
                                    className="w-full"
                                    disabled
                                >
                                    <Globe className="w-4 h-4 mr-2" />
                                    Configure External API
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 