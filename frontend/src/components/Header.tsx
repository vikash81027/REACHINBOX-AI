'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { LogOut, Mail, Menu } from 'lucide-react';
import { Button } from './ui/Button';

export function Header() {
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-dark-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-dark-900">ReachInbox</h1>
                            <p className="text-xs text-dark-500">Email Scheduler</p>
                        </div>
                    </div>

                    {/* User info */}
                    {session?.user && (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-dark-50 rounded-xl">
                                {session.user.image && (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        width={32}
                                        height={32}
                                        className="rounded-full ring-2 ring-primary-500/20"
                                    />
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-medium text-dark-900">
                                        {session.user.name}
                                    </p>
                                    <p className="text-xs text-dark-500">{session.user.email}</p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                icon={<LogOut className="w-4 h-4" />}
                            >
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
