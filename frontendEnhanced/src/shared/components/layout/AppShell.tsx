/**
 * AppShell Component
 * Main application layout wrapper
 * Cognitive Complexity: 4
 */
import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Header
        onMenuClick={() => {
          setMobileSidebarOpen(!mobileSidebarOpen);
          setSidebarOpen(!sidebarOpen);
        }}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out',
            'pt-16', // Account for fixed header
            sidebarOpen ? 'md:ml-64' : 'md:ml-16'
          )}
        >
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};
