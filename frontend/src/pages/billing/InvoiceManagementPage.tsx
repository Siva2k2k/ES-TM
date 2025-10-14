import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useInvoiceManagement } from '../../hooks/useInvoiceManagement';
import type { BillingInvoice } from '../../types/billing';
import { BillingHeader } from './components/BillingHeader';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceGenerateDialog } from './components/InvoiceGenerateDialog';
import { RejectInvoiceDialog } from './components/RejectInvoiceDialog';

export function InvoiceManagementPage() {
  const {
    invoices,
    clients,
    loading,
    statusFilter,
    setStatusFilter,
    approveInvoice,
    rejectInvoice,
    generateInvoice,
    refresh
  } = useInvoiceManagement();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [rejectingInvoice, setRejectingInvoice] = useState<BillingInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  const statusOptions = useMemo(
    () => [
      { id: 'all', label: 'All statuses' },
      { id: 'draft', label: 'Draft' },
      { id: 'pending_approval', label: 'Pending Approval' },
      { id: 'approved', label: 'Approved' },
      { id: 'sent', label: 'Sent' },
      { id: 'paid', label: 'Paid' },
      { id: 'overdue', label: 'Overdue' },
      { id: 'cancelled', label: 'Cancelled' }
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      <BillingHeader
        title="Invoice Management"
        subtitle="Generate, review, and approve billing invoices with audit-ready actions"
        onRefresh={refresh}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Invoice Queue
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Filter by status and approve or reject pending invoices.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </section>

      <InvoiceList
        invoices={invoices}
        loading={loading}
        onApprove={approveInvoice}
        onReject={(invoiceId) => {
          const invoice = invoices.find((item) => item.id === invoiceId);
          if (invoice) {
            setRejectingInvoice(invoice);
          }
        }}
        onView={setSelectedInvoice}
      />

      {selectedInvoice && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Invoice Details
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Invoice {selectedInvoice.invoice_number} for {selectedInvoice.client_name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Summary</h4>
              <dl className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>${selectedInvoice.subtotal.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tax</dt>
                  <dd>${selectedInvoice.tax_amount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100">
                  <dt>Total</dt>
                  <dd>${selectedInvoice.total_amount.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Timeline</h4>
              <dl className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <dt>Issue Date</dt>
                  <dd>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Due Date</dt>
                  <dd>{new Date(selectedInvoice.due_date).toLocaleDateString()}</dd>
                </div>
                {selectedInvoice.approved_at && (
                  <div className="flex justify-between">
                    <dt>Approved</dt>
                    <dd>{new Date(selectedInvoice.approved_at).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Line Items
            </h4>
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Rate
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-300">
                  {selectedInvoice.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">${item.rate.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <InvoiceGenerateDialog
        open={generateOpen}
        clients={clients}
        onClose={() => setGenerateOpen(false)}
        onGenerate={async (clientId, weekStart) => {
          await generateInvoice(clientId, weekStart);
          setGenerateOpen(false);
        }}
      />

      <RejectInvoiceDialog
        open={Boolean(rejectingInvoice)}
        invoiceNumber={rejectingInvoice?.invoice_number}
        onClose={() => setRejectingInvoice(null)}
        onReject={async (reason) => {
          if (!rejectingInvoice) return;
          await rejectInvoice(rejectingInvoice.id, reason);
          setRejectingInvoice(null);
        }}
      />
    </div>
  );
}

export default InvoiceManagementPage;
