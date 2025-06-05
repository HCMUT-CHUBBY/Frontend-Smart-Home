// components/layout/Header.tsx
"use client";
import { useSession } from 'next-auth/react';
import styles from '@/styles/header.module.scss'; // <<< THÊM DÒNG IMPORT NÀY

const Header = () => {
  const { data: session } = useSession();

  
  return (
    // Sử dụng class từ header.module.scss
    <header className={styles.header}> {/* <<< THAY CLASSNAME */}
      {/* Chào mừng người dùng */}
      <h1 className={styles.title}> {/* <<< THAY CLASSNAME */}
        Hi,  {session?.user?.name || session?.user?.email || sessionStorage.getItem("username") || "Guest"}
      </h1>

      {/* Các thành phần khác (Search, Notifications,...) */}
      <div className={styles.controls}> {/* <<< THAY CLASSNAME */}
        {/* Đặt các nút Search, Bell,... vào đây nếu bạn muốn thêm lại */}
        {/* Ví dụ:
        <button>
           <Search size={20} /> // Giả sử dùng lucide-react
        </button>
        <button>
           <Bell size={20} />
        </button>
        */}
      </div>
    </header>
  );
};

export default Header;