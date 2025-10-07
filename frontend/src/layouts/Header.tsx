import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Shield,
  User,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../store/contexts/AuthContext';
import { Badge } from '../components/ui/Badge';

export interface HeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

/**
 * Header Component
 * Application header with search, notifications, and user menu
 */
export const Header: React.FC<HeaderProps> = ({ onMenuToggle, className }) => {
  const { currentUser, currentUserRole, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    // TODO: Implement theme switching logic
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'Timesheet Approved',
      message: 'Your timesheet for week of Oct 1 has been approved',
      time: '2 hours ago',
      type: 'success' as const,
      unread: true,
    },
    {
      id: 2,
      title: 'New Task Assigned',
      message: 'Payment Gateway Setup task has been assigned to you',
      time: '4 hours ago',
      type: 'info' as const,
      unread: true,
    },
    {
      id: 3,
      title: 'Project Deadline',
      message: 'E-commerce Platform milestone due in 2 days',
      time: '1 day ago',
      type: 'warning' as const,
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        'bg-white/95 backdrop-blur-sm shadow-md border-b border-slate-200 sticky top-0 z-40',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="relative">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
            </div>
            <div className="hidden md:block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TimeTracker Pro
              </span>
              <div className="text-xs text-slate-500 font-medium -mt-1">
                Enterprise Edition
              </div>
            </div>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search for Mobile */}
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors md:hidden">
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle - Hidden on small screens */}
          <button
            onClick={toggleTheme}
            className="hidden sm:block p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="info" size="sm">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer',
                          notification.unread && 'bg-blue-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                              notification.type === 'success' && 'bg-green-500',
                              notification.type === 'warning' && 'bg-yellow-500',
                              notification.type === 'info' && 'bg-blue-500'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-slate-600 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-slate-400 text-xs mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">
                  {currentUser?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {currentUserRole?.replace('_', ' ')}
                </p>
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-medium text-slate-900">
                      {currentUser?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">{currentUser?.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-2">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
