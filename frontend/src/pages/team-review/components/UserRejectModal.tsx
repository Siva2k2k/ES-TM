/**
 * UserRejectModal
 * Modal to collect rejection reason when rejecting a single user's timesheet
 */
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface UserRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
  projectName: string | null;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const UserRejectModal: React.FC<UserRejectModalProps> = ({
  isOpen,
  onClose,
  userName,
  projectName,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const textareaId = 'user-reject-reason';

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setError('');
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity border-0 p-0 m-0"
        type="button"
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reject User Timesheet</h3>
            </div>
            <button onClick={handleClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">Rejecting timesheet for</p>
              <p className="font-medium text-gray-900">{userName} — {projectName}</p>
            </div>

            <div>
              <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea
                id={textareaId}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(''); }}
                disabled={isLoading}
                placeholder="Explain why this timesheet is being rejected (minimum 10 characters)..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">{reason.length}/10 characters minimum</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button onClick={handleClose} disabled={isLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
            <button onClick={handleConfirm} disabled={isLoading || reason.trim().length < 10} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors bg-red-600 hover:bg-red-700">
              {isLoading ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</span>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRejectModal;
