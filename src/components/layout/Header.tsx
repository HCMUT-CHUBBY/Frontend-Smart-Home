// components/layout/Header.tsx
"use client";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
// import { Search, Bell, Home, Settings, User, Wifi } from 'lucide-react'; // Uncomment để dùng icons

const Header = () => {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  // Cập nhật thời gian real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theo dõi trạng thái online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const userName = session?.user?.name || session?.user?.email || sessionStorage.getItem("username") || "Guest";
  const timeString = currentTime.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  const dateString = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="relative overflow-hidden">
      {/* Gradient Background với Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 animate-gradient-x"></div>
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      
      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -top-24 -left-24 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-blue-400/10 rounded-full top-16 right-32 animate-bounce delay-1000"></div>
        <div className="absolute w-32 h-32 bg-purple-400/15 rounded-full bottom-8 left-1/3 animate-ping delay-500"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-between p-6">
        {/* Left Section - Welcome & Time */}
        <div className="flex items-center space-x-6">
          {/* Smart Home Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg hover:scale-110 transition-transform duration-300">
            {/* <Home className="w-6 h-6 text-white" /> */}
            <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
          </div>
          
          {/* Welcome Message */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Hi, <span className="text-yellow-300 animate-pulse">{userName}</span>! 👋
            </h1>
            <p className="text-blue-100 text-sm font-medium">
              Welcome to your Smart Home
            </p>
          </div>
        </div>

        {/* Center Section - Time & Date */}
        <div className="hidden md:flex flex-col items-center space-y-1 bg-white/15 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
          <div className="text-3xl font-bold text-white tabular-nums tracking-wider">
            {timeString}
          </div>
          <div className="text-blue-100 text-sm capitalize">
            {dateString}
          </div>
        </div>

        {/* Right Section - Status & Controls */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
            isOnline 
              ? 'bg-green-500/20 border-green-400/30 text-green-100' 
              : 'bg-red-500/20 border-red-400/30 text-red-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button className="group p-3 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-12">
              {/* <Search className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors" /> */}
              <div className="w-5 h-5 border-2 border-white rounded-full group-hover:border-yellow-300 transition-colors"></div>
            </button>

            {/* Notifications */}
            <button className="group relative p-3 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:scale-110">
              {/* <Bell className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors" /> */}
              <div className="w-5 h-5 bg-white rounded-sm group-hover:bg-yellow-300 transition-colors"></div>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </button>

            {/* Settings */}
            <button className="group p-3 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-180">
              {/* <Settings className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors" /> */}
              <div className="w-5 h-5 border-2 border-white rounded group-hover:border-yellow-300 transition-colors"></div>
            </button>

            {/* User Avatar */}
            <div className="group relative">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 hover:scale-110 transition-transform duration-300 cursor-pointer">
                <span className="text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Status Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </header>
  );
};

export default Header;