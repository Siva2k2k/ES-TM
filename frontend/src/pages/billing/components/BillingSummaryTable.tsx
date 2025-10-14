import React from 'react';
import { Edit3 } from 'lucide-react';
import type { BillingSummary, BillingSummaryEntry } from '../../../types/billing';

interface BillingSummaryTableProps {
  summary: BillingSummary | null;
  loading: boolean;
  onEdit: (entry: BillingSummaryEntry) => void;
}

export function BillingSummaryTable({ summary, loading, onEdit }: BillingSummaryTableProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Billing Summary
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage billable overrides and review revenue impacts
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                ${summary.total_revenue.toLocaleString()}
              </strong>{' '}
              total revenue
            </span>
            <span>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {summary.billable_hours.toFixed(1)}h
              </strong>{' '}
              billable
            </span>
            <span>
              Avg. rate{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                ${summary.average_rate.toFixed(2)}/hr
              </strong>
            </span>
          </div>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Week Starting
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Hours
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Billable Hours
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Revenue
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                  <td className="px-4 py-4" />
                </tr>
              ))
            ) : summary && summary.entries.length > 0 ? (
              summary.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entry.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(entry.week_start).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                    {entry.hours.toFixed(1)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                    {entry.billable_hours.toFixed(1)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    ${entry.revenue.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      disabled={!entry.is_editable}
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-900/20"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Adjust
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No billing summary entries for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
