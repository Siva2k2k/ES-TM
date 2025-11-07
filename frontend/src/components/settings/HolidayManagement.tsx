import React, { useState, useEffect } from 'react';
import { CompanyHolidayService, type CompanyHoliday, type HolidayType } from '../../services/CompanyHolidayService';

export const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    holiday_type: 'public' as HolidayType,
    description: ''
  });

  const loadHolidays = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CompanyHolidayService.getHolidaysByYear(selectedYear);

      if (result.error) {
        setError(result.error);
      } else {
        setHolidays(result.holidays);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;

      if (editingHoliday) {
        result = await CompanyHolidayService.updateHoliday(editingHoliday._id, formData);
      } else {
        result = await CompanyHolidayService.createHoliday(formData);
      }

      if (result.error) {
        alert(result.error);
      } else {
        setShowForm(false);
        setEditingHoliday(null);
        setFormData({ name: '', date: '', holiday_type: 'public', description: '' });
        loadHolidays();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save holiday');
    }
  };

  const handleEdit = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: typeof holiday.date === 'string' ? holiday.date.split('T')[0] : new Date(holiday.date).toISOString().split('T')[0],
      holiday_type: holiday.holiday_type,
      description: holiday.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const result = await CompanyHolidayService.deleteHoliday(id);

      if (result.error) {
        alert(result.error);
      } else {
        loadHolidays();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete holiday');
    }
  };

  const handleToggleActive = async (holiday: CompanyHoliday) => {
    try {
      const result = await CompanyHolidayService.updateHoliday(holiday._id, {
        is_active: !holiday.is_active
      });

      if (result.error) {
        alert(result.error);
      } else {
        loadHolidays();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update holiday');
    }
  };

  const getHolidayTypeColor = (type: HolidayType): string => {
    switch (type) {
      case 'public':
        return 'bg-blue-100 text-blue-800';
      case 'company':
        return 'bg-green-100 text-green-800';
      case 'optional':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
            <p className="text-gray-600 text-sm mt-1">Manage company holidays and leave calendar</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setEditingHoliday(null);
                setFormData({ name: '', date: '', holiday_type: 'public', description: '' });
                setShowForm(!showForm);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : '+ Add Holiday'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Independence Day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.holiday_type}
                  onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value as HolidayType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public Holiday</option>
                  <option value="company">Company Holiday</option>
                  <option value="optional">Optional Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingHoliday(null);
                  setFormData({ name: '', date: '', holiday_type: 'public', description: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading holidays...</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No holidays found for {selectedYear}</p>
            <p className="text-sm">Click "Add Holiday" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holiday Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holidays.map((holiday) => (
                  <tr key={holiday._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(holiday.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {holiday.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHolidayTypeColor(holiday.holiday_type)}`}>
                        {holiday.holiday_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {holiday.description || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleActive(holiday)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          holiday.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {holiday.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(holiday._id, holiday.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayManagement;
