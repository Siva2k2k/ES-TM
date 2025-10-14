import React, { useState } from 'react';
import { useBillingContext } from '../../store/contexts/BillingContext';
import { useBillingData } from '../../hooks/useBillingData';
import type { BillingSummaryEntry } from '../../types/billing';
import { BillingHeader } from './components/BillingHeader';
import { BillingFilters } from './components/BillingFilters';
import { BillingStatsGrid } from './components/BillingStatsGrid';
import { RevenueByProjectList } from './components/RevenueByProjectList';
import { BillingSummaryTable } from './components/BillingSummaryTable';
import { BillingEditHoursDialog } from './components/BillingEditHoursDialog';

export function BillingDashboardPage() {
  const {
    period,
    setPeriod,
    filterType,
    setFilterType,
    selectedProjectId,
    setSelectedProjectId,
    selectedUserId,
    setSelectedUserId,
    dateRange,
    setDateRange,
    projects,
    users,
    loadingOptions
  } = useBillingContext();

  const {
    metrics,
    revenue,
    summary,
    loading,
    exportReport,
    updateBillableHours,
    refreshAll
  } = useBillingData();

  const [editingEntry, setEditingEntry] = useState<BillingSummaryEntry | null>(null);

  const handleEdit = (entry: BillingSummaryEntry) => {
    if (entry.is_editable) {
      setEditingEntry(entry);
    }
  };

  const handleSave = async (hours: number) => {
    if (!editingEntry) return;
    const entryId = editingEntry.id;
    setEditingEntry(null);
    await updateBillableHours(entryId, hours);
  };

  return (
    <div className="space-y-6 pb-10">
      <BillingHeader
        title="Billing Dashboard"
        subtitle="Monitor revenue, billable hours, and approval workload across services"
        onRefresh={refreshAll}
        onExport={exportReport}
      />

      <BillingFilters
        period={period}
        filterType={filterType}
        onPeriodChange={setPeriod}
        onFilterTypeChange={(type) => {
          setFilterType(type);
          setSelectedProjectId(undefined);
          setSelectedUserId(undefined);
        }}
        projects={projects}
        users={users}
        selectedProjectId={selectedProjectId}
        selectedUserId={selectedUserId}
        onProjectChange={setSelectedProjectId}
        onUserChange={setSelectedUserId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        loading={loadingOptions}
      />

      <BillingStatsGrid metrics={metrics} loading={loading.metrics} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <BillingSummaryTable
          summary={summary}
          loading={loading.summary}
          onEdit={handleEdit}
        />
        <RevenueByProjectList items={revenue} loading={loading.revenue} />
      </div>

      <BillingEditHoursDialog
        open={Boolean(editingEntry)}
        title="Adjust Billable Hours"
        description={
          editingEntry ? (
            <>
              Update the billable total for <strong>{editingEntry.name}</strong> starting{' '}
              {new Date(editingEntry.week_start).toLocaleDateString()}.
            </>
          ) : undefined
        }
        initialHours={editingEntry?.billable_hours ?? 0}
        originalHours={editingEntry?.billable_hours}
        workedHours={editingEntry?.hours}
        onClose={() => setEditingEntry(null)}
        onSave={handleSave}
      />
    </div>
  );
}

export default BillingDashboardPage;
