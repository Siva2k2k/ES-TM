import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../utils/cn';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * AppLayout Component
 * Main application layout with header, sidebar, and content area
 * Handles responsive behavior and sidebar collapse state
 */
export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Auto-collapse sidebar on mobile
  React.useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseMobileMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <Header onMenuToggle={handleMenuToggle} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Overlay */}
        {isMobile && mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={handleCloseMobileMenu}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'transition-all duration-300',
            isMobile
              ? cn(
                  'fixed inset-y-0 left-0 z-40 mt-16',
                  mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )
              : 'relative'
          )}
        >
          <Sidebar
            collapsed={sidebarCollapsed && !isMobile}
            onToggle={handleMenuToggle}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
