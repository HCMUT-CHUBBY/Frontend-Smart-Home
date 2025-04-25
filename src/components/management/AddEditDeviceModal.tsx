// app/(protected)/manage-devices/components/AddEditDeviceModal.tsx
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { Device, DeviceDTO } from '@/lib/types';
import apiClient from '@/lib/apiClient';
import axios from 'axios';
import { Save, X, AlertCircle, Server, ChevronDown, Eye, EyeOff, Info, Thermometer, Lightbulb, ExternalLink, HelpCircle /* Thêm icon này */ } from 'lucide-react';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  initialData?: Device | null;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, onSuccess, initialData, defaultAdaUsername, defaultAdaApiKey
}) => {
  // --- State Variables ---
  const [feed, setFeed] = useState('');
  // --- THAY ĐỔI: State isSensor sẽ do người dùng chọn khi Add ---
  const [isSensor, setIsSensor] = useState(true); // Vẫn giữ state, giá trị ban đầu khi Add sẽ là true
  // ----------------------------------------------------------
  const [type, setType] = useState<'TEMP' | 'LIGHT'>('TEMP');
  const [state, setState] = useState<'ON' | 'OFF'>('OFF');
  const [adaUsername, setAdaUsername] = useState('');
  const [adaApiKey, setAdaApiKey] = useState('');
  const [minTemp, setMinTemp] = useState<string>('');
  const [maxTemp, setMaxTemp] = useState<string>('');
  const [lightThreshold, setLightThreshold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configErrors, setConfigErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);

  const isEditing = !!initialData;

  // Effect khởi tạo/reset form
  useEffect(() => {
    if (isOpen) {
      let initialConfig: Record<string, string | number> = {};
      let initialType: 'TEMP' | 'LIGHT' = 'TEMP';
      let initialIsSensor = true; // Mặc định khi Add

      if (isEditing && initialData) {
        setFeed(initialData.feed);
        // --- THAY ĐỔI: Lấy isSensor từ initialData khi Edit ---
        initialIsSensor = initialData.isSensor;
        setIsSensor(initialData.isSensor);
        // --------------------------------------------------
        initialType = initialData.type === 'LIGHT' ? 'LIGHT' : 'TEMP';
        setType(initialType);
        setState(initialData.state);
        setAdaUsername(initialData.adaUsername);
        setAdaApiKey(initialData.adaApikey);
        initialConfig = Object.fromEntries(
          Object.entries(initialData.deviceConfig || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value,
          ])
        );
      } else {
        // Chế độ Add: Reset về mặc định
        setFeed('');
        // --- THAY ĐỔI: Đặt giá trị isSensor mặc định ban đầu khi Add ---
        initialIsSensor = true; // Có thể đổi thành false nếu muốn mặc định là Device
        setIsSensor(initialIsSensor);
        // ----------------------------------------------------------
        initialType = 'TEMP'; // Mặc định là TEMP khi thêm mới
        setType('TEMP');
        setState('OFF');
        setAdaUsername(defaultAdaUsername);
        setAdaApiKey(defaultAdaApiKey);
        initialConfig = {};
      }

      // Reset config fields dựa trên initialType và initialIsSensor
      // (Logic này giữ nguyên, chỉ cần đảm bảo initialType đúng)
      if (initialType === 'TEMP') {
          setMinTemp(String(initialConfig.min_temp ?? ''));
          setMaxTemp(String(initialConfig.max_temp ?? ''));
          setLightThreshold('');
      } else if (initialType === 'LIGHT') {
          setLightThreshold(String(initialConfig.light_threshold ?? ''));
          setMinTemp('');
          setMaxTemp('');
      } else {
          setMinTemp(''); setMaxTemp(''); setLightThreshold('');
      }

      // Reset các state UI
      setIsLoading(false);
      setError(null);
      setConfigErrors({});
      setFormTouched(false);
      setActiveField(null);
      setShowPassword(false);
    }
  }, [isOpen, isEditing, initialData, defaultAdaUsername, defaultAdaApiKey]);

   // Effect dọn dẹp config fields khi type HOẶC isSensor thay đổi TRONG KHI THÊM MỚI
   useEffect(() => {
    if (isOpen && !isEditing) {
        // Nếu chuyển sang TEMP, xóa config LIGHT
        if (type === 'TEMP') {
            setLightThreshold('');
        }
        // Nếu chuyển sang LIGHT, xóa config TEMP
        else if (type === 'LIGHT') {
            setMinTemp('');
            setMaxTemp('');
        }
        // Nếu chuyển sang Sensor, xóa config LIGHT (vì sensor ánh sáng không có ngưỡng)
        // Sensor nhiệt độ vẫn giữ min/max
        if (isSensor && type === 'LIGHT') {
             setLightThreshold('');
        }

        // Nếu không phải Sensor (là Device), thì phải có State
        // Nếu là Sensor, không cần State (có thể ẩn đi)
        // State 'ON'/'OFF' không cần xóa khi đổi type/isSensor, chỉ ẩn/hiện UI

        setConfigErrors({}); // Reset lỗi config khi đổi type/isSensor
    }
}, [type, isSensor, isOpen, isEditing]); // Thêm isSensor vào dependency


  // --- Validation ---
  // (validateBasicForm giữ nguyên)
   const validateBasicForm = (): boolean => {
       let isValid = true;
       if (!feed.trim()) isValid = false;
       if (!adaUsername.trim()) isValid = false;
       if (!adaApiKey.trim()) isValid = false;
       return isValid;
   };

  // (validateAndBuildConfig giữ nguyên, vì nó dựa trên type và các giá trị config)
   const validateAndBuildConfig = useCallback((): { config: Record<string, string>; errors: { [key: string]: string } } => {
    const currentErrors: { [key: string]: string } = {};
    const configData: Record<string, string> = {};
    let minTempValue: number | undefined = undefined;
    let maxTempValue: number | undefined = undefined;

    // Chỉ validate config nếu là Sensor và Type là TEMP, hoặc nếu là Device (ko phải sensor)
    // Vì Sensor LIGHT thường không có config min/max/threshold
    if ((isSensor && type === 'TEMP') || !isSensor) {
        if (type === 'TEMP') {
            // Validate Min Temp
            if (minTemp.trim() !== '') {
                const min = parseFloat(minTemp);
                if (isNaN(min)) {
                    currentErrors.minTemp = 'Min temp must be a number.';
                } else {
                    configData.min_temp = minTemp.trim();
                    minTempValue = min;
                }
            }
            // Validate Max Temp
            if (maxTemp.trim() !== '') {
                const max = parseFloat(maxTemp);
                if (isNaN(max)) {
                    currentErrors.maxTemp = 'Max temp must be a number.';
                } else {
                    configData.max_temp = maxTemp.trim();
                    maxTempValue = max;
                }
            }
            // Validate Min < Max
            if (minTempValue !== undefined && maxTempValue !== undefined) {
                if (minTempValue >= maxTempValue) {
                    currentErrors.maxTemp = 'Max temp must be greater than min temp.';
                    delete configData.min_temp; // Xóa khỏi config nếu logic sai
                    delete configData.max_temp;
                }
            }
        } else if (type === 'LIGHT' && !isSensor) { // Chỉ validate threshold cho Light Device
            // Validate Light Threshold
            if (lightThreshold.trim() !== '') {
                const threshold = parseFloat(lightThreshold);
                if (isNaN(threshold)) {
                    currentErrors.lightThreshold = 'Threshold must be a number.';
                } else if (threshold < 0) {
                    currentErrors.lightThreshold = 'Threshold cannot be negative.';
                } else {
                    configData.light_threshold = lightThreshold.trim();
                }
            }
        }
    } // End if validate config

    setConfigErrors(currentErrors);
    return { config: configData, errors: currentErrors };
}, [type, isSensor, minTemp, maxTemp, lightThreshold]); // Thêm isSensor


  // --- Event Handlers ---
  // (handleFocus, handleBlur, togglePasswordVisibility, getTypeIcon giữ nguyên)
   const handleFocus = (fieldName: string) => { setActiveField(fieldName); };
   const handleBlur = () => { setActiveField(null); };
   const togglePasswordVisibility = () => { setShowPassword(!showPassword); };
   const getTypeIcon = (deviceType: 'TEMP' | 'LIGHT'): React.ReactNode => {
       return deviceType === 'TEMP' ? (
           <Thermometer size={18} className="text-blue-500" />
       ) : (
           <Lightbulb size={18} className="text-yellow-500" />
       );
   };

  // Xử lý khi submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormTouched(true);

    const basicValid = validateBasicForm();
    const { config: finalDeviceConfig, errors: configValidationErrors } = validateAndBuildConfig();

    if (!basicValid || Object.keys(configValidationErrors).length > 0) {
      console.error("Validation Failed:", { basicValid, configValidationErrors });
      setError("Please fix the errors highlighted in the form.");
      return;
    }

    setIsLoading(true);
    const deviceDataPayload: DeviceDTO = {
      ...(isEditing && initialData && { id: initialData.id }),
      feed: feed.trim(),
      type,
      // --- THAY ĐỔI: Chỉ gửi state nếu là Device ---
      state: !isSensor ? state : 'OFF', // Gửi state đã chọn nếu là Device, gửi OFF (hoặc null tùy backend) nếu là Sensor
      // --------------------------------------------
      adaUsername: adaUsername.trim(),
      adaApikey: adaApiKey.trim(),
      // --- THAY ĐỔI: Lấy isSensor trực tiếp từ state ---
      isSensor: isSensor, // Gửi giá trị true/false từ state isSensor
      // -----------------------------------------------
      // Chỉ gửi deviceConfig nếu nó không rỗng
      deviceConfig: Object.keys(finalDeviceConfig).length > 0 ? finalDeviceConfig : {},
    };

    console.log("--- Submitting Payload ---");
    console.log(JSON.stringify(deviceDataPayload, null, 2));

    const apiCall = isEditing
        ? apiClient.put(`/devices/${initialData!.id}`, deviceDataPayload)
        : apiClient.post('/devices', deviceDataPayload);

    const failureMessagePrefix = isEditing ? 'Failed to update device' : 'Failed to add device';

    try {
      const response = await apiCall;
      console.log("API Response:", response.data);
      await onSuccess();
    } catch (err: unknown) {
      console.error(`${failureMessagePrefix}:`, err);
      let specificErrorMessage = "An unexpected error occurred. Check console for details.";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const responseData = err.response.data;
          specificErrorMessage = responseData?.message || responseData?.errorMessage || JSON.stringify(responseData);
          console.error("Backend Error Response:", responseData);
        } else if (err.request) {
          specificErrorMessage = "Could not connect to the server. Please check your network or contact support.";
        } else {
          specificErrorMessage = `Error setting up request: ${err.message}`;
        }
      } else if (err instanceof Error) {
        specificErrorMessage = err.message;
      }
      setError(`${failureMessagePrefix}. Error: ${specificErrorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Render Logic ---
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative pb-2">
        {/* --- Nút Close --- */}
        <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute -top-2 -right-2 p-1 rounded-full text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close modal"
        >
            <X size={18} />
        </button>

        {/* --- Header --- */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
              <Server size={24} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800" id="modal-title">
              {isEditing ? "Edit Device" : "Add New Device"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
              {isEditing ? "Update the device configuration and credentials." : "Configure a new IoT device and link it to Adafruit IO."}
          </p>
        </div>

        {/* --- Hiển thị lỗi chung --- */}
        {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
                <AlertCircle size={18} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 break-words">{error}</p>
            </div>
        )}

        {/* --- Form --- */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* --- HƯỚNG DẪN ADAFRUIT IO (Chỉ khi thêm mới) --- */}
          {/* (Giữ nguyên phần hướng dẫn) */}
          {!isEditing && (
                <div className="mb-5 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-md text-sm text-blue-800">
                    <h4 className="font-semibold mb-1.5 flex items-center">
                         <Info size={16} className="mr-1.5" /> Important Steps:
                     </h4>
                     <ol className="list-decimal list-inside space-y-1">
                         <li>Visit <a href="https://io.adafruit.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600">Adafruit IO <ExternalLink size={12} className="inline mb-0.5"/></a> and log in or create an account.</li>
                         <li>Go to <strong className="font-medium">Feeds</strong> and create a <strong className="font-medium">New Feed</strong>. Note down the exact <strong className="font-medium">Feed Key</strong> (usually similar to the name, e.g., <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">my-light</code>).</li>
                         <li>Click on <strong className="font-medium">My Key</strong> (top right) to find your <strong className="font-medium">Adafruit Username</strong> and active <strong className="font-medium">AIO Key</strong>.</li>
                         <li>Enter the <strong className="font-medium">Feed Key</strong>, <strong className="font-medium">Username</strong>, and <strong className="font-medium">AIO Key</strong> in the fields below.</li>
                     </ol>
                 </div>
             )}

          {/* === Feed Name === */}
          {/* (Giữ nguyên Feed Name) */}
           <div>
                 <label htmlFor="feed" className={`block text-sm font-medium mb-1 ${activeField === 'feed' ? 'text-indigo-600' : 'text-gray-700'}`}>
                     Feed Key <span className="text-red-500">*</span>
                 </label>
                 <div className="relative">
                     <input
                         type="text"
                         id="feed"
                         value={feed}
                         onChange={(e) => { setFeed(e.target.value); if (formTouched) setError(null); }}
                         onFocus={() => handleFocus('feed')}
                         onBlur={handleBlur}
                         required
                         className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm ${activeField === 'feed' ? 'border-indigo-500 ring-1 ring-indigo-500' : formTouched && !feed.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' } transition-all duration-200`}
                         placeholder="e.g., living-room-light"
                         disabled={isLoading}
                     />
                     {formTouched && !feed.trim() && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><AlertCircle size={16} className="text-red-500" /></div>}
                 </div>
                 {formTouched && !feed.trim() && <p className="mt-1 text-xs text-red-600">Feed key is required.</p>}
                 <p className="mt-1 text-xs text-gray-500">Must exactly match the Feed Key created on Adafruit IO.</p>
             </div>

          {/* === THAY ĐỔI: Grid cho Category, Type, State === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* --- Device Category (isSensor) --- */}
              <div>
                  <label htmlFor="isSensor" className={`block text-sm font-medium mb-1 ${activeField === 'isSensor' ? 'text-indigo-600' : 'text-gray-700'}`}>
                      Device Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                      <select
                          id="isSensor"
                          value={isSensor ? 'true' : 'false'}
                          onChange={(e) => { setIsSensor(e.target.value === 'true'); setFormTouched(false); setError(null); }} // Reset touch/error khi đổi
                          onFocus={() => handleFocus('isSensor')}
                          onBlur={handleBlur}
                          required
                          // --- THAY ĐỔI: Sử dụng class Tailwind và disable khi edit ---
                          className={`block w-full pl-3 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none ${activeField === 'isSensor' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} transition-all duration-200 ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          disabled={isLoading || isEditing} // Disable khi loading hoặc đang edit
                      >
                          <option value="true">Sensor (Reads data)</option>
                          <option value="false">Device (Controls state)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-gray-500" /></div>
                  </div>
                  {isEditing && <p className="mt-1 text-xs text-orange-600">Device category cannot be changed after creation.</p> }
                  {!isEditing && <p className="mt-1 text-xs text-gray-500">{isSensor ? 'Reports measurements' : 'Can be turned ON/OFF'}</p>}
              </div>


              {/* --- Device Type (Temp/Light) --- */}
              <div>
                  <label htmlFor="type" className={`block text-sm font-medium mb-1 ${activeField === 'type' ? 'text-indigo-600' : 'text-gray-700'}`}>
                      Measurement/Control Type
                      <span className="ml-1 inline-flex items-center" title={ isSensor ? "What does this sensor measure?" : "What does this device control?"}>
                           <HelpCircle size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                      </span>
                    </label>
                  <div className="relative">
                      <select
                          id="type"
                          value={type}
                          onChange={(e) => { setType(e.target.value as 'TEMP' | 'LIGHT'); setFormTouched(false); setError(null); }}
                          onFocus={() => handleFocus('type')}
                          onBlur={handleBlur}
                          className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none ${activeField === 'type' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} transition-all duration-200 ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          disabled={isLoading || isEditing} // Disable nếu đang edit
                      >
                          <option value="TEMP">Temperature</option>
                          <option value="LIGHT">Light</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{getTypeIcon(type)}</div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-gray-500" /></div>
                  </div>
                   {isEditing && <p className="mt-1 text-xs text-orange-600">Measurement/Control type cannot be changed.</p> }
                   {!isEditing && <p className="mt-1 text-xs text-gray-500">{type === 'TEMP' ? (isSensor ? 'Monitors temperature' : 'Controls temperature system') : (isSensor ? 'Monitors light level' : 'Controls a light')}</p>}
              </div>


              {/* --- State (ON/OFF) - THAY ĐỔI: Chỉ hiện khi là Device --- */}
              {!isSensor && (
                  <div>
                      <label htmlFor="state" className={`block text-sm font-medium mb-1 ${activeField === 'state' ? 'text-indigo-600' : 'text-gray-700'}`}>Initial State</label>
                      <div className="relative">
                          <select
                              id="state"
                              value={state}
                              onChange={(e) => { setState(e.target.value as 'ON' | 'OFF'); if (formTouched) setError(null);}}
                              onFocus={() => handleFocus('state')}
                              onBlur={handleBlur}
                              className={`block w-full pl-3 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none ${activeField === 'state' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} transition-all duration-200`}
                              disabled={isLoading}
                          >
                              <option value="OFF">OFF</option>
                              <option value="ON">ON</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-gray-500" /></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{state === 'ON' ? 'Device will start in ON state' : 'Device will start in OFF state'}</p>
                  </div>
              )}
              {/* ----------------------------------------------------- */}

          </div> {/* Kết thúc grid */}


          {/* === Device Configuration Section === */}
          {/* (Giữ nguyên logic hiển thị config dựa trên type, nhưng chỉ hiển thị nếu là TEMP Sensor hoặc là Device) */}
           <div className="pt-4 mt-4 border-t border-gray-200">
                 <h4 className="text-sm font-medium text-gray-500 mb-3">Device Configuration (Optional)</h4>

                 {/* Chỉ hiển thị config khi là Sensor Nhiệt độ HOẶC là Device (Bất kể Type) */}
                 {(isSensor && type === 'TEMP') || !isSensor ? (
                     <>
                         {/* Config for TEMP (Hiển thị nếu Type là TEMP) */}
                         {type === 'TEMP' && (
                             <div className="space-y-3 mb-3"> {/* Thêm mb-3 nếu có config LIGHT bên dưới */}
                                 {/* Min Temp Input */}
                                 <div>
                                     <label htmlFor="minTemp" className={`block text-sm font-medium mb-1 ${activeField === 'minTemp' ? 'text-indigo-600' : 'text-gray-700'}`}>Min Temperature (°C)</label>
                                     <input
                                         type="number" step="any" id="minTemp" name="minTemp"
                                         value={minTemp}
                                         onChange={(e) => { setMinTemp(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null); }}
                                         onBlur={handleBlur} onFocus={() => handleFocus('minTemp')}
                                         className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.minTemp ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                         placeholder="e.g., 0" disabled={isLoading}
                                     />
                                     {configErrors.minTemp && <p className="mt-1 text-xs text-red-600">{configErrors.minTemp}</p>}
                                 </div>
                                 {/* Max Temp Input */}
                                  <div>
                                     <label htmlFor="maxTemp" className={`block text-sm font-medium mb-1 ${activeField === 'maxTemp' ? 'text-indigo-600' : 'text-gray-700'}`}>Max Temperature (°C)</label>
                                     <input
                                         type="number" step="any" id="maxTemp" name="maxTemp"
                                         value={maxTemp}
                                         onChange={(e) => { setMaxTemp(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null); }}
                                         onBlur={handleBlur} onFocus={() => handleFocus('maxTemp')}
                                         className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.maxTemp ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                         placeholder="e.g., 40" disabled={isLoading}
                                     />
                                     {configErrors.maxTemp && <p className="mt-1 text-xs text-red-600">{configErrors.maxTemp}</p>}
                                 </div>
                             </div>
                         )}

                         {/* Config for LIGHT (Hiển thị nếu Type là LIGHT VÀ LÀ DEVICE) */}
                         {type === 'LIGHT' && !isSensor && (
                             <div>
                                 <label htmlFor="lightThreshold" className={`block text-sm font-medium mb-1 ${activeField === 'lightThreshold' ? 'text-indigo-600' : 'text-gray-700'}`}>Light Threshold</label>
                                 <input
                                     type="number" step="any" id="lightThreshold" name="lightThreshold"
                                     value={lightThreshold}
                                     onChange={(e) => { setLightThreshold(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null); }}
                                     onBlur={handleBlur} onFocus={() => handleFocus('lightThreshold')}
                                     className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.lightThreshold ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                     placeholder="e.g., 50 (unit depends on sensor)" disabled={isLoading}
                                 />
                                 {configErrors.lightThreshold && <p className="mt-1 text-xs text-red-600">{configErrors.lightThreshold}</p>}
                                  <p className="mt-1 text-xs text-gray-500">Define a threshold value for light-based automation (if applicable).</p>
                             </div>
                         )}
                     </>
                 ) : (
                     /* Fallback nếu là Sensor mà không phải TEMP */
                     isSensor && type !== 'TEMP' && (
                        <p className="text-sm text-gray-500 italic">No specific configuration available for this sensor type.</p>
                     )
                 )}
             </div>


          {/* === Adafruit IO Credentials Section === */}
          {/* (Giữ nguyên) */}
           <div className="pt-5 mt-5 border-t border-gray-200">
                 <div className="flex items-center mb-4">
                     <div className="flex-grow border-t border-gray-200"></div>
                     <span className="flex-shrink-0 px-3 text-sm font-medium text-gray-500">Adafruit IO Credentials</span>
                     <div className="flex-grow border-t border-gray-200"></div>
                 </div>
                 {/* Username */}
                 <div className="mb-4">
                      <label htmlFor="adaUsername" className={`block text-sm font-medium mb-1 ${activeField === 'adaUsername' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          Adafruit Username <span className="text-red-500">*</span>
                         <span className="ml-1 inline-flex items-center" title="Your Adafruit IO username">
                              <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                         </span>
                      </label>
                     <div className="relative">
                         <input
                             type="text" id="adaUsername" value={adaUsername}
                             onChange={(e) => { setAdaUsername(e.target.value); if (formTouched) setError(null);}}
                             onFocus={() => handleFocus('adaUsername')} onBlur={handleBlur} required
                             className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm ${activeField === 'adaUsername' ? 'border-indigo-500 ring-1 ring-indigo-500' : formTouched && !adaUsername.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' } transition-all duration-200`}
                             placeholder="Your Adafruit Username" disabled={isLoading}
                         />
                         {formTouched && !adaUsername.trim() && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><AlertCircle size={16} className="text-red-500" /></div>}
                     </div>
                     {formTouched && !adaUsername.trim() && <p className="mt-1 text-xs text-red-600">Adafruit username is required.</p>}
                 </div>
                 {/* API Key */}
                  <div>
                      <label htmlFor="adaApiKey" className={`block text-sm font-medium mb-1 ${activeField === 'adaApiKey' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          Adafruit IO Key <span className="text-red-500">*</span>
                         <span className="ml-1 inline-flex items-center" title="Your Adafruit IO API Key (AIO Key)">
                              <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                         </span>
                      </label>
                     <div className="relative">
                         <input
                             type={showPassword ? "text" : "password"} id="adaApiKey" value={adaApiKey}
                             onChange={(e) => { setAdaApiKey(e.target.value); if (formTouched) setError(null);}}
                             onFocus={() => handleFocus('adaApiKey')} onBlur={handleBlur} required
                             className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm pr-10 ${activeField === 'adaApiKey' ? 'border-indigo-500 ring-1 ring-indigo-500' : formTouched && !adaApiKey.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' } transition-all duration-200`}
                             placeholder="Your Adafruit IO Key" disabled={isLoading} autoComplete="new-password"
                         />
                         <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none" onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide API Key" : "Show API Key"} tabIndex={-1}>
                             {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                         {formTouched && !adaApiKey.trim() && <div className="absolute inset-y-0 right-10 flex items-center pr-1 pointer-events-none"><AlertCircle size={16} className="text-red-500" /></div>}
                     </div>
                     {formTouched && !adaApiKey.trim() && <p className="mt-1 text-xs text-red-600">Adafruit API Key is required.</p>}
                 </div>
             </div>

          {/* === Action Buttons === */}
          {/* (Giữ nguyên) */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 space-y-3 space-y-reverse sm:space-y-0 pt-6">
                 <button
                     type="button" onClick={onClose} disabled={isLoading}
                     className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50"
                 >
                     Cancel
                 </button>
                 <button
                     type="submit" disabled={isLoading}
                     className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors duration-200"
                 >
                     {isLoading ? ( /* Spinner SVG */ <>...</> ) : ( <> <Save size={16} className="-ml-0.5 mr-2" /> {isEditing ? 'Save Changes' : 'Add Device'} </> )}
                 </button>
             </div>

        </form>
      </div>
    </Modal>
  );
};

export default AddEditDeviceModal;