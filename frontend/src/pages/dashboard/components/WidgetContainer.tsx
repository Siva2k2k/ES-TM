import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface WidgetContainerProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  refreshable?: boolean;
  exportable?: boolean;
  fullScreenable?: boolean;
  settingsMenu?: React.ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

// ============================================================================
// WIDGET CONTAINER COMPONENT
// ============================================================================

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  children,
  collapsible = false,
  refreshable = false,
  exportable = false,
  fullScreenable = false,
  settingsMenu,
  isLoading = false,
  onRefresh,
  onExport,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-transparent dark:border-gray-700 transition-all
        ${isFullScreen ? 'fixed inset-4 z-50 overflow-auto' : ''}
        ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {refreshable && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {exportable && (
            <button
              onClick={handleExport}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {fullScreenable && (
            <button
              onClick={toggleFullScreen}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {settingsMenu && (
            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

export default WidgetContainer;
