import React from 'react';
import { Settings } from 'lucide-react';
import { useBillingRates } from '../../hooks/useBillingRates';
import { BillingHeader } from './components/BillingHeader';
import { RateForm } from './components/RateForm';
import { RateTable } from './components/RateTable';

export function RateManagementPage() {
  const { users, projects, clients, rates, loading, saveRate, deleteRate } = useBillingRates();

  return (
    <div className="space-y-6 pb-12">
      <BillingHeader
        title="Rate Management"
        subtitle="Configure global, client, project, or role-based billing rates and multipliers"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Create Billing Rate
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Override default billable values for specific scopes and enforce Sonar-compliant rates.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <RateForm
            users={users}
            projects={projects}
            clients={clients}
            onSubmit={saveRate}
          />
        </div>
      </section>

      <RateTable
        rates={rates}
        loading={loading}
        onDelete={deleteRate}
      />
    </div>
  );
}

export default RateManagementPage;
