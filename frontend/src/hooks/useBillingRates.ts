import { useCallback, useEffect, useState } from 'react';
import { BillingService } from '../services/BillingService';
import { useBillingContext } from '../store/contexts/BillingContext';
import type { BillingRate, CreateRateData } from '../types/billing';
import { showError, showSuccess } from '../utils/toast';

export function useBillingRates() {
  const { users, projects, clients } = useBillingContext();
  const [rates, setRates] = useState<BillingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await BillingService.getBillingRates();
    if (result.error) {
      setError(result.error);
      showError(result.error);
    } else {
      setRates(result.rates);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const saveRate = useCallback(async (payload: CreateRateData) => {
    const { error: saveError } = await BillingService.createBillingRate(payload);
    if (saveError) {
      showError(saveError);
      return false;
    }

    showSuccess('Billing rate saved');
    await loadRates();
    return true;
  }, [loadRates]);

  const deleteRate = useCallback(async (rateId: string) => {
    const { success, error: deleteError } = await BillingService.deleteBillingRate(rateId);
    if (!success) {
      showError(deleteError ?? 'Failed to delete rate');
      return false;
    }

    showSuccess('Billing rate removed');
    await loadRates();
    return true;
  }, [loadRates]);

  return {
    users,
    projects,
    clients,
    rates,
    loading,
    error,
    refresh: loadRates,
    saveRate,
    deleteRate
  };
}
