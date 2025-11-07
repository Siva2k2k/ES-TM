import React, { useState } from 'react';

interface RejectInvoiceDialogProps {
  open: boolean;
  invoiceNumber?: string;
  onClose: () => void;
  onReject: (reason: string) => Promise<void> | void;
}

export function RejectInvoiceDialog({ open, invoiceNumber, onClose, onReject }: RejectInvoiceDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    await onReject(reason.trim());
    setReason('');
    setSubmitting(false);
  };

  const handleClose = () => {
    setReason('');
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Reject Invoice
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Provide a reason for rejecting invoice{' '}
          <span className="font-semibold">{invoiceNumber ?? ''}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Rejection Reason
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Describe why this invoice is being rejected..."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Rejecting...' : 'Reject Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
