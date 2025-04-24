// app/(protected)/manage-devices/components/AddEditDeviceModal.tsx
// (Giả sử đường dẫn này, bạn cần điều chỉnh nếu khác)

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Modal from '@/components/ui/Modal'; // Component Modal gốc
import { Device, DeviceDTO } from '@/lib/types';
import apiClient from '@/lib/apiClient';
import axios from 'axios'; // Để kiểm tra lỗi axios
import { Save, X, AlertCircle, Server, ChevronDown, Eye, EyeOff, Info, Thermometer, Lightbulb, ExternalLink } from 'lucide-react';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>; // Callback khi thành công (để component cha refresh)
  initialData?: Device | null;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, onSuccess, initialData, defaultAdaUsername, defaultAdaApiKey
}) => {
  // --- State Variables ---
  const [feed, setFeed] = useState('');
  const [type, setType] = useState<'TEMP' | 'LIGHT'>('TEMP');
  const [state, setState] = useState<'ON' | 'OFF'>('OFF');
  const [adaUsername, setAdaUsername] = useState('');
  const [adaApiKey, setAdaApiKey] = useState('');
  // Config states
  const [minTemp, setMinTemp] = useState<string>('');
  const [maxTemp, setMaxTemp] = useState<string>('');
  const [lightThreshold, setLightThreshold] = useState<string>('');
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Lỗi chung của form hoặc lỗi từ API
  const [configErrors, setConfigErrors] = useState<{ [key: string]: string }>({}); // Lỗi riêng cho phần config
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false); // Để hiển thị lỗi validation cơ bản khi người dùng tương tác

  const isEditing = !!initialData;

  // --- Effects ---

  // Effect khởi tạo/reset form khi modal mở hoặc initialData thay đổi
  useEffect(() => {
    if (isOpen) {
      let initialConfig: Record<string, string | number> = {}; // Specify string or number as the value type
      let initialType: 'TEMP' | 'LIGHT' = 'TEMP';

      if (isEditing && initialData) {
        // Chế độ Edit: Load dữ liệu từ initialData
        setFeed(initialData.feed);
        initialType = initialData.type === 'LIGHT' ? 'LIGHT' : 'TEMP'; // Xác định type ban đầu
        setType(initialType);
        setState(initialData.state);
        setAdaUsername(initialData.adaUsername);
        setAdaApiKey(initialData.adaApikey);
        initialConfig = Object.fromEntries(
          Object.entries(initialData.deviceConfig || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value,
          ])
        ); // Lấy config đã lưu
      } else {
        // Chế độ Add: Reset về mặc định
        setFeed('');
        initialType = 'TEMP'; // Mặc định là TEMP khi thêm mới
        setType('TEMP');
        setState('OFF');
        setAdaUsername(defaultAdaUsername);
        setAdaApiKey(defaultAdaApiKey);
        initialConfig = {};
      }

      // Reset và set giá trị config dựa trên initialType và initialConfig
      if (initialType === 'TEMP') {
        setMinTemp(String(initialConfig.min_temp ?? ''));
        setMaxTemp(String(initialConfig.max_temp ?? ''));
        setLightThreshold(''); // Dọn dẹp trường không liên quan
      } else if (initialType === 'LIGHT') {
        setLightThreshold(String(initialConfig.light_threshold ?? ''));
        setMinTemp(''); // Dọn dẹp trường không liên quan
        setMaxTemp(''); // Dọn dẹp trường không liên quan
      } else {
        // Trường hợp type khác (nếu có)
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

  // Effect dọn dẹp config fields khi type thay đổi TRONG KHI THÊM MỚI
  // (Không chạy khi đang edit để tránh mất dữ liệu nếu người dùng đổi type nhầm)
  useEffect(() => {
     if (isOpen && !isEditing) { // Chỉ chạy khi đang mở và ở chế độ Add
        if (type === 'TEMP') {
             setLightThreshold(''); // Xóa config của LIGHT
        } else if (type === 'LIGHT') {
             setMinTemp(''); // Xóa config của TEMP
             setMaxTemp(''); // Xóa config của TEMP
        }
        setConfigErrors({}); // Reset lỗi config khi đổi type
     }
  }, [type, isOpen, isEditing]); // Phụ thuộc vào type, isOpen, isEditing


  // --- Validation ---

  // Validate các trường cơ bản (không phải config)
  const validateBasicForm = (): boolean => {
    let isValid = true;
    if (!feed.trim()) {
      // Không set lỗi ở đây nữa, để UI tự hiển thị dựa trên formTouched
      isValid = false;
    }
    if (!adaUsername.trim()) {
      isValid = false;
    }
    if (!adaApiKey.trim()) {
      isValid = false;
    }
    // Không set lỗi chung ở đây nữa, chỉ trả về true/false
    return isValid;
  };

  // Validate các trường config và xây dựng object config hợp lệ
  const validateAndBuildConfig = useCallback((): { config: Record<string, string>; errors: { [key: string]: string } } => {
    const currentErrors: { [key: string]: string } = {};
    const configData: Record<string, string> = {};
    let minTempValue: number | undefined = undefined;
    let maxTempValue: number | undefined = undefined;

    console.log("Validating config for type:", type); // Log để debug

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
        // Validate Min < Max (chỉ khi cả 2 đều là số hợp lệ)
        if (minTempValue !== undefined && maxTempValue !== undefined) {
            if (minTempValue >= maxTempValue) {
                 // Chỉ đặt lỗi nếu cả 2 đều hợp lệ nhưng min >= max
                currentErrors.maxTemp = 'Max temp must be greater than min temp.';
                // Xóa khỏi config data nếu logic min/max sai
                delete configData.min_temp;
                delete configData.max_temp;
            }
        }

    } else if (type === 'LIGHT') {
        // Validate Light Threshold
        if (lightThreshold.trim() !== '') {
            const threshold = parseFloat(lightThreshold);
            if (isNaN(threshold)) {
                currentErrors.lightThreshold = 'Threshold must be a number.';
            } else if (threshold < 0) {
                currentErrors.lightThreshold = 'Threshold cannot be negative.';
            } else {
                // Hợp lệ
                configData.light_threshold = lightThreshold.trim();
            }
        }
    }

    console.log("Validation result - Config Data:", configData, "Errors:", currentErrors); // Log để debug
    setConfigErrors(currentErrors); // Cập nhật state lỗi config cho UI
    return { config: configData, errors: currentErrors }; // Trả về cả config và lỗi

  }, [type, minTemp, maxTemp, lightThreshold]); // Dependencies cho useCallback


  // --- Event Handlers ---

  const handleFocus = (fieldName: string) => { setActiveField(fieldName); };
  const handleBlur = () => {
      setActiveField(null);
      // Có thể gọi validate config ở đây nếu muốn validate ngay khi blur
      // validateAndBuildConfig();
  };
  const togglePasswordVisibility = () => { setShowPassword(!showPassword); };

  // Hàm lấy icon dựa trên type
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
    setError(null); // Reset lỗi chung trước mỗi lần submit
    setFormTouched(true); // Đánh dấu là đã cố submit để hiển thị lỗi basic validation

    // 1. Validate basic fields
    const basicValid = validateBasicForm();

    // 2. Validate config fields và lấy kết quả
    // Gọi lại validate để đảm bảo lấy config và error mới nhất
    const { config: finalDeviceConfig, errors: configValidationErrors } = validateAndBuildConfig();

    // 3. Kiểm tra tổng thể validation
    if (!basicValid || Object.keys(configValidationErrors).length > 0) {
        console.error("Validation Failed:", { basicValid, configValidationErrors });
        // Không set lỗi chung ở đây nữa, UI sẽ tự hiển thị lỗi chi tiết từ state `configErrors`
        // và các trường basic sẽ có viền đỏ do `formTouched`
        setError("Please fix the errors highlighted in the form."); // Có thể thêm lỗi chung nếu muốn
        return; // Dừng submit
    }

    // 4. Tạo payload nếu validation thành công
    setIsLoading(true);
    const deviceDataPayload: DeviceDTO = {
        // ID chỉ có khi edit
        ...(isEditing && initialData && { id: initialData.id }),
        feed: feed.trim(),
        type,
        state,
        adaUsername: adaUsername.trim(),
        adaApikey: adaApiKey.trim(),
        isSensor: type === 'TEMP', // isSensor dựa trên type
        // Chỉ gửi deviceConfig nếu nó không rỗng
        deviceConfig: Object.keys(finalDeviceConfig).length > 0 ? finalDeviceConfig : {},
    };

    console.log("--- Submitting Payload ---");
    console.log(JSON.stringify(deviceDataPayload, null, 2)); // Log payload cuối cùng rõ ràng

    // 5. Gọi API (POST hoặc PUT)
    const apiCall = isEditing
        ? apiClient.put(`/devices/${initialData!.id}`, deviceDataPayload)
        : apiClient.post('/devices', deviceDataPayload);

    const failureMessagePrefix = isEditing ? 'Failed to update device' : 'Failed to add device';

    try {
        const response = await apiCall; // Chờ API call hoàn thành
        console.log("API Response:", response.data); // Log response thành công
        // Gọi onSuccess để báo cho component cha (đóng modal, refresh list)
        await onSuccess();
        // Không cần toast ở đây, component cha sẽ xử lý sau khi onSuccess

    } catch (err: unknown) {
        console.error(`${failureMessagePrefix}:`, err); // Log lỗi chi tiết

        // Xử lý và hiển thị lỗi từ backend hoặc lỗi mạng
        let specificErrorMessage = "An unexpected error occurred. Check console for details.";
        if (axios.isAxiosError(err)) { // Kiểm tra nếu là lỗi từ Axios (backend)
             if (err.response) {
                // Ưu tiên lấy lỗi từ cấu trúc data trả về của backend
                const responseData = err.response.data;
                specificErrorMessage = responseData?.message || responseData?.errorMessage || JSON.stringify(responseData);
                console.error("Backend Error Response:", responseData);
             } else if (err.request) {
                 // Lỗi không nhận được response (mạng, CORS, server không chạy...)
                 specificErrorMessage = "Could not connect to the server. Please check your network or contact support.";
             } else {
                 // Lỗi khi thiết lập request
                 specificErrorMessage = `Error setting up request: ${err.message}`;
             }
        } else if (err instanceof Error) { // Lỗi JavaScript khác
             specificErrorMessage = err.message;
        }

        // Hiển thị lỗi cụ thể này trong modal
        setError(`${failureMessagePrefix}. Error: ${specificErrorMessage}`);

    } finally {
        setIsLoading(false); // Luôn tắt loading dù thành công hay thất bại
    }
  };


  // --- Render Logic ---
  // Phần JSX giữ nguyên cấu trúc như bạn đã cung cấp, chỉ cần đảm bảo các classname và binding đúng
  // Các phần quan trọng cần kiểm tra trong JSX:
  // - Input `feed`, `adaUsername`, `adaApiKey`: class được cập nhật dựa trên `formTouched` và giá trị rỗng.
  // - Select `type`: `onChange` cập nhật state `type`.
  // - Select `state`: `onChange` cập nhật state `state`.
  // - Phần Device Configuration: Hiển thị đúng input (`minTemp`/`maxTemp` hoặc `lightThreshold`) dựa trên state `type`. Các input này hiển thị lỗi từ state `configErrors`.
  // - Nút Submit: `onSubmit={handleSubmit}` được gán cho thẻ `<form>`.

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
                      <p className="text-sm text-red-700 break-words">{error}</p> {/* Thêm break-words */}
                  </div>
              )}

              {/* --- Form --- */}
              <form onSubmit={handleSubmit} className="space-y-5">

                  {/* === HƯỚNG DẪN ADAFRUIT IO (Chỉ khi thêm mới) === */}
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
                  <div>
                      <label htmlFor="feed" className={`block text-sm font-medium mb-1 ${activeField === 'feed' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          Feed Key <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                          <input
                              type="text"
                              id="feed"
                              value={feed}
                              onChange={(e) => { setFeed(e.target.value); if (formTouched) setError(null); }} // Xóa lỗi chung khi người dùng sửa
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

                  {/* === Type & State Grid === */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* --- Type --- */}
                      <div>
                          <label htmlFor="type" className={`block text-sm font-medium mb-1 ${activeField === 'type' ? 'text-indigo-600' : 'text-gray-700'}`}>Device Type</label>
                          <div className="relative">
                              <select
                                  id="type"
                                  value={type}
                                  // Khi đổi type, setFormTouched về false để không hiện lỗi config ngay lập tức nếu chưa nhập gì
                                  onChange={(e) => { setType(e.target.value as 'TEMP' | 'LIGHT'); setFormTouched(false); setError(null); }}
                                  onFocus={() => handleFocus('type')}
                                  onBlur={handleBlur}
                                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none ${activeField === 'type' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} transition-all duration-200`}
                                  disabled={isLoading || isEditing} // Disable nếu đang edit để tránh nhầm lẫn
                              >
                                  <option value="TEMP">Temperature Sensor</option>
                                  <option value="LIGHT">Light Control</option>
                                  {/* Thêm các loại khác nếu cần */}
                              </select>
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{getTypeIcon(type)}</div>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><ChevronDown size={16} className="text-gray-500" /></div>
                          </div>
                           {isEditing && <p className="mt-1 text-xs text-orange-600">Device type cannot be changed after creation.</p> }
                          {!isEditing && <p className="mt-1 text-xs text-gray-500">{type === 'TEMP' ? 'Monitors temperature' : 'Controls ON/OFF state'}</p>}
                      </div>
                      {/* --- State --- */}
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
                  </div>

                  {/* === Device Configuration Section === */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Device Configuration (Optional)</h4>
                      {/* --- Config for TEMP --- */}
                      {type === 'TEMP' && (
                          <div className="space-y-3">
                              <div>
                                  <label htmlFor="minTemp" className={`block text-sm font-medium mb-1 ${activeField === 'minTemp' ? 'text-indigo-600' : 'text-gray-700'}`}>Min Temperature (°C)</label>
                                  <input
                                      type="number" // Sử dụng number để có mũi tên tăng giảm (tuỳ trình duyệt)
                                      step="any"    // Cho phép số thập phân
                                      id="minTemp"
                                      name="minTemp"
                                      value={minTemp}
                                      onChange={(e) => { setMinTemp(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null); }} // Validate lại khi thay đổi nếu form đã touched
                                      onBlur={handleBlur}
                                      onFocus={() => handleFocus('minTemp')}
                                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.minTemp ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                      placeholder="e.g., 0"
                                      disabled={isLoading}
                                  />
                                  {configErrors.minTemp && <p className="mt-1 text-xs text-red-600">{configErrors.minTemp}</p>}
                              </div>
                              <div>
                                  <label htmlFor="maxTemp" className={`block text-sm font-medium mb-1 ${activeField === 'maxTemp' ? 'text-indigo-600' : 'text-gray-700'}`}>Max Temperature (°C)</label>
                                  <input
                                      type="number"
                                      step="any"
                                      id="maxTemp"
                                      name="maxTemp"
                                      value={maxTemp}
                                      onChange={(e) => { setMaxTemp(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null);}}
                                      onBlur={handleBlur}
                                      onFocus={() => handleFocus('maxTemp')}
                                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.maxTemp ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                      placeholder="e.g., 40"
                                      disabled={isLoading}
                                  />
                                  {configErrors.maxTemp && <p className="mt-1 text-xs text-red-600">{configErrors.maxTemp}</p>}
                              </div>
                          </div>
                      )}
                      {/* --- Config for LIGHT --- */}
                      {type === 'LIGHT' && (
                          <div>
                              <label htmlFor="lightThreshold" className={`block text-sm font-medium mb-1 ${activeField === 'lightThreshold' ? 'text-indigo-600' : 'text-gray-700'}`}>Light Threshold</label>
                              <input
                                  type="number"
                                  step="any"
                                  id="lightThreshold"
                                  name="lightThreshold"
                                  value={lightThreshold}
                                  onChange={(e) => { setLightThreshold(e.target.value); if (formTouched) validateAndBuildConfig(); setError(null);}}
                                  onBlur={handleBlur}
                                  onFocus={() => handleFocus('lightThreshold')}
                                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${configErrors.lightThreshold ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                  placeholder="e.g., 50 (unit depends on sensor)"
                                  disabled={isLoading}
                              />
                              {configErrors.lightThreshold && <p className="mt-1 text-xs text-red-600">{configErrors.lightThreshold}</p>}
                               <p className="mt-1 text-xs text-gray-500">Define a threshold value for light-based automation (if applicable).</p>
                          </div>
                      )}
                      {/* --- Fallback nếu có type khác --- */}
                      {type !== 'TEMP' && type !== 'LIGHT' && (<p className="text-sm text-gray-500 italic">No specific configuration available for this device type.</p>)}
                  </div>

                  {/* === Adafruit IO Credentials Section === */}
                  <div className="pt-5 mt-5 border-t border-gray-200">
                      <div className="flex items-center mb-4">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink-0 px-3 text-sm font-medium text-gray-500">Adafruit IO Credentials</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                      </div>
                      {/* --- Username --- */}
                      <div className="mb-4">
                           <label htmlFor="adaUsername" className={`block text-sm font-medium mb-1 ${activeField === 'adaUsername' ? 'text-indigo-600' : 'text-gray-700'}`}>
                               Adafruit Username <span className="text-red-500">*</span>
                               <span className="ml-1 inline-flex items-center" title="Your Adafruit IO username">
                                   <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                               </span>
                            </label>
                          <div className="relative">
                              <input
                                  type="text"
                                  id="adaUsername"
                                  value={adaUsername}
                                  onChange={(e) => { setAdaUsername(e.target.value); if (formTouched) setError(null);}}
                                  onFocus={() => handleFocus('adaUsername')}
                                  onBlur={handleBlur}
                                  required
                                  className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm ${activeField === 'adaUsername' ? 'border-indigo-500 ring-1 ring-indigo-500' : formTouched && !adaUsername.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' } transition-all duration-200`}
                                  placeholder="Your Adafruit Username"
                                  disabled={isLoading}
                              />
                              {formTouched && !adaUsername.trim() && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><AlertCircle size={16} className="text-red-500" /></div>}
                          </div>
                          {formTouched && !adaUsername.trim() && <p className="mt-1 text-xs text-red-600">Adafruit username is required.</p>}
                      </div>
                      {/* --- API Key --- */}
                      <div>
                          <label htmlFor="adaApiKey" className={`block text-sm font-medium mb-1 ${activeField === 'adaApiKey' ? 'text-indigo-600' : 'text-gray-700'}`}>
                              Adafruit IO Key <span className="text-red-500">*</span>
                               <span className="ml-1 inline-flex items-center" title="Your Adafruit IO API Key (AIO Key)">
                                   <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                               </span>
                            </label>
                          <div className="relative">
                              <input
                                  type={showPassword ? "text" : "password"}
                                  id="adaApiKey"
                                  value={adaApiKey}
                                  onChange={(e) => { setAdaApiKey(e.target.value); if (formTouched) setError(null);}}
                                  onFocus={() => handleFocus('adaApiKey')}
                                  onBlur={handleBlur}
                                  required
                                  className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm pr-10 ${activeField === 'adaApiKey' ? 'border-indigo-500 ring-1 ring-indigo-500' : formTouched && !adaApiKey.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' } transition-all duration-200`}
                                  placeholder="Your Adafruit IO Key"
                                  disabled={isLoading}
                                  autoComplete="new-password" // Tránh trình duyệt tự điền
                              />
                              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none" onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide API Key" : "Show API Key"} tabIndex={-1}>
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {/* Icon lỗi đặt bên trái nút xem pass */}
                              {formTouched && !adaApiKey.trim() && <div className="absolute inset-y-0 right-10 flex items-center pr-1 pointer-events-none"><AlertCircle size={16} className="text-red-500" /></div>}
                          </div>
                          {formTouched && !adaApiKey.trim() && <p className="mt-1 text-xs text-red-600">Adafruit API Key is required.</p>}
                      </div>
                  </div>

                  {/* === Action Buttons === */}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 space-y-3 space-y-reverse sm:space-y-0 pt-6">
                      <button
                          type="button"
                          onClick={onClose}
                          disabled={isLoading}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50"
                      >
                          Cancel
                      </button>
                      <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors duration-200"
                      >
                          {isLoading ? (
                              <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {isEditing ? 'Saving...' : 'Creating...'}
                              </>
                          ) : (
                              <>
                                  <Save size={16} className="-ml-0.5 mr-2" />
                                  {isEditing ? 'Save Changes' : 'Add Device'}
                              </>
                          )}
                      </button>
                  </div>

              </form>
          </div>
      </Modal>
  );
};

export default AddEditDeviceModal;