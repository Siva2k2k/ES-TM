import { ThemeColors } from './types';

export const lightTheme: ThemeColors = {
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    paper: 'bg-white',
    overlay: 'bg-black/50',
  },
  
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    inverse: 'text-white',
    muted: 'text-gray-500',
  },
  
  border: {
    primary: 'border-gray-200',
    secondary: 'border-gray-300',
    focus: 'border-blue-500',
    error: 'border-red-500',
    success: 'border-green-500',
  },
  
  status: {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  
  interactive: {
    primary: {
      base: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-700',
      active: 'active:bg-blue-800',
      disabled: 'disabled:bg-gray-300 disabled:text-gray-500',
    },
    secondary: {
      base: 'bg-gray-200 text-gray-900',
      hover: 'hover:bg-gray-300',
      active: 'active:bg-gray-400',
      disabled: 'disabled:bg-gray-100 disabled:text-gray-400',
    },
    danger: {
      base: 'bg-red-600 text-white',
      hover: 'hover:bg-red-700',
      active: 'active:bg-red-800',
      disabled: 'disabled:bg-gray-300 disabled:text-gray-500',
    },
  },
  
  shadow: {
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
  },
};

export const darkTheme: ThemeColors = {
  background: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    paper: 'bg-gray-800',
    overlay: 'bg-black/70',
  },
  
  text: {
    primary: 'text-gray-100',
    secondary: 'text-gray-200',
    tertiary: 'text-gray-300',
    inverse: 'text-gray-900',
    muted: 'text-gray-400',
  },
  
  border: {
    primary: 'border-gray-700',
    secondary: 'border-gray-600',
    focus: 'border-blue-400',
    error: 'border-red-400',
    success: 'border-green-400',
  },
  
  status: {
    error: 'text-red-300 bg-red-900/20 border-red-800',
    warning: 'text-yellow-300 bg-yellow-900/20 border-yellow-800',
    success: 'text-green-300 bg-green-900/20 border-green-800',
    info: 'text-blue-300 bg-blue-900/20 border-blue-800',
  },
  
  interactive: {
    primary: {
      base: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-500',
      active: 'active:bg-blue-700',
      disabled: 'disabled:bg-gray-700 disabled:text-gray-500',
    },
    secondary: {
      base: 'bg-gray-700 text-gray-100',
      hover: 'hover:bg-gray-600',
      active: 'active:bg-gray-500',
      disabled: 'disabled:bg-gray-800 disabled:text-gray-600',
    },
    danger: {
      base: 'bg-red-600 text-white',
      hover: 'hover:bg-red-500',
      active: 'active:bg-red-700',
      disabled: 'disabled:bg-gray-700 disabled:text-gray-500',
    },
  },
  
  shadow: {
    small: 'shadow-sm shadow-gray-900/50',
    medium: 'shadow-md shadow-gray-900/50',
    large: 'shadow-lg shadow-gray-900/50',
  },
};