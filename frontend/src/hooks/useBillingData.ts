import { useCallback, useEffect, useMemo, useState } from 'react';
import { BillingService } from '../services/BillingService';
import { useBillingContext } from '../store/contexts/BillingContext';
import { showError, showSuccess } from '../utils/toast';
import type {
  BillingDashboardMetrics,
  BillingSummary,
  RevenueByProject
} from '../types/billing';

interface BillingDataState {
  metrics: BillingDashboardMetrics | null;
  metricsLoading: boolean;
  revenue: RevenueByProject[];
  revenueLoading: boolean;
  summary: BillingSummary | null;
  summaryLoading: boolean;
  error: string | null;
}

const initialState: BillingDataState = {
  metrics: null,
  metricsLoading: true,
  revenue: [],
  revenueLoading: true,
  summary: null,
  summaryLoading: true,
  error: null
};

export function useBillingData() {
  const {
    period,
    filterType,
    selectedProjectId,
    selectedUserId,
    dateRange,
    refreshToken
  } = useBillingContext();

  const [state, setState] = useState<BillingDataState>(initialState);

  const loadMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, metricsLoading: true, error: null }));
    const result = await BillingService.getBillingDashboard();
    if (result.error) {
      showError(result.error);
      setState((prev) => ({ ...prev, metricsLoading: false, error: result.error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      metrics: {
        totalRevenue: result.totalRevenue,
        weeklyRevenue: result.weeklyRevenue,
        monthlyRevenue: result.monthlyRevenue,
        pendingApprovals: result.pendingApprovals,
        totalBillableHours: result.totalBillableHours,
        averageHourlyRate: result.averageHourlyRate,
        revenueGrowth: result.revenueGrowth
      },
      metricsLoading: false
    }));
  }, []);

  const loadRevenue = useCallback(async () => {
    setState((prev) => ({ ...prev, revenueLoading: true, error: null }));
    const result = await BillingService.getRevenueByProject();
    if (result.error) {
      showError(result.error);
      setState((prev) => ({ ...prev, revenueLoading: false, error: result.error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      revenue: result.projects.map((project) => ({
        projectId: project.projectId,
        projectName: project.projectName,
        revenue: project.revenue,
        hours: project.hours,
        rate: project.rate
      })),
      revenueLoading: false
    }));
  }, []);

  const loadSummary = useCallback(async () => {
    setState((prev) => ({ ...prev, summaryLoading: true }));
    const filterId =
      filterType === 'project' ? selectedProjectId :
      filterType === 'employee' ? selectedUserId :
      undefined;

    const result = await BillingService.getBillingSummary(
      period,
      filterType,
      filterId,
      dateRange.start,
      dateRange.end
    );

    if (result.error) {
      showError(result.error);
      setState((prev) => ({ ...prev, summaryLoading: false, error: result.error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      summary: result.summary ?? null,
      summaryLoading: false,
      error: null
    }));
  }, [period, filterType, selectedProjectId, selectedUserId, dateRange.start, dateRange.end]);

  useEffect(() => {
    loadMetrics();
    loadRevenue();
    loadSummary();
  }, [loadMetrics, loadRevenue, loadSummary, refreshToken]);

  const updateBillableHours = useCallback(async (entryId: string, newHours: number) => {
    const { success, error } = await BillingService.updateBillableHours(entryId, newHours);
    if (!success) {
      showError(error ?? 'Unable to update billable hours');
      return;
    }

    showSuccess('Billable hours updated successfully');
    await loadSummary();
    await loadMetrics();
  }, [loadSummary, loadMetrics]);

  const exportReport = useCallback(async (format: 'csv' | 'pdf' | 'excel') => {
    const { success, downloadUrl, error } = await BillingService.exportBillingReport(
      dateRange.start,
      dateRange.end,
      format
    );

    if (!success) {
      showError(error ?? 'Failed to export billing report');
      return;
    }

    showSuccess(`Billing report generated${downloadUrl ? ' - Download ready' : ''}`);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  }, [dateRange.start, dateRange.end]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMetrics(), loadRevenue(), loadSummary()]);
  }, [loadMetrics, loadRevenue, loadSummary]);

  return useMemo(() => ({
    metrics: state.metrics,
    revenue: state.revenue,
    summary: state.summary,
    loading: {
      metrics: state.metricsLoading,
      revenue: state.revenueLoading,
      summary: state.summaryLoading
    },
    error: state.error,
    period,
    filterType,
    selectedProjectId,
    selectedUserId,
    dateRange,
    updateBillableHours,
    exportReport,
    refreshAll
  }), [
    state,
    period,
    filterType,
    selectedProjectId,
    selectedUserId,
    dateRange,
    updateBillableHours,
    exportReport,
    refreshAll
  ]);
}
