// components/dashboard/DeviceCard.tsx
import React from 'react';
import { Device } from '@/lib/types';
import { Lightbulb, Thermometer, Power } from 'lucide-react'; // Icons

interface DeviceCardProps {
  device: Device;
  currentState?: "ON" | "OFF"; // State từ WebSocket (ưu tiên)
  currentValue?: string | number; // Value từ WebSocket (cho sensor)
  onToggle: () => void;
  onClick: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  currentState,
  currentValue,
  onToggle,
  onClick
}) => {
  const displayState = currentState ?? device.state; // Ưu tiên state realtime
  const isSensor = device.type === 'TEMP'; // Giả sử TEMP là sensor, LIGHT là công tắc

  const Icon = device.type === 'TEMP' ? Thermometer : Lightbulb;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick} // Click cả card để xem chi tiết
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-full ${displayState === 'ON' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <Icon className={`h-6 w-6 ${displayState === 'ON' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
          </div>
          {/* Nút Toggle chỉ hiển thị cho thiết bị không phải sensor */}
          {!isSensor && (
             <button
                onClick={(e) => {
                    e.stopPropagation(); // Ngăn sự kiện click của card cha
                    onToggle();
                }}
                className={`p-2 rounded-full transition-colors ${
                    displayState === 'ON'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                }`}
            >
                <Power className="h-5 w-5" />
            </button>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1 truncate">{device.feed}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {device.type === 'TEMP' ? 'Temperature Sensor' : 'Light Control'}
        </p>
      </div>

        {/* Hiển thị trạng thái/giá trị */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
             <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
             {isSensor ? (
                 // Hiển thị giá trị sensor nếu có
                 <span className="font-medium text-lg text-gray-800 dark:text-gray-200">
                     {currentValue !== undefined ? `${currentValue}°C` : (displayState === 'ON' ? 'Active' : 'Inactive')}
                     {/* Hoặc hiển thị giá trị mặc định/loading nếu chưa có */}
                 </span>
             ) : (
                 // Hiển thị ON/OFF cho công tắc
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                     displayState === 'ON'
                     ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                     : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                 }`}>
                     {displayState}
                 </span>
             )}
        </div>
    </div>
  );
};

export default DeviceCard;