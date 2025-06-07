// components/dashboard/DeviceCard.tsx
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Device } from '@/lib/types';
import { Lightbulb, Thermometer, Power, Trash2, BarChart3} from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  isSensor: boolean;
  currentState?: 'ON' | 'OFF';
  currentValue?: string | number;
  onClick: () => void;
  onToggle?: () => void;
  onSetSpeed?: (speed: number) => void;
  onDeleteRequest?: () => void;
  onShowChart?: () => void;
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
  const displayState = currentState ?? device.state;
  const isActuator = !isSensor;
  const isTempActuator = device.type === 'TEMP' && isActuator;
  const Icon = device.type === 'TEMP' ? Thermometer : Lightbulb;

  // States cho slider debounce
  const [localSpeed, setLocalSpeed] = useState<number>(minSpeed);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [isTempActuator, displayState, currentValue, minSpeed, maxSpeed]);

  // Sync localSpeed với currentSpeed khi không active
  useEffect(() => {
    if (!isSliderActive) {
      setLocalSpeed(currentSpeed);
    }
  }, [currentSpeed, isSliderActive]);

  // Debounced slider handler
  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    setLocalSpeed(newValue);
    setIsSliderActive(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (onSetSpeed) {
        onSetSpeed(newValue);
      }
      setIsSliderActive(false);
    }, 300); // 300ms debounce
  }, [onSetSpeed]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleChartClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onShowChart) {
      onShowChart();
    }
  }, [onShowChart]);

  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => { 
    e.stopPropagation(); 
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { 
    e.stopPropagation(); 
    if (onDeleteRequest) onDeleteRequest(); 
  }, [onDeleteRequest]);

  const handleToggleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => { 
    e.stopPropagation(); 
    if (onToggle) onToggle(); 
  }, [onToggle]);

  return (
    <div
      className={`
        group relative bg-white rounded-xl shadow-sm border border-gray-200 
        hover:shadow-lg hover:border-gray-300 transition-all duration-300 
        cursor-pointer overflow-hidden
        ${isActuator && displayState === 'ON' ? 'ring-2 ring-green-500/20 border-green-500/30' : ''}
        ${isActuator && displayState === 'OFF' ? 'ring-2 ring-gray-300/20' : ''}
        ${isSensor ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : ''}
      `}
      onClick={onClick}
    >
      {/* Status Indicator */}
      {isActuator && (
        <div className={`absolute top-0 left-0 w-full h-1 ${
          displayState === 'ON' ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-300'
        }`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-lg 
            ${device.type === 'TEMP' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-yellow-100 text-yellow-600'
            }
          `}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 truncate" title={device.id}>
              {device.id}
            </h3>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {isSensor ? 'Sensor' : 'Actuator'} • {device.type}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {isActuator && (
          <div className={`
            flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium
            ${displayState === 'ON' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            <div className={`w-2 h-2 rounded-full ${
              displayState === 'ON' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {displayState}
          </div>
        )}
      </div>

      {/* Body - Main Content */}
      <div className="px-4 pb-4">
        {isSensor ? (
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {currentValue !== undefined ? `${currentValue}` : '--'}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {device.type === 'TEMP' ? 'Degrees Celsius' : 'Lux'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isTempActuator && onSetSpeed ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Temperature Control
                  </label>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    displayState === 'ON' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {displayState === 'ON' ? `${isSliderActive ? localSpeed : currentSpeed}°C` : 'OFF'}
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min={minSpeed}
                    max={maxSpeed}
                    value={isSliderActive ? localSpeed : currentSpeed}
                    onChange={handleSliderChange}
                    onClick={handleSliderClick}
                    className={`
                      w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-blue-500
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:hover:bg-blue-600
                      [&::-webkit-slider-thumb]:transition-colors
                    `}
                    style={{
                      background: displayState === 'ON' 
                        ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((isSliderActive ? localSpeed : currentSpeed) - minSpeed) / (maxSpeed - minSpeed) * 100}%, #e5e7eb ${((isSliderActive ? localSpeed : currentSpeed) - minSpeed) / (maxSpeed - minSpeed) * 100}%, #e5e7eb 100%)`
                        : '#e5e7eb'
                    }}
                    disabled={displayState === 'OFF'}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{minSpeed}°C</span>
                    <span>{maxSpeed}°C</span>
                  </div>
                  {isSliderActive && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        Updating...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : device.type === 'LIGHT' && isActuator ? (
              <div className="text-center py-4">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  displayState === 'ON' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Lightbulb size={18} />
                  <span className="font-medium">{displayState}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Left side - Chart button */}
          <div>
            {onShowChart && (
              <button
                onClick={handleChartClick}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group/chart"
                title="View Analytics"
              >
                <BarChart3 size={16} className="group-hover/chart:scale-110 transition-transform" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            )}
          </div>

          {/* Right side - Control buttons */}
          <div className="flex items-center space-x-2">
            {isActuator && onToggle && (
              <button
                onClick={handleToggleClick}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${displayState === 'ON'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                  }
                `}
                title={displayState === 'ON' ? 'Turn Off' : 'Turn On'}
              >
                <Power size={16} />
                <span className="hidden sm:inline">
                  {displayState === 'ON' ? 'Turn Off' : 'Turn On'}
                </span>
              </button>
            )}

            {onDeleteRequest && (
              <button
                onClick={handleDeleteClick}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 group/delete"
                title="Delete Device"
              >
                <Trash2 size={16} className="group-hover/delete:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;