// app/(protected)/settings/page.tsx
"use client";

import React, { useState, useEffect} from 'react';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, Key, Palette, Save, Loader2 } from 'lucide-react'; // Icons
import { motion } from 'framer-motion';

import { CustomSession } from '@/lib/types'; // Import kiểu Session tùy chỉnh của bạn

// Giả sử bạn có component Card hoặc tạo một cái đơn giản
const SettingsCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden"
  >
    <div className="p-5 border-b border-gray-200 flex items-center space-x-3 bg-gray-50">
      <div className="text-indigo-600">{icon}</div>
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </motion.div>
);

// Component Input đơn giản (bạn có thể dùng component UI sẵn có nếu có)
const SettingsInput: React.FC<{ label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; required?: boolean; placeholder?: string }> =
({ label, id, type = "text", value, onChange, disabled = false, required = false, placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150"
    />
  </div>
);

export default function SettingsPage() {
  const { data: session, status } = useSession() as { data: CustomSession | null; status: string };

  // --- State cho các form cài đặt ---
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({ theme: 'light', emailNotifications: true }); // Thêm theme và notifications

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Load dữ liệu người dùng từ session khi có
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
     // Load theme từ localStorage nếu có
     const savedTheme = localStorage.getItem('theme') || 'light';
     setPreferences(prev => ({ ...prev, theme: savedTheme }));
     applyTheme(savedTheme); // Apply theme on load

  }, [session]);

   // --- Hàm xử lý thay đổi ---
   const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const { name, value } = e.target;
     setProfileData(prev => ({ ...prev, [name]: value }));
   };

   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const { name, value } = e.target;
     setPasswordData(prev => ({ ...prev, [name]: value }));
   };

   const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

   // --- Hàm xử lý Submit (Hiện tại chỉ là Placeholder) ---

   const handleSaveProfile = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSavingProfile(true);
     console.log("Saving profile data:", profileData);
     // --- TODO: Gọi API cập nhật profile khi có ---
     // await apiClient.put('/users/profile', profileData);
     await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập gọi API
     toast.info("Profile update functionality not implemented yet.");
     setIsSavingProfile(false);
   };

   const handleChangePassword = async (e: React.FormEvent) => {
     e.preventDefault();
     if (passwordData.newPassword !== passwordData.confirmPassword) {
       toast.error("New password and confirmation password do not match.");
       return;
     }
     if (passwordData.newPassword.length < 6) { // Ví dụ kiểm tra độ dài
        toast.error("New password must be at least 6 characters long.");
        return;
     }

     setIsChangingPassword(true);
     console.log("Changing password with data:", { current: '***', new: '***' }); // Không log mật khẩu thật
     // --- TODO: Gọi API đổi mật khẩu khi có ---
     // await apiClient.post('/users/change-password', {
     //   currentPassword: passwordData.currentPassword,
     //   newPassword: passwordData.newPassword,
     // });
     await new Promise(resolve => setTimeout(resolve, 1500)); // Giả lập gọi API
     toast.success("Password change functionality not implemented yet, but validation passed!"); // Hoặc .info
     setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
     setIsChangingPassword(false);
   };

    // --- Xử lý Theme ---
    const applyTheme = (themeName: string) => {
        if (themeName === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', themeName); // Lưu vào localStorage
    };

    const handleThemeChange = (themeName: string) => {
        setPreferences(prev => ({ ...prev, theme: themeName }));
        applyTheme(themeName);
    };

   const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    console.log("Saving preferences:", preferences);
     // --- TODO: Gọi API lưu tùy chọn khi có ---
    // await apiClient.put('/users/preferences', preferences);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập
    toast.info("Preferences saving functionality not implemented yet.");
    setIsSavingPrefs(false);
   };


  // --- Render ---
  if (status === 'loading') {
    return (
        <div className="flex justify-center items-center h-screen">
             <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
    );
  }

  if (!session) {
     // Có thể redirect về login hoặc hiển thị thông báo
     return <div className="p-6 text-center text-red-600">Please log in to access settings.</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <ToastContainer position="bottom-right" autoClose={3000} theme={preferences.theme === 'dark' ? 'dark' : 'light'} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cài đặt</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Quản lý thông tin tài khoản và tùy chọn ứng dụng của bạn.</p>
      </motion.div>

      {/* Grid layout for settings cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Column 1: Profile */}
        <div className="lg:col-span-2 space-y-6">
          <SettingsCard title="Thông tin cá nhân" icon={<User size={20} />}>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <SettingsInput
                label="Tên hiển thị"
                id="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder="Tên của bạn"
              />
              <SettingsInput
                label="Email"
                id="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange} // Có thể không cho sửa email
                disabled // Email thường không được sửa đổi
                placeholder="Địa chỉ email"
              />
              {/* Có thể thêm các trường khác: Avatar URL, Timezone, etc. */}
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isSavingProfile}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                >
                  {isSavingProfile ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </SettingsCard>

          {/* Security Card */}
          <SettingsCard title="Bảo mật" icon={<Key size={20} />}>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Đổi mật khẩu</h3>
               <SettingsInput
                 label="Mật khẩu hiện tại"
                 id="currentPassword"
                 type="password"
                 value={passwordData.currentPassword}
                 onChange={handlePasswordChange}
                 required
                 placeholder="Nhập mật khẩu hiện tại"
               />
               <SettingsInput
                 label="Mật khẩu mới"
                 id="newPassword"
                 type="password"
                 value={passwordData.newPassword}
                 onChange={handlePasswordChange}
                 required
                 placeholder="Ít nhất 6 ký tự"
               />
               <SettingsInput
                 label="Xác nhận mật khẩu mới"
                 id="confirmPassword"
                 type="password"
                 value={passwordData.confirmPassword}
                 onChange={handlePasswordChange}
                 required
                 placeholder="Nhập lại mật khẩu mới"
               />
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isChangingPassword}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition duration-150"
                >
                  {isChangingPassword ? <Loader2 size={18} className="animate-spin mr-2" /> : <Key size={18} className="mr-2" />}
                  {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </SettingsCard>
        </div>

        {/* Column 2: Preferences */}
        <div className="lg:col-span-1 space-y-6">
           <SettingsCard title="Tùy chọn" icon={<Palette size={20}/>}>
                <form onSubmit={handleSavePreferences} className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Giao diện</label>
                        <div className="flex space-x-4">
                            <button type="button" onClick={() => handleThemeChange('light')}
                                className={`px-4 py-2 rounded-md text-sm font-medium border ${preferences.theme === 'light' ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} >
                                ☀️ Sáng
                            </button>
                             <button type="button" onClick={() => handleThemeChange('dark')}
                                className={`px-4 py-2 rounded-md text-sm font-medium border ${preferences.theme === 'dark' ? 'bg-gray-700 text-white border-gray-600 ring-2 ring-gray-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} >
                                🌙 Tối
                            </button>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thông báo</label>
                        <div className="space-y-2">
                           <label className="flex items-center space-x-3 cursor-pointer">
                               <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={preferences.emailNotifications}
                                onChange={handleNotificationChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                               />
                               <span className="text-sm text-gray-700">Nhận thông báo qua Email về cảnh báo thiết bị</span>
                           </label>
                           {/* Thêm các tùy chọn thông báo khác nếu cần */}
                        </div>
                    </div>

                     <div className="pt-4 flex justify-end">
                         <button type="submit" disabled={isSavingPrefs}
                           className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150"
                         >
                           {isSavingPrefs ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                           {isSavingPrefs ? 'Đang lưu...' : 'Lưu tùy chọn'}
                         </button>
                     </div>
                </form>
           </SettingsCard>
        </div>

      </div> {/* End Grid */}
    </div> // End Main Container
  );
}