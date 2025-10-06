import React, { useState } from 'react';
import { 
  Building, 
  CheckSquare, 
  BarChart3, 
  FileText,
  Settings
} from 'lucide-react';
import ProjectBillingView from './ProjectBillingView';
import TaskBillingView from './TaskBillingView';
import { EnhancedBillingDashboard } from './EnhancedBillingDashboard';
import { BillingRateManagement } from './BillingRateManagement';
import { EnhancedInvoiceWorkflow } from './EnhancedInvoiceWorkflow';

type BillingViewType = 'dashboard' | 'projects' | 'tasks' | 'rates' | 'invoices';

export const BillingManagement: React.FC = () => {
  const [activeView, setActiveView] = useState<BillingViewType>('projects');

  const navigationItems = [
    {
      id: 'projects' as BillingViewType,
      label: 'Project Billing',
      icon: Building,
      description: 'Project-wise resource hours and billing',
      isPrimary: true
    },
    {
      id: 'tasks' as BillingViewType,
      label: 'Task Billing',
      icon: CheckSquare,
      description: 'Detailed task-level billing breakdown',
      isPrimary: true
    },
    {
      id: 'dashboard' as BillingViewType,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Billing overview and statistics',
      isPrimary: false
    },
    {
      id: 'invoices' as BillingViewType,
      label: 'Invoices',
      icon: FileText,
      description: 'Invoice generation and workflow',
      isPrimary: false
    },
    {
      id: 'rates' as BillingViewType,
      label: 'Rate Management',
      icon: Settings,
      description: 'Configure billing rates and multipliers',
      isPrimary: false
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'projects':
        return <ProjectBillingView />;
      case 'tasks':
        return <TaskBillingView />;
      case 'dashboard':
        return <EnhancedBillingDashboard />;
      case 'rates':
        return <BillingRateManagement />;
      case 'invoices':
        return <EnhancedInvoiceWorkflow />;
      default:
        return <ProjectBillingView />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage billing and invoicing</p>
        </div>
        
        {/* Primary Features */}
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Primary Views
          </h2>
          <nav className="space-y-2">
            {navigationItems.filter(item => item.isPrimary).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div>{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Features */}
        <div className="p-4 border-t">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Secondary Features
          </h2>
          <nav className="space-y-2">
            {navigationItems.filter(item => !item.isPrimary).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === item.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Feature Highlight */}
        <div className="p-4 border-t bg-blue-50">
          <div className="text-xs text-blue-700 font-medium">✨ Primary Features</div>
          <div className="text-xs text-blue-600 mt-1">
            Project and Task billing views provide comprehensive resource tracking with editable billable hours.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default BillingManagement;