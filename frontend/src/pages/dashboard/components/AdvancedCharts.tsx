import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

// ============================================================================
// GAUGE CHART
// ============================================================================

interface GaugeChartProps {
  title: string;
  value: number;
  max?: number;
  unit?: string;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  colors?: {
    low: string;
    medium: string;
    high: string;
  };
  height?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  max = 100,
  unit = '%',
  thresholds = { low: 33, medium: 66, high: 100 },
  colors = { low: '#EF4444', medium: '#F59E0B', high: '#10B981' },
  height = 200,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  let color = colors.low;

  if (percentage >= thresholds.high) {
    color = colors.high;
  } else if (percentage >= thresholds.medium) {
    color = colors.medium;
  }

  const data = [
    {
      name: title,
      value: percentage,
      fill: color,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <div className="text-3xl font-bold" style={{ color }}>
          {value}
          {unit}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          of {max}
          {unit}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMBO CHART (Line + Bar)
// ============================================================================

interface ComboChartData {
  name: string;
  [key: string]: string | number;
}

interface ComboChartProps {
  title: string;
  data: ComboChartData[];
  lineKeys: Array<{ key: string; color: string; name: string }>;
  barKeys: Array<{ key: string; color: string; name: string }>;
  height?: number;
  xAxisKey?: string;
}

export const ComboChartCard: React.FC<ComboChartProps> = ({
  title,
  data,
  lineKeys,
  barKeys,
  height = 300,
  xAxisKey = 'name',
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis
            dataKey={xAxisKey}
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" tick={{ fill: 'currentColor' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(31, 41, 55)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {barKeys.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
          ))}
          {lineKeys.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              name={line.name}
              dot={{ r: 4 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// HEATMAP CHART
// ============================================================================

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  title: string;
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  height?: number;
  colorScale?: {
    low: string;
    medium: string;
    high: string;
  };
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  title,
  data,
  xLabels,
  yLabels,
  height = 300,
  colorScale = { low: '#DBEAFE', medium: '#60A5FA', high: '#1E40AF' },
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.66) return colorScale.high;
    if (intensity > 0.33) return colorScale.medium;
    return colorScale.low;
  };

  const cellWidth = 100 / xLabels.length;
  const cellHeight = height / yLabels.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-around pr-2">
          {yLabels.map((label) => (
            <div key={label} className="text-xs text-gray-600 dark:text-gray-400 text-right">
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="ml-20 grid" style={{ gridTemplateColumns: `repeat(${xLabels.length}, 1fr)`, gap: '2px' }}>
          {yLabels.map((yLabel) =>
            xLabels.map((xLabel) => {
              const cell = data.find((d) => d.x === xLabel && d.y === yLabel);
              const value = cell?.value || 0;
              return (
                <div
                  key={`${xLabel}-${yLabel}`}
                  className="aspect-square flex items-center justify-center rounded text-xs font-medium transition-all hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: getColor(value),
                    color: value / maxValue > 0.5 ? 'white' : 'black',
                  }}
                  title={`${xLabel} - ${yLabel}: ${value}`}
                >
                  {value > 0 ? value : ''}
                </div>
              );
            })
          )}
        </div>

        {/* X-axis labels */}
        <div className="ml-20 grid mt-2" style={{ gridTemplateColumns: `repeat(${xLabels.length}, 1fr)` }}>
          {xLabels.map((label) => (
            <div key={label} className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SPARKLINE (Inline Mini Chart)
// ============================================================================

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showDots?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#3B82F6',
  width = 100,
  height = 30,
  showDots = false,
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        data.map((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          return <circle key={index} cx={x} cy={y} r="2" fill={color} />;
        })}
    </svg>
  );
};

// ============================================================================
// RADIAL PROGRESS (Multi-ring)
// ============================================================================

interface RadialProgressData {
  name: string;
  value: number;
  fill: string;
}

interface RadialProgressProps {
  title: string;
  data: RadialProgressData[];
  height?: number;
}

export const RadialProgressChart: React.FC<RadialProgressProps> = ({ title, data, height = 300 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data}>
          <RadialBar background dataKey="value" cornerRadius={10} />
          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          <Tooltip />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  GaugeChart,
  ComboChartCard,
  HeatmapChart,
  Sparkline,
  RadialProgressChart,
};
