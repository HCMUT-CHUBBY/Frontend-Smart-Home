// components/dashboard/AddEditDeviceModal.tsx
import React, { useState, useEffect, FormEvent, useCallback} from 'react';
import Modal from '@/components/ui/Modal';
import { Device, DeviceDTO } from '@/lib/types';
import { Save, X, AlertCircle, Server, ChevronDown, Eye, EyeOff, Thermometer, Lightbulb, Trash2 } from 'lucide-react';
import styles from '@/styles/AddEditDeviceModal.module.scss';
import commonStyles from '@/styles/Common.module.scss';

type DeviceCategory = 'LIGHT_SENSOR' | 'TEMP_SENSOR' | 'LIGHT_ACTUATOR' | 'TEMP_ACTUATOR';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | null;
  initialData?: Device | null;
  onSave: (deviceData: DeviceDTO, mode: 'add' | 'edit') => Promise<void>;
  onDelete?: (deviceId: string) => void;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, mode, initialData, onSave, onDelete, defaultAdaUsername, defaultAdaApiKey
}) => {
  const [feed, setFeed] = useState('');
  const [adaUsername, setAdaUsername] = useState('');
  const [adaApiKey, setAdaApiKey] = useState('');
  const [deviceCategory, setDeviceCategory] = useState<DeviceCategory>('LIGHT_SENSOR');
  
  const [configMin, setConfigMin] = useState<string | number>(''); 
  const [configMax, setConfigMax] = useState<string | number>(''); 
  
  // <<< BỎ: configMinSpeed, configMaxSpeed, configThreshold (ngưỡng kích hoạt actuator) >>>
  // const [configMinSpeed, setConfigMinSpeed] = useState<string | number>('');
  // const [configMaxSpeed, setConfigMaxSpeed] = useState<string | number>('');
  // const [configThreshold, setConfigThreshold] = useState<string | number>(''); 
  
  const [configLightThreshold, setConfigLightThreshold] = useState<string | number>('');
  const [configInitialState, setConfigInitialState] = useState<'ON' | 'OFF'>('OFF');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = mode === 'edit';

  const resetForm = useCallback(() => {
    setFeed('');
    setAdaUsername(defaultAdaUsername);
    setAdaApiKey(isEditing ? '' : defaultAdaApiKey);
    setDeviceCategory('LIGHT_SENSOR');
    setConfigMin('');
    setConfigMax('');
    // <<< BỎ: reset cho các state đã xóa >>>
    // setConfigMinSpeed('');
    // setConfigMaxSpeed('');
    // setConfigThreshold('');
    setConfigLightThreshold('');
    setConfigInitialState('OFF');
    setIsLoading(false);
    setError(null);
    setShowPassword(false);
  }, [defaultAdaUsername, defaultAdaApiKey, isEditing]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);
      setShowPassword(false);

      if (isEditing && initialData) {
        let category: DeviceCategory = 'LIGHT_SENSOR';
        if (initialData.type === 'LIGHT') {
          category = initialData.isSensor ? 'LIGHT_SENSOR' : 'LIGHT_ACTUATOR';
        } else if (initialData.type === 'TEMP') {
          category = initialData.isSensor ? 'TEMP_SENSOR' : 'TEMP_ACTUATOR';
        }
        setDeviceCategory(category);
        setFeed(initialData.feed);
        setAdaUsername(initialData.adaUsername);
        setAdaApiKey('');
        
        const cfg = initialData.deviceConfig || {};
        setConfigMin(''); setConfigMax('');
        setConfigLightThreshold('');
        // <<< BỎ: đọc các config đã xóa cho TEMP_ACTUATOR >>>
        // setConfigMinSpeed(''); setConfigMaxSpeed(''); setConfigThreshold('');


        if (category === 'TEMP_SENSOR' || category === 'TEMP_ACTUATOR') {
            setConfigMin((cfg['min_temp'] as string | number) ?? '');
            setConfigMax(typeof cfg['max_temp'] === 'string' || typeof cfg['max_temp'] === 'number' ? cfg['max_temp'] : '');
        }
        
        if (category === 'LIGHT_SENSOR' || category === 'LIGHT_ACTUATOR') {
            setConfigLightThreshold((cfg['light_threshold'] as string | number) ?? '');
        }
        
        // <<< BỎ: Đọc configMinSpeed, configMaxSpeed, configThreshold riêng cho TEMP_ACTUATOR >>>
        // if (category === 'TEMP_ACTUATOR') {
        //     setConfigMinSpeed((cfg['minSpeed'] as string | number) ?? '');
        //     setConfigMaxSpeed(typeof cfg['maxSpeed'] === 'string' || typeof cfg['maxSpeed'] === 'number' ? cfg['maxSpeed'] : '');
        //     setConfigThreshold(typeof cfg['threshold'] === 'string' || typeof cfg['threshold'] === 'number' ? cfg['threshold'] : '');
        // }
        
        if (!initialData.isSensor) {
            setConfigInitialState(initialData.state || 'OFF');
        } else {
            setConfigInitialState('OFF');
        }

      } else {
        resetForm();
        setAdaUsername(defaultAdaUsername);
        setAdaApiKey(defaultAdaApiKey);
      }
    }
  }, [isOpen, isEditing, initialData, resetForm, defaultAdaUsername, defaultAdaApiKey]);
  
  const validateForm = (): boolean => {
    setError(null);
    if (!feed.trim()) { setError("Feed name is required"); return false; }
    if (!adaUsername.trim()) { setError("Adafruit Username is required"); return false; }
    
    if (mode === 'add' && !adaApiKey.trim()) {
      setError("Adafruit API Key is required for new device");
      return false;
    }

    if (deviceCategory === 'LIGHT_SENSOR' || deviceCategory === 'LIGHT_ACTUATOR') {
      const lightThresholdValue = String(configLightThreshold).trim();
      if (!lightThresholdValue) {
        setError("Light Threshold is required for this Light device.");
        return false;
      }
      const numericLightThreshold = Number(lightThresholdValue);
      if (isNaN(numericLightThreshold)) {
        setError("Light Threshold must be a valid number.");
        return false;
      }
      // === THÊM KIỂM TRA GIỚI HẠN CHO light_threshold ===
      if (numericLightThreshold < 0 || numericLightThreshold > 100) { // Ví dụ: giới hạn từ 0 đến 100
        setError("Light Threshold must be between 0 and 100.");
        return false;
      }
      // === KẾT THÚC THÊM KIỂM TRA ===
    }
    
    if (deviceCategory === 'TEMP_SENSOR' || deviceCategory === 'TEMP_ACTUATOR') {
        const minTempValue = String(configMin).trim();
        const maxTempValue = String(configMax).trim();

        if (!minTempValue) {
            setError(`Min Temp is required for ${deviceCategory === 'TEMP_SENSOR' ? 'Temperature Sensor' : 'Temp Actuator'}.`);
            return false;
        }
        if (isNaN(Number(minTempValue))) {
            setError("Min Temp must be a valid number.");
            return false;
        }
        if (!maxTempValue) {
            setError(`Max Temp is required for ${deviceCategory === 'TEMP_SENSOR' ? 'Temperature Sensor' : 'Temp Actuator'}.`);
            return false;
        }
        if (isNaN(Number(maxTempValue))) {
            setError("Max Temp must be a valid number.");
            return false;
        }
        if (Number(minTempValue) >= Number(maxTempValue)) {
            setError("Min Temp must be less than Max Temp.");
            return false;
        }
    }
    
    return true;
  };
  // >>> KẾT THÚC CHỈNH SỬA (Hàm validateForm) <<<

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    let type: 'TEMP' | 'LIGHT';
    let isSensor: boolean;
    switch (deviceCategory) {
      case 'LIGHT_SENSOR': type = 'LIGHT'; isSensor = true; break;
      case 'TEMP_SENSOR': type = 'TEMP'; isSensor = true; break;
      case 'LIGHT_ACTUATOR': type = 'LIGHT'; isSensor = false; break;
      case 'TEMP_ACTUATOR': type = 'TEMP'; isSensor = false; break;
      default:
        setError("Invalid device category selected.");
        setIsLoading(false);
        return;
    }

    const finalDeviceConfig: Record<string, number> = {}; // Để any cho phép các kiểu khác nhau, hoặc định nghĩa chặt chẽ hơn
    
    if (deviceCategory === 'LIGHT_SENSOR' || deviceCategory === 'LIGHT_ACTUATOR') {
      finalDeviceConfig.light_threshold = Number(configLightThreshold);
    } else if (deviceCategory === 'TEMP_SENSOR' || deviceCategory === 'TEMP_ACTUATOR') { // <<< Gộp logic cho TEMP_SENSOR và TEMP_ACTUATOR
      finalDeviceConfig.min_temp = Number(configMin);
      finalDeviceConfig.max_temp = Number(configMax);
      // <<< BỎ: Thêm minSpeed, maxSpeed, threshold cho TEMP_ACTUATOR >>>
      // if (deviceCategory === 'TEMP_ACTUATOR') {
      //   if (configMinSpeed !== '' && !isNaN(Number(configMinSpeed))) finalDeviceConfig.minSpeed = Number(configMinSpeed);
      //   if (configMaxSpeed !== '' && !isNaN(Number(configMaxSpeed))) finalDeviceConfig.maxSpeed = Number(configMaxSpeed);
      //   if (configThreshold !== '' && !isNaN(Number(configThreshold))) finalDeviceConfig.threshold = Number(configThreshold);
      // }
    }

    const deviceDataPayload: DeviceDTO = {
      ...(isEditing && initialData && { id: initialData.id }),
      feed: feed.trim(),
      type: type,
      isSensor: isSensor,
      state: (mode === 'add' && !isSensor) ? configInitialState : (initialData?.state || 'OFF'),
      adaUsername: adaUsername.trim(),
      ...(adaApiKey.trim() && { adaApikey: adaApiKey.trim() }),
      deviceConfig: finalDeviceConfig,
    };

    console.log("Payload to be sent:", deviceDataPayload);

    try {
      await onSave(deviceDataPayload, mode!);
    } catch (err: unknown) {
      const specificError = (err as { response?: { data?: { message?: string, detail?: string, errors?: Record<string, string> } } })?.response?.data;
      let errorMessage = specificError?.message || specificError?.detail || (err instanceof Error ? err.message : "An unexpected error occurred.");
      if(specificError?.errors && typeof specificError.errors === 'object') {
        errorMessage += ` Details: ${Object.values(specificError.errors).join(', ')}`;
      }
      setError(errorMessage);
      console.error("Submit error caught in modal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (isEditing && initialData && onDelete) {
      onDelete(initialData.id);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const getCategoryIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'LIGHT_SENSOR': return <Lightbulb size={18} className="text-yellow-500" />;
      case 'TEMP_SENSOR': return <Thermometer size={18} className="text-blue-500" />;
      case 'LIGHT_ACTUATOR': return <Lightbulb size={18} className="text-orange-500" />; 
      case 'TEMP_ACTUATOR': return <Thermometer size={18} className="text-red-500" />;   
      default: return <Server size={18} className="text-gray-500" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative pb-2">
        <button onClick={onClose} disabled={isLoading} className={styles.closeButton} aria-label="Close modal"> <X size={18}/> </button>
        <div className={styles.header}>
           <div className={styles.headerIconWrapper}> <Server size={24} className={styles.headerIcon}/> </div>
          <h3 className={styles.headerTitle}> {isEditing ? "Edit Device" : "Add New Device"} </h3>
          <p className={styles.headerSubtitle}>
            {isEditing ? "Update device configuration" : "Configure a new IoT device"}
          </p>
        </div>

        {error && ( <div className={styles.errorBox}> <AlertCircle size={18}/> <p>{error}</p> </div> )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Feed Name, Device Category fields giữ nguyên */}
          <div className={commonStyles.formGroup}>
            <label htmlFor="feed" className={commonStyles.label}>Feed Name <span className={commonStyles.required}>*</span></label>
            <input type="text" id="feed" value={feed} onChange={(e) => setFeed(e.target.value)} required className={commonStyles.inputField} placeholder="e.g., living_room_light" disabled={isLoading} />
            <small className={commonStyles.helpText}>Tên Feed bạn đã tạo trên Adafruit IO.</small>
          </div>

          <div className={commonStyles.formGroup}>
            <label htmlFor="deviceCategory" className={commonStyles.label}>Device Type <span className={commonStyles.required}>*</span></label>
            <div className="relative">
              <select id="deviceCategory" value={deviceCategory}
                onChange={(e) => {
                  const newCategory = e.target.value as DeviceCategory;
                  setDeviceCategory(newCategory);
                  setConfigMin(''); setConfigMax('');
                  setConfigLightThreshold(''); 
                  setConfigInitialState('OFF'); 
                  // <<< BỎ: Reset các state đã xóa >>>
                  // setConfigMinSpeed(''); setConfigMaxSpeed(''); setConfigThreshold('');
                }}
                className={`${commonStyles.selectField} pl-10`}
                disabled={isLoading || isEditing}
              >
                <option value="LIGHT_SENSOR">Light Sensor</option>
                <option value="TEMP_SENSOR">Temperature Sensor</option>
                <option value="LIGHT_ACTUATOR">Light Actuator</option>
                <option value="TEMP_ACTUATOR">Temp Actuator</option>
              </select>
              <div className={styles.selectIcon}> {getCategoryIcon(deviceCategory)} </div>
              <div className={styles.selectChevron}> <ChevronDown size={16} /> </div>
            </div>
            {isEditing && <small className={commonStyles.helpText}>Device type cannot be changed after creation.</small>}
          </div>


          <div className={styles.configSection}>
            <h4 className={styles.configTitle}>Configuration</h4>
            <div className={styles.configGrid}>
              {(deviceCategory === 'LIGHT_SENSOR' || deviceCategory === 'LIGHT_ACTUATOR') && (
                <>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="configLightThreshold" className={commonStyles.label}>Light Threshold <span className={commonStyles.required}>*</span></label>
                    <input type="number" id="configLightThreshold" name="light_threshold" value={configLightThreshold} onChange={(e)=>setConfigLightThreshold(e.target.value)} required className={commonStyles.inputField} placeholder="e.g., 500 (lux)" disabled={isLoading}/>
                    <small className={commonStyles.helpText}>Required threshold for light level.</small>
                  </div>
                </>
              )}
              {(deviceCategory === 'TEMP_SENSOR' || deviceCategory === 'TEMP_ACTUATOR') && (
                <>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="configMinTemp" className={commonStyles.label}>Min Temp (°C) <span className={commonStyles.required}>*</span></label>
                    <input type="number" id="configMinTemp" name="min_temp" value={configMin} onChange={(e)=>setConfigMin(e.target.value)} required className={commonStyles.inputField} placeholder="e.g., 0" disabled={isLoading}/>
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="configMaxTemp" className={commonStyles.label}>Max Temp (°C) <span className={commonStyles.required}>*</span></label>
                    <input type="number" id="configMaxTemp" name="max_temp" value={configMax} onChange={(e)=>setConfigMax(e.target.value)} required className={commonStyles.inputField} placeholder="e.g., 50" disabled={isLoading}/>
                  </div>
                </>
              )}
              {/* <<< BỎ: UI cho minSpeed, maxSpeed, threshold của TEMP_ACTUATOR >>> */}
              {/* {deviceCategory === 'TEMP_ACTUATOR' && (
                <>
                  // Các input cho minSpeed, maxSpeed, threshold đã được bỏ
                </>
              )} */}
              {(deviceCategory === 'LIGHT_ACTUATOR' || deviceCategory === 'TEMP_ACTUATOR') && (
                <div className={commonStyles.formGroup}>
                  <label htmlFor="configInitialState" className={commonStyles.label}>Initial State (for new device)</label>
                  <select id="configInitialState" name="initialState" value={configInitialState} onChange={(e)=>setConfigInitialState(e.target.value as 'ON'|'OFF')} className={commonStyles.selectField} disabled={isLoading || isEditing} 
                  >
                    <option value="OFF">OFF</option>
                    <option value="ON">ON</option>
                  </select>
                  {isEditing && <small className={commonStyles.helpText}>Initial state applies when adding. Current state is managed via controls.</small>}
                </div>
              )}
               {/* Thông báo nếu không có config nào khác ngoài Initial State (ví dụ cho LIGHT_ACTUATOR giờ chỉ có light_threshold) */}
                { !(deviceCategory === 'LIGHT_SENSOR' || 
                     deviceCategory === 'LIGHT_ACTUATOR' || 
                     deviceCategory === 'TEMP_SENSOR' || 
                     deviceCategory === 'TEMP_ACTUATOR' 
                    // Thêm điều kiện ở đây nếu một loại nào đó không có config số nào cả
                    // Ví dụ, nếu LIGHT_ACTUATOR không có config số nào khác
                    // (nhưng nó có light_threshold nên điều kiện này không đúng nữa)
                   ) && 
                  ( 
                 <p className={styles.noConfigText}>No specific numeric configuration for this device type beyond initial state (if applicable).</p>
              )}
            </div>
          </div>

           <div className={styles.credentialsSection}>
            <div className={styles.sectionDivider}><span>Adafruit IO Credentials</span></div>
            <div className={commonStyles.formGroup}>
              <label htmlFor="adaUsername" className={commonStyles.label}>Username <span className={commonStyles.required}>*</span></label>
              <input type="text" id="adaUsername" value={adaUsername} onChange={(e) => setAdaUsername(e.target.value)} required className={commonStyles.inputField} placeholder={defaultAdaUsername || "Your Adafruit Username"} disabled={isLoading} />
            </div>
            <div className={commonStyles.formGroup}>
              <label htmlFor="adaApiKey" className={commonStyles.label}>IO Key {mode === 'add' ? <span className={commonStyles.required}>*</span> : '(Leave blank to keep current)'}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} id="adaApiKey" value={adaApiKey} onChange={(e) => setAdaApiKey(e.target.value)} required={mode === 'add'} className={`${commonStyles.inputField} pr-10`} placeholder={isEditing ? "Enter new key to change" : "Your Adafruit IO Key"} disabled={isLoading} />
                <button type="button" className={styles.passwordToggle} onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide key" : "Show key"} tabIndex={-1} > {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button>
              </div>
            </div>
          </div>

          <div className={styles.footerButtonGroup}>
            {isEditing && onDelete && (
              <button type="button" onClick={handleDelete} disabled={isLoading} className={`${commonStyles.button} ${commonStyles.dangerButton} mr-auto`} >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button type="button" onClick={onClose} disabled={isLoading} className={`${commonStyles.button} ${commonStyles.secondaryButton}`} > <X size={16} /> Cancel </button>
            <button type="submit" disabled={isLoading} className={`${commonStyles.button} ${commonStyles.primaryButton}`} >
              {isLoading ? ( <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> ) : ( <Save size={16} className="mr-1" /> )}
              {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Add Device')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEditDeviceModal;