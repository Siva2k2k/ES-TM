import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import type { TaskBillingRecord, TaskBillingResponse } from '../../../types/billing';

interface TaskBillingTableProps {
  data: TaskBillingResponse | null;
  loading: boolean;
  onEdit: (args: {
    task: TaskBillingRecord;
    userId: string;
    userName: string;
    currentBillable: number;
    totalHours: number;
  }) => void;
}

export function TaskBillingTable({ data, loading, onEdit }: TaskBillingTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

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

  if (!data || data.tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No task billing records for the selected criteria.
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
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Project
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Hours
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Billable
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.tasks.map((task) => {
              const isExpanded = expanded.has(task.task_id);
              return (
                <React.Fragment key={task.task_id}>
                  <tr className="bg-white hover:bg-blue-50/40 dark:bg-slate-900 dark:hover:bg-blue-900/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.task_id)}
                        className="flex items-center gap-2 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {task.task_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {task.project_name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300">
                      {task.total_hours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {task.billable_hours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      $
                      {task.resources
                        .reduce((total, resource) => total + resource.amount, 0)
                        .toLocaleString()}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                      <td colSpan={5} className="px-4 pb-4 pt-0">
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Resource
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Hours
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Billable
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Rate
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Amount
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {task.resources.map((resource) => (
                                <tr key={resource.user_id}>
                                  <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {resource.user_name}
                                  </td>
                                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                                    {resource.hours.toFixed(1)}h
                                  </td>
                                  <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {resource.billable_hours.toFixed(1)}h
                                  </td>
                                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                                    ${resource.rate.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    ${resource.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEdit({
                                          task,
                                          userId: resource.user_id,
                                          userName: resource.user_name,
                                          currentBillable: resource.billable_hours,
                                          totalHours: resource.hours
                                        })
                                      }
                                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-900/20"
                                    >
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Adjust
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
