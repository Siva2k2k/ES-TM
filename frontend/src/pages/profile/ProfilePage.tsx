import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, DollarSign, Edit, Lock } from 'lucide-react';
import { useAuth } from '../../store/contexts/AuthContext';
import { UserProfileModal } from '../../components/UserProfileModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import { useToast } from '../../hooks/useToast';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleProfileUpdate = async () => {
    setShowProfileModal(false);
    // Profile will be refreshed automatically by the modal
    toast.success('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(false);
    toast.success('Password changed successfully!');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your personal information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Header Section with Avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-blue-600">
                  {currentUser.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentUser.full_name}
                </h2>
                <p className="text-blue-100 capitalize text-lg">
                  {currentUser.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Quick Actions */}
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        {currentUser.full_name || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100 capitalize">
                        {currentUser.role?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Role is managed by your administrator.
                    </p>
                  </div>

                  {/* Hourly Rate */}
                  {Boolean(currentUser.hourly_rate && currentUser.hourly_rate > 0) && (
                    <div>
                      <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hourly Rate
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">
                          ${currentUser.hourly_rate}/hr
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Created At */}
                  <div>
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member Since
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatDate(currentUser.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Updated
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatDate(currentUser.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Picture Notice */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Profile Picture
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Profile pictures will be available in a future update. For now, your initials are displayed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser ? {
          id: currentUser.id || '',
          email: currentUser.email,
          full_name: currentUser.full_name || '',
          role: currentUser.role,
          hourly_rate: currentUser.hourly_rate,
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at,
          manager_id: currentUser.manager_id
        } : undefined}
        onUpdate={handleProfileUpdate}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChange}
      />
    </div>
  );
};

export default ProfilePage;
