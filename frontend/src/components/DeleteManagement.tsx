import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Shield, 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  Archive,
  ShieldAlert
} from 'lucide-react';
import { DeleteButton, BulkDeleteButton } from './common/DeleteButton';

interface DeletedItem {
  id: string;
  type: 'user' | 'project' | 'task' | 'timesheet' | 'client';
  name: string;
  deleted_at: string;
  deleted_by: string;
  deleted_reason?: string;
  dependencies?: string[];
}

interface DeleteManagementProps {
  userRole: 'super_admin' | 'management' | 'manager' | 'lead' | 'employee';
}

export const DeleteManagement: React.FC<DeleteManagementProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [entityType, setEntityType] = useState<string>('user');
  const [items, setItems] = useState<any[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isSuperAdmin = userRole === 'super_admin';
  const isManagement = userRole === 'management' || isSuperAdmin;

  // Available entity types based on role
  const getAvailableEntityTypes = () => {
    const types = [
      { value: 'user', label: 'Users', icon: Shield, adminOnly: true },
      { value: 'project', label: 'Projects', icon: Archive, managementOnly: true },
      { value: 'task', label: 'Tasks', icon: Trash2, managementOnly: false },
      { value: 'timesheet', label: 'Timesheets', icon: Trash2, managementOnly: false },
      { value: 'client', label: 'Clients', icon: Archive, managementOnly: true }
    ];

    return types.filter(type => {
      if (type.adminOnly && !isSuperAdmin) return false;
      if (type.managementOnly && !isManagement) return false;
      return true;
    });
  };

  const entityTypes = getAvailableEntityTypes();

  useEffect(() => {
    loadItems();
  }, [entityType, activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deleted') {
        await loadDeletedItems();
      } else {
        await loadActiveItems();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActiveItems = async () => {
    // Mock data - replace with actual API call
    const mockData = {
      user: [
        { id: '1', name: 'John Doe', email: 'john@company.com', role: 'employee', status: 'active' },
        { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'manager', status: 'active' }
      ],
      project: [
        { id: '1', name: 'Website Redesign', status: 'active', client: 'Acme Corp' },
        { id: '2', name: 'Mobile App', status: 'completed', client: 'Tech Inc' }
      ],
      task: [
        { id: '1', name: 'UI Design', project: 'Website Redesign', assignee: 'John Doe' },
        { id: '2', name: 'Backend API', project: 'Mobile App', assignee: 'Jane Smith' }
      ]
    };

    setItems(mockData[entityType as keyof typeof mockData] || []);
  };

  const loadDeletedItems = async () => {
    // Mock deleted data - replace with actual API call
    const mockDeletedData: DeletedItem[] = [
      {
        id: '1',
        type: 'user',
        name: 'Former Employee',
        deleted_at: '2024-10-01T10:30:00Z',
        deleted_by: 'Admin User',
        deleted_reason: 'Left company',
        dependencies: ['2 timesheets', '1 project assignment']
      },
      {
        id: '2', 
        type: 'project',
        name: 'Old Project',
        deleted_at: '2024-09-15T15:45:00Z',
        deleted_by: 'Management',
        deleted_reason: 'Project cancelled',
        dependencies: ['5 tasks', '3 timesheets']
      }
    ];

    setDeletedItems(mockDeletedData.filter(item => item.type === entityType));
  };

  const handleDelete = async (entityType: string, entityId: string, deleteType: 'soft' | 'hard') => {
    try {
      // Call your delete API here
      console.log(`${deleteType} deleting ${entityType} ${entityId}`);
      await loadItems(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRestore = async (entityType: string, entityId: string) => {
    try {
      // Call your restore API here  
      console.log(`Restoring ${entityType} ${entityId}`);
      await loadItems(); // Refresh list
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const handleBulkDelete = async (entityType: string, entityIds: string[], deleteType: 'soft' | 'hard') => {
    try {
      // Call your bulk delete API here
      console.log(`Bulk ${deleteType} deleting ${entityType}s:`, entityIds);
      setSelectedIds(new Set());
      await loadItems(); // Refresh list
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Trash2 className="h-6 w-6 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Delete Management</h1>
            </div>
            
            {isSuperAdmin && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                <ShieldAlert className="h-4 w-4" />
                Super Admin Access
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Entity Type Selector */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                {entityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Active Items
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'deleted'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Deleted Items
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${entityType}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && activeTab === 'active' && (
              <BulkDeleteButton
                entityType={entityType}
                selectedIds={Array.from(selectedIds)}
                onBulkDelete={handleBulkDelete}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : activeTab === 'active' ? (
            /* Active Items Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedIds.size === items.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.email && <div className="text-sm text-gray-500">{item.email}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {entityType === 'user' && `Role: ${item.role}`}
                        {entityType === 'project' && `Client: ${item.client}`}
                        {entityType === 'task' && `Project: ${item.project}, Assignee: ${item.assignee}`}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DeleteButton
                          entityType={entityType}
                          entityId={item.id}
                          entityName={item.name}
                          ownerId={item.user_id || item.created_by}
                          onDelete={handleDelete}
                          variant="dropdown"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No {entityType}s found.
                </div>
              )}
            </div>
          ) : (
            /* Deleted Items Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deleted Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deleted By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dependencies
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deletedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(item.deleted_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {item.deleted_by}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {item.deleted_reason || 'No reason provided'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {item.dependencies?.join(', ') || 'None'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <DeleteButton
                            entityType={item.type}
                            entityId={item.id}
                            entityName={item.name}
                            onRestore={handleRestore}
                            variant="button"
                            showRestore={true}
                            isDeleted={true}
                          />
                          
                          {isSuperAdmin && (
                            <DeleteButton
                              entityType={item.type}
                              entityId={item.id}
                              entityName={item.name}
                              onDelete={handleDelete}
                              variant="icon"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {deletedItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No deleted {entityType}s found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};