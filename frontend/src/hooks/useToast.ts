import { toast as toastify, ToastOptions, Id } from 'react-toastify';
import { TOAST_DURATION } from '../utils/constants';

export interface ToastReturn {
  success: (message: string, options?: ToastOptions) => Id;
  error: (message: string, options?: ToastOptions) => Id;
  warning: (message: string, options?: ToastOptions) => Id;
  info: (message: string, options?: ToastOptions) => Id;
  loading: (message: string, options?: ToastOptions) => Id;
  dismiss: (toastId?: Id) => void;
  update: (toastId: Id, options: ToastOptions) => void;
}

/**
 * useToast Hook
 * Simplified toast notification API
 * Wraps react-toastify with consistent styling and durations
 *
 * @returns Toast notification functions
 *
 * @example
 * const toast = useToast();
 *
 * toast.success('User created successfully!');
 * toast.error('Failed to save changes');
 *
 * const loadingId = toast.loading('Saving...');
 * // Later...
 * toast.update(loadingId, {
 *   render: 'Saved!',
 *   type: 'success',
 *   isLoading: false,
 *   autoClose: 3000
 * });
 */
export function useToast(): ToastReturn {
  const success = (message: string, options?: ToastOptions): Id => {
    return toastify.success(message, {
      autoClose: TOAST_DURATION.SUCCESS,
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions): Id => {
    return toastify.error(message, {
      autoClose: TOAST_DURATION.ERROR,
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions): Id => {
    return toastify.warning(message, {
      autoClose: TOAST_DURATION.WARNING,
      ...options,
    });
  };

  const info = (message: string, options?: ToastOptions): Id => {
    return toastify.info(message, {
      autoClose: TOAST_DURATION.INFO,
      ...options,
    });
  };

  const loading = (message: string, options?: ToastOptions): Id => {
    return toastify.loading(message, options);
  };

  const dismiss = (toastId?: Id): void => {
    toastify.dismiss(toastId);
  };

  const update = (toastId: Id, options: ToastOptions): void => {
    toastify.update(toastId, options);
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    update,
  };
}
