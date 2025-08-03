"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Shield, 
    Eye, 
    EyeOff, 
    Lock, 
    User,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { loginAdmin } from '@/lib/api/login';

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Redirect if already authenticated
    if (isAuthenticated && user) {
        router.push('/admin');
        return null;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setError('Username is required');
            return false;
        }
        if (!formData.password.trim()) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // API
            const response = await loginAdmin(formData.username, formData.password);
            if (response.status) {
                localStorage.setItem('auth_token', response.token);
                window.location.href = '/admin';
            } else {
                setError('Invalid username or password');
            }
            
            setSuccess('Login successful! Redirecting...');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
                    <p className="text-gray-600">Access the MONEV administration panel</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl font-semibold text-center">
                            Sign In
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access the admin dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium">
                                    Username
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Enter username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        disabled={loading}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="pl-10 pr-10"
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Signing In...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                    Demo Credentials
                                </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p><strong>Username:</strong> admin</p>
                                <p><strong>Password:</strong> admin123</p>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500">
                                This is a secure admin login. Your credentials are encrypted.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        MONEV - CeLOE Monitoring & Evaluation System
                    </p>
                </div>
            </div>
        </div>
    );
}
