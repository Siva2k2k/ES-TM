import { clsx } from 'clsx';

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return clsx(classes.filter(Boolean));
};

export interface ThemeClassProps {
  className?: string;
  darkClassName?: string;
}

/**
 * Utility function to combine theme-aware classes
 * @param baseClasses - Base classes that apply to both themes
 * @param lightClasses - Classes for light theme
 * @param darkClasses - Classes for dark theme
 * @param customClassName - Additional custom classes
 */
export const themeClass = (
  baseClasses: string = '',
  lightClasses: string = '',
  darkClasses: string = '',
  customClassName?: string
): string => {
  return cn(
    baseClasses,
    lightClasses,
    darkClasses && `dark:${darkClasses.replace(/dark:/g, '')}`,
    customClassName
  );
};

/**
 * Generate responsive theme classes for different screen sizes
 */
export const responsiveThemeClass = (classes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  dark?: {
    base?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}): string => {
  return cn(
    classes.base,
    classes.sm && `sm:${classes.sm}`,
    classes.md && `md:${classes.md}`,
    classes.lg && `lg:${classes.lg}`,
    classes.xl && `xl:${classes.xl}`,
    classes.dark?.base && `dark:${classes.dark.base}`,
    classes.dark?.sm && `dark:sm:${classes.dark.sm}`,
    classes.dark?.md && `dark:md:${classes.dark.md}`,
    classes.dark?.lg && `dark:lg:${classes.dark.lg}`,
    classes.dark?.xl && `dark:xl:${classes.dark.xl}`
  );
};

/**
 * Common theme-aware class combinations
 */
export const themeClasses = {
  // Background patterns
  page: 'min-h-screen bg-gray-50 dark:bg-gray-950',
  container: 'bg-white dark:bg-gray-800',
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/50',
  modal: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  
  // Text patterns
  heading: 'text-gray-900 dark:text-gray-100',
  subheading: 'text-gray-700 dark:text-gray-200',
  body: 'text-gray-600 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  inverse: 'text-white dark:text-gray-900',
  
  // Interactive patterns
  button: {
    primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800',
  },
  
  input: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400',
  
  // Status patterns
  status: {
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  
  // Border patterns
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    strong: 'border-gray-300 dark:border-gray-600',
    focus: 'border-blue-500 dark:border-blue-400',
  },
  
  // Shadow patterns
  shadow: {
    small: 'shadow-sm dark:shadow-gray-900/50',
    medium: 'shadow-md dark:shadow-gray-900/50',
    large: 'shadow-lg dark:shadow-gray-900/50',
  },
};