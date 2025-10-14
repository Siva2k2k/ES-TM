import React from 'react';
import { Trash2 } from 'lucide-react';
import type { BillingRate } from '../../../types/billing';

interface RateTableProps {
  rates: BillingRate[];
  loading: boolean;
  onDelete: (rateId: string) => void;
}

const entityTypeLabels: Record<BillingRate['entity_type'], string> = {
  global: 'Global',
  user: 'User',
  project: 'Project',
  client: 'Client',
  role: 'Role'
};

export function RateTable({ rates, loading, onDelete }: RateTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No billing rates configured yet. Create a rate to override default billable values.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Multipliers
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Effective
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {rates.map((rate) => (
              <tr key={rate.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/30">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {entityTypeLabels[rate.entity_type]}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {rate.entity_name ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  ${rate.hourly_rate.toFixed(2)}/hr
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  <div className="flex flex-wrap gap-3">
                    <span>OT × {rate.overtime_multiplier.toFixed(2)}</span>
                    <span>Holiday × {rate.holiday_multiplier.toFixed(2)}</span>
                    <span>Weekend × {rate.weekend_multiplier.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Min increment: {rate.minimum_increment_minutes} min
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  <div>{new Date(rate.effective_from).toLocaleDateString()}</div>
                  {rate.effective_until && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Until {new Date(rate.effective_until).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(rate.id)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
