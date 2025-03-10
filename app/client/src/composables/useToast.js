/**
 * Composable for toast notifications
 * Provides a standardized way to show toast notifications across the application
 */
import { useUIStore } from '@/stores/ui';

export const useToast = () => {
  const uiStore = useUIStore();

  /**
   * Show a toast notification
   * @param {string} message - Message to display in the toast
   * @param {string} type - Type of toast (success, error, info, warning)
   * @param {number} duration - Duration to show the toast in milliseconds
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    if (!message) return;
    
    const validTypes = ['success', 'error', 'info', 'warning'];
    const toastType = validTypes.includes(type) ? type : 'info';
    
    switch (toastType) {
      case 'success':
        uiStore.notifySuccess(message, duration);
        break;
      case 'error':
        uiStore.notifyError(message, duration);
        break;
      case 'warning':
        uiStore.notifyWarning(message, duration);
        break;
      case 'info':
      default:
        uiStore.notifyInfo(message, duration);
    }
  };

  return {
    showToast,
  };
};
