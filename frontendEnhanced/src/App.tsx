/**
 * Main App Component
 * Application entry point with providers
 */
import React from 'react';
import { AuthProvider } from './core/auth';
import { ThemeProvider } from './core/theme';
import { AppShell } from './shared/components/layout';
import { EmployeeDashboard } from './features/dashboard/components';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell>
          <EmployeeDashboard />
        </AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
