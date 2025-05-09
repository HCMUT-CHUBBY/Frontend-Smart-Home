// components/dashboard/DeviceCard.tsx
import React, { useMemo, useCallback } from 'react';
import { Device } from '@/lib/types';
import { Lightbulb, Thermometer, Power, Trash2, BarChart2} from 'lucide-react';

// Cập nhật Props Interface (Giống như trước)
interface DeviceCardProps {
  device: Device;
  isSensor: boolean;
  currentState?: 'ON' | 'OFF';
  currentValue?: string | number;
  onClick: () => void; // Mở modal Edit/Details
  onToggle?: () => void;
  onSetSpeed?: (speed: number) => void;
  onDeleteRequest?: () => void;
  onShowChart?: () => void; // Chart để sau
  minSpeed?: number;
  maxSpeed?: number;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSensor,
  currentState,
  currentValue,
  onClick,
  onToggle,
  onSetSpeed,
  onDeleteRequest,
   onShowChart,
  minSpeed = 0,
  maxSpeed = 100
}) => {
  //console.log(`[DeviceCard ${device.id}] Render. Props: device.state=${device.state}, currentState=${currentState}, currentValue=${currentValue} (type: ${typeof currentValue})`);

  const displayState = currentState ?? device.state;
  const isActuator = !isSensor;
  const isTempActuator = device.type === 'TEMP' && isActuator;

  const Icon = device.type === 'TEMP' ? Thermometer : Lightbulb;

  // components/dashboard/DeviceCard.tsx
  const currentSpeed = useMemo(() => {
    let calculatedSpeed = minSpeed; // Giá trị mặc định nếu OFF hoặc không phải temp actuator
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
   // console.log(`[DeviceCard ${device.id}] Calculated currentSpeed: ${calculatedSpeed} (based on currentValue: ${currentValue}, displayState: ${displayState}, isTempActuator: ${isTempActuator})`);
    return calculatedSpeed;
  }, [isTempActuator, displayState, currentValue, minSpeed, maxSpeed, device.id]); // Thêm device.id vào dependencies nếu cần cho log


  const handleChartClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onShowChart) {
        onShowChart();
    }
 }, [onShowChart]);
  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSetSpeed) onSetSpeed(parseInt(event.target.value, 10));
  }, [onSetSpeed]);

  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => { e.stopPropagation(); }, []);
  const handleDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onDeleteRequest) onDeleteRequest(); }, [onDeleteRequest]);
  const handleToggleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onToggle) onToggle(); }, [onToggle]);
//   const handleChartClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onShowChart) onShowChart(); }, [onShowChart]);


  return (
    // Card container - Thêm hiệu ứng hover, shadow, rounded corners
    // Conditional background/border dựa trên displayState (chỉ áp dụng nếu là Actuator?)
    // Hoặc đơn giản là màu nền trắng/xám nhạt
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
        {/* Status Dot - Chỉ hiển thị cho Actuator */}
        {isActuator && (
          <span
            title={`Status: ${displayState}`}
            className={`w-3 h-3 rounded-full ${displayState === 'ON' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          ></span>
        )}
         {/* Hiển thị icon nhỏ cho sensor thay vì status dot */}
         {isSensor && (
            <span title="Sensor" className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            </span>
         )}
      </div>

      {/* Body */}
      <div className="p-4 min-h-[80px] flex flex-col justify-center"> {/* Đặt chiều cao tối thiểu */}
        {isSensor ? (
          // Sensor: Hiển thị giá trị lớn
          <div className="text-center">
            <span className="text-3xl font-bold text-gray-900">
              {currentValue !== undefined ? `${currentValue}` : '--'}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {device.type === 'TEMP' ? '°C' : ' lux'}
            </span>
          </div>
        ) : (
          // Actuator: Hiển thị điều khiển
          <div className="space-y-3">
            {/* Slider tốc độ (chỉ Temp Actuator và khi ON) */}
            {isTempActuator && onSetSpeed ? (
                <div className="space-y-1" title={`Speed: ${currentSpeed}% (${minSpeed}-${maxSpeed})`}>
                    <input
                        type="range"
                        id={`speed-${device.id}`}
                        min={minSpeed}
                        max={maxSpeed}
                        value={currentSpeed} // Dùng value
                        onChange={handleSliderChange}
                        onClick={handleSliderClick}
                        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed`} // Dùng accent-color
                        disabled={displayState === 'OFF'}
                    />
                    <div className="text-xs text-gray-500 text-right">
                        {displayState === 'ON' ? `${currentSpeed}%` : 'OFF'}
                    </div>
                </div>
            // Hiển thị trạng thái chữ cho Light Actuator (nếu không có slider)
            ) : device.type === 'LIGHT' && isActuator ? (
                <p className="text-sm text-center text-gray-600 font-medium">
                    State: {displayState}
                 </p>
            ) : null }
          </div>
        )}
      </div>

      {/* Footer - Các nút Actions */}
      <div className="flex justify-end items-center space-x-2 p-2 bg-gray-50 border-t border-gray-100">
        {/* Nút Toggle (chỉ cho Actuator) */}
        {isSensor && onShowChart && (
          <button 
               onClick={handleChartClick} 
               className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors duration-150" 
               title="View Chart"> <BarChart2 size={18} /> 
          </button> 
        )}
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

        {/* Nút Chart (chỉ cho Sensor - để sau) */}
        {isSensor && onShowChart && ( 
          <button 
               onClick={handleChartClick} 
               className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors duration-150" 
               title="View Chart"> <BarChart2 size={18} /> 
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