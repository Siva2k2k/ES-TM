import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { SettingsService } from '../services/SettingsService';
import { ThemeContextType, Theme, ResolvedTheme } from './theme/types';
import { lightTheme, darkTheme } from './theme/colors';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from user settings
  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      try {
        // Check if user is authenticated before calling API
        const token = localStorage.getItem('accessToken');

        if (token) {
          // Try to load from backend if authenticated
          const result = await SettingsService.getUserSettings();
          if (result.settings?.theme) {
            setThemeState(result.settings.theme as Theme);
            localStorage.setItem('theme', result.settings.theme);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage if not authenticated or API fails
        const storedTheme = localStorage.getItem('theme') as Theme;
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
          setThemeState(storedTheme);
        }
      } catch {
        // Silent fail - just use localStorage
        const storedTheme = localStorage.getItem('theme') as Theme;
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
          setThemeState(storedTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadTheme();
  }, []);

  // Resolve system theme
  useEffect(() => {
    const getSystemTheme = (): ResolvedTheme => {
      if (typeof globalThis !== 'undefined' && globalThis.window?.matchMedia) {
        return globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    };

    const resolveTheme = (): void => {
      if (theme === 'system') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(theme);
      }
    };

    resolveTheme();

    // Listen for system theme changes
    if (theme === 'system' && globalThis.window?.matchMedia) {
      const mediaQuery = globalThis.window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent): void => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [resolvedTheme]);

  const setTheme = async (newTheme: Theme): Promise<void> => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Update user settings in backend (only if authenticated)
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await SettingsService.updateUserSettings({ theme: newTheme });
      } catch {
        // Silent fail - theme is already saved in localStorage
      }
    }
  };

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    resolvedTheme,
    setTheme,
    isLoading,
    colors: resolvedTheme === 'dark' ? darkTheme : lightTheme,
    isDark: resolvedTheme === 'dark',
  }), [theme, resolvedTheme, isLoading]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
