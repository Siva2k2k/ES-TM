export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    paper: string;
    overlay: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    muted: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
    success: string;
  };
  
  // Status colors
  status: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  
  // Interactive colors
  interactive: {
    primary: {
      base: string;
      hover: string;
      active: string;
      disabled: string;
    };
    secondary: {
      base: string;
      hover: string;
      active: string;
      disabled: string;
    };
    danger: {
      base: string;
      hover: string;
      active: string;
      disabled: string;
    };
  };
  
  // Shadow colors
  shadow: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
  colors: ThemeColors;
  isDark: boolean;
}