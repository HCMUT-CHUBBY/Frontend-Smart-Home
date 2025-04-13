// components/dashboard/DeviceCard.tsx
import React from 'react';
import { Device } from '@/lib/types';
import { Lightbulb, Thermometer, Power } from 'lucide-react';
import styles from '@/styles/DeviceCard.module.scss';

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
    <div className={styles.deviceCard} onClick={onClick}>
      <div className={styles.cardHeader}>
        <div className={`${styles.icon} ${displayState === 'ON' ? styles.active : ''}`}>
          <Icon size={20} className={isSensor ? styles.sensorIcon : ''} />
        </div>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{device.feed}</h3>
          <p className={styles.subtitle}>
            {device.type === 'TEMP' ? 'Temperature Sensor' : 'Light Control'}
          </p>
        </div>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.statusContainer}>
          <span className={styles.statusLabel}>Status:</span>
          
          {isSensor ? (
            <div className={styles.statusValue}>
              <span className={`${styles.statusPill} ${styles.sensor}`}>
                {currentValue !== undefined 
                  ? `${currentValue}°C` 
                  : (displayState === 'ON' ? 'Active' : 'Inactive')}
              </span>
            </div>
          ) : (
            <div className={styles.statusValue}>
              <span className={`${styles.statusPill} ${displayState === 'ON' ? styles.on : styles.off}`}>
                {displayState}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Nút Toggle chỉ hiển thị cho thiết bị không phải sensor */}
      {!isSensor && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click của card cha
            onToggle();
          }}
          className={`${styles.toggleButton} ${displayState === 'ON' ? styles.on : styles.off}`}
          aria-label={`Turn ${displayState === 'ON' ? 'off' : 'on'}`}
        >
          <Power size={18} />
        </button>
      )}
      
      <div className={`${styles.bottomBar} ${displayState === 'OFF' ? styles.off : ''}`}></div>
    </div>
  );
};

export default DeviceCard;