// components/ui/Modal.tsx
import React, { useEffect } from 'react';
import styles from '@/styles/modal.module.scss'; // <<< IMPORT SCSS MODULE

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Xử lý đóng modal bằng phím Escape (tùy chọn)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Sử dụng class từ modal.module.scss
    <div
      className={styles.overlay} // <<< Class cho lớp phủ
      onClick={onClose} // Đóng khi click nền
      role="dialog" // Thêm role cho accessibility
      aria-modal="true"
      aria-labelledby="modal-title" // Liên kết với tiêu đề
    >
      <div
        className={styles.modalContent} // <<< Class cho khung nội dung
        onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click nội dung modal
      >
        {/* Header */}
        <div className={styles.modalHeader}> {/* <<< Class cho header */}
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2> {/* <<< Class cho title */}
          <button
            onClick={onClose}
            className={styles.closeButton} // <<< Class cho nút đóng
            aria-label="Close modal" // Thêm aria-label
          >
            {/* X Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}> {/* <<< Class cho body */}
          {children} {/* Nội dung form từ AddDeviceModal sẽ hiển thị ở đây */}
        </div>
      </div>
    </div>
  );
};

export default Modal;