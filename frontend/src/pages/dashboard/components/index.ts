/**
 * Dashboard Components Barrel Export
 * Centralized exports for all dashboard components
 */

// Basic Components
export { StatsCard } from './StatsCard';
export {
  LineChartCard,
  BarChartCard,
  PieChartCard,
  AreaChartCard,
  SimpleMetricCard,
} from './Charts';
export { QuickActions } from './QuickActions';
export { RecentActivity } from './RecentActivity';

// Advanced Chart Components
export {
  GaugeChart,
  ComboChartCard,
  HeatmapChart,
  Sparkline,
  RadialProgressChart,
} from './AdvancedCharts';

// Dynamic KPI Widget
export { KPIWidget } from './KPIWidget';

// Container & Layout Components
export { WidgetContainer } from './WidgetContainer';
export { DashboardFilters } from './DashboardFilters';

// Specialized Widgets
export { LeaderboardWidget } from './LeaderboardWidget';
export { ProgressTracker } from './ProgressTracker';

// Type exports
export type { LeaderboardEntry } from './LeaderboardWidget';
export type { ProgressItem, ProgressStatus } from './ProgressTracker';
export type { DateRange, DashboardFiltersState } from './DashboardFilters';
