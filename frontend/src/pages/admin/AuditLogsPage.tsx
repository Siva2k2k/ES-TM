/**
 * Audit Logs Page
 * Admin-only page for viewing system audit logs
 * SonarQube Compliant: Cognitive Complexity < 15, File < 250 lines
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/contexts/AuthContext';
import { AuditLogTable, AuditLog } from './components';
import {
  Shield,
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { showError, showSuccess } from '../../utils/toast';

const AUDIT_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'TIMESHEET_SUBMITTED',
  'TIMESHEET_APPROVED',
  'TIMESHEET_REJECTED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'PERMISSION_DENIED'
];

export const AuditLogsPage: React.FC = () => {
  const { currentUser, currentUserRole } = useAuth();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const LOGS_PER_PAGE = 50;

  // Permission check
  const canViewAuditLogs = ['super_admin', 'management'].includes(currentUserRole);

  useEffect(() => {
    if (canViewAuditLogs) {
      loadAuditLogs();
    }
  }, [currentPage, selectedActions, startDate, endDate, canViewAuditLogs]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LOGS_PER_PAGE.toString(),
        offset: ((currentPage - 1) * LOGS_PER_PAGE).toString()
      });

      if (selectedActions.length > 0) {
        params.append('actions', selectedActions.join(','));
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/v1/audit/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      showError('Failed to load audit logs');
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionFilter = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action)
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', 'csv');

      const response = await fetch(`/api/v1/audit/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const data = await response.json();
      showSuccess('Audit logs export initiated');
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      showError('Failed to export audit logs');
      console.error('Error exporting audit logs:', error);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    // Could open a modal with full log details
    console.log('View log details:', log);
  };

  if (!canViewAuditLogs) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view audit logs. Only Super Admin and Management roles can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                Audit Logs
              </h1>
              <p className="text-gray-600 mt-1">View all system activities and user actions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAuditLogs}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Action Types
              </label>
              <select
                multiple
                value={selectedActions}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedActions(selected);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                size={4}
              >
                {AUDIT_ACTIONS.map(action => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedActions.map(action => (
                <span
                  key={action}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2"
                >
                  {action.replace(/_/g, ' ')}
                  <button
                    onClick={() => handleActionFilter(action)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Activity Log ({totalLogs} total entries)
            </h3>
          </div>

          <AuditLogTable
            logs={logs}
            loading={loading}
            onViewDetails={handleViewDetails}
          />

          {/* Pagination */}
          {totalLogs > LOGS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1} to {Math.min(currentPage * LOGS_PER_PAGE, totalLogs)} of {totalLogs} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
