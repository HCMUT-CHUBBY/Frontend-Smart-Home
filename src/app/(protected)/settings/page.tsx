// app/(protected)/settings/page.tsx
"use client";

import React, { useState} from 'react';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Key,Loader2 } from 'lucide-react'; // Giữ lại Key, Save, Loader2
import { motion } from 'framer-motion';
import axios from 'axios';

import apiClient from '@/lib/apiClient';
import { PasswordDTO } from '@/lib/types'; // Chỉ cần PasswordDTO

// SettingsCard Component (Giữ nguyên vì nó là UI chung)
const SettingsCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden" // Bỏ dark mode class nếu không quản lý theme nữa
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

// SettingsInput Component (Giữ nguyên vì nó là UI chung)
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 placeholder-gray-400"
        />
    </div>
);

export default function SettingsPage() {
    const { data: session, status } = useSession();

    // --- State ---
    // Bỏ profileData và preferences state
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Bỏ useEffect liên quan đến profile và preferences/theme
    // useEffect(() => {
    //     if (session?.user) {
    //         // Không set profileData nữa
    //     }
    //     // Không xử lý theme ở đây nữa
    // }, [session]);

    // --- Handlers ---
    // Bỏ handleProfileChange và handleNotificationChange

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    // Bỏ handleThemeChange và applyTheme

    // --- API Submit Functions ---
    // Bỏ handleSaveProfile và handleSavePreferences

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Mật khẩu mới và mật khẩu xác nhận không khớp.");
            return;
        }
        if (passwordData.newPassword.length < 6) { // Giữ validation cơ bản
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (!passwordData.currentPassword) {
            toast.error("Mật khẩu hiện tại là bắt buộc.");
            return;
        }
        if (!passwordData.confirmPassword) {
            toast.error("Xác nhận mật khẩu là bắt buộc.");
            return;
        }

        setIsChangingPassword(true);
        const payload: PasswordDTO = {
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword
        };
        console.log("Attempting to change password...");

        try {
            const response = await apiClient.put('/user/password', payload);
            toast.success(response.data?.message || "Đổi mật khẩu thành công!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: unknown) {
            console.error("Error changing password:", err);
            let errorMessage = "Có lỗi không xác định xảy ra.";
            if (axios.isAxiosError(err) && err.response?.data) {
                const errorData = err.response.data;
                if (errorData.errors && typeof errorData.errors === 'object') {
                    errorMessage = Object.values(errorData.errors).join('. ');
                } else {
                    errorMessage = errorData.errorMessage || errorData.message || `Yêu cầu thất bại với mã lỗi ${err.response.status}`;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast.error(`Không thể đổi mật khẩu: ${errorMessage}`);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // --- Render ---
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!session) {
        return <div className="p-6 text-center text-red-600">Vui lòng đăng nhập để truy cập cài đặt.</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen transition-colors duration-300">
            {/* ToastContainer với theme mặc định hoặc cố định */}
            <ToastContainer position="bottom-right" autoClose={4000} theme="light" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                <h1 className="text-3xl font-bold text-gray-900">Cài đặt Tài khoản</h1>
                <p className="text-gray-600 mt-2">Quản lý thông tin bảo mật tài khoản của bạn.</p>
            </motion.div>

            {/* Chỉ hiển thị phần Security Card */}
            <div className="max-w-2xl mx-auto"> {/* Căn giữa card duy nhất */}
                <SettingsCard title="Bảo mật" icon={<Key size={20} />}>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Đổi Mật khẩu</h3>
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
                                {isChangingPassword ? 'Đang đổi...' : 'Đổi Mật khẩu'}
                            </button>
                        </div>
                    </form>
                </SettingsCard>
            </div>
        </div>
    );
}