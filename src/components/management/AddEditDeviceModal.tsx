"use client";

import React, { useState, useEffect, FormEvent} from 'react';
import { Device, DeviceDTO } from '@/lib/types';
import { Save, Info, Server, Eye, EyeOff, Thermometer, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

type DeviceCategory = 'LIGHT_SENSOR' | 'TEMP_SENSOR' | 'LIGHT_ACTUATOR' | 'TEMP_ACTUATOR';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | null;
  initialData?: Device | null;
  onSave: (deviceData: DeviceDTO, mode: 'add' | 'edit') => Promise<void>;
  defaultAdaUsername: string;
  defaultAdaApiKey: string;
}

const deviceCategoryOptions = [
    { id: 'LIGHT_SENSOR', label: 'Light Sensor', icon: Lightbulb },
    { id: 'TEMP_SENSOR', label: 'Temp Sensor', icon: Thermometer },
    { id: 'LIGHT_ACTUATOR', label: 'Light Actuator', icon: Lightbulb },
    { id: 'TEMP_ACTUATOR', label: 'Temp Actuator', icon: Thermometer },
] as const;


const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen, onClose, mode, initialData, onSave, defaultAdaUsername, defaultAdaApiKey
}) => {
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    feed: '',
    adaUsername: defaultAdaUsername,
    adaApiKey: '',
    deviceCategory: 'LIGHT_SENSOR' as DeviceCategory,
    configMin: '',
    configMax: '',
    configLightThreshold: '',
    configInitialState: 'OFF' as 'ON' | 'OFF'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const isEditing = mode === 'edit';

  // --- FORM POPULATION & RESET ---
  useEffect(() => {
    if (isOpen) {
        setError(null);
        if (isEditing && initialData) {
            let category: DeviceCategory = 'LIGHT_SENSOR';
            if (initialData.type === 'LIGHT') category = initialData.isSensor ? 'LIGHT_SENSOR' : 'LIGHT_ACTUATOR';
            else if (initialData.type === 'TEMP') category = initialData.isSensor ? 'TEMP_SENSOR' : 'TEMP_ACTUATOR';
            
            setFormData({
                feed: initialData.feed,
                adaUsername: initialData.adaUsername,
                adaApiKey: '', // Để trống, người dùng có thể nhập để thay đổi
                deviceCategory: category,
                configMin: String(initialData.deviceConfig?.['min_temp'] ?? ''),
                configMax: String(initialData.deviceConfig?.['max_temp'] ?? ''),
                configLightThreshold: String(initialData.deviceConfig?.['light_threshold'] ?? ''),
                configInitialState: initialData.state || 'OFF'
            });
        } else {
            // Reset cho chế độ Add
            setFormData({
                feed: '',
                adaUsername: defaultAdaUsername,
                adaApiKey: defaultAdaApiKey, // Dùng key mặc định cho lần thêm mới
                deviceCategory: 'LIGHT_SENSOR',
                configMin: '', configMax: '', configLightThreshold: '',
                configInitialState: 'OFF'
            });
        }
    }
  }, [isOpen, isEditing, initialData, defaultAdaUsername, defaultAdaApiKey]);


  // --- FORM SUBMISSION ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.feed.trim() || !formData.adaUsername.trim() || (mode === 'add' && !formData.adaApiKey.trim())) {
        setError("Please fill in all required fields.");
        toast.error("Please fill in all required fields.");
        return;
    }
    setError(null);
    setIsLoading(true);

    let type: 'TEMP' | 'LIGHT';
    let isSensor: boolean;
    switch (formData.deviceCategory) {
      case 'LIGHT_SENSOR': type = 'LIGHT'; isSensor = true; break;
      case 'TEMP_SENSOR': type = 'TEMP'; isSensor = true; break;
      case 'LIGHT_ACTUATOR': type = 'LIGHT'; isSensor = false; break;
      case 'TEMP_ACTUATOR': type = 'TEMP'; isSensor = false; break;
      default: type = 'LIGHT'; isSensor = true;
    }

    const deviceDataPayload: DeviceDTO = {
      ...(isEditing && initialData && { id: initialData.id }),
      feed: formData.feed.trim(),
      type: type,
      isSensor: isSensor,
      state: (mode === 'add' && !isSensor) ? formData.configInitialState : (initialData?.state || 'OFF'),
      adaUsername: formData.adaUsername.trim(),
      // Chỉ gửi key nếu có nhập mới (cho edit) hoặc là thêm mới
      ...(formData.adaApiKey.trim() && { adaApikey: formData.adaApiKey.trim() }),
      deviceConfig: {
        ...( (type === 'TEMP') && { min_temp: Number(formData.configMin), max_temp: Number(formData.configMax) }),
        ...( (type === 'LIGHT') && { light_threshold: Number(formData.configLightThreshold) }),
      }
    };

    try {
      await onSave(deviceDataPayload, mode!);
    } catch (err: unknown) {
      const specificError = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(specificError?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // --- RENDER LOGIC ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full max-w-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <Server size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Device' : 'Add New Device'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {isEditing ? `Update configuration for ${initialData?.feed}` : 'Configure a new IoT device for your system'}
                </p>
            </div>
            
            {/* Hướng dẫn Adafruit */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 rounded-r-lg"
            >
                <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300">Quick Guide</h4>
                        <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                            <li>First, go to <a href="https://io.adafruit.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-500">Adafruit IO</a> and create a new Feed.</li>
                            <li>Copy the exact <strong className="text-blue-800 dark:text-blue-200">Feed Name</strong> you just created.</li>
                            <li>Paste the Feed Name into the corresponding field below.</li>
                        </ol>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Device Category Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Device Type*</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {deviceCategoryOptions.map(option => (
                            <button
                                key={option.id}
                                type="button"
                                disabled={isEditing}
                                onClick={() => setFormData(prev => ({...prev, deviceCategory: option.id}))}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                                    formData.deviceCategory === option.id 
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-gray-800/50'
                                } ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <option.icon size={24} className={formData.deviceCategory === option.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
                                <span className="mt-2 text-sm font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Core Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="feed" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Feed Name*</label>
                        <input id="feed" type="text" value={formData.feed} onChange={e => setFormData(p => ({...p, feed: e.target.value}))} required placeholder="e.g., living-room-light" className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label htmlFor="adaUsername" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Adafruit Username*</label>
                        <input id="adaUsername" type="text" value={formData.adaUsername} onChange={e => setFormData(p => ({...p, adaUsername: e.target.value}))} required placeholder="Your Adafruit username" className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="adaApiKey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Adafruit IO Key {mode === 'add' ? '*' : <span className="font-normal text-gray-400">(Leave blank to keep current)</span>}
                    </label>
                    <div className="relative">
                        <input id="adaApiKey" type={showApiKey ? 'text' : 'password'} value={formData.adaApiKey} onChange={e => setFormData(p => ({...p, adaApiKey: e.target.value}))} required={mode === 'add'} placeholder="Enter your Adafruit IO key" className="w-full p-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                
                {/* Conditional Config Fields */}
                <AnimatePresence>
                  {(formData.deviceCategory.includes('TEMP')) && (
                     <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                         <div>
                            <label htmlFor="configMin" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Min Temp (°C)*</label>
                            <input id="configMin" type="number" value={formData.configMin} onChange={e => setFormData(p => ({...p, configMin: e.target.value}))} required placeholder="e.g., 0" className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor="configMax" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Temp (°C)*</label>
                            <input id="configMax" type="number" value={formData.configMax} onChange={e => setFormData(p => ({...p, configMax: e.target.value}))} required placeholder="e.g., 50" className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                        </div>
                     </motion.div>
                  )}
                  {(formData.deviceCategory.includes('LIGHT')) && (
                      <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <label htmlFor="configLightThreshold" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Light Threshold (lux)*</label>
                          <input id="configLightThreshold" type="number" value={formData.configLightThreshold} onChange={e => setFormData(p => ({...p, configLightThreshold: e.target.value}))} required placeholder="e.g., 400" className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                      </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <motion.button 
                        type="submit" disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Device')}
                    </motion.button>
                </div>
            </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddEditDeviceModal;