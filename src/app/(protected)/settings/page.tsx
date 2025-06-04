// app/(protected)/settings/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Import signOut if needed later
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, Key, Palette, Save, Loader2 } from 'lucide-react'; // Icons
import { motion } from 'framer-motion';
import axios from 'axios'; // Import axios to check for AxiosError

import apiClient from '@/lib/apiClient'; // Your API Client
// Import các DTO mới và CustomSession
import {  PasswordDTO, ProfileUpdateDTO, PreferencesUpdateDTO } from '@/lib/types';

// SettingsCard Component (Keep as is or use your UI library component)
const SettingsCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        // Use dark mode classes from Tailwind
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50">
            {/* Adjust icon color for dark mode if needed */}
            <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </motion.div>
);

// SettingsInput Component (Keep as is or use your UI library component)
const SettingsInput: React.FC<{ label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; required?: boolean; placeholder?: string }> =
    ({ label, id, type = "text", value, onChange, disabled = false, required = false, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            // Add dark mode styles for input
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-150 placeholder-gray-400 dark:placeholder-gray-500"
        />
    </div>
);

export default function SettingsPage() {
    const { data: session, status, update } = useSession() ; // Add update function from useSession

    // --- State ---
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [preferences, setPreferences] = useState({ theme: 'light', emailNotifications: true });

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    // Load user data and preferences
    useEffect(() => {
        if (session?.user) {
            setProfileData({
                name: session.user.name || '',
                email: session.user.email || '',
            });
            // --- TODO: Fetch user preferences from API if they exist ---
            // Example:
            // const fetchPrefs = async () => {
            //     try {
            //         const response = await apiClient.get('/user/preferences');
            //         if (response.data?.data) {
            //              setPreferences(response.data.data);
            //              applyTheme(response.data.data.theme || 'light');
            //          }
            //      } catch (error) { console.error("Failed to fetch preferences", error); }
            // };
            // fetchPrefs();

             // Fallback to localStorage theme if no API pref found yet
             const savedTheme = localStorage.getItem('theme') || 'light';
             setPreferences(prev => ({ ...prev, theme: savedTheme }));
             applyTheme(savedTheme);

        } else {
            // Handle no session? Might redirect elsewhere.
            // Apply default theme if no session
            const savedTheme = localStorage.getItem('theme') || 'light';
            applyTheme(savedTheme);
        }

    }, [session]);

    // --- Handlers ---
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


    // --- Theme Handling ---
    const applyTheme = (themeName: string) => {
        if (themeName === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', themeName); // Save preference locally
    };

    const handleThemeChange = (themeName: string) => {
        setPreferences(prev => ({ ...prev, theme: themeName }));
        applyTheme(themeName);
        // Optionally trigger save preferences immediately or rely on save button
        // handleSavePreferences();
    };

    // --- API Submit Functions ---

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData.name.trim()) {
             toast.error("Display Name cannot be empty.");
             return;
        }
        setIsSavingProfile(true);
        console.log("Saving profile data:", { name: profileData.name }); // Don't log email if not changing

        try {
            // --- TODO: Replace with your actual API endpoint ---
            const payload: ProfileUpdateDTO = { name: profileData.name };
            await apiClient.put('/user/profile', payload); // <<<< ASSUMED API CALL

            toast.success("Profile updated successfully!");

            // Update the session data if possible (useful if name is used elsewhere immediately)
            await update({ name: profileData.name }); // Update next-auth session

        } catch (err: unknown) {
            console.error("Error saving profile:", err);
             const errorMessage = axios.isAxiosError(err) && err.response?.data
                 ? (err.response.data.errorMessage || err.response.data.message || JSON.stringify(err.response.data))
                 : (err instanceof Error ? err.message : "An unknown error occurred.");
            toast.error(`Failed to update profile: ${errorMessage}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // app/(protected)/settings/page.tsx

// ... imports và các state khác ...

const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  // --- Giữ nguyên phần validation phía client ---
  if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirmation password do not match.");
      return;
  }
  if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
  }
  // Giữ lại kiểm tra này vì backend cũng yêu cầu oldPassword (currentPassword)
  if (!passwordData.currentPassword) {
      toast.error("Current password is required.");
      return;
  }
   // Thêm kiểm tra confirmPassword (mặc dù đã so sánh ở trên, nhưng để chắc chắn không rỗng nếu backend yêu cầu)
   if (!passwordData.confirmPassword) {
      toast.error("Confirm password is required."); // Thêm thông báo này nếu cần
      return;
  }


  setIsChangingPassword(true);

  // --- Sửa lại Payload ---
  const payload: PasswordDTO = {
      oldPassword: passwordData.currentPassword, // <<< Gửi giá trị state 'currentPassword' với key là 'oldPassword'
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword // <<< Thêm trường confirmPassword vào payload
  };
  // -----------------------

  console.log("Attempting to change password..."); // Log trước khi gọi API

  try {
      const response = await apiClient.put('/user/password', payload); // Gọi API với payload đã sửa

      toast.success(response.data?.message || "Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form

  } catch (err: unknown) {
      console.error("Error changing password:", err);

      let errorMessage = "An unknown error occurred.";
      // Cố gắng lấy lỗi chi tiết hơn từ response 400
      if (axios.isAxiosError(err) && err.response?.data) {
          const errorData = err.response.data;
          if (errorData.errors && typeof errorData.errors === 'object') {
              // Nếu có object 'errors', nối các thông báo lỗi lại
              errorMessage = Object.values(errorData.errors).join('. ');
          } else {
              // Nếu không, lấy message chung
              errorMessage = errorData.errorMessage || errorData.message || `Request failed with status ${err.response.status}`;
          }
      } else if (err instanceof Error) {
          errorMessage = err.message;
      }

      toast.error(`Failed to change password: ${errorMessage}`);
  } finally {
      setIsChangingPassword(false);
  }
};

// ... phần còn lại của component ...

    const handleSavePreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPrefs(true);
        console.log("Saving preferences:", preferences);

        try {
            // --- TODO: Replace with your actual API endpoint ---
             const payload: PreferencesUpdateDTO = {
                 theme: preferences.theme as 'light' | 'dark', // Ensure type safety
                 emailNotifications: preferences.emailNotifications,
             };
            await apiClient.put('/user/preferences', payload); // <<<< ASSUMED API CALL

            toast.success("Preferences saved successfully!");

        } catch (err: unknown) {
            console.error("Error saving preferences:", err);
             const errorMessage = axios.isAxiosError(err) && err.response?.data
                 ? (err.response.data.errorMessage || err.response.data.message || JSON.stringify(err.response.data))
                 : (err instanceof Error ? err.message : "An unknown error occurred.");
            toast.error(`Failed to save preferences: ${errorMessage}`);
        } finally {
            setIsSavingPrefs(false);
        }
    };


    // --- Render ---
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Optional: Redirect or show message if not authenticated
    if (!session) {
         return <div className="p-6 text-center text-red-600 dark:text-red-400">Please log in to access settings.</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            {/* Use theme state for ToastContainer */}
            <ToastContainer position="bottom-right" autoClose={4000} theme={preferences.theme === 'dark' ? 'dark' : 'light'} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                {/* Translated Header */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information and application preferences.</p>
            </motion.div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                {/* Column 1: Profile & Security */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information Card */}
                    <SettingsCard title="Personal Information" icon={<User size={20} />}>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <SettingsInput
                                label="Display Name" // Translated
                                id="name"
                                value={profileData.name}
                                onChange={handleProfileChange}
                                placeholder="Your name" // Translated
                                required
                            />
                            <SettingsInput
                                label="Email" // Translated
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={()=>{}} // No-op as it's disabled
                                disabled // Email usually not changeable
                                placeholder="Your email address" // Translated
                            />
                            <div className="pt-2 flex justify-end">
                                <button type="submit" disabled={isSavingProfile}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                                >
                                    {isSavingProfile ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                    {isSavingProfile ? 'Saving...' : 'Save Changes'} {/* Translated */}
                                </button>
                            </div>
                        </form>
                    </SettingsCard>

                    {/* Security Card */}
                    <SettingsCard title="Security" icon={<Key size={20} />}>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Change Password</h3> {/* Translated */}
                            <SettingsInput
                                label="Current Password" // Translated
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Enter current password" // Translated
                            />
                            <SettingsInput
                                label="New Password" // Translated
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="At least 6 characters" // Translated
                            />
                            <SettingsInput
                                label="Confirm New Password" // Translated
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Re-enter new password" // Translated
                            />
                            <div className="pt-2 flex justify-end">
                                <button type="submit" disabled={isChangingPassword}
                                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition duration-150"
                                >
                                    {isChangingPassword ? <Loader2 size={18} className="animate-spin mr-2" /> : <Key size={18} className="mr-2" />}
                                    {isChangingPassword ? 'Changing...' : 'Change Password'} {/* Translated */}
                                </button>
                            </div>
                        </form>
                    </SettingsCard>
                </div>

                {/* Column 2: Preferences */}
                <div className="lg:col-span-1 space-y-6">
                    <SettingsCard title="Preferences" icon={<Palette size={20} />}>
                        <form onSubmit={handleSavePreferences} className="space-y-4">
                            {/* Theme Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label> {/* Translated */}
                                <div className="flex space-x-4">
                                     {/* Added dark mode styles for buttons */}
                                    <button type="button" onClick={() => handleThemeChange('light')}
                                         className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-150 ${preferences.theme === 'light'
                                             ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800'
                                             : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                     >
                                        ☀️ Light {/* Translated */}
                                    </button>
                                     <button type="button" onClick={() => handleThemeChange('dark')}
                                         className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-150 ${preferences.theme === 'dark'
                                             ? 'bg-gray-700 dark:bg-gray-600 text-white border-gray-600 dark:border-gray-500 ring-2 ring-gray-500 dark:ring-gray-400'
                                             : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                     >
                                        🌙 Dark {/* Translated */}
                                    </button>
                                </div>
                            </div>

                            {/* Notification Settings */}
                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notifications</label> {/* Translated */}
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="emailNotifications" // Matches state key
                                            checked={preferences.emailNotifications}
                                            onChange={handleNotificationChange}
                                             // Added dark mode styles for checkbox
                                            className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-gray-100 dark:bg-gray-700 focus:ring-offset-0 dark:focus:ring-offset-gray-800"
                                        />
                                        {/* Translated Label */}
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Receive email notifications for device alerts</span>
                                    </label>
                                    {/* Add more notification options if needed */}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={isSavingPrefs}
                                    className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150"
                                >
                                    {isSavingPrefs ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                    {isSavingPrefs ? 'Saving...' : 'Save Preferences'} {/* Translated */}
                                </button>
                            </div>
                        </form>
                    </SettingsCard>
                </div>

            </div> {/* End Grid */}
        </div> // End Main Container
    );
}