import React from 'react';
import { Trash2, AlertTriangle, ShieldAlert, RotateCcw } from 'lucide-react';

export interface DeleteButtonProps {
  entityType: string;
  entityId: string;
  entityName?: string;
  ownerId?: string;
  onDelete?: (entityType: string, entityId: string, deleteType: 'soft' | 'hard') => Promise<void>;
  onRestore?: (entityType: string, entityId: string) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string | undefined;
  variant?: 'icon' | 'button' | 'dropdown';
  showRestore?: boolean;
  isDeleted?: boolean;
  className?: string;
}

interface DeletePermissions {
  canSoftDelete: boolean;
  canHardDelete: boolean;
  canRestore: boolean;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  entityType,
  entityId,
  entityName = 'item',
  ownerId,
  onDelete,
  onRestore,
  disabled = false,
  variant = 'icon',
  showRestore = false,
  isDeleted = false,
  className = ''
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Mock permission check - should be replaced with actual permission service
  const getPermissions = (): DeletePermissions => {
    // This should call your permission service based on current user role
    return {
      canSoftDelete: true,
      canHardDelete: false, // Only super_admin
      canRestore: true
    };
  };

  const permissions = getPermissions();

  const handleDelete = async (deleteType: 'soft' | 'hard') => {
    if (!onDelete) return;

    const confirmMessage = deleteType === 'hard'
      ? `⚠️ PERMANENTLY DELETE ${entityName}?\n\nThis action CANNOT be undone. All associated data will be lost forever.\n\nType "DELETE" to confirm:`
      : `Delete ${entityName}?\n\nThis will move the ${entityType} to trash. You can restore it later.`;

    let confirmed = false;
    
    if (deleteType === 'hard') {
      const userInput = prompt(confirmMessage);
      confirmed = userInput === 'DELETE';
    } else {
      confirmed = window.confirm(confirmMessage);
    }

    if (!confirmed) return;

    setLoading(true);
    try {
      await onDelete(entityType, entityId, deleteType);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore) return;

    const confirmed = window.confirm(`Restore ${entityName}?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await onRestore(entityType, entityId);
    } finally {
      setLoading(false);
    }
  };

  // Restore button for deleted items
  if (isDeleted && showRestore && permissions.canRestore) {
    return (
      <button
        onClick={handleRestore}
        disabled={disabled || loading}
        className={`flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors ${className}`}
        title={`Restore ${entityName}`}
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        {variant === 'button' ? 'Restore' : ''}
      </button>
    );
  }

  // Don't show delete buttons if no permissions
  if (!permissions.canSoftDelete && !permissions.canHardDelete) {
    return null;
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <button
        onClick={() => handleDelete('soft')}
        disabled={disabled || loading}
        className={`text-red-500 hover:text-gray-400 transition-colors ${className}`}
        title={`Delete ${entityName}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={() => handleDelete('soft')}
        disabled={disabled || loading}
        className={`flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors ${className}`}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </button>
    );
  }

  // Dropdown variant (soft + hard delete options)
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || loading}
          className={`text-gray-400 hover:text-red-500 transition-colors ${className}`}
          title="Delete options"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border z-20 min-w-48">
              {permissions.canSoftDelete && (
                <button
                  onClick={() => handleDelete('soft')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <Trash2 className="h-4 w-4 mr-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Move to Trash</div>
                    <div className="text-xs text-gray-500">Can be restored later</div>
                  </div>
                </button>
              )}

              {permissions.canSoftDelete && permissions.canHardDelete && (
                <hr className="my-1" />
              )}

              {permissions.canHardDelete && (
                <button
                  onClick={() => handleDelete('hard')}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-700"
                >
                  <ShieldAlert className="h-4 w-4 mr-3 text-red-600" />
                  <div>
                    <div className="font-medium flex items-center">
                      Permanently Delete
                      <AlertTriangle className="h-3 w-3 ml-1" />
                    </div>
                    <div className="text-xs text-red-500">Cannot be undone!</div>
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

// Bulk Delete Component
export interface BulkDeleteButtonProps {
  entityType: string;
  selectedIds: string[];
  onBulkDelete: (entityType: string, entityIds: string[], deleteType: 'soft' | 'hard') => Promise<void>;
  disabled?: boolean;
}

export const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
  entityType,
  selectedIds,
  onBulkDelete,
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkDelete = async (deleteType: 'soft' | 'hard') => {
    const count = selectedIds.length;
    const confirmMessage = deleteType === 'hard'
      ? `⚠️ PERMANENTLY DELETE ${count} ${entityType}s?\n\nThis action CANNOT be undone. Type "DELETE" to confirm:`
      : `Delete ${count} ${entityType}s?\n\nThese will be moved to trash and can be restored later.`;

    let confirmed = false;
    
    if (deleteType === 'hard') {
      const userInput = prompt(confirmMessage);
      confirmed = userInput === 'DELETE';
    } else {
      confirmed = window.confirm(confirmMessage);
    }

    if (!confirmed) return;

    setLoading(true);
    try {
      await onBulkDelete(entityType, selectedIds, deleteType);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || loading}
        className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete ({selectedIds.length})
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute left-0 top-full mt-1 bg-white rounded-md shadow-lg border z-20 min-w-48">
            <button
              onClick={() => handleBulkDelete('soft')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700"
            >
              <Trash2 className="h-4 w-4 mr-3 text-orange-500" />
              <div>
                <div className="font-medium">Move to Trash</div>
                <div className="text-xs text-gray-500">Can be restored later</div>
              </div>
            </button>

            <hr className="my-1" />

            <button
              onClick={() => handleBulkDelete('hard')}
              className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-700"
            >
              <ShieldAlert className="h-4 w-4 mr-3 text-red-600" />
              <div>
                <div className="font-medium flex items-center">
                  Permanently Delete
                  <AlertTriangle className="h-3 w-3 ml-1" />
                </div>
                <div className="text-xs text-red-500">Cannot be undone!</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};