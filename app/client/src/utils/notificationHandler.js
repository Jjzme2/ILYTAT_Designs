import { useToast } from 'vue-toastification';

export const useNotification = () => {
    const toast = useToast();

    const showSuccess = (message) => {
        toast.success(message);
    };

    const showError = (error) => {
        if (error.response?.data) {
            const { error: errorMessage, validationErrors } = error.response.data;
            
            // If we have specific validation errors, show the first one
            if (validationErrors && Object.keys(validationErrors).length > 0) {
                const firstError = Object.values(validationErrors)[0];
                toast.error(firstError);
                return validationErrors;
            }
            
            // Show the error message from the API
            if (errorMessage) {
                toast.error(errorMessage);
                return;
            }
        }
        
        // Fallback error message
        toast.error(error.message || 'An unexpected error occurred');
    };

    const showInfo = (message) => {
        toast.info(message);
    };

    const showWarning = (message) => {
        toast.warning(message);
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning
    };
};

export const handleApiResponse = (response) => {
    const notification = useNotification();
    
    if (response.success) {
        if (response.message) {
            notification.showSuccess(response.message);
        }
        return response.data;
    } else {
        notification.showError(response.error);
        return null;
    }
};
