import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();

    const minutes = Math.floor(Math.abs(diff) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) {
        // Past
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    } else {
        // Future
        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'Now';
    }
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'SCHEDULED':
            return 'bg-blue-100 text-blue-800';
        case 'PROCESSING':
            return 'bg-yellow-100 text-yellow-800';
        case 'SENT':
            return 'bg-green-100 text-green-800';
        case 'FAILED':
            return 'bg-red-100 text-red-800';
        case 'RATE_LIMITED':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function getStatusIcon(status: string): string {
    switch (status) {
        case 'SCHEDULED':
            return '🕐';
        case 'PROCESSING':
            return '⏳';
        case 'SENT':
            return '✅';
        case 'FAILED':
            return '❌';
        case 'RATE_LIMITED':
            return '⚠️';
        default:
            return '•';
    }
}
