// components/dashboard/AddDeviceModal.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '@/components/ui/Modal'; // Giữ nguyên component Modal gốc
import { DeviceDTO } from '@/lib/types';
import styles from '@/styles/AddDeviceModal.module.scss'; // <<< IMPORT SCSS MODULE

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: DeviceDTO) => Promise<void>;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
    isOpen, onClose, onSubmit, defaultAdaUsername, defaultAdaApiKey
}) => {
  const [feed, setFeed] = useState('');
  const [type, setType] = useState<'TEMP' | 'LIGHT'>('TEMP');
  const [state, setState] = useState<'ON' | 'OFF'>('OFF');
  const [adaUsername, setAdaUsername] = useState(defaultAdaUsername);
  const [adaApiKey, setAdaApiKey] = useState(defaultAdaApiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFeed('');
      setType('TEMP');
      setState('OFF');
      setAdaUsername(defaultAdaUsername);
      setAdaApiKey(defaultAdaApiKey);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, defaultAdaUsername, defaultAdaApiKey]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!feed.trim()) {
      setError("Feed name is required.");
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        feed: feed.trim(),
        type,
        state,
        adaUsername: adaUsername.trim() || defaultAdaUsername,
        adaApikey: adaApiKey.trim() || defaultAdaApiKey,
      });
      // onClose(); // Cha sẽ gọi onClose sau khi submit thành công
    } catch (err: unknown) {
      // Hiển thị lỗi từ onSubmit nếu có, hoặc lỗi chung
      const specificError = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
       setError(specificError || (err instanceof Error ? err.message : "An unexpected error occurred."));
      console.error("Submit error in modal:", err); // Log lỗi chi tiết
    } finally {
      setIsLoading(false);
    }
  };

  // Sử dụng component Modal gốc, chỉ style phần form bên trong
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Hiển thị lỗi */}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {/* Feed Name */}
        <div>
          <label htmlFor="feed" className={styles.label}>
            Feed Name <span className={styles.requiredStar}>*</span>
          </label>
          <input
            type="text"
            id="feed"
            value={feed}
            onChange={(e) => setFeed(e.target.value)}
            required
            className={styles.input} // <<< Áp dụng class SCSS
            placeholder="e.g., living_room_light"
            disabled={isLoading}
          />
        </div>

        {/* Type & State */}
        <div className={styles.formGrid}> {/* <<< Dùng grid cho 2 cột */}
            <div>
              <label htmlFor="type" className={styles.label}>
                  Type
              </label>
              <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'TEMP' | 'LIGHT')}
                  className={styles.select} // <<< Áp dụng class SCSS
                  disabled={isLoading}
              >
                  <option value="TEMP">Temperature Sensor</option>
                  <option value="LIGHT">Light Control</option>
              </select>
            </div>
            <div>
              <label htmlFor="state" className={styles.label}>
                  Initial State
              </label>
              <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value as 'ON' | 'OFF')}
                  className={styles.select} // <<< Áp dụng class SCSS
                  disabled={isLoading}
              >
                  <option value="OFF">OFF</option>
                  <option value="ON">ON</option>
              </select>
            </div>
        </div>

        {/* Adafruit Username */}
        <div>
          <label htmlFor="adaUsername" className={styles.label}>
            Adafruit Username (Optional)
          </label>
          <input
            type="text"
            id="adaUsername"
            value={adaUsername}
            onChange={(e) => setAdaUsername(e.target.value)}
            className={styles.input} // <<< Áp dụng class SCSS
            placeholder={defaultAdaUsername || "Using system default"}
            disabled={isLoading}
          />
        </div>

        {/* Adafruit API Key */}
        <div>
          <label htmlFor="adaApiKey" className={styles.label}>
            Adafruit IO Key (Optional)
          </label>
          <input
            type="password"
            id="adaApiKey"
            value={adaApiKey}
            onChange={(e) => setAdaApiKey(e.target.value)}
            className={styles.input} // <<< Áp dụng class SCSS
            placeholder="Using system default if empty"
            disabled={isLoading}
          />
        </div>

        {/* Nút bấm */}
        <div className={styles.buttonGroup}> {/* <<< Khu vực nút bấm */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={styles.cancelButton} // <<< Class nút Cancel
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton} // <<< Class nút Submit
          >
            {isLoading ? (
               <span className={styles.spinner} role="status" aria-hidden="true"></span>
            ) : null}
            {isLoading ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDeviceModal;