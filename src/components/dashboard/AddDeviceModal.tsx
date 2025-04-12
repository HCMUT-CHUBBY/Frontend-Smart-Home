// components/dashboard/AddDeviceModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { DeviceDTO } from '@/lib/types';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: DeviceDTO) => Promise<void>; // onSubmit trả về Promise để xử lý loading
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

  // Reset form khi modal đóng/mở
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        adaUsername: adaUsername.trim() || defaultAdaUsername, // Dùng default nếu rỗng
        adaApikey: adaApiKey.trim() || defaultAdaApiKey,     // Dùng default nếu rỗng
        // isSensor: true, // Đã thêm trong hàm handleAddDevice ở page
      });
      // onClose(); // Đóng modal sẽ được gọi từ component cha sau khi submit thành công
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Device">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="feed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Feed Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="feed"
            value={feed}
            onChange={(e) => setFeed(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., living_room_light"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
            </label>
            <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'TEMP' | 'LIGHT')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="TEMP">Temperature Sensor</option>
                <option value="LIGHT">Light Control</option>
            </select>
            </div>
            <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial State
            </label>
            <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value as 'ON' | 'OFF')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="OFF">OFF</option>
                <option value="ON">ON</option>
            </select>
            </div>
        </div>


        <div>
          <label htmlFor="adaUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adafruit Username (Optional)
          </label>
          <input
            type="text"
            id="adaUsername"
            value={adaUsername}
            onChange={(e) => setAdaUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={defaultAdaUsername}
          />
        </div>

        <div>
          <label htmlFor="adaApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Adafruit IO Key (Optional)
          </label>
          <input
            type="password" // Dùng password để ẩn key
            id="adaApiKey"
            value={adaApiKey}
            onChange={(e) => setAdaApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Using default if empty"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDeviceModal;