import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, cn, type Theme } from '../contexts/theme';

type SizeType = 'sm' | 'md' | 'lg';

interface ThemeToggleProps {
  className?: string;
  size?: SizeType;
  showLabel?: boolean;
}

function getIconSize(size: SizeType): string {
  switch (size) {
    case 'sm':
      return 'h-3 w-3';
    case 'md':
      return 'h-4 w-4';
    case 'lg':
      return 'h-5 w-5';
  }
}

function getButtonSize(size: SizeType): string {
  switch (size) {
    case 'sm':
      return 'p-1.5';
    case 'md':
      return 'p-2';
    case 'lg':
      return 'p-3';
  }
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  size = 'md', 
  showLabel = false 
}) => {
  const { theme, setTheme } = useTheme();

  const themes: Array<{
    value: Theme;
    icon: React.ReactNode;
    label: string;
  }> = [
    {
      value: 'light',
      icon: <Sun className={`${getIconSize(size)}`} />,
      label: 'Light',
    },
    {
      value: 'dark',
      icon: <Moon className={`${getIconSize(size)}`} />,
      label: 'Dark',
    },
    {
      value: 'system',
      icon: <Monitor className={`${getIconSize(size)}`} />,
      label: 'System',
    },
  ];

  const handleThemeChange = async (newTheme: Theme): Promise<void> => {
    await setTheme(newTheme);
  };

  return (
    <div className={cn('flex items-center', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
          Theme:
        </span>
      )}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, icon, label }) => (
          <button
            key={value}
            onClick={() => void handleThemeChange(value)}
            className={cn(
              'relative rounded-md transition-all duration-200 flex items-center justify-center',
              getButtonSize(size),
              theme === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
            title={`Switch to ${label.toLowerCase()} theme`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// Simple toggle between light and dark
export const SimpleThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { setTheme, isDark } = useTheme();

  const handleToggle = async (): Promise<void> => {
    const newTheme = isDark ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  return (
    <button
      onClick={() => void handleToggle()}
      className={cn(
        'relative inline-flex items-center justify-center rounded-md p-2',
        'text-gray-500 dark:text-gray-400',
        'hover:text-gray-700 dark:hover:text-gray-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        'transition-colors duration-200',
        className
      )}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};