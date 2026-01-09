// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setMessage({ type: 'error', text: 'Invalid or missing reset token' });
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const validatePassword = () => {
        if (!newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            return false;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
            return false;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Password reset successfully! Redirecting to login...'
                });

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Failed to reset password. The link may have expired.'
                });
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setMessage({
                type: 'error',
                text: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="bg-red-100 p-4 rounded-full">
                                    <AlertCircle className="h-12 w-12 text-red-600" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h1>
                            <p className="text-gray-600">
                                This password reset link is invalid or has expired.
                            </p>
                            <div className="space-y-3 pt-4">
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                                >
                                    Back to Login
                                </Button>
                                <p className="text-sm text-gray-600">
                                    Need a new link?{" "}
                                    <span
                                        onClick={() => router.push('/login')}
                                        className="text-blue-600 cursor-pointer hover:underline font-medium"
                                    >
                                        Request another reset
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-blue-100 p-4 rounded-full">
                                <Lock className="h-12 w-12 text-blue-600" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
                        <p className="text-gray-600 mt-2">Enter your new password below</p>
                    </div>

                    {message && (
                        <Alert
                            className={`mb-6 ${message.type === 'success'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertDescription className="ml-2">
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    className="bg-white border-gray-300 text-gray-900 h-11 pr-10"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    className="bg-white border-gray-300 text-gray-900 h-11 pr-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || message?.type === 'success'}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>

                        <p className="text-center text-sm text-gray-600 mt-4">
                            Remember your password?{" "}
                            <span
                                onClick={() => router.push('/login')}
                                className="text-blue-600 cursor-pointer hover:underline font-medium"
                            >
                                Back to Login
                            </span>
                        </p>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Need help?{" "}
                        <a
                            href="mailto:support@godigital.com"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}