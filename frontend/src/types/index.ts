// User types
export interface User {
    id: string;
    googleId: string;
    email: string;
    name: string;
    avatar: string | null;
}

// Sender types
export interface Sender {
    id: string;
    email: string;
    name: string;
    hourlyLimit: number;
    isActive?: boolean;
    createdAt: string;
}

// Email types
export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';

export interface Email {
    id: string;
    userId: string;
    senderId: string;
    toEmail: string;
    subject: string;
    body: string;
    scheduledAt: string;
    sentAt: string | null;
    status: EmailStatus;
    errorMessage: string | null;
    retryCount: number;
    createdAt: string;
    updatedAt: string;
    sender?: {
        email: string;
        name: string;
    };
}

// API Response types
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface EmailsResponse {
    emails: Email[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SendersResponse {
    senders: Sender[];
}

// Schedule request types
export interface ScheduleEmailRequest {
    senderId: string;
    toEmail: string;
    subject: string;
    body: string;
    scheduledAt: string;
}

export interface ScheduleBulkRequest {
    senderId: string;
    emails: string[];
    subject: string;
    body: string;
    startTime: string;
    delayBetweenEmails: number;
    hourlyLimit?: number;
}

// Stats types
export interface Stats {
    database: {
        scheduled: number;
        sent: number;
        failed: number;
    };
    queue: {
        waiting: number;
        active: number;
        delayed: number;
    };
}
