import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    onRowClick?: (item: T) => void;
}

export function Table<T>({
    columns,
    data,
    keyExtractor,
    loading = false,
    emptyMessage = 'No data available',
    emptyIcon,
    onRowClick,
}: TableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-dark-200 overflow-hidden">
                <div className="animate-pulse">
                    <div className="h-12 bg-dark-100" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 border-t border-dark-100">
                            <div className="flex items-center space-x-4 px-6 py-4">
                                <div className="h-4 bg-dark-200 rounded w-1/4" />
                                <div className="h-4 bg-dark-200 rounded w-1/3" />
                                <div className="h-4 bg-dark-200 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-dark-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    {emptyIcon || (
                        <div className="w-16 h-16 bg-dark-100 rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-8 h-8 text-dark-400" />
                        </div>
                    )}
                    <h3 className="text-lg font-medium text-dark-700 mb-1">
                        {emptyMessage}
                    </h3>
                    <p className="text-sm text-dark-500">
                        Items will appear here once available
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-dark-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-dark-50 border-b border-dark-200">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        'px-6 py-3 text-left text-xs font-semibold text-dark-600 uppercase tracking-wider',
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className={cn(
                                    'hover:bg-dark-50 transition-colors',
                                    onRowClick && 'cursor-pointer'
                                )}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'px-6 py-4 whitespace-nowrap text-sm text-dark-700',
                                            column.className
                                        )}
                                    >
                                        {column.render
                                            ? column.render(item)
                                            : (item as any)[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm font-medium text-dark-600 bg-white border border-dark-200 rounded-lg hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Previous
            </button>
            <span className="px-4 py-1.5 text-sm text-dark-600">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-dark-600 bg-white border border-dark-200 rounded-lg hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Next
            </button>
        </div>
    );
}

export default Table;
