import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Calendar,
  Plus,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../../store/contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { showSuccess, showError, showWarning } from '../../utils/toast';

interface BillingDashboardStats {
  total_invoices: number;
  draft_invoices: number;
  pending_approval: number;
  approved_invoices: number;
  total_outstanding: number;
  overdue_invoices: number;
  total_revenue_month: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'success' | 'warning';
}

export const EnhancedBillingDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingDashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  const canCreateInvoices = permissions.canManageBilling;
  const canApproveInvoices = ['super_admin', 'management', 'manager'].includes(currentUser?.role || '');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load dashboard statistics using proper token
      const token = localStorage.getItem('accessToken');
      const statsResponse = await fetch('/api/v1/billing/invoices/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to load dashboard statistics');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // TODO: Load recent invoices (implement endpoint)
      setRecentInvoices([]);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      showError('Failed to load billing dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = () => {
    // Navigate to invoice generation wizard
    showWarning('Invoice generation wizard will be implemented');
  };

  const handleCreateBillingSnapshot = async () => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
      
      const response = await fetch('/api/v1/billing/snapshots/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weekStartDate: weekStart.toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(`Generated ${data.snapshots?.length || 0} billing snapshots`);
        loadDashboardData(); // Refresh dashboard
      } else {
        showError(data.error || 'Failed to generate billing snapshots');
      }
    } catch (err) {
      console.error('Error generating snapshots:', err);
      showError('Failed to generate billing snapshots');
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'generate-invoice',
      label: 'Generate Invoice',
      icon: Plus,
      onClick: handleGenerateInvoice,
      disabled: !canCreateInvoices,
      variant: 'primary'
    },
    {
      id: 'create-snapshot',
      label: 'Create Billing Snapshot',
      icon: Calendar,
      onClick: handleCreateBillingSnapshot,
      disabled: !canCreateInvoices,
      variant: 'secondary'
    },
    {
      id: 'export-report',
      label: 'Export Report',
      icon: Download,
      onClick: () => showWarning('Export functionality will be implemented'),
      variant: 'secondary'
    }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-emerald-100 text-emerald-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!permissions.canManageBilling) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the billing dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Enhanced Billing Management
              </h1>
              <p className="text-gray-600">
                Comprehensive invoice management and financial tracking
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                      ${action.variant === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100'
                      }
                      ${action.disabled ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.total_invoices || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.pending_approval || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats?.total_revenue_month || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.overdue_invoices || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Filter className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {recentInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No recent invoices</p>
                    <p className="text-sm text-gray-400">
                      Invoices will appear here once you create them
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-600">{invoice.client_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                            <p className="text-sm text-gray-600">Due {invoice.due_date}</p>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Outstanding Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Outstanding Balance</h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats?.total_outstanding || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total outstanding</p>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current</span>
                    <span className="font-medium">{formatCurrency((stats?.total_outstanding || 0) * 0.7)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Overdue</span>
                    <span className="font-medium text-red-600">{formatCurrency((stats?.total_outstanding || 0) * 0.3)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Draft</span>
                  </div>
                  <span className="font-medium">{stats?.draft_invoices || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="font-medium">{stats?.pending_approval || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Approved</span>
                  </div>
                  <span className="font-medium">{stats?.approved_invoices || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBillingDashboard;