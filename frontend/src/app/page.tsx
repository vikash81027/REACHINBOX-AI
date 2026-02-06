'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Mail, ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session) {
            router.push('/dashboard');
        }
    }, [session, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900">
                <div className="animate-pulse">
                    <Mail className="w-16 h-16 text-primary-400" />
                </div>
            </div>
        );
    }

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex flex-col">
            {/* Header */}
            <header className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">ReachInbox</h1>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    {/* Hero section */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
                            <Zap className="w-4 h-4 text-primary-400" />
                            <span className="text-sm text-primary-300">AI-Powered Email Scheduling</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Schedule emails at{' '}
                            <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                                scale
                            </span>
                        </h2>
                        <p className="text-lg text-dark-300">
                            Production-grade email scheduler with rate limiting, persistence, and real-time monitoring.
                        </p>
                    </div>

                    {/* Login card */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                        <h3 className="text-xl font-semibold text-white text-center mb-6">
                            Get started for free
                        </h3>

                        <Button
                            onClick={handleGoogleLogin}
                            className="w-full"
                            size="lg"
                            icon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            }
                        >
                            Continue with Google
                        </Button>

                        <p className="text-center text-dark-400 text-sm mt-6">
                            By signing in, you agree to our Terms of Service
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Clock className="w-5 h-5 text-primary-400" />
                            </div>
                            <p className="text-sm text-dark-300">Scheduled Delivery</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Shield className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-dark-300">Rate Limiting</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-sm text-dark-300">Persistent Queue</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center">
                <p className="text-dark-500 text-sm">
                    Built for ReachInbox Assignment
                </p>
            </footer>
        </div>
    );
}
