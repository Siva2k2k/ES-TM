import { useCallback, useEffect, useMemo, useState } from 'react';
import { BillingService } from '../services/BillingService';
import type { TaskBillingResponse } from '../types/billing';
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

interface UpdateTaskHoursArgs {
  taskId: string;
  userId: string;
  billableHours: number;
  totalHours?: number;
  reason?: string;
}

export function useTaskBilling(initialProjectIds: string[] = [], initialTaskIds: string[] = []) {
  const defaultRange = useMemo(getDefaultRange, []);

  const [params, setParams] = useState<{
    startDate: string;
    endDate: string;
    projectIds: string[];
    taskIds: string[];
  }>({
    ...defaultRange,
    projectIds: initialProjectIds,
    taskIds: initialTaskIds
  });

  const [data, setData] = useState<TaskBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await BillingService.getTaskBilling({
      startDate: params.startDate,
      endDate: params.endDate,
      projectIds: params.projectIds,
      taskIds: params.taskIds
    });

    if (result.error) {
      setError(result.error);
      showError(result.error);
    } else {
      setData(result.data ?? null);
    }

    setLoading(false);
  }, [params.startDate, params.endDate, params.projectIds, params.taskIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateTaskHours = useCallback(async (args: UpdateTaskHoursArgs) => {
    const { success, error: updateError } = await BillingService.updateProjectBillingHours({
      userId: args.userId,
      taskId: args.taskId,
      projectId: undefined,
      startDate: params.startDate,
      endDate: params.endDate,
      billableHours: args.billableHours,
      totalHours: args.totalHours,
      reason: args.reason ?? 'Manual adjustment from task billing view'
    });

    if (!success) {
      showError(updateError ?? 'Failed to update billable hours');
      return;
    }

    showSuccess('Billable hours updated');
    await loadData();
  }, [params.startDate, params.endDate, loadData]);

  const setDateRange = useCallback((start: string, end: string) => {
    setParams((prev) => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  }, []);

  const setProjectIds = useCallback((projectIds: string[]) => {
    setParams((prev) => ({
      ...prev,
      projectIds
    }));
  }, []);

  const setTaskIds = useCallback((taskIds: string[]) => {
    setParams((prev) => ({
      ...prev,
      taskIds
    }));
  }, []);

  return {
    data,
    loading,
    error,
    params,
    setDateRange,
    setProjectIds,
    setTaskIds,
    refresh: loadData,
    updateTaskHours
  };
}
