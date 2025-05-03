import React from 'react';

import { AlertTriangle, Check, X } from 'lucide-react';
// Giả sử bạn có commonStyles cho button hoặc định nghĩa style riêng

import commonStyles from '@/styles/Common.module.scss';
import modalStyles from '@/styles/ConfirmationModal.module.scss'; // Tạo file style riêng cho modal này nếu cần
import Modal from '@/components/ui/Modal'; // Giả sử bạn có một component Modal chung
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string | React.ReactNode; // Cho phép truyền cả JSX vào message
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean; // Thêm trạng thái loading nếu cần
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action", // Title mặc định
  message,
  confirmText = "Confirm", // Text nút xác nhận mặc định
  cancelText = "Cancel",   // Text nút hủy mặc định
  isLoading = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title=""> {/* Bỏ title của Modal gốc nếu muốn title riêng trong content */}
      <div className={modalStyles.container}> {/* Class bao ngoài */}
        <div className={modalStyles.iconWrapper}> {/* Vùng chứa icon cảnh báo */}
          <AlertTriangle size={28} className={modalStyles.icon} />
        </div>

        <h3 className={modalStyles.title}>{title}</h3>

        <div className={modalStyles.message}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className={modalStyles.buttonGroup}>
          {/* Nút Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            // Sử dụng class từ commonStyles hoặc modalStyles
            className={`${commonStyles.button} ${commonStyles.secondaryButton} ${modalStyles.cancelButton}`}
          >
            <X size={16} /> {cancelText}
          </button>

          {/* Nút Confirm */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            // Thêm class riêng cho nút confirm, ví dụ màu đỏ cho hành động nguy hiểm
            className={`${commonStyles.button} ${commonStyles.dangerButton} ${modalStyles.confirmButton}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" /* ... SVG spinner ... */ ></svg>
            ) : (
              <Check size={16} />
            )}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;