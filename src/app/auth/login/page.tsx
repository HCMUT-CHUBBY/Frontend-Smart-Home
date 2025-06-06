"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// Lưu ý: Đường dẫn 'assests' có thể là lỗi chính tả, thường là 'assets'.
// Hãy kiểm tra lại tên thư mục của bạn. Tôi sẽ dùng 'assets' trong ví dụ.
import houselogin from '@/assests/houselogin.jpg';
import LogoLight from '@/assests/illumination.svg'; // Giả sử logo này vẫn dùng được
import ForwardIcon from '@/assests/forward.svg'; // Giả sử bạn có icon này
export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    // ... (logic xử lý submit giữ nguyên)
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        console.error("Sign-in error:", result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
      // Lưu tên người dùng vào session storage
      sessionStorage.setItem("username", username);
    } catch (err) {
      setError("Đã xảy ra lỗi mạng hoặc lỗi không mong muốn.");
      console.error("Unexpected error during sign-in:", err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-white overflow-hidden relative">
      {/* Animated Background Effect (giữ nguyên) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-purple-500/10 animate-pulse delay-700"></div>
      </div>

      {/* Header (giữ nguyên) */}
      <header className="w-full z-10 bg-black/80 backdrop-blur-md py-4">
        {/* ... code header giữ nguyên ... */}
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {LogoLight?.src && (
              <Image
                src={LogoLight.src}
                alt="Synapse Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            )}
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Synapse Home
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
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
            {/* Các link khác nếu có */}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-16 z-10">
        <div className="container mx-auto">
          {/* ---- Card Trắng Bao Quanh ---- */}
          {/* THÊM PADDING vào đây (ví dụ p-4, p-6, p-8 tùy ý) */}
          <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row overflow-hidden space-x-0 md:space-x-6"> {/* Thêm space-x-6 để tạo khoảng cách giữa 2 cột */}

            {/* ---- Cột Trái - Hình Ảnh (Nằm trong padding) ---- */}
            {houselogin?.src && (
              // Thêm overflow-hidden và bo góc cho div chứa ảnh
              <div className="md:w-1/2 hidden md:block rounded-xl overflow-hidden relative">
                <Image
                  src={houselogin.src}
                  alt="Modern House"
                  // Sử dụng width/height hoặc fill tùy thuộc vào div cha
                  // Nếu dùng fill, div cha phải có position relative (đã có)
                  layout="fill" // Hoặc dùng width/height và objectFit
                  objectFit="cover" // Đảm bảo ảnh che phủ div
                  // width={500} // Bỏ nếu dùng layout="fill"
                  // height={600} // Bỏ nếu dùng layout="fill"
                  className="h-full w-full" // Đảm bảo ảnh chiếm hết div chứa nó
                />
              </div>
            )}

            {/* ---- Cột Phải - Form Đăng Nhập (Nằm trong padding) ---- */}
            {/* Giảm padding bên trong cột form một chút nếu cần (ví dụ p-6 thay vì p-10) */}
            <div className={`p-6 md:p-8 flex flex-col justify-center ${houselogin?.src ? 'md:w-1/2' : 'w-full'}`}>
              {/* ---- Phần Tiêu Đề Form ---- */}
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">
                  Welcome back!
                </h1>
                <p className="text-gray-500 text-sm">
                  Today is a new day. Sign in to manage your smart home.
                </p>
              </div>

              {/* ---- Form ---- */}
              {/* ... code form giữ nguyên như trước ... */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Trường Username/Email */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                    Username
                  </label>
                  <input
                    id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2.5 rounded-md bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required disabled={isLoading}
                  />
                </div>
                {/* Trường Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-md bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required disabled={isLoading}
                  />
                </div>
                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="remember-me" className="ml-2 block text-gray-600">Remember me</label>
                  </div>
                  <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">Forgot password?</Link>
                </div>
                {/* Nút Submit */}
                <button type="submit"
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 mx-auto text-white" /* SVG code */></svg>
                  ) : ('Sign In')}
                </button>
              </form>

              {/* Thông báo lỗi */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Link Đăng Ký */}
              <p className="mt-6 text-center text-sm text-gray-500">
                Don&#39;t have an account?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 transition-colors font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (giữ nguyên) */}
      <footer className="py-6 bg-black/80 backdrop-blur-md z-10 mt-auto">
        {/* ... code footer giữ nguyên ... */}
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Synapse Home. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}