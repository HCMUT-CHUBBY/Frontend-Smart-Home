"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, Settings, List, LogOut, User, History} from "lucide-react";
import styles from "@/styles/sidebar.module.scss";

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  console.log("Sidebar - Session:", session, "Status:", status); // Log để kiểm tra

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/manage-devices", label: "Manage Devices", icon: List },
    {href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <span className={styles.logo}>SMART</span>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        {menuItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""
                }`}
            >
              <ItemIcon className={styles.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className={styles.userSection}>
        {status === "loading" && (
          <p className={styles.loading}>Loading session...</p>
        )}
        {status === "authenticated" && (
          <>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                <User className={styles.avatarIcon} />
              </div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>
                  {session?.user?.name || session?.user?.email || sessionStorage.getItem("username") || "Guest"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log("Logging out...");
                signOut({ callbackUrl: "/auth/login" });
              }}
              className={styles.logoutButton}
            >
              <LogOut className={styles.logoutIcon} />
              <span>Log Out</span>
            </button>
          </>
        )}
        {status === "unauthenticated" && (
          <p className={styles.error}>Not authenticated</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;