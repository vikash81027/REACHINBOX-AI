'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';
import { Table, Pagination } from './ui/Table';
import { emailsApi } from '@/lib/api';
import { formatDate, getStatusColor, truncate } from '@/lib/utils';
import type { Email } from '@/types';

interface SentEmailsTableProps {
    page: number;
    onPageChange: (page: number) => void;
}

export function SentEmailsTable({ page, onPageChange }: SentEmailsTableProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['emails', 'sent', page],
        queryFn: async () => {
            const response = await emailsApi.getSent(page, 20);
            return response.data;
        },
        refetchInterval: 10000,
    });

    const columns = [
        {
            key: 'toEmail',
            header: 'Recipient',
            render: (email: Email) => (
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${email.status === 'SENT' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {email.status === 'SENT' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                        )}
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
            key: 'sentAt',
            header: 'Sent At',
            render: (email: Email) => (
                <span className="text-sm">
                    {email.sentAt ? formatDate(email.sentAt) : '-'}
                </span>
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
                    {email.status}
                </span>
            ),
        },
        {
            key: 'error',
            header: 'Details',
            render: (email: Email) => (
                <span className="text-xs text-dark-500">
                    {email.errorMessage ? truncate(email.errorMessage, 30) : 'Delivered'}
                </span>
            ),
        },
    ];

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">Failed to load sent emails</p>
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
                emptyMessage="No sent emails yet"
                emptyIcon={
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-green-500" />
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

export default SentEmailsTable;
