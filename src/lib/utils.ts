import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { twMerge } from 'tailwind-merge';

import { CURRENCY } from '@/lib/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string) {
  return format(new Date(value), 'MMM d, yyyy • h:mm a');
}

export function formatDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy');
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function groupByDay<T extends { createdAt: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const date = format(new Date(item.createdAt), 'yyyy-MM-dd');
    accumulator[date] = [...(accumulator[date] ?? []), item];
    return accumulator;
  }, {});
}
