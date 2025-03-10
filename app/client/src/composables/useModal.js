/**
 * Composable for modal management
 * Provides a standardized way to open and close modals across the application
 */
import { useUIStore } from '@/stores/ui';

export const useModal = () => {
  const uiStore = useUIStore();

  /**
   * Open a modal with the specified ID and data
   * @param {string} modalId - ID of the modal to open
   * @param {object} modalData - Data to pass to the modal
   */
  const openModal = (modalId, modalData = {}) => {
    if (!modalId) return;
    uiStore.openModal(modalId, modalData);
  };

  /**
   * Close the currently open modal
   */
  const closeModal = () => {
    uiStore.closeModal();
  };

  return {
    openModal,
    closeModal
  };
};
