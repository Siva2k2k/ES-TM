import { useCallback, useEffect, useMemo, useState } from 'react';
import { BillingService } from '../services/BillingService';
import { ProjectService } from '../services/ProjectService';
import type { BillingClient, BillingInvoice, BillingInvoiceStatus } from '../types/billing';
import { showError, showSuccess } from '../utils/toast';

type InvoiceStatusFilter = 'all' | BillingInvoiceStatus;

export function useInvoiceManagement() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await BillingService.getInvoices();
    if (result.error) {
      showError(result.error);
      setError(result.error);
    } else {
      setInvoices(result.invoices);
    }

    setLoading(false);
  }, []);

  const loadClients = useCallback(async () => {
    const result = await ProjectService.getAllClients();
    if (result.error) {
      showError(result.error);
    } else {
      setClients(
        result.clients.map((client) => ({
          id: client._id ?? client.id ?? '',
          name: client.name,
          email: client.email
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadClients();
  }, [loadInvoices, loadClients]);

  const approveInvoice = useCallback(async (invoiceId: string) => {
    const { success, error: approveError } = await BillingService.approveInvoice(invoiceId);
    if (!success) {
      showError(approveError ?? 'Failed to approve invoice');
      return;
    }

    showSuccess('Invoice approved');
    await loadInvoices();
  }, [loadInvoices]);

  const rejectInvoice = useCallback(async (invoiceId: string, reason: string) => {
    const { success, error: rejectError } = await BillingService.rejectInvoice(invoiceId, reason);
    if (!success) {
      showError(rejectError ?? 'Failed to reject invoice');
      return;
    }

    showSuccess('Invoice rejected');
    await loadInvoices();
  }, [loadInvoices]);

  const generateInvoice = useCallback(async (clientId: string, weekStartDate: string) => {
    const { success, error: generateError } = await BillingService.generateInvoice(clientId, weekStartDate);
    if (!success) {
      showError(generateError ?? 'Failed to generate invoice');
      return;
    }

    showSuccess('Invoice generated');
    await loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') {
      return invoices;
    }
    return invoices.filter((invoice) => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  return {
    invoices: filteredInvoices,
    allInvoices: invoices,
    clients,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refresh: loadInvoices,
    approveInvoice,
    rejectInvoice,
    generateInvoice
  };
}
