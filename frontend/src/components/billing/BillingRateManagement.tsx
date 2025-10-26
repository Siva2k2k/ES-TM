import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Clock,
  Users,
  Building,
  Briefcase,
  Settings
} from 'lucide-react';
import { DeleteButton } from '../common/DeleteButton';
import { showSuccess, showError } from '../../utils/toast';
import { BillingService } from '../../services/BillingService';
import { UserService } from '../../services/UserService';
import { ProjectService } from '../../services/ProjectService';

interface BillingRate {
  id: string;
  entity_type: 'user' | 'role' | 'project' | 'client' | 'global';
  entity_id?: string;
  hourly_rate: number;
  overtime_multiplier: number;
  holiday_multiplier: number;
  weekend_multiplier: number;
  minimum_increment_minutes: number;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
  entity_name?: string; // For display purposes
}

interface CreateRateData {
  entity_type: 'user' | 'role' | 'project' | 'client' | 'global';
  entity_id?: string;
  hourly_rate: number;
  overtime_multiplier: number;
  holiday_multiplier: number;
  weekend_multiplier: number;
  minimum_increment_minutes: number;
  effective_from: string;
  effective_until?: string;
}

interface EntityOption {
  id: string;
  name: string;
  type: string;
}

export const BillingRateManagement: React.FC = () => {
  const [rates, setRates] = useState<BillingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [entities, setEntities] = useState<{
    users: EntityOption[];
    projects: EntityOption[];
    clients: EntityOption[];
  }>({
    users: [],
    projects: [],
    clients: []
  });

  const [newRate, setNewRate] = useState<CreateRateData>({
    entity_type: 'global',
    hourly_rate: 0,
    overtime_multiplier: 1.5,
    holiday_multiplier: 2.0,
    weekend_multiplier: 1.2,
    minimum_increment_minutes: 15,
    effective_from: new Date().toISOString().split('T')[0]
  });

  const entityTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    user: Users,
    role: Briefcase,
    project: Building,
    client: Building,
    global: Settings
  };

  const roleOptions = [
    { id: 'super_admin', name: 'Super Admin' },
    { id: 'management', name: 'Management' },
    { id: 'manager', name: 'Manager' },
    { id: 'lead', name: 'Lead' },
    { id: 'employee', name: 'Employee' }
  ];

  useEffect(() => {
    loadRates();
    loadEntities();
  }, []);

  const loadRates = async () => {
    try {
      const result = await BillingService.getBillingRates();
      if (result.rates) {
        setRates(result.rates);
      } else if (result.error) {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error loading rates:', err);
      showError('Failed to load billing rates');
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    try {
      // Load users, projects, and clients in parallel using service methods
      const [usersResult, projectsResult, clientsResult] = await Promise.all([
        UserService.getAllUsers(),
        ProjectService.getAllProjects(),
        BillingService.getClients()
      ]);

      setEntities({
        users: usersResult.users?.map((u: any) => ({
          id: u._id,
          name: `${u.first_name} ${u.last_name}`,
          type: 'user'
        })) || [],
        projects: projectsResult.projects?.map((p: any) => ({
          id: p._id,
          name: p.name,
          type: 'project'
        })) || [],
        clients: clientsResult.clients?.map((c: any) => ({
          id: c._id,
          name: c.name,
          type: 'client'
        })) || []
      });
    } catch (err) {
      console.error('Error loading entities:', err);
    }
  };

  const handleCreateRate = async () => {
    try {
      const result = await BillingService.createBillingRate(newRate);
      if (result.rate) {
        showSuccess('Billing rate created successfully');
        await loadRates();
        setShowCreateForm(false);
        resetNewRate();
      } else {
        showError(result.error || 'Failed to create rate');
      }
    } catch (err) {
      console.error('Error creating rate:', err);
      showError('Failed to create rate');
    }
  };

  const handleDeleteRate = async (entityType: string, entityId: string, deleteType: 'soft' | 'hard') => {
    try {
      const result = await BillingService.deleteBillingRate(entityId);
      if (result.success) {
        if (deleteType === 'soft') {
          showSuccess('Billing rate moved to trash successfully');
        } else {
          showSuccess('Billing rate permanently deleted');
        }
        await loadRates();
      } else {
        showError(result.error || 'Failed to delete rate');
      }
    } catch (err) {
      console.error('Error deleting rate:', err);
      showError('Failed to delete rate');
    }
  };

  const resetNewRate = () => {
    setNewRate({
      entity_type: 'global',
      hourly_rate: 0,
      overtime_multiplier: 1.5,
      holiday_multiplier: 2.0,
      weekend_multiplier: 1.2,
      minimum_increment_minutes: 15,
      effective_from: new Date().toISOString().split('T')[0]
    });
  };

  const getEntityOptions = () => {
    switch (newRate.entity_type) {
      case 'user':
        return entities.users;
      case 'role':
        return roleOptions;
      case 'project':
        return entities.projects;
      case 'client':
        return entities.clients;
      default:
        return [];
    }
  };

  const getEntityName = (rate: BillingRate) => {
    if (rate.entity_type === 'global') return 'Global Default';
    if (rate.entity_type === 'role') {
      const role = roleOptions.find(r => r.id === rate.entity_id);
      return role?.name || rate.entity_id;
    }
    return rate.entity_name || rate.entity_id || 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Billing Rate Management
              </h1>
              <p className="text-gray-600">
                Configure hourly rates and multipliers for different entities
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Rate</span>
            </button>
          </div>
        </div>

        {/* Create Rate Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Rate</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetNewRate();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type
                </label>
                <select
                  value={newRate.entity_type}
                  onChange={(e) => setNewRate(prev => ({
                    ...prev,
                    entity_type: e.target.value as any,
                    entity_id: undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="global">Global Default</option>
                  <option value="role">Role-based</option>
                  <option value="user">User-specific</option>
                  <option value="project">Project-specific</option>
                  <option value="client">Client-specific</option>
                </select>
              </div>

              {/* Entity Selection */}
              {newRate.entity_type !== 'global' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {newRate.entity_type}
                  </label>
                  <select
                    value={newRate.entity_id || ''}
                    onChange={(e) => setNewRate(prev => ({ ...prev, entity_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select {newRate.entity_type}</option>
                    {getEntityOptions().map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRate.hourly_rate}
                  onChange={(e) => setNewRate(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Overtime Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={newRate.overtime_multiplier}
                  onChange={(e) => setNewRate(prev => ({ ...prev, overtime_multiplier: parseFloat(e.target.value) || 1.5 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Holiday Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={newRate.holiday_multiplier}
                  onChange={(e) => setNewRate(prev => ({ ...prev, holiday_multiplier: parseFloat(e.target.value) || 2.0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Weekend Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekend Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={newRate.weekend_multiplier}
                  onChange={(e) => setNewRate(prev => ({ ...prev, weekend_multiplier: parseFloat(e.target.value) || 1.2 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Minimum Increment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Increment (minutes)
                </label>
                <select
                  value={newRate.minimum_increment_minutes}
                  onChange={(e) => setNewRate(prev => ({ ...prev, minimum_increment_minutes: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From
                </label>
                <input
                  type="date"
                  value={newRate.effective_from}
                  onChange={(e) => setNewRate(prev => ({ ...prev, effective_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Effective Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Until (Optional)
                </label>
                <input
                  type="date"
                  value={newRate.effective_until || ''}
                  onChange={(e) => setNewRate(prev => ({ ...prev, effective_until: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetNewRate();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Rate</span>
              </button>
            </div>
          </div>
        )}

        {/* Rates List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Rates</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {rates.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No billing rates configured</p>
                <p className="text-sm text-gray-400">
                  Create your first rate to get started
                </p>
              </div>
            ) : (
              rates.map((rate) => {
                const EntityIcon = entityTypeIcons[rate.entity_type];
                return (
                  <div key={rate.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <EntityIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">
                              {getEntityName(rate)}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                              {rate.entity_type}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(rate.hourly_rate)}/hr</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{rate.minimum_increment_minutes}min increment</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>OT: {rate.overtime_multiplier}x</span>
                            <span>Holiday: {rate.holiday_multiplier}x</span>
                            <span>Weekend: {rate.weekend_multiplier}x</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-600 mr-4">
                          <p>Effective: {new Date(rate.effective_from).toLocaleDateString()}</p>
                          {rate.effective_until && (
                            <p>Until: {new Date(rate.effective_until).toLocaleDateString()}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setEditingRate(rate.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <DeleteButton
                          onDelete={handleDeleteRate}
                          entityId={rate.id}
                          entityName={`${rate.entity_type} billing rate ($${rate.hourly_rate}/hr)`}
                          entityType="billing_rate"
                          variant="icon"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingRateManagement;
