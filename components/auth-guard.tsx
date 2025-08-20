"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ShieldX, 
  Clock, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Key,
  LogIn
} from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
        <CardTitle>Verifying Authentication</CardTitle>
        <CardDescription>Please wait while we verify your access...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  </div>
);

const UnauthorizedScreen: React.FC<{ error?: string | null }> = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <ShieldX className="h-16 w-16 text-red-500" />
        </div>
        <CardTitle className="text-2xl text-red-700 dark:text-red-400">
          Akses ditolak
        </CardTitle>
        <CardDescription>
          Anda perlu token yang valid untuk mengakses platform ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Kesalahan autentikasi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Untuk mengakses platform ini:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Dapatkan token JWT yang valid dari administrator Anda</li>
              <li>Akses dari platform resmi Celoe</li>
              <li>Akses platform dengan parameter token:</li>
            </ol>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <code className="text-sm break-all">
              {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?token=YOUR_TOKEN
            </code>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Catatan:</strong> Token akan dihapus setelah digunakan untuk tujuan keamanan.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant='outline'
            onClick={() => window.location.href = '/login'}
          >
            <LogIn className="w-4 h-4 mr-2" />
             Admin Login
          </Button>
          {/* <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ulangi Autentikasi
          </Button> */}
          {/* <Button
            variant='outline'
            onClick={() => window.location.href = '/token-generator'}
            className="w-full"
          >
            <Key className="w-4 h-4 mr-2" />
            Generate Test Token (Testing only)
          </Button> */}
        </div>
      </CardContent>
    </Card>
  </div>
);

const TokenExpiryWarning: React.FC = () => {
  const { token } = useAuth();
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [showWarning, setShowWarning] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    const updateTimeLeft = () => {
      const payload = token.split('.')[1];
      if (!payload) return;
      
      try {
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        const now = Math.floor(Date.now() / 1000);
        const remaining = decoded.exp - now;
        
        setTimeLeft(remaining);
        setShowWarning(remaining > 0 && remaining <= 60); // Show warning in last minute
        
        // Auto refresh when token expires
        if (remaining <= 0 && !isRefreshing) {
          console.log('Token expired in warning component, refreshing page...');
          setIsRefreshing(true);
          
          // Small delay to show final countdown
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error parsing token for expiry warning:', error);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [token, isRefreshing]);

  // Show countdown even at 0 to indicate refreshing
  if (!showWarning && timeLeft > 0) return null;
  if (timeLeft <= 0 && !isRefreshing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert className={`w-80 ${
        timeLeft <= 0 
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
          : timeLeft <= 10 
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
      }`}>
        <Clock className={`h-4 w-4 ${
          timeLeft <= 0 ? 'text-red-600' : timeLeft <= 10 ? 'text-red-600' : 'text-orange-600'
        }`} />
        <AlertTitle className={
          timeLeft <= 0 
            ? 'text-red-800 dark:text-red-200' 
            : timeLeft <= 10 
              ? 'text-red-800 dark:text-red-200'
              : 'text-orange-800 dark:text-orange-200'
        }>
          {timeLeft <= 0 ? 'Sesi telah berakhir' : 'Sesi akan segera berakhir'}
        </AlertTitle>
        <AlertDescription className={
          timeLeft <= 0 
            ? 'text-red-700 dark:text-red-300' 
            : timeLeft <= 10 
              ? 'text-red-700 dark:text-red-300'
              : 'text-orange-700 dark:text-orange-300'
        }>
          {timeLeft <= 0 
            ? 'Sesi telah kadaluarsa, silahkan login kembali.' 
            : `Sesi akan berakhir dalam ${timeLeft} detik. Halaman akan otomatis refresh ketika sesi berakhir.`
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  const pathname = usePathname();
  
  // Routes that don't require authentication
  const publicRoutes = ['/token-generator', '/login'];
  
  // Check if current route is public
  const isPublicRoute = React.useMemo(() => {
    return publicRoutes.some(route => pathname === route);
  }, [pathname]);

  // If it's a public route, don't require authentication
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <UnauthorizedScreen error={error} />;
  }

  return (
    <>
      <TokenExpiryWarning />
      {children}
    </>
  );
}; 