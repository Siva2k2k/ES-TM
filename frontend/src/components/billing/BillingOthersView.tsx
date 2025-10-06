import React, { useState } from 'react';
import { EnhancedBillingDashboard } from './EnhancedBillingDashboard';
import { BillingRateManagement } from './BillingRateManagement';
import { EnhancedInvoiceWorkflow } from './EnhancedInvoiceWorkflow';
import { EnhancedBillingManagement } from '../EnhancedBillingManagement';

type OtherBillingViewType = 'dashboard' | 'rates' | 'invoices' | 'snapshots' | 'reports';

interface TabItem {
  id: OtherBillingViewType;
  label: string;
  description: string;
}

export const BillingOthersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OtherBillingViewType>('dashboard');

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Enhanced Dashboard',
      description: 'Billing overview and statistics'
    },
    {
      id: 'invoices',
      label: 'Invoice Workflow',
      description: 'Invoice generation and management'
    },
    {
      id: 'rates',
      label: 'Rate Management',
      description: 'Configure billing rates and multipliers'
    },
    {
      id: 'snapshots',
      label: 'Billing Snapshots',
      description: 'Weekly billing snapshots'
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      description: 'Revenue and billing reports'
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnhancedBillingDashboard />;
      case 'rates':
        return <BillingRateManagement />;
      case 'invoices':
        return <EnhancedInvoiceWorkflow />;
      case 'snapshots':
      case 'reports':
      default:
        return <EnhancedBillingManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Other Billing Features</h1>
        <p className="text-gray-600">Additional billing management tools and features</p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="bg-white rounded-lg shadow border">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderActiveTab()}
        </div>
      </div>

      {/* Feature Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">💡</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Secondary Features</h3>
            <p className="text-sm text-blue-700 mt-1">
              These are additional billing management features. The main billing workflows are handled in the 
              <strong> Project Billing</strong> and <strong> Task Billing</strong> sections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingOthersView;