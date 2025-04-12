// components/layout/Sidebar.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Home, Settings, List, LogOut, User } from 'lucide-react'; // Ví dụ dùng lucide-react icons




const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/manage-devices', label: 'Manage Devices', icon: List },
    // { href: '/notifications', label: 'Notifications', icon: Bell }, // Tùy chọn
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">SMART</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
              pathname === item.href
                ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          {/* Avatar Mặc Định */}
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {session?.user?.name || session?.user?.email || 'User'} {/* Hiển thị tên nếu có */}
            </p>
            {/* <p className="text-xs text-gray-500 dark:text-gray-400">Online</p> */}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })} // Chuyển về trang login sau khi logout
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;