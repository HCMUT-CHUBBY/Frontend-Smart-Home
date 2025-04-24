// components/dashboard/DeleteConfirmationModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal'; // Component Modal gốc
import { AlertTriangle, Trash2, X } from 'lucide-react'; // Import icons

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deviceName: string; // Tên hoặc ID thiết bị để hiển thị
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, deviceName, isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative">
        {/* Close button absolute positioned in the top right */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Close modal"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div className="flex flex-col items-center space-y-5 pt-2 pb-5">
          {/* Warning icon with animation */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 animate-pulse">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          {/* Title with bold text */}
          <h3 className="text-xl font-bold text-gray-800 text-center">Confirm Deletion</h3>
          
          {/* Detailed warning message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              You are about to delete the device:
            </p>
            <p className="text-base font-medium text-gray-800 bg-gray-100 py-2 px-4 rounded-md break-all max-w-full overflow-hidden">
              {deviceName}
            </p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>

          {/* Action buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 w-full pt-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Device
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Optional keyboard shortcuts help */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md mr-1">Esc</kbd>
            <span>Cancel</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md mr-1">Enter</kbd>
            <span>Confirm</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Add keyboard event handlers
const EnhancedDeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = (props) => {
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!props.isOpen) return;
    
    if (e.key === 'Enter' && !props.isLoading) {
      props.onConfirm();
    }
  }, [props.isOpen, props.isLoading, props.onConfirm]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <DeleteConfirmationModal {...props} />;
};

export default EnhancedDeleteConfirmationModal;