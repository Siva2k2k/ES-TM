import React, { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  Building,
  CheckSquare,
  Users,
  Download,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface TaskBillingData {
  task_id: string;
  task_name: string;
  project_id: string;
  project_name: string;
  total_hours: number;
  billable_hours: number;
  resources: TaskResourceData[];
}

interface TaskResourceData {
  user_id: string;
  user_name: string;
  hours: number;
  billable_hours: number;
  rate: number;
  amount: number;
}

interface TaskBillingResponse {
  tasks: TaskBillingData[];
  summary: {
    total_tasks: number;
    total_hours: number;
    total_billable_hours: number;
    total_amount: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

export const TaskBillingView: React.FC = () => {
  const [data, setData] = useState<TaskBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingHours, setEditingHours] = useState<{
    taskId: string;
    userId: string;
    originalBillable: number;
    newBillable: number;
  } | null>(null);
  const [groupBy, setGroupBy] = useState<'project' | 'none'>('project');

  useEffect(() => {
    loadTaskBillingData();
  }, [startDate, endDate]);

  const loadTaskBillingData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(`/api/v1/project-billing/tasks?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        const errorMsg = result.error || 'Unknown error occurred';
        console.error('Failed to load task billing data:', errorMsg);
        showError(`Failed to load task billing data: ${errorMsg}`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Network error occurred';
      console.error('Error loading task billing data:', errorMsg);
      showError(`Error loading task billing data: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const startEditingHours = (taskId: string, userId: string, currentBillable: number) => {
    setEditingHours({
      taskId,
      userId,
      originalBillable: currentBillable,
      newBillable: currentBillable
    });
  };

  const saveHoursEdit = async () => {
    if (!editingHours) return;

    try {
      const response = await fetch('/api/v1/project-billing/billable-hours', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: editingHours.userId,
          task_id: editingHours.taskId,
          date: startDate,
          billable_hours: editingHours.newBillable,
          reason: 'Manual adjustment from task billing view'
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingHours(null);
        await loadTaskBillingData();
      } else {
        showError(`Failed to update hours: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating billable hours:', error);
      showError('Failed to update billable hours');
    }
  };

  const cancelHoursEdit = () => {
    setEditingHours(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Group tasks by project if needed
  const getGroupedTasks = () => {
    if (!data?.tasks) return {};

    if (groupBy === 'project') {
      return data.tasks.reduce((groups, task) => {
        const projectKey = `${task.project_id}_${task.project_name}`;
        if (!groups[projectKey]) {
          groups[projectKey] = {
            project_name: task.project_name,
            project_id: task.project_id,
            tasks: []
          };
        }
        groups[projectKey].tasks.push(task);
        return groups;
      }, {} as Record<string, { project_name: string; project_id: string; tasks: TaskBillingData[] }>);
    }

    return { all: { project_name: 'All Tasks', project_id: 'all', tasks: data.tasks } };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const groupedTasks = getGroupedTasks();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Billing View</h1>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'project' | 'none')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="project">Project</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.total_tasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{formatHours(data.summary.total_hours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Billable Hours</p>
                <p className="text-2xl font-bold text-gray-900">{formatHours(data.summary.total_billable_hours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.total_amount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Groups */}
      {Object.entries(groupedTasks).map(([groupKey, group]) => (
        <div key={groupKey} className="space-y-4">
          {/* Project Header (if grouped) */}
          {groupBy === 'project' && group.project_id !== 'all' && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{group.project_name}</h2>
              </div>
            </div>
          )}

          {/* Tasks */}
          {group.tasks.map((task) => (
            <div key={task.task_id} className="bg-white rounded-lg shadow border">
              {/* Task Header */}
              <div 
                className="p-4 border-b cursor-pointer hover:bg-gray-50"
                onClick={() => toggleTaskExpansion(task.task_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedTasks.has(task.task_id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{task.task_name}</h3>
                      {groupBy !== 'project' && (
                        <p className="text-sm text-gray-500">{task.project_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{formatHours(task.total_hours)}</p>
                      <p className="text-gray-500">Total Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-600">{formatHours(task.billable_hours)}</p>
                      <p className="text-gray-500">Billable</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-600">
                        {formatCurrency(task.resources.reduce((sum, r) => sum + r.amount, 0))}
                      </p>
                      <p className="text-gray-500">Amount</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Resource Details */}
              {expandedTasks.has(task.task_id) && (
                <div className="p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Resources</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Resource
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Billable Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {task.resources.map((resource) => (
                          <tr key={resource.user_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {resource.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatHours(resource.hours)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingHours?.taskId === task.task_id && 
                               editingHours?.userId === resource.user_id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max={resource.hours}
                                    value={editingHours.newBillable}
                                    onChange={(e) => setEditingHours({
                                      ...editingHours,
                                      newBillable: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-20 px-2 py-1 text-sm border rounded"
                                  />
                                  <button
                                    onClick={saveHoursEdit}
                                    className="p-1 text-green-600 hover:text-green-800"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelHoursEdit}
                                    className="p-1 text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-green-600 font-medium">
                                  {formatHours(resource.billable_hours)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(resource.rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {formatCurrency(resource.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {editingHours?.taskId === task.task_id && 
                               editingHours?.userId === resource.user_id ? null : (
                                <button
                                  onClick={() => startEditingHours(
                                    task.task_id, 
                                    resource.user_id, 
                                    resource.billable_hours
                                  )}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {!data?.tasks.length && !loading && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No task billing data found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default TaskBillingView;