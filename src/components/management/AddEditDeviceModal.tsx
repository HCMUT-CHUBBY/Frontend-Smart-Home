// components/dashboard/AddEditDeviceModal.tsx
import React, { useState, useEffect, FormEvent, useCallback} from 'react';
import Modal from '@/components/ui/Modal';
import { Device, DeviceDTO } from '@/lib/types'; // Đảm bảo types đã cập nhật isSensor
import { Save, X, AlertCircle, Server, ChevronDown, Eye, EyeOff,  Thermometer, Lightbulb, Trash2 } from 'lucide-react';
import styles from '@/styles/AddEditDeviceModal.module.scss'; // <<< Tạo file SCSS mới này
import commonStyles from '@/styles/Common.module.scss'; // Nếu dùng

// Định nghĩa kiểu cho việc chọn loại thiết bị
type DeviceCategory = 'LIGHT_SENSOR' | 'TEMP_SENSOR' | 'LIGHT_ACTUATOR' | 'TEMP_ACTUATOR';

// Props Interface cập nhật
interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | null; // <<< Bổ sung mode
  initialData?: Device | null; // <<< Dữ liệu ban đầu khi edit
  onSave: (deviceData: DeviceDTO, mode: 'add' | 'edit') => Promise<void>; // <<< Callback lưu
  onDelete?: (deviceId: string) => void; // <<< Callback xóa (optional)
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, mode, initialData, onSave, onDelete, defaultAdaUsername, defaultAdaApiKey
}) => {
  // Form fields state
  const [feed, setFeed] = useState('');
  const [adaUsername, setAdaUsername] = useState('');
  const [adaApiKey, setAdaApiKey] = useState('');
  // Loại thiết bị (quan trọng)
  const [deviceCategory, setDeviceCategory] = useState<DeviceCategory>('LIGHT_SENSOR');
  // State cho các trường config cụ thể
  const [configMin, setConfigMin] = useState<string | number>('');
  const [configMax, setConfigMax] = useState<string | number>('');
  const [configMinSpeed, setConfigMinSpeed] = useState<string | number>('');
  const [configMaxSpeed, setConfigMaxSpeed] = useState<string | number>('');
  const [configThreshold, setConfigThreshold] = useState<string | number>('');
  const [configInitialState, setConfigInitialState] = useState<'ON' | 'OFF'>('OFF'); // State ban đầu chỉ cho actuator

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  const isEditing = mode === 'edit';
  // --- Khởi tạo/Reset Form ---
  const resetForm = useCallback(() => {
    setFeed('');
    setAdaUsername(defaultAdaUsername);
    setAdaApiKey(defaultAdaApiKey); // Không nên set key cũ khi edit ở đây
    setDeviceCategory('LIGHT_SENSOR');
    setConfigMin('');
    setConfigMax('');
    setConfigMinSpeed('');
    setConfigMaxSpeed('');
    setConfigThreshold('');
    setConfigInitialState('OFF');
    setIsLoading(false);
    setError(null);
    setFormTouched(false);
    setShowPassword(false);
}, [defaultAdaUsername, defaultAdaApiKey]);
  // Initialize form when modal opens
  // Khởi tạo form dựa trên mode và initialData
  useEffect(() => {
    if (isOpen) {
        setError(null); // Luôn xóa lỗi cũ khi mở
        setFormTouched(false);
        setIsLoading(false);
        setShowPassword(false);

        if (isEditing && initialData) {
            console.log("[Modal Effect - Edit] Initializing with data:", initialData);
            // --- Xác định DeviceCategory từ initialData ---
            let category: DeviceCategory = 'LIGHT_SENSOR'; // Default
            if (initialData.type === 'LIGHT') {
                category = initialData.isSensor ? 'LIGHT_SENSOR' : 'LIGHT_ACTUATOR';
            } else if (initialData.type === 'TEMP') {
                category = initialData.isSensor ? 'TEMP_SENSOR' : 'TEMP_ACTUATOR';
            }
             console.log("Determined category:", category);
            setDeviceCategory(category);

            // --- Điền các trường cơ bản ---
            setFeed(initialData.feed);
            setAdaUsername(initialData.adaUsername);
            setAdaApiKey(''); // Để trống ô API key, người dùng nhập nếu muốn đổi
            setConfigInitialState(initialData.state || 'OFF'); // Lấy state hiện tại làm initial state nếu edit actuator

            // --- Điền các trường config ---
            const cfg = initialData.deviceConfig || {};
            setConfigMin((cfg['min'] as string | number) ?? ''); // Dùng các key thống nhất
            setConfigMax(typeof cfg['max'] === 'string' || typeof cfg['max'] === 'number' ? cfg['max'] : '');
            setConfigMinSpeed((cfg['minSpeed'] as string | number) ?? '');
            setConfigMaxSpeed(typeof cfg['maxSpeed'] === 'string' || typeof cfg['maxSpeed'] === 'number' ? cfg['maxSpeed'] : '');
            setConfigThreshold(typeof cfg['threshold'] === 'string' || typeof cfg['threshold'] === 'number' ? cfg['threshold'] : '');

        } else {
             console.log("[Modal Effect - Add] Resetting form.");
            resetForm(); // Reset hoàn toàn cho mode 'add'
            setAdaUsername(defaultAdaUsername); // Set default lại
            setAdaApiKey(defaultAdaApiKey);
        }
    }
}, [isOpen, isEditing, initialData, resetForm, defaultAdaUsername, defaultAdaApiKey]);

  // Update isSensor when type changes
  
  // Form validation
  const validateForm = (): boolean => {
    if (!feed.trim()) { setError("Feed name is required"); return false; }
    if (!adaUsername.trim()) { setError("Adafruit Username is required"); return false; }
    // API Key chỉ bắt buộc khi thêm mới HOẶC khi người dùng cố tình sửa và để trống
    // Khi edit, để trống nghĩa là giữ key cũ (logic gửi PUT sẽ xử lý)
    if (mode === 'add' && !adaApiKey.trim()) {
        setError("Adafruit API Key is required for new device");
        return false;
    }
    // Thêm validation cho các trường config nếu cần (ví dụ min < max)
    return true;
};


  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormTouched(true);

    if (!validateForm()) return;

    setIsLoading(true);

    // --- Xác định type và isSensor từ deviceCategory ---
    let type: 'TEMP' | 'LIGHT';
    let isSensor: boolean;
    switch (deviceCategory) {
        case 'LIGHT_SENSOR': type = 'LIGHT'; isSensor = true; break;
        case 'TEMP_SENSOR': type = 'TEMP'; isSensor = true; break;
        case 'LIGHT_ACTUATOR': type = 'LIGHT'; isSensor = false; break;
        case 'TEMP_ACTUATOR': type = 'TEMP'; isSensor = false; break;
        default: type = 'LIGHT'; isSensor = true; // Fallback không nên xảy ra
    }

    // --- Xây dựng deviceConfig từ state ---
    const finalDeviceConfig: Record<string, number|string> = {};
    if (isSensor) {
        if (configMin !== '') finalDeviceConfig.min = Number(configMin); // Chuyển về số nếu có thể
        if (configMax !== '') finalDeviceConfig.max = Number(configMax);
    } else if (deviceCategory === 'TEMP_ACTUATOR') {
        if (configMinSpeed !== '') finalDeviceConfig.minSpeed = Number(configMinSpeed);
        if (configMaxSpeed !== '') finalDeviceConfig.maxSpeed = Number(configMaxSpeed);
        if (configThreshold !== '') finalDeviceConfig.threshold = Number(configThreshold);
    }

    // --- Tạo DeviceDTO payload ---
    const deviceDataPayload: DeviceDTO = {
        // id chỉ thêm vào khi edit
        ...(isEditing && initialData && { id: initialData.id }),
        feed: feed.trim(),
        type: type,
        isSensor: isSensor,
        // state chỉ quan trọng khi thêm mới actuator, khi edit thì không nên gửi qua DTO này
        state: (mode === 'add' && !isSensor) ? configInitialState : (initialData?.state || 'OFF'), // State ban đầu cho add, state gốc cho edit
        adaUsername: adaUsername.trim(),
        // adaApikey chỉ gửi nếu có giá trị (khác rỗng)
        ...(adaApiKey.trim() && { adaApikey: adaApiKey.trim() }),
        deviceConfig: finalDeviceConfig,
    };

    try {
        // Gọi callback onSave được truyền từ DashboardPage
        await onSave(deviceDataPayload, mode!); // Truyền cả mode
        // DashboardPage sẽ xử lý đóng modal và load lại data nếu thành công
    } catch (err: unknown) {
        // Lỗi đã được xử lý và báo toast ở DashboardPage, chỉ cần set lỗi cục bộ nếu muốn
        const specificError = (err as { response?: { data?: { message?: string, detail?: string } } })?.response?.data;
        setError(specificError?.detail || specificError?.message || (err instanceof Error ? err.message : "An unexpected error occurred."));
        console.error("Submit error caught in modal:", err);
        setIsLoading(false); // Dừng loading ở modal khi có lỗi
        if (!formTouched) {
         console.log("Please make changes before submitting.");
          return;
        }
    }
    // Không gọi setIsLoading(false) ở đây nếu không có lỗi, vì DashboardPage sẽ đóng modal
};
const handleDelete = () => {
  if (isEditing && initialData && onDelete) {
      // Có thể thêm xác nhận nội bộ ở đây hoặc dựa vào modal xác nhận ở DashboardPage
      console.log(`Requesting delete for device: ${initialData.id}`);
      onDelete(initialData.id); // Gọi callback xóa truyền từ DashboardPage
  }
};
  // Input field focus handlers
 

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  // Hàm chọn icon dựa trên category (ví dụ)
    const getCategoryIcon = (category: DeviceCategory) => {
        switch (category) {
            case 'LIGHT_SENSOR': return <Lightbulb size={18} className="text-yellow-500" />;
            case 'TEMP_SENSOR': return <Thermometer size={18} className="text-blue-500" />;
            case 'LIGHT_ACTUATOR': return <Lightbulb size={18} className="text-orange-500" />; // Màu khác cho actuator
            case 'TEMP_ACTUATOR': return <Thermometer size={18} className="text-red-500" />; // Màu khác cho actuator
            default: return <Server size={18} className="text-gray-500" />;
        }
   };
  function setDeviceConfigValue(config: Record<string, number | string>) {
    if ('min' in config) setConfigMin(config.min);
    if ('max' in config) setConfigMax(config.max);
    if ('minSpeed' in config) setConfigMinSpeed(config.minSpeed);
    if ('maxSpeed' in config) setConfigMaxSpeed(config.maxSpeed);
    if ('threshold' in config) setConfigThreshold(config.threshold);
  }

  // Get appropriate icon based on device type
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title=""> {/* Title sẽ đặt trong content */}
      <div className="relative pb-2">
        {/* Close button */}
        <button onClick={onClose} disabled={isLoading} className={styles.closeButton} aria-label="Close modal"> <X size={18}/> </button>

        {/* Header */}
        <div className={styles.header}> {/* Sử dụng class từ SCSS */}
          <div className={styles.headerIconWrapper}> <Server size={24} className={styles.headerIcon}/> </div>
          <h3 className={styles.headerTitle}> {isEditing ? "Edit Device" : "Add New Device"} </h3>
          <p className={styles.headerSubtitle}>
            {isEditing ? "Update device configuration" : "Configure a new IoT device"}
          </p>
        </div>

        {/* Error display */}
        {error && ( <div className={styles.errorBox}> <AlertCircle size={18}/> <p>{error}</p> </div> )}

        {/* --- Form --- */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Feed Name */}
          <div className={commonStyles.formGroup}>
            <label htmlFor="feed" className={commonStyles.label}>Feed Name <span className={commonStyles.required}>*</span></label>
            <input type="text" id="feed" value={feed} onChange={(e) => setFeed(e.target.value)} required className={commonStyles.inputField} placeholder="e.g., living_room_light" disabled={isLoading} />
            <small className={commonStyles.helpText}>Tên Feed bạn đã tạo trên Adafruit IO.</small>
          </div>

          {/* Device Category Selection */}
          <div className={commonStyles.formGroup}>
            <label htmlFor="deviceCategory" className={commonStyles.label}>Device Type <span className={commonStyles.required}>*</span></label>
            <div className="relative"> {/* Wrapper cho icon */}
                <select id="deviceCategory" value={deviceCategory}
                    onChange={(e) => {
                        setDeviceCategory(e.target.value as DeviceCategory);
                        // Reset các trường config liên quan khi đổi loại
                        setDeviceConfigValue({});
                        setConfigMin(''); setConfigMax(''); setConfigMinSpeed(''); setConfigMaxSpeed(''); setConfigThreshold('');
                    }}
                    className={`${commonStyles.selectField} pl-10`} // Thêm padding trái cho icon
                    disabled={isLoading || isEditing} // Không cho sửa type khi edit
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

          {/* --- Conditional Config Section --- */}
          <div className={styles.configSection}>
              <h4 className={styles.configTitle}>Configuration (Optional)</h4>
              <div className={styles.configGrid}>
                  {/* Config cho Sensors */}
                  {(deviceCategory === 'LIGHT_SENSOR' || deviceCategory === 'TEMP_SENSOR') && (
                      <>
                          <div className={commonStyles.formGroup}>
                              <label htmlFor="configMin" className={commonStyles.label}>Min Value</label>
                              <input type="number" id="configMin" name="min" value={configMin} onChange={(e)=>setConfigMin(e.target.value)} className={commonStyles.inputField} placeholder="e.g., 0 or 10" disabled={isLoading}/>
                          </div>
                          <div className={commonStyles.formGroup}>
                              <label htmlFor="configMax" className={commonStyles.label}>Max Value</label>
                              <input type="number" id="configMax" name="max" value={configMax} onChange={(e)=>setConfigMax(e.target.value)} className={commonStyles.inputField} placeholder="e.g., 1000 or 50" disabled={isLoading}/>
                          </div>
                      </>
                  )}
                  {/* Config cho Temp Actuator */}
                  {deviceCategory === 'TEMP_ACTUATOR' && (
                      <>
                          <div className={commonStyles.formGroup}>
                              <label htmlFor="configMinSpeed" className={commonStyles.label}>Min Speed (%)</label>
                              <input type="number" id="configMinSpeed" name="minSpeed" value={configMinSpeed} onChange={(e)=>setConfigMinSpeed(e.target.value)} className={commonStyles.inputField} placeholder="e.g., 0" disabled={isLoading}/>
                          </div>
                          <div className={commonStyles.formGroup}>
                              <label htmlFor="configMaxSpeed" className={commonStyles.label}>Max Speed (%)</label>
                              <input type="number" id="configMaxSpeed" name="maxSpeed" value={configMaxSpeed} onChange={(e)=>setConfigMaxSpeed(e.target.value)} className={commonStyles.inputField} placeholder="e.g., 100" disabled={isLoading}/>
                          </div>
                          <div className={commonStyles.formGroup}>
                              <label htmlFor="configThreshold" className={commonStyles.label}>Threshold (°C)</label>
                              <input type="number" id="configThreshold" name="threshold" value={configThreshold} onChange={(e)=>setConfigThreshold(e.target.value)} className={commonStyles.inputField} placeholder="e.g., 28" disabled={isLoading}/>
                          </div>
                      </>
                  )}
                   {/* Config Initial State cho Actuators */}
                   {(deviceCategory === 'LIGHT_ACTUATOR' || deviceCategory === 'TEMP_ACTUATOR') && (
                       <div className={commonStyles.formGroup}>
                           <label htmlFor="configInitialState" className={commonStyles.label}>Initial State</label>
                           <select id="configInitialState" name="initialState" value={configInitialState} onChange={(e)=>setConfigInitialState(e.target.value as 'ON'|'OFF')} className={commonStyles.selectField} disabled={isLoading || isEditing} /* Không cho sửa state ban đầu khi edit */ >
                               <option value="OFF">OFF</option>
                               <option value="ON">ON</option>
                           </select>
                            {isEditing && <small className={commonStyles.helpText}>Initial state applies when adding. Current state is managed via controls.</small>}
                       </div>
                   )}
                   {(deviceCategory !== 'LIGHT_SENSOR' && deviceCategory !== 'TEMP_SENSOR' && deviceCategory !== 'TEMP_ACTUATOR') && (
                        <p className={styles.noConfigText}>No specific configuration for this device type.</p>
                   )}
              </div>
          </div>


          {/* --- Credentials Section --- */}
          <div className={styles.credentialsSection}>
            <div className={styles.sectionDivider}><span>Adafruit IO Credentials</span></div>
            {/* Adafruit Username */}
            <div className={commonStyles.formGroup}>
              <label htmlFor="adaUsername" className={commonStyles.label}>Username <span className={commonStyles.required}>*</span></label>
              <input type="text" id="adaUsername" value={adaUsername} onChange={(e) => setAdaUsername(e.target.value)} required className={commonStyles.inputField} placeholder={defaultAdaUsername || "Your Adafruit Username"} disabled={isLoading} />
            </div>
            {/* Adafruit API Key */}
            <div className={commonStyles.formGroup}>
               <label htmlFor="adaApiKey" className={commonStyles.label}>IO Key {mode === 'add' ? <span className={commonStyles.required}>*</span> : '(Leave blank to keep current)'}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} id="adaApiKey" value={adaApiKey} onChange={(e) => setAdaApiKey(e.target.value)} required={mode === 'add'} className={`${commonStyles.inputField} pr-10`} placeholder={isEditing ? "Enter new key to change" : "Your Adafruit IO Key"} disabled={isLoading} />
                <button type="button" className={styles.passwordToggle} onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide key" : "Show key"} tabIndex={-1} > {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button>
              </div>
            </div>
          </div>

          {/* --- Action Buttons --- */}
          <div className={styles.footerButtonGroup}>
              {/* Nút Delete chỉ hiện khi Edit */}
              {isEditing && onDelete && (
                  <button type="button" onClick={handleDelete} disabled={isLoading} className={`${commonStyles.button} ${commonStyles.dangerButton} mr-auto`} > {/* Đẩy nút Delete sang trái */}
                      <Trash2 size={16} /> Delete
                  </button>
              )}
              {/* Nút Cancel và Save */}
              <button type="button" onClick={onClose} disabled={isLoading} className={`${commonStyles.button} ${commonStyles.secondaryButton}`} > <X size={16} /> Cancel </button>
              <button type="submit" disabled={isLoading} className={`${commonStyles.button} ${commonStyles.primaryButton}`} >
                  {isLoading ? ( <svg className="animate-spin h-4 w-4 mr-2" /* ... */ ></svg> ) : ( <Save size={16} className="mr-1" /> )}
                  {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Add Device')}
              </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};


// Có thể không cần EnhancedAddEditDeviceModal nếu không dùng phím tắt phức tạp
export default AddEditDeviceModal; // Xuất component chính


