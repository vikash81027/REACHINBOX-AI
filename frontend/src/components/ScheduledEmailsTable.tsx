'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Mail, AlertCircle } from 'lucide-react';
import { Table, Pagination } from './ui/Table';
import { emailsApi } from '@/lib/api';
import { formatDate, formatRelativeTime, getStatusColor, truncate } from '@/lib/utils';
import type { Email } from '@/types';

interface ScheduledEmailsTableProps {
    page: number;
    onPageChange: (page: number) => void;
}

export function ScheduledEmailsTable({ page, onPageChange }: ScheduledEmailsTableProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['emails', 'scheduled', page],
        queryFn: async () => {
            const response = await emailsApi.getScheduled(page, 20);
            return response.data;
        },
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    const columns = [
        {
            key: 'toEmail',
            header: 'Recipient',
            render: (email: Email) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium">{email.toEmail}</span>
                </div>
            ),
        },
        {
            key: 'subject',
            header: 'Subject',
            render: (email: Email) => (
                <span className="text-dark-600">{truncate(email.subject, 40)}</span>
            ),
        },
        {
            key: 'scheduledAt',
            header: 'Scheduled For',
            render: (email: Email) => (
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-dark-400" />
                    <div>
                        <p className="text-sm font-medium">{formatDate(email.scheduledAt)}</p>
                        <p className="text-xs text-dark-500">{formatRelativeTime(email.scheduledAt)}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (email: Email) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        email.status
                    )}`}
                >
                    {email.status === 'RATE_LIMITED' ? 'QUEUED' : email.status}
                </span>
            ),
        },
        {
            key: 'sender',
            header: 'From',
            render: (email: Email) => (
                <span className="text-dark-500 text-xs">
                    {email.sender?.name || 'Unknown'}
                </span>
            ),
        },
    ];

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">Failed to load scheduled emails</p>
            </div>
        );
    }

    return (
        <div>
            <Table
                columns={columns}
                data={data?.emails || []}
                keyExtractor={(email) => email.id}
                loading={isLoading}
                emptyMessage="No scheduled emails"
                emptyIcon={
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                }
            />
            {data && (
                <Pagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
}

export default ScheduledEmailsTable;
