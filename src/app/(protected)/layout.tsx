// app/(protected)/layout.tsx
"use client"; // Cần thiết vì dùng hook

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; 
import styles from '@/styles/layout.module.scss'; 

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log('[ProtectedLayout] Status:', status, 'Session:', session); // Thêm log này

  useEffect(() => {
    console.log('[ProtectedLayout] useEffect running. Status:', status); // Log khi effect chạy
    if (status === 'unauthenticated') {
      console.log('[ProtectedLayout] Redirecting to login...');
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    console.log('[ProtectedLayout] Rendering Loading state...');
    return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  }

 
  // Chỉ render layout khi đã xác thực thành công
  if (status === 'authenticated') {
    return (
      // Sử dụng class từ layout.module.scss
      <div className={styles.layoutContainer}>
        <Sidebar /> {/* Sidebar tự quản lý style của nó */}
        {/* div này bao bọc phần nội dung chính */}
        <div className={styles.mainContentWrapper}>
          <Header /> {/* Header tự quản lý style của nó (cần tạo Header.module.scss) */}
          {/* main này chứa nội dung trang con */}
          <main className={styles.mainContentArea}>
            {children} {/* Nội dung của các trang con (Dashboard, Settings,...) */}
          </main>
        </div>
      </div>
    );
  }

  // Trường hợp fallback
  return null;
}