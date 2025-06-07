"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, Settings, List, LogOut, User, History, Zap, ChevronLeft, ChevronRight } from "lucide-react";
// Bỏ useState khỏi import nếu không dùng cho logic khác


// 1. Thêm props cho component
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

// 2. Nhận props vào
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 3. XÓA BỎ STATE NỘI BỘ, VÌ GIỜ NÓ ĐƯỢC QUẢN LÝ BỞI CHA
  // const [isCollapsed, setIsCollapsed] = useState(false); 
  
  // Giữ lại các state và logic khác không liên quan nếu có
  // ...

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/manage-devices", label: "Devices", icon: List },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    // 4. Bỏ `w-72` và `w-20` vì nó được điều khiển bởi `layout` rồi
    <aside className={`fixed top-0 left-0 z-30 h-full bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
        {/* Nút bấm giờ sẽ gọi prop từ cha */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-3 top-10 z-20 p-1.5 bg-slate-700 hover:bg-indigo-600 rounded-full border-2 border-slate-800 transition-all text-white"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex flex-col h-full">
            {/* ... Phần còn lại của JSX trong Sidebar giữ nguyên ... */}
            {/* Header & Logo */}
            <div className="flex items-center p-4 h-20 border-b border-slate-700/50 overflow-hidden">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                {!isCollapsed && (
                    <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                        SMART
                    </h1>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-2 py-4 space-y-2">
                {menuItems.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link key={item.href} href={item.href} title={item.label} className={`group flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/10 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                            <item.icon className="w-6 h-6 flex-shrink-0" />
                            {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-700/50">
                {status === "authenticated" && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                           <User className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate"> {session?.user?.name || session?.user?.email || sessionStorage.getItem("username") || "Guest"}</p>
                            </div>
                        )}
                        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors flex-shrink-0" title="Log Out">
                            <LogOut size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </aside>
  );
};

export default Sidebar;