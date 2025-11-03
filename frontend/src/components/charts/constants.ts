// Color palettes
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#6b7280'
};

export const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

// Chart types
export interface TooltipPayload {
  value: number;
  name: string;
  color: string;
  payload?: Record<string, unknown>;
}

export interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number) => string;
}

export interface PieEntry {
  value: number;
  name?: string;
  [key: string]: unknown;
}