import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Sparkline } from './AdvancedCharts';

// ============================================================================
// TYPES
// ============================================================================

type KPIFormat = 'number' | 'currency' | 'percentage' | 'hours' | 'decimal';
type ComparisonPeriod = 'MoM' | 'YoY' | 'WoW' | 'QoQ';
type TrendDirection = 'up' | 'down' | 'stable';
type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface KPIComparison {
  period: ComparisonPeriod;
  previousValue: number;
  change: number;
  changePercentage: number;
}

interface KPIAlert {
  type: AlertType;
  message: string;
}

interface KPIWidgetProps {
  title: string;
  value: number | string;
  format?: KPIFormat;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'pink' | 'orange';
  comparison?: KPIComparison;
  target?: number;
  trend?: TrendDirection;
  alerts?: KPIAlert[];
  sparklineData?: number[];
  onClick?: () => void;
  subtitle?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatValue = (value: number | string, format: KPIFormat = 'number'): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'hours':
      return `${value.toFixed(1)}h`;
    case 'decimal':
      return value.toFixed(2);
    case 'number':
    default:
      return value.toLocaleString('en-US');
  }
};

const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-blue-600',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500 to-green-600',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500 to-purple-600',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-500 to-red-600',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: 'text-indigo-600 dark:text-indigo-400',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-200 dark:border-pink-800',
      icon: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-500 to-pink-600',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500 to-orange-600',
    },
  };

  return colors[color as keyof typeof colors] || colors.blue;
};

const getAlertColor = (type: AlertType) => {
  const colors = {
    critical: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  };
  return colors[type];
};

const getTrendIcon = (trend: TrendDirection) => {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    case 'stable':
    default:
      return Minus;
  }
};

const getTrendColor = (trend: TrendDirection, isPositive: boolean = true) => {
  if (trend === 'stable') return 'text-gray-500 dark:text-gray-400';
  if (trend === 'up') {
    return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
  return isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
};

// ============================================================================
// KPI WIDGET COMPONENT
// ============================================================================

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  title,
  value,
  format = 'number',
  icon: Icon,
  color = 'blue',
  comparison,
  target,
  trend,
  alerts,
  sparklineData,
  onClick,
  subtitle,
}) => {
  const colorClasses = getColorClasses(color);
  const TrendIcon = trend ? getTrendIcon(trend) : null;
  const hasInteraction = !!onClick;

  // Calculate progress toward target
  const targetProgress = target && typeof value === 'number' ? (value / target) * 100 : null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border ${colorClasses.border}
        ${hasInteraction ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* Header with icon and alerts */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
              </div>
              {alerts && alerts.length > 0 && (
                <div className="flex space-x-1">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getAlertColor(
                        alert.type
                      )}`}
                      title={alert.message}
                    >
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>

            {/* Main value */}
            <div className="mt-2 flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatValue(value, format)}
              </p>
              {TrendIcon && (
                <TrendIcon className={`w-5 h-5 ${getTrendColor(trend!)}`} />
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="ml-4">
              <Sparkline data={sparklineData} color={colorClasses.icon.split(' ')[0].replace('text-', '#')} width={80} height={40} />
            </div>
          )}
        </div>

        {/* Comparison data */}
        {comparison && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">{comparison.period}:</span>
              <span
                className={`font-medium ${
                  comparison.change > 0
                    ? 'text-green-600 dark:text-green-400'
                    : comparison.change < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {comparison.change > 0 ? '+' : ''}
                {formatValue(comparison.change, format)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  comparison.changePercentage > 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : comparison.changePercentage < 0
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {comparison.changePercentage > 0 ? '+' : ''}
                {comparison.changePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Target progress bar */}
        {targetProgress !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Target: {formatValue(target!, format)}</span>
              <span>{targetProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Alert messages */}
        {alerts && alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 text-xs p-2 rounded ${getAlertColor(alert.type)}`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIWidget;
