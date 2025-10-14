import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

interface BillingHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void;
}

const exportOptions: Array<{ id: 'csv' | 'pdf' | 'excel'; label: string }> = [
  { id: 'csv', label: 'Export CSV' },
  { id: 'pdf', label: 'Export PDF' },
  { id: 'excel', label: 'Export Excel' }
];

export function BillingHeader({
  title = 'Billing Management',
  subtitle = 'Track revenue, billable hours, and approvals across services',
  onRefresh,
  onExport
}: BillingHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        )}

        {onExport && (
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onExport(option.id)}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                <Download className="mr-2 h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
