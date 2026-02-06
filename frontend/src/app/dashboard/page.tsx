'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Send, RefreshCw, Settings } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { ComposeModal } from '@/components/ComposeModal';
import { ScheduledEmailsTable } from '@/components/ScheduledEmailsTable';
import { SentEmailsTable } from '@/components/SentEmailsTable';
import { healthApi, sendersApi } from '@/lib/api';
import toast from 'react-hot-toast';

type TabType = 'scheduled' | 'sent';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<TabType>('scheduled');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [scheduledPage, setScheduledPage] = useState(1);
    const [sentPage, setSentPage] = useState(1);

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        router.push('/');
        return null;
    }

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const response = await healthApi.stats();
            return response.data;
        },
        refetchInterval: 10000,
    });

    // Fetch senders
    const { data: sendersData } = useQuery({
        queryKey: ['senders'],
        queryFn: async () => {
            const response = await sendersApi.getAll();
            return response.data;
        },
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['emails'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success('Data refreshed');
    };

    const handleComposeSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['emails', 'scheduled'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
    };

    const handleCreateSender = async () => {
        const name = prompt('Enter sender name:');
        if (name) {
            try {
                await sendersApi.create(name);
                queryClient.invalidateQueries({ queryKey: ['senders'] });
                toast.success('Sender created with Ethereal account');
            } catch (error) {
                toast.error('Failed to create sender');
            }
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-dark-50 flex items-center justify-center">
                <div className="animate-spin">
                    <RefreshCw className="w-8 h-8 text-primary-500" />
                </div>
            </div>
        );
    }

    const stats = statsData || { database: { scheduled: 0, sent: 0, failed: 0 } };
    const senders = sendersData?.senders || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 to-dark-100">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-dark-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Scheduled</p>
                                <p className="text-2xl font-bold text-dark-900">{stats.database.scheduled}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-dark-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Send className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Sent</p>
                                <p className="text-2xl font-bold text-dark-900">{stats.database.sent}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-dark-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <span className="text-xl">❌</span>
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Failed</p>
                                <p className="text-2xl font-bold text-dark-900">{stats.database.failed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-dark-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Senders</p>
                                <p className="text-2xl font-bold text-dark-900">{senders.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeTab === 'scheduled' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('scheduled')}
                            icon={<Clock className="w-4 h-4" />}
                        >
                            Scheduled
                        </Button>
                        <Button
                            variant={activeTab === 'sent' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('sent')}
                            icon={<Send className="w-4 h-4" />}
                        >
                            Sent
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleRefresh}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            Refresh
                        </Button>

                        {senders.length === 0 && (
                            <Button
                                variant="secondary"
                                onClick={handleCreateSender}
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Add Sender
                            </Button>
                        )}

                        <Button
                            onClick={() => setIsComposeOpen(true)}
                            icon={<Plus className="w-4 h-4" />}
                            disabled={senders.length === 0}
                        >
                            Compose Email
                        </Button>
                    </div>
                </div>

                {/* Sender warning */}
                {senders.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-yellow-800 text-sm">
                            <strong>No senders available.</strong> Create a sender first to schedule emails.
                            Each sender is automatically created with an Ethereal test email account.
                        </p>
                    </div>
                )}

                {/* Email tables */}
                {activeTab === 'scheduled' ? (
                    <ScheduledEmailsTable page={scheduledPage} onPageChange={setScheduledPage} />
                ) : (
                    <SentEmailsTable page={sentPage} onPageChange={setSentPage} />
                )}
            </main>

            {/* Compose Modal */}
            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSuccess={handleComposeSuccess}
            />
        </div>
    );
}
