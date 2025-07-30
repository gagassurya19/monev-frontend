"use client"
import { ApiTestComponent } from '@/components/api-test';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ApiTestPage() {
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
    <div className="flex flex-col min-h-screen">
      <AppHeader 
        title="API Test" 
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "API Test" }
        ]}
      />
      <main className="flex-1 p-4 sm:p-6">
        <ApiTestComponent />
      </main>
    </div>
  );
} 