"use client";
import ForwardIcon from '@/assests/forward.svg'; // Kiểm tra lại đường dẫn 'assests' -> 'assets' nếu cần
import { useState, FormEvent } from "react";
// Bỏ import axios trực tiếp nếu bạn chỉ dùng apiClient cho request này
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoLight from '@/assests/illumination.svg'; // Kiểm tra lại đường dẫn

// Import apiClient của bạn
import apiClient from '@/lib/apiClient'; // <<<< THÊM DÒNG NÀY (điều chỉnh đường dẫn nếu cần)

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check again.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/register", {
        username,
        password,
        firstName,
        lastName,
        phoneNumber,
      });

      if (response.status === 200 || response.status === 201 || response.data === "User registered successfully") {
        router.push("/auth/login");
      } else {
        console.log("Registration response (unexpected):", response.data);
        setError(response.data?.message || response.data?.toString() || "Registration successful, but unexpected response.");
      }
    } catch (err: unknown) { // err là 'unknown' là đúng theo TypeScript hiện đại
      console.error("Sign up error details:", err);
      let errorMessage = "Sign up failed. An unknown error occurred.";

      // SỬA Ở ĐÂY: Dùng axios.isAxiosError(err)
      if (axios.isAxiosError(err)) { // <<<< THAY ĐỔI Ở ĐÂY
        // Sau khi kiểm tra này, TypeScript sẽ biết err là một AxiosError trong khối if này
        if (err.response) {
          const responseData = err.response.data;
          if (typeof responseData === 'string') {
            errorMessage = responseData;
          } else if (responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message;
          } else if (responseData && typeof responseData.errorMessage === 'string') {
            errorMessage = responseData.errorMessage;
          } else if (responseData && responseData.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)) {
            const errorKeys = Object.keys(responseData.errors);
            if (errorKeys.length > 0) {
                 // Lấy message của lỗi đầu tiên trong object errors
                const firstErrorKey = errorKeys[0];
                const errorValue = (responseData.errors as Record<string, string>)[firstErrorKey];
                errorMessage = typeof errorValue === 'string' ? errorValue : "Validation failed.";
            } else {
                errorMessage = "Validation failed with multiple unspecified errors.";
            }
          } else {
            errorMessage = `Server error: ${err.response.status}`;
          }
          setError(`Sign up failed. ${errorMessage}`);
        } else if (err.request) {
          setError("Sign up failed. No response from server. Check your network or contact support.");
        } else {
          setError(`Sign up failed. Error setting up request: ${err.message}`);
        }
      } else if (err instanceof Error) { // Kiểm tra nếu là một Error thông thường
        setError(`Sign up failed. ${err.message}`);
      }
      // setIsLoading(false) đã có trong finally
    } finally {
      setIsLoading(false);
    }
  };
  return (
    // Main container with dark background and relative positioning
    <div className="min-h-screen bg-gray-700 flex flex-col text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-500/10 animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-purple-500/10 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-cyan-500/5 animate-pulse delay-1000"></div>

        {/* Decorative gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-900/20 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-20 bg-gradient-to-l from-purple-900/20 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="w-full z-10 bg-black/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image
              src={LogoLight.src} // Ensure LogoLight is imported correctly
              alt="Synapse Logo"
              width={60} // Adjust size as needed
              height={24}
              className="object-contain"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Synapse Home
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Translated Links */}
            <Link
              href="/"
              // Thêm: flex items-center gap-1 (hoặc gap-2) để căn chỉnh icon và chữ
              className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              {/* Thêm SVG component ở đây */}
              <Image
                src={ForwardIcon.src}
                alt="Synapse Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span>Home</span> {/* Bọc chữ trong span nếu muốn kiểm soát riêng */}
            </Link>
            <Link href="/auth/login" className="hover:text-blue-400 transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <div className="container mx-auto max-w-2xl">
          {/* Form container with blur effect */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden shadow-2xl p-8 md:p-10">
            {/* Form Header */}
            <div className="text-center mb-8">
              {/* Translated Title */}
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Tạo tài khoản của bạn
              </h1>
              {/* Translated Subtitle */}
              <p className="text-white">
                Tạo tài khoản của bạn để bắt đầu hành trình thông minh hơn.
              </p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name and Last Name grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Translated Label */}
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-50 mb-1">
                    Họ
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    // Translated Placeholder
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  {/* Translated Label */}
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-50 mb-1">
                    Tên
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    // Translated Placeholder
                    placeholder="Enter your last name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Username (might be email) */}
              <div>
                {/* Translated Label */}
                <label htmlFor="username" className="block text-sm font-medium text-gray-50 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  // Consider type="email" if it's always an email
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  // Translated Placeholder
                  placeholder="Enter your username (e.g., email)"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Phone number */}
              <div>
                {/* Translated Label */}
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-50 mb-1">
                  Số điện thoại
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  // Translated Placeholder
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required // Adjust if phone number is optional
                  disabled={isLoading}
                />
              </div>

              {/* Password fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Translated Label */}
                  <label htmlFor="password" className="block text-sm font-medium text-gray-50 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // Translated Placeholder
                    placeholder="Create a password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  {/* Translated Label */}
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-50 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    // Translated Placeholder
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Terms and conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  {/* Translated Label and Links */}
                  <label htmlFor="terms" className="text-gray-50">
                    Tôi đồng ý với <a href="#" className="text-blue-400 hover:text-blue-300 underline">Các điều khoản dịch vụ</a> và <a href="#" className="text-blue-400 hover:text-blue-300 underline">Chính sách bảo mật</a>
                  </label>
                </div>
              </div>

              {/* Error message display */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm animate-pulse">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  // Loading spinner and translated text
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  // Translated Button Text
                  'Đăng ký'
                )}
              </button>
            </form>

            {/* Link to Login page */}
            <p className="mt-6 text-center text-gray-50">
              {/* Translated Text and Link */}
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium underline">
                Đăng nhập
              </Link>
            </p>
          </div>

          {/* Features section below the form */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {/* Translated Feature Blocks */}
            <div className="p-4 bg-blue-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-blue-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Safe & Secure</h3>
              <p className="mt-1 text-sm text-gray-50">Protect your home with our smart security system.</p>
            </div>

            <div className="p-4 bg-purple-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-purple-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Energy Saving</h3>
              <p className="mt-1 text-sm text-gray-50">Optimize your home&#39;s energy consumption.</p>
            </div>

            <div className="p-4 bg-pink-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-pink-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Remote Control</h3>
              <p className="mt-1 text-sm text-gray-50">Manage your home from anywhere in the world.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-black/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          {/* Translated Footer */}
          <p>© {new Date().getFullYear()} Synapse Home. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}