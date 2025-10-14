import { useCallback, useEffect, useMemo, useState } from 'react';
import { BillingService } from '../services/BillingService';
import type { BillingPeriodView, ProjectBillingResponse } from '../types/billing';
import { showError, showSuccess } from '../utils/toast';

const getDefaultRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toIso = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: toIso(start),
    endDate: toIso(end)
  };
};

interface UpdateHoursArgs {
  userId: string;
  projectId: string;
  billableHours: number;
  totalHours?: number;
  reason?: string;
}

export function useProjectBilling(initialProjectIds: string[] = []) {
  const defaultRange = useMemo(getDefaultRange, []);

  const [params, setParams] = useState<{
    startDate: string;
    endDate: string;
    view: BillingPeriodView;
    projectIds: string[];
  }>({
    ...defaultRange,
    view: 'monthly',
    projectIds: initialProjectIds
  });

  const [data, setData] = useState<ProjectBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await BillingService.getProjectBilling({
      startDate: params.startDate,
      endDate: params.endDate,
      view: params.view,
      projectIds: params.projectIds
    });

    if (result.error) {
      setError(result.error);
      showError(result.error);
    } else {
      setData(result.data ?? null);
    }

    setLoading(false);
  }, [params.startDate, params.endDate, params.view, params.projectIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateBillingHours = useCallback(async (args: UpdateHoursArgs) => {
    const { success, error: updateError } = await BillingService.updateProjectBillingHours({
      userId: args.userId,
      projectId: args.projectId,
      startDate: params.startDate,
      endDate: params.endDate,
      billableHours: args.billableHours,
      totalHours: args.totalHours,
      reason: args.reason ?? 'Manual adjustment from project billing view'
    });

    if (!success) {
      showError(updateError ?? 'Failed to update billable hours');
      return false;
    }

    showSuccess('Billable hours updated');
    await loadData();
    return true;
  }, [params.startDate, params.endDate, loadData]);

  const setDateRange = useCallback((start: string, end: string) => {
    setParams((prev) => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  }, []);

  const setView = useCallback((view: BillingPeriodView) => {
    setParams((prev) => ({
      ...prev,
      view
    }));
  }, []);

  const setProjectIds = useCallback((projectIds: string[]) => {
    setParams((prev) => ({
      ...prev,
      projectIds
    }));
  }, []);

  return {
    data,
    loading,
    error,
    params,
    setDateRange,
    setView,
    setProjectIds,
    refresh: loadData,
    updateBillingHours
  };
}
