// components/dashboard/DeviceDetailsModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';
import { Device } from '@/lib/types';

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2 break-words">{value}</dd>
    </div>
);


const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ isOpen, onClose, device }) => {
  if (!device) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Device Details: ${device.feed}`}>
      <div className="flow-root">
          <dl className="-my-2 divide-y divide-gray-200 dark:divide-gray-700">
             <DetailItem label="ID" value={device.id} />
             <DetailItem label="Feed Name" value={device.feed} />
             <DetailItem label="Type" value={device.type === 'TEMP' ? 'Temperature Sensor' : 'Light Control'} />
              <DetailItem
                label="Current State"
                value={
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                         device.state === 'ON'
                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                         : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                     }`}>
                         {device.state}
                     </span>
                }
              />
             <DetailItem label="Adafruit User" value={device.adaUsername} />
             {/* Không nên hiển thị API Key đầy đủ vì lý do bảo mật */}
             {/* <DetailItem label="Adafruit Key" value={device.adaApikey} /> */}
             <DetailItem label="Config" value={<pre className="text-xs whitespace-pre-wrap">{JSON.stringify(device.deviceConfig, null, 2) || '{}'}</pre>} />
             {/* Thêm các trường khác nếu cần */}
          </dl>
      </div>
       <div className="mt-6 flex justify-end">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Close
          </button>
       </div>
    </Modal>
  );
};

export default DeviceDetailsModal;