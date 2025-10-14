import React, { useMemo, useState } from 'react';
import { useBillingContext } from '../../store/contexts/BillingContext';
import { useProjectBilling } from '../../hooks/useProjectBilling';
import type { ProjectBillingRecord } from '../../types/billing';
import { BillingHeader } from './components/BillingHeader';
import { BillingEditHoursDialog } from './components/BillingEditHoursDialog';
import { ProjectBillingTable } from './components/ProjectBillingTable';

interface EditingState {
  project: ProjectBillingRecord;
  userId: string;
  userName: string;
  currentBillable: number;
  totalHours: number;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

export function ProjectBillingPage() {
  const { projects } = useBillingContext();
  const {
    data,
    loading,
    params,
    setDateRange,
    setView,
    setProjectIds,
    refresh,
    updateBillingHours
  } = useProjectBilling();

  const [editing, setEditing] = useState<EditingState | null>(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: project._id ?? project.id ?? '',
        name: project.name
      })),
    [projects]
  );

  const summaryCards = data
    ? (() => {
        const totals = data.projects.reduce(
          (acc, project) => {
            acc.projects += 1;
            acc.totalHours += project.total_hours;
            acc.totalBillable += project.billable_hours;
            acc.cost += project.resources.reduce(
              (sum, resource) => sum + resource.hourly_rate * resource.total_hours,
              0
            );
            return acc;
          },
          { projects: 0, totalHours: 0, totalBillable: 0, cost: 0 }
        );

        return [
          {
            label: 'Projects',
            value: totals.projects.toString()
          },
          {
            label: 'Billable Hours',
            value: `${totals.totalBillable.toFixed(1)}h`
          },
          {
            label: 'Worked Hours',
            value: `${totals.totalHours.toFixed(1)}h`
          },
          {
            label: 'Cost',
            value: `$${totals.cost.toLocaleString()}`
          }
        ];
      })()
    : [];

  const handleDialogSave = async (hours: number) => {
    if (!editing) return;
    const { userId, project, totalHours } = editing;
    const succeeded = await updateBillingHours({
      userId,
      projectId: project.project_id,
      billableHours: hours,
      totalHours
    });
    if (succeeded) {
      setEditing(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <BillingHeader
        title="Project Billing"
        subtitle="Review project-level billable hours, overrides, and revenue performance"
        onRefresh={refresh}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Start Date
            </label>
            <input
              type="date"
              value={params.startDate}
              onChange={(event) => setDateRange(event.target.value, params.endDate)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              End Date
            </label>
            <input
              type="date"
              value={params.endDate}
              onChange={(event) => setDateRange(params.startDate, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              View
            </label>
            <select
              value={params.view}
              onChange={(event) => setView(event.target.value as 'weekly' | 'monthly')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Projects
            </label>
            <select
              multiple
              value={params.projectIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                setProjectIds(values);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              size={Math.min(6, Math.max(projectOptions.length, 3))}
            >
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Hold Ctrl/⌘ to select multiple projects.
            </p>
          </div>
        </div>
      </section>

      {summaryCards.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {card.value}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatDate(params.startDate)} – {formatDate(params.endDate)}
              </p>
            </div>
          ))}
        </section>
      )}

      <ProjectBillingTable
        data={data}
        loading={loading}
        onEdit={(payload) => setEditing(payload)}
      />

      <BillingEditHoursDialog
        open={Boolean(editing)}
        title="Adjust Project Billable Hours"
        description={
          editing ? (
            <>
              Update <strong>{editing.userName}</strong> on{' '}
              <strong>{editing.project.project_name}</strong>.
            </>
          ) : undefined
        }
        initialHours={editing?.currentBillable ?? 0}
        originalHours={editing?.currentBillable}
        workedHours={editing?.totalHours}
        confirmLabel="Update Hours"
        onClose={() => setEditing(null)}
        onSave={handleDialogSave}
      />
    </div>
  );
}

export default ProjectBillingPage;
