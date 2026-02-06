'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { X, Upload, Calendar, Clock, Users, Send } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal } from './ui';
import { sendersApi, emailsApi } from '@/lib/api';
import type { Sender } from '@/types';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [senderId, setSenderId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [delaySeconds, setDelaySeconds] = useState('5');
    const [emails, setEmails] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Fetch senders
    const { data: sendersData } = useQuery({
        queryKey: ['senders'],
        queryFn: async () => {
            const response = await sendersApi.getAll();
            return response.data;
        },
    });

    const senders: Sender[] = sendersData?.senders || [];

    // Handle file upload
    const handleFileUpload = useCallback((file: File) => {
        Papa.parse(file, {
            complete: (results) => {
                const emailList: string[] = [];
                results.data.forEach((row: any) => {
                    // Look for email in various column names
                    const email =
                        row.email || row.Email || row.EMAIL || row[0];
                    if (email && typeof email === 'string' && email.includes('@')) {
                        emailList.push(email.trim().toLowerCase());
                    }
                });
                // Remove duplicates
                const uniqueEmails = [...new Set(emailList)];
                setEmails(uniqueEmails);
                toast.success(`Found ${uniqueEmails.length} email addresses`);
            },
            header: true,
            skipEmptyLines: true,
            error: () => {
                toast.error('Failed to parse file');
            },
        });
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!senderId) {
            toast.error('Please select a sender');
            return;
        }
        if (!subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }
        if (!body.trim()) {
            toast.error('Please enter email body');
            return;
        }
        if (emails.length === 0) {
            toast.error('Please upload a file with email addresses');
            return;
        }
        if (!startTime) {
            toast.error('Please select a start time');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await emailsApi.scheduleBulk({
                senderId,
                emails,
                subject,
                body,
                startTime: new Date(startTime).toISOString(),
                delayBetweenEmails: parseInt(delaySeconds) * 1000,
            });

            toast.success(`${response.data.count} emails scheduled successfully!`);

            // Reset form
            setSubject('');
            setBody('');
            setSenderId('');
            setStartTime('');
            setEmails([]);

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to schedule emails');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get default datetime (5 minutes from now)
    const getDefaultDateTime = () => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + 5);
        return date.toISOString().slice(0, 16);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose New Email" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sender Selection */}
                <div>
                    <Select
                        label="From (Sender)"
                        value={senderId}
                        onChange={(e) => setSenderId(e.target.value)}
                        options={[
                            { value: '', label: 'Select a sender...' },
                            ...senders.map((s) => ({
                                value: s.id,
                                label: `${s.name} <${s.email}>`,
                            })),
                        ]}
                    />
                    {senders.length === 0 && (
                        <p className="mt-1 text-sm text-yellow-600">
                            No senders available. Create one first.
                        </p>
                    )}
                </div>

                {/* Subject */}
                <Input
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                />

                {/* Body */}
                <Textarea
                    label="Email Body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter email content..."
                    rows={5}
                />

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1.5">
                        Email Recipients
                    </label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragActive
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-dark-300 hover:border-dark-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <Upload className="w-10 h-10 text-dark-400 mb-2" />
                            <span className="text-sm text-dark-600">
                                Drop a CSV/TXT file here, or{' '}
                                <span className="text-primary-600 font-medium">browse</span>
                            </span>
                        </label>
                    </div>
                    {emails.length > 0 && (
                        <div className="mt-3 flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                    {emails.length} email addresses loaded
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEmails([])}
                                className="text-green-600 hover:text-green-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Scheduling Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Start Time
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            min={getDefaultDateTime()}
                            className="block w-full rounded-xl border border-dark-300 bg-white px-4 py-2.5 text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-700 mb-1.5">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Delay Between Emails (seconds)
                        </label>
                        <input
                            type="number"
                            value={delaySeconds}
                            onChange={(e) => setDelaySeconds(e.target.value)}
                            min="1"
                            max="3600"
                            className="block w-full rounded-xl border border-dark-300 bg-white px-4 py-2.5 text-dark-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-200">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        icon={<Send className="w-4 h-4" />}
                    >
                        Schedule {emails.length > 0 && `${emails.length} Emails`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default ComposeModal;
