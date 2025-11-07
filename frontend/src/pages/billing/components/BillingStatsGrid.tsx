import React from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import type { BillingDashboardMetrics } from '../../../types/billing';

interface BillingStatsGridProps {
  metrics: BillingDashboardMetrics | null;
  loading: boolean;
}

const cards = [
  {
    id: 'totalRevenue',
    label: 'Total Revenue',
    icon: DollarSign,
    value: (metrics: BillingDashboardMetrics) => `$${metrics.totalRevenue.toLocaleString()}`,
    accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  },
  {
    id: 'monthlyRevenue',
    label: 'Monthly Revenue',
    icon: Calendar,
    value: (metrics: BillingDashboardMetrics) => `$${metrics.monthlyRevenue.toLocaleString()}`,
    accent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  },
  {
    id: 'billableHours',
    label: 'Billable Hours',
    icon: Clock,
    value: (metrics: BillingDashboardMetrics) => metrics.totalBillableHours.toFixed(1),
    accent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  },
  {
    id: 'averageRate',
    label: 'Average Rate',
    icon: TrendingUp,
    value: (metrics: BillingDashboardMetrics) => `$${metrics.averageHourlyRate.toFixed(2)}/hr`,
    accent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }
];

export function BillingStatsGrid({ metrics, loading }: BillingStatsGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
            </div>
            <div className="mt-6 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {loading || !metrics ? (
                <span className="inline-block h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                card.value(metrics)
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
