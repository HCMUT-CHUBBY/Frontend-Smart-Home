"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  XCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

import apiClient from '@/lib/apiClient';
import { PasswordDTO } from '@/lib/types';

// Enhanced Toast Configuration
const toastConfig = {
  position: "top-right" as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored" as const,
  toastClassName: "!rounded-2xl !shadow-2xl",
  bodyClassName: "!font-medium"
};

// Password Strength Checker
const checkPasswordStrength = (password: string) => {
  const strength = {
    score: 0,
    criteria: {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  };
  
  strength.score = Object.values(strength.criteria).filter(Boolean).length;
  
  return {
    ...strength,
    level: strength.score <= 2 ? 'weak' : strength.score <= 4 ? 'medium' : 'strong',
    color: strength.score <= 2 ? 'red' : strength.score <= 4 ? 'yellow' : 'green'
  };
};

// Enhanced Settings Card Component
const SettingsCard: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.1 
    }}
    whileHover={{ 
      y: -5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.3 }
    }}
    className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20" />
    
    <div className="relative p-8 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur opacity-50" />
          <div className="relative">
            {icon}
          </div>
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Update your security information</p>
        </div>
      </div>
    </div>
    
    <div className="relative p-8">
      {children}
    </div>
  </motion.div>
);

// Enhanced Input Component
const SettingsInput: React.FC<{
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showPasswordToggle?: boolean;
  showStrength?: boolean;
  error?: string;
  success?: boolean;
}> = ({ 
  label, id, type = "text", value, onChange, placeholder,
  showPasswordToggle = false, showStrength = false, error, success 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const passwordStrength = showStrength ? checkPasswordStrength(value) : null;
  
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <motion.input
          type={inputType}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required
          placeholder={placeholder}
          className={`
            block w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300
            bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm
            text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-0
            ${error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500' 
              : success 
                ? 'border-green-300 dark:border-green-600 focus:border-green-500'
                : isFocused 
                  ? 'border-indigo-400 dark:border-indigo-500 focus:border-indigo-500 shadow-lg shadow-indigo-500/25'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
          animate={{
            scale: isFocused ? 1.02 : 1,
            transition: { duration: 0.2 }
          }}
        />
        
        {showPasswordToggle && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        )}
        
        <AnimatePresence>
          {(success || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {success ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {showStrength && value && passwordStrength && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 pt-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Password Strength
            </span>
            <span className={`text-xs font-bold ${
              passwordStrength.color === 'red' ? 'text-red-500' :
              passwordStrength.color === 'yellow' ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {passwordStrength.level}
            </span>
          </div>
          
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full flex-1 ${
                  i < passwordStrength.score 
                    ? passwordStrength.color === 'red' ? 'bg-red-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
            {Object.entries(passwordStrength.criteria).map(([key, met]) => (
              <div key={key} className={`flex items-center space-x-1.5 ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {met ? <CheckCircle size={12} /> : <XCircle size={12} />}
                <span>
                  {key === 'length' ? '8+ Characters' :
                   key === 'uppercase' ? 'Uppercase' :
                   key === 'lowercase' ? 'Lowercase' :
                   key === 'number' ? 'Number' : 'Special Character'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1 pt-1"
          >
            <XCircle size={14} />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full" />
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-gray-600 dark:text-gray-400 font-medium"
    >
      Loading...
    </motion.p>
  </div>
);

// Main Settings Page Component
export default function SettingsPage() {
  const { status } = useSession();
  const [passwordData, setPasswordData] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Please confirm your new password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Confirmation password does not match';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors before submitting.", toastConfig);
      return;
    }
    setIsChangingPassword(true);
    const payload: PasswordDTO = {
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    };
    try {
      const response = await apiClient.patch('/users/me/password', payload);
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      toast.success(response.data?.message || "🎉 Password changed successfully!", toastConfig);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormErrors({});
    } catch (err: unknown) {
      let errorMessage = "An unknown error occurred.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as { message?: string, detail?: string };
        errorMessage = errorData.message || errorData.detail || `Error: ${err.response.status}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(`❌ Password change failed: ${errorMessage}`, toastConfig);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (status === 'loading') return <LoadingSpinner />;
  
  if (status === 'unauthenticated') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
      >
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the settings page.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
      <ToastContainer {...toastConfig} />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12 max-w-4xl mx-auto text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} className="inline-flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <Sparkles size={32} />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Account Settings
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Manage your security and personal information with a modern and secure interface.
          </motion.p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <SettingsCard title="Advanced Security" icon={<Shield size={28} />}>
            <form onSubmit={handleChangePassword} className="space-y-8">
              <div className="space-y-6">
                <SettingsInput
                  label="Current Password"
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  showPasswordToggle={true}
                  error={formErrors.currentPassword}
                />
                <SettingsInput
                  label="New Password"
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="At least 8 characters"
                  showPasswordToggle={true}
                  showStrength={true}
                  error={formErrors.newPassword}
                />
                <SettingsInput
                  label="Confirm New Password"
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter your new password"
                  showPasswordToggle={true}
                  error={formErrors.confirmPassword}
                  success={!!passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <motion.button
                  type="submit"
                  disabled={isChangingPassword}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 transform hover:shadow-xl hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="relative z-10 flex items-center space-x-2">
                    <AnimatePresence mode="wait">
                      {isChangingPassword ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                          <Loader2 size={20} className="animate-spin" />
                          <span>Processing...</span>
                        </motion.div>
                      ) : showSuccessAnimation ? (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex items-center space-x-2">
                          <CheckCircle size={20} />
                          <span>Success!</span>
                        </motion.div>
                      ) : (
                        <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                          <Zap size={20} />
                          <span>Update Password</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </div>
            </form>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}