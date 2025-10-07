import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Send,
  Edit,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  line_items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

interface InvoiceLineItem {
  id: string;
  type: 'timesheet' | 'expense' | 'fixed_fee';
  description: string;
  quantity: number;
  rate: number;
  total: number;
  timesheet_ids?: string[];
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export const EnhancedInvoiceWorkflow: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
    pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
    paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
  };

  useEffect(() => {
    loadInvoices();
    loadClients();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/v1/billing/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/v1/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.clients?.map((c: any) => ({
          id: c._id,
          name: c.name,
          email: c.email
        })) || []);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/v1/billing/invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        await loadInvoices();
        showSuccess('Invoice approved successfully');
      } else {
        showError(data.error || 'Failed to approve invoice');
      }
    } catch (err) {
      console.error('Error approving invoice:', err);
      showError('Failed to approve invoice');
    }
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/v1/billing/invoices/${invoiceId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (data.success) {
        await loadInvoices();
        showSuccess('Invoice rejected successfully');
      } else {
        showError(data.error || 'Failed to reject invoice');
      }
    } catch (err) {
      console.error('Error rejecting invoice:', err);
      showError('Failed to reject invoice');
    }
  };

  const handleGenerateInvoice = async (clientId: string, weekStartDate: string) => {
    try {
      const response = await fetch('/api/v1/billing/invoices/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          week_start_date: weekStartDate
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadInvoices();
        setShowGenerateModal(false);
        showSuccess('Invoice generated successfully');
      } else {
        showError(data.error || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      showError('Failed to generate invoice');
    }
  };

  const filteredInvoices = selectedStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === selectedStatus);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
                Enhanced Invoice Workflow
              </h1>
              <p className="text-gray-600">
                Manage invoice generation, approval, and tracking
              </p>
            </div>
            
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending_approval', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'sent', label: 'Sent' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Invoices ({filteredInvoices.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No invoices found</p>
                <p className="text-sm text-gray-400">
                  {selectedStatus === 'all' 
                    ? 'Generate your first invoice to get started'
                    : `No invoices with status: ${selectedStatus}`
                  }
                </p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => {
                const statusInfo = statusConfig[invoice.status];
                const StatusIcon = statusInfo.icon;
                const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date();

                return (
                  <div key={invoice.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <StatusIcon className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">
                              {invoice.invoice_number}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {invoice.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{invoice.client_name}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {formatDate(invoice.due_date)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(invoice.total_amount)}</span>
                            </span>
                          </div>

                          {invoice.line_items && (
                            <div className="mt-2 text-xs text-gray-500">
                              {invoice.line_items.length} line item{invoice.line_items.length !== 1 ? 's' : ''}
                              {invoice.approved_by && (
                                <span className="ml-4">
                                  Approved by: {invoice.approved_by}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Action buttons based on status */}
                        {invoice.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApproveInvoice(invoice.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Invoice"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectInvoice(invoice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Invoice"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetails(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => showError('Download functionality will be implemented')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {invoice.status === 'draft' && (
                          <>
                            <button
                              onClick={() => showError('Edit functionality will be implemented')}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => showError('Delete functionality will be implemented')}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Generate Invoice Modal */}
        {showGenerateModal && (
          <GenerateInvoiceModal
            clients={clients}
            onGenerate={handleGenerateInvoice}
            onClose={() => setShowGenerateModal(false)}
          />
        )}

        {/* Invoice Details Modal */}
        {showDetails && selectedInvoice && (
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowDetails(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Generate Invoice Modal Component
const GenerateInvoiceModal: React.FC<{
  clients: Client[];
  onGenerate: (clientId: string, weekStartDate: string) => void;
  onClose: () => void;
}> = ({ clients, onGenerate, onClose }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return weekStart.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient && weekStartDate) {
      onGenerate(selectedClient, weekStartDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Invoice</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Week Start Date
            </label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invoice Details Modal Component
const InvoiceDetailsModal: React.FC<{
  invoice: Invoice;
  onClose: () => void;
}> = ({ invoice, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{invoice.invoice_number}</h2>
            <p className="text-gray-600">{invoice.client_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Invoice Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{invoice.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span>{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span>{formatDate(invoice.due_date)}</span>
              </div>
              {invoice.approved_by && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved By:</span>
                    <span>{invoice.approved_by}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved At:</span>
                    <span>{invoice.approved_at ? formatDate(invoice.approved_at) : 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Amount Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.line_items && invoice.line_items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Line Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">
                        <span className="capitalize">{item.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInvoiceWorkflow;
