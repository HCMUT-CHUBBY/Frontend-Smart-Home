// components/dashboard/DeviceCard.tsx
import React, { useMemo, useCallback } from 'react';
import { Device } from '@/lib/types';
import { Lightbulb, Thermometer, Power, Trash2, BarChart2 } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  isSensor: boolean; // Vẫn giữ prop này vì có thể dùng cho logic khác
  currentState?: 'ON' | 'OFF';
  currentValue?: string | number;
  onClick: () => void; // Mở modal Edit/Details
  onToggle?: () => void;
  onSetSpeed?: (speed: number) => void;
  onDeleteRequest?: () => void;
  onShowChart?: () => void; // Callback để hiển thị chart
  minSpeed?: number;
  maxSpeed?: number;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSensor, // Prop isSensor vẫn được nhận và có thể dùng cho các mục đích khác
  currentState,
  currentValue,
  onClick,
  onToggle,
  onSetSpeed,
  onDeleteRequest,
  onShowChart, // Callback này sẽ được truyền từ DashboardPage
  minSpeed = 0,
  maxSpeed = 100
}) => {
  const displayState = currentState ?? device.state;
  const isActuator = !isSensor;
  const isTempActuator = device.type === 'TEMP' && isActuator;
  const Icon = device.type === 'TEMP' ? Thermometer : Lightbulb;

  const currentSpeed = useMemo(() => {
    let calculatedSpeed = minSpeed;
    if (isTempActuator && displayState === 'ON') {
      let numericValue = minSpeed; 
      if (currentValue !== undefined && currentValue !== null && String(currentValue).trim() !== "") {
        const parsed = parseFloat(String(currentValue)); 
        if (!isNaN(parsed)) {
          numericValue = parsed;
        }
      }
      calculatedSpeed = Math.max(minSpeed, Math.min(numericValue, maxSpeed));
    }
    return calculatedSpeed;
  }, [isTempActuator, displayState, currentValue, minSpeed, maxSpeed, device.id]);


  const handleChartClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Ngăn sự kiện click của card cha (tránh mở modal edit)
    if (onShowChart) {
      onShowChart(); // Gọi callback được truyền từ DashboardPage
    }
  }, [onShowChart]);

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSetSpeed) onSetSpeed(parseInt(event.target.value, 10));
  }, [onSetSpeed]);

  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => { e.stopPropagation(); }, []);
  const handleDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onDeleteRequest) onDeleteRequest(); }, [onDeleteRequest]);
  const handleToggleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onToggle) onToggle(); }, [onToggle]);

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md overflow-hidden
        border border-gray-200 hover:shadow-lg transition-shadow duration-200
        cursor-pointer group relative
        ${isActuator && displayState === 'ON' ? 'border-l-4 border-green-500' : ''}
        ${isActuator && displayState === 'OFF' ? 'border-l-4 border-red-500' : ''}
      `}
      onClick={onClick} // Click cả card để mở Edit/Details
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Icon
            size={20}
            className={`${device.type === 'TEMP' ? 'text-blue-600' : 'text-yellow-600'}`}
          />
          <span className="font-medium text-gray-800 truncate" title={device.feed}>
            {device.feed}
          </span>
        </div>
        {isActuator && (
          <span
            title={`Status: ${displayState}`}
            className={`w-3 h-3 rounded-full ${displayState === 'ON' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          ></span>
        )}
        {isSensor && ( // Vẫn hiển thị icon riêng cho sensor nếu muốn
          <span title="Sensor" className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 min-h-[80px] flex flex-col justify-center">
        {isSensor ? (
          <div className="text-center">
            <span className="text-3xl font-bold text-gray-900">
              {currentValue !== undefined ? `${currentValue}` : '--'}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {device.type === 'TEMP' ? '°C' : ' lux'}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {isTempActuator && onSetSpeed ? (
              <div className="space-y-1" title={`Speed: ${currentSpeed}% (${minSpeed}-${maxSpeed})`}>
                <input
                  type="range"
                  id={`speed-${device.id}`}
                  min={minSpeed}
                  max={maxSpeed}
                  value={currentSpeed}
                  onChange={handleSliderChange}
                  onClick={handleSliderClick}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={displayState === 'OFF'}
                />
                <div className="text-xs text-gray-500 text-right">
                  {displayState === 'ON' ? `${currentSpeed}%` : 'OFF'}
                </div>
              </div>
            ) : device.type === 'LIGHT' && isActuator ? (
              <p className="text-sm text-center text-gray-600 font-medium">
                State: {displayState}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer - Các nút Actions */}
      <div className="flex justify-end items-center space-x-2 p-2 bg-gray-50 border-t border-gray-100">
        
        {/* >>> THAY ĐỔI CHÍNH Ở ĐÂY <<< */}
        {/* Nút Chart: Hiển thị nếu có callback onShowChart được truyền vào */}
        {onShowChart && ( 
          <button 
            onClick={handleChartClick} 
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors duration-150" 
            title="View Chart"
          > 
            <BarChart2 size={18} /> 
          </button> 
        )}
        {/* >>> KẾT THÚC THAY ĐỔI CHÍNH <<< */}

        {/* Nút Toggle (chỉ cho Actuator) */}
        {isActuator && onToggle && (
          <button
            onClick={handleToggleClick}
            className={`p-1.5 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
                        ${displayState === 'ON'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'}`
                      }
            title={displayState === 'ON' ? 'Turn Off' : 'Turn On'}
          >
            <Power size={18} />
          </button>
        )}

        {/* Nút Delete */}
        {onDeleteRequest && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete Device"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;