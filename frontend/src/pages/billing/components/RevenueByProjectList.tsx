import React from 'react';
import { Building2 } from 'lucide-react';
import type { RevenueByProject } from '../../../types/billing';

interface RevenueByProjectListProps {
  items: RevenueByProject[];
  loading: boolean;
}

export function RevenueByProjectList({ items, loading }: RevenueByProjectListProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Revenue by Project
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Top performing projects based on billable hours and rates
        </p>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No revenue data available for the selected filters.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.slice(0, 10).map((project) => (
              <li
                key={project.projectId}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {project.projectName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {project.hours.toFixed(1)}h &bull; ${project.rate.toFixed(2)}/hr
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    ${project.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Revenue
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
