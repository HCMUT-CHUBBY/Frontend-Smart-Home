// components/dashboard/AddEditDeviceModal.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '@/components/ui/Modal'; // Component Modal gốc
import { Device, DeviceDTO } from '@/lib/types';
import { Save, X, AlertCircle, Server, ChevronDown, Eye, EyeOff, Info, Thermometer, Lightbulb } from 'lucide-react';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: DeviceDTO) => Promise<void>;
  initialData?: Device | null;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, onSubmit, initialData, defaultAdaUsername, defaultAdaApiKey
}) => {
  // Form fields state
  const [feed, setFeed] = useState('');
  const [type, setType] = useState<'TEMP' | 'LIGHT'>('TEMP');
  const [state, setState] = useState<'ON' | 'OFF'>('OFF');
  const [adaUsername, setAdaUsername] = useState('');
  const [adaApiKey, setAdaApiKey] = useState('');
  const [isSensorValue, setIsSensorValue] = useState(true);
  const [deviceConfigValue, setDeviceConfigValue] = useState({});

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);

  const isEditing = !!initialData;

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        // Fill form with data to edit
        setFeed(initialData.feed);
        setType(initialData.type || 'TEMP');
        setState(initialData.state);
        setAdaUsername(initialData.adaUsername);
        setAdaApiKey(initialData.adaApikey);
        setIsSensorValue(initialData.type === 'TEMP');
        setDeviceConfigValue(initialData.deviceConfig || {});
      } else {
        // Reset form for new device
        setFeed('');
        setType('TEMP');
        setState('OFF');
        setAdaUsername(defaultAdaUsername);
        setAdaApiKey(defaultAdaApiKey);
        setIsSensorValue(true);
        setDeviceConfigValue({});
      }
      setIsLoading(false);
      setError(null);
      setFormTouched(false);
      setActiveField(null);
    }
  }, [isOpen, isEditing, initialData, defaultAdaUsername, defaultAdaApiKey]);

  // Update isSensor when type changes
  useEffect(() => {
    setIsSensorValue(type === 'TEMP');
  }, [type]);

  // Form validation
  const validateForm = (): boolean => {
    if (!feed.trim()) {
      setError("Feed name is required");
      return false;
    }
    if (!adaUsername.trim()) {
      setError("Adafruit Username is required");
      return false;
    }
    if (!adaApiKey.trim()) {
      setError("Adafruit API Key is required");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormTouched(true);
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const deviceDataPayload: DeviceDTO = {
      feed: feed.trim(),
      type,
      state,
      adaUsername: adaUsername.trim(),
      adaApikey: adaApiKey.trim(),
      isSensor: isSensorValue,
      deviceConfig: deviceConfigValue,
    };

    try {
      await onSubmit(deviceDataPayload);
    } catch (err: unknown) {
      const specificError = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(specificError || (err instanceof Error ? err.message : "An unexpected error occurred."));
      console.error("Submit error in modal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Input field focus handlers
  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName);
  };

  const handleBlur = () => {
    setActiveField(null);
    setFormTouched(true);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Get appropriate icon based on device type
  const getTypeIcon = (deviceType: 'TEMP' | 'LIGHT') => {
    return deviceType === 'TEMP' ? 
      <Thermometer size={18} className="text-blue-500" /> : 
      <Lightbulb size={18} className="text-yellow-500" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative pb-2">
        {/* Close button */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close modal"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
            <Server size={24} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? "Edit Device" : "Add New Device"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing 
              ? "Update your device configuration" 
              : "Configure a new IoT device to add to your dashboard"}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
            <AlertCircle size={18} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feed Name */}
          <div>
            <label 
              htmlFor="feed" 
              className={`block text-sm font-medium mb-1 ${
                activeField === 'feed' ? 'text-indigo-600' : 'text-gray-700'
              }`}
            >
              Feed Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="feed"
                value={feed}
                onChange={(e) => {
                  setFeed(e.target.value);
                  setFormTouched(true);
                }}
                onFocus={() => handleFocus('feed')}
                onBlur={handleBlur}
                required
                className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm
                  ${activeField === 'feed' 
                    ? 'border-indigo-500 ring-1 ring-indigo-500' 
                    : formTouched && !feed.trim() 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }
                  transition-all duration-200
                `}
                placeholder="e.g., living_room_light"
                disabled={isLoading}
              />
              {formTouched && !feed.trim() && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
              )}
            </div>
            {formTouched && !feed.trim() && (
              <p className="mt-1 text-xs text-red-600">Feed name is required</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for this device feed on Adafruit IO
            </p>
          </div>

          {/* Type & State - Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Type Selection */}
            <div>
              <label 
                htmlFor="type" 
                className={`block text-sm font-medium mb-1 ${
                  activeField === 'type' ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                Device Type
              </label>
              <div className="relative">
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as 'TEMP' | 'LIGHT');
                    setFormTouched(true);
                  }}
                  onFocus={() => handleFocus('type')}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none
                    ${activeField === 'type' 
                      ? 'border-indigo-500 ring-1 ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }
                    transition-all duration-200
                  `}
                  disabled={isLoading}
                >
                  <option value="TEMP">Temperature Sensor</option>
                  <option value="LIGHT">Light Control</option>
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {getTypeIcon(type)}
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {type === 'TEMP' 
                  ? 'Monitors temperature readings' 
                  : 'Controls lighting state'}
              </p>
            </div>

            {/* State Selection */}
            <div>
              <label 
                htmlFor="state" 
                className={`block text-sm font-medium mb-1 ${
                  activeField === 'state' ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                Initial State
              </label>
              <div className="relative">
                <select
                  id="state"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value as 'ON' | 'OFF');
                    setFormTouched(true);
                  }}
                  onFocus={() => handleFocus('state')}
                  onBlur={handleBlur}
                  className={`block w-full pl-3 pr-10 py-2.5 border rounded-lg shadow-sm appearance-none text-gray-900 sm:text-sm focus:outline-none
                    ${activeField === 'state' 
                      ? 'border-indigo-500 ring-1 ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }
                    transition-all duration-200
                  `}
                  disabled={isLoading}
                >
                  <option value="OFF">OFF</option>
                  <option value="ON">ON</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {state === 'ON' ? 'Device starts in active mode' : 'Device starts in inactive mode'}
              </p>
            </div>
          </div>

          {/* Credentials section with header */}
          <div className="pt-2">
            <div className="flex items-center mb-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 px-3 text-sm font-medium text-gray-500">Adafruit IO Credentials</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Adafruit Username */}
            <div className="mb-4">
              <label 
                htmlFor="adaUsername" 
                className={`block text-sm font-medium mb-1 ${
                  activeField === 'adaUsername' ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                Adafruit Username <span className="text-red-500">*</span>
                <span className="ml-1 inline-flex items-center">
                  <span title="Your Adafruit IO username">
                    <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                  </span>
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="adaUsername"
                  value={adaUsername}
                  onChange={(e) => {
                    setAdaUsername(e.target.value);
                    setFormTouched(true);
                  }}
                  onFocus={() => handleFocus('adaUsername')}
                  onBlur={handleBlur}
                  required
                  className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm
                    ${activeField === 'adaUsername' 
                      ? 'border-indigo-500 ring-1 ring-indigo-500' 
                      : formTouched && !adaUsername.trim() 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }
                    transition-all duration-200
                  `}
                  placeholder="Your Adafruit Username"
                  disabled={isLoading}
                />
                {formTouched && !adaUsername.trim() && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <AlertCircle size={16} className="text-red-500" />
                  </div>
                )}
              </div>
              {formTouched && !adaUsername.trim() && (
                <p className="mt-1 text-xs text-red-600">Adafruit username is required</p>
              )}
            </div>

            {/* Adafruit API Key */}
            <div>
              <label 
                htmlFor="adaApiKey" 
                className={`block text-sm font-medium mb-1 ${
                  activeField === 'adaApiKey' ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                Adafruit IO Key <span className="text-red-500">*</span>
                <span className="ml-1 inline-flex items-center">
                  <span title="Your Adafruit IO API Key">
                    <Info size={14} className="text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
                  </span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="adaApiKey"
                  value={adaApiKey}
                  onChange={(e) => {
                    setAdaApiKey(e.target.value);
                    setFormTouched(true);
                  }}
                  onFocus={() => handleFocus('adaApiKey')}
                  onBlur={handleBlur}
                  required
                  className={`block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none text-gray-900 sm:text-sm pr-10
                    ${activeField === 'adaApiKey' 
                      ? 'border-indigo-500 ring-1 ring-indigo-500' 
                      : formTouched && !adaApiKey.trim() 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }
                    transition-all duration-200
                  `}
                  placeholder="Your Adafruit IO Key"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-indigo-600 transition-colors"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {formTouched && !adaApiKey.trim() && (
                  <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                    <AlertCircle size={16} className="text-red-500" />
                  </div>
                )}
              </div>
              {formTouched && !adaApiKey.trim() && (
                <p className="mt-1 text-xs text-red-600">Adafruit API Key is required</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Your API key will be encrypted and stored securely
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 space-y-3 space-y-reverse sm:space-y-0 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
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
                  <Save size={16} className="mr-2" />
                  {isEditing ? 'Save Changes' : 'Add Device'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md mr-1">Esc</kbd>
            <span>Cancel</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md mr-1">Enter</kbd>
            <span>Submit</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Add keyboard event handlers
const EnhancedAddEditDeviceModal: React.FC<AddEditDeviceModalProps> = (props) => {
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!props.isOpen) return;
    
    // Submit form on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      document.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    }
  }, [props.isOpen]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <AddEditDeviceModal {...props} />;
};

export default EnhancedAddEditDeviceModal;