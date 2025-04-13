// app/(protected)/layout.tsx
"use client"; // Cần thiết vì dùng hook

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; // Giả định có component Header
import styles from '@/styles/layout.module.scss'; // <<< THÊM DÒNG IMPORT NÀY

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
    // Thay thế bằng component loading nếu muốn đẹp hơn
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