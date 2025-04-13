// components/dashboard/DeviceDetailsModal.tsx
import React, { useState } from 'react';
import { Lightbulb, Thermometer } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Device } from '@/lib/types';
import styles from '@/styles/DeviceDetailModal.module.scss';

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  isSensitive?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isSensitive = false }) => {
  const [showSensitive, setShowSensitive] = useState(false);
  
  return (
    <div className={styles.detailItem}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>
        {isSensitive ? (
          <>
            <span>{showSensitive ? value : String(value).substring(0, 5)}</span>
            <span className={showSensitive ? '' : styles.maskedValue}></span>
            <button 
              className={styles.showButton} 
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? 'Hide' : 'Show'}
            </button>
          </>
        ) : (
          value
        )}
      </div>
    </div>
  );
};

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ isOpen, onClose, device }) => {
  if (!device) return null;
  
  const Icon = device.type === 'TEMP' ? Thermometer : Lightbulb;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Device Details">
      <div className={`${styles.modalContent} ${styles.animatedModal}`}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <Icon size={18} />
          </div>
          <h2>Device Details</h2>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.detailSection}>
            <h3>Basic Information</h3>
            <div className={styles.detailGrid}>
              <DetailItem label="Name" value={device.feed} />
              <DetailItem label="Type" value={device.type === 'TEMP' ? 'Temperature Sensor' : 'Light Control'} />
              <DetailItem label="Status" value={
                <span className={`${styles.statusBadge} ${device.state === 'ON' ? styles.on : styles.off}`}>
                  {device.state}
                </span>
              } />
              <DetailItem label="ID" value={device.id} />
            </div>
          </div>
          
          <div className={styles.detailSection}>
            <h3>Connection Information</h3>
            <div className={styles.detailGrid}>
              <DetailItem label="Adafruit Username" value={device.adaUsername} />
              {/* Không nên hiển thị API Key đầy đủ vì lý do bảo mật */}
              <DetailItem label="API Key" value={device.adaApikey} isSensitive={true} />
            </div>
          </div>
          
          <div className={styles.detailSection}>
            <h3>Device Configuration</h3>
            <pre className={styles.configBlock}>
              {JSON.stringify(device.deviceConfig, null, 2) || '{}'}
            </pre>
          </div>
          {/* Thêm các trường khác nếu cần */}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
          <button className={styles.actionButton}>
            Edit Device
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeviceDetailsModal;