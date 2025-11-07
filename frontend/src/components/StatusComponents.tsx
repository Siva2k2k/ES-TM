import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { themeClasses, cn } from '../contexts/theme';

type StatusType = 'error' | 'warning' | 'success' | 'info';

interface StatusBadgeProps {
  type: StatusType;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface StatusAlertProps {
  type: StatusType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const statusConfig = {
  error: {
    icon: AlertCircle,
    classes: themeClasses.status.error,
  },
  warning: {
    icon: AlertTriangle,
    classes: themeClasses.status.warning,
  },
  success: {
    icon: CheckCircle,
    classes: themeClasses.status.success,
  },
  info: {
    icon: Info,
    classes: themeClasses.status.info,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  children,
  className,
  size = 'md',
}) => {
  const config = statusConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], 'mr-1.5')} />
      {children}
    </span>
  );
};

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type,
  title,
  children,
  className,
  onClose,
}) => {
  const config = statusConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        config.classes,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-75"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};