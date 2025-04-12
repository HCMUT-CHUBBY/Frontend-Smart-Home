// components/layout/Header.tsx
"use client";
import { useSession } from 'next-auth/react';


const Header = () => {
  const { data: session } = useSession();

  // Lấy username từ session (ưu tiên name, rồi email, rồi id nếu không có)
  const getUsername = () => {
    if (session?.user) {
        
        return session.user.name || 'User'; // Hoặc session.user.name || session.user.email || 'User' nếu có
    }
    return 'User';
  }


  return (
    <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 border-b dark:border-gray-700">
      {/* Chào mừng người dùng */}
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Hi, {getUsername()}
      </h1>

      {/* Các thành phần khác (Search, Notifications,...) - Tùy chọn */}
      <div className="flex items-center space-x-4">
        {/* <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-200"
          />
        </div>
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          <Bell className="h-6 w-6" />
        </button> */}
      </div>
    </header>
  );
};

export default Header;