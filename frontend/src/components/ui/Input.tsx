import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export function Input({
    className,
    label,
    error,
    icon,
    id,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-dark-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={cn(
                        'block w-full rounded-xl border border-dark-300 bg-white px-4 py-2.5 text-dark-900 placeholder-dark-400 transition-all duration-200',
                        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                        'disabled:bg-dark-100 disabled:cursor-not-allowed',
                        icon && 'pl-10',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({
    className,
    label,
    error,
    id,
    ...props
}: TextareaProps) {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-dark-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    'block w-full rounded-xl border border-dark-300 bg-white px-4 py-2.5 text-dark-900 placeholder-dark-400 transition-all duration-200 resize-none',
                    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'disabled:bg-dark-100 disabled:cursor-not-allowed',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({
    className,
    label,
    error,
    options,
    id,
    ...props
}: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-dark-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={cn(
                    'block w-full rounded-xl border border-dark-300 bg-white px-4 py-2.5 text-dark-900 transition-all duration-200',
                    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'disabled:bg-dark-100 disabled:cursor-not-allowed',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                    className
                )}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default Input;
