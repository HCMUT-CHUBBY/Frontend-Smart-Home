// app/(protected)/layout.tsx
"use client"; // Cần thiết vì dùng hook

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Nếu chưa load xong hoặc chưa đăng nhập, chuyển hướng về trang login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Hiển thị loading hoặc null nếu chưa xác thực xong
  if (status === 'loading') {
    return <div>Loading authentication...</div>; // Hoặc một spinner đẹp hơn
  }

  // Chỉ render layout khi đã xác thực thành công
  if (status === 'authenticated') {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-6">
            {children} {/* Nội dung của các trang con (Dashboard, Settings,...) */}
          </main>
        </div>
      </div>
    );
  }

  // Trường hợp fallback (mặc dù không nên xảy ra nếu logic trên đúng)
  return null;
}