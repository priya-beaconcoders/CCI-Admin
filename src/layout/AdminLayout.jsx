// 📁 layout/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  LogOut,
  Home,
  Building2,
  Clock,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import SidebarItem from "../components/SidebarItem";
import logo from "../assets/logo-india.png";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [collapsed, setCollapsed] = useState(false);

  // Reset collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, title: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, title: "Bookings", path: "/bookings" },
    { icon: Home, title: "Masters", path: "/masters" },
    { icon: Users, title: "Staff", path: "/staff" },
    { icon: FileText, title: "Reports", path: "/reports" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = menuItems.find(item => item.path === location.pathname);
    return item ? item.title : "Dashboard";
  };

  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 PIXEL PERFECT CALCULATION
  const activeIndex = menuItems.findIndex(item => item.path === location.pathname);
  const stride = 46; 
  const pillOffset = activeIndex * stride;
  const pillHeight = 40;

  return (
    <div className="h-[100dvh] flex overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        h-[100dvh]
        transform transition-all duration-300 ease-in-out
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white border-r border-gray-200/60 shadow-sm
        backdrop-blur-xl
        ${collapsed ? 'w-16' : 'w-72'}
      `}>
        {/* Logo Section */}
        <div className={`h-16 flex items-center transition-all duration-300 bg-white ${collapsed ? 'justify-center px-2' : 'px-6 gap-3'}`}>
          <div className="relative flex-shrink-0">
            <img src={logo} alt="CCI" className="h-9 w-9 object-contain"
              style={{ filter: 'brightness(1.05) contrast(1.05)' }}
            />
          </div>
          <div className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? 'opacity-0 scale-95 max-w-0 pointer-events-none' : 'opacity-100 scale-100 max-w-[200px]'}`}>
            <span className="text-sm font-semibold tracking-tight truncate text-gray-900">
              Constitution Club
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide truncate">
              of India • Hospitality
            </span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden md:flex p-1.5 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1">
          <div className={`px-2 transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? 'max-h-0 py-0 opacity-0' : 'max-h-10 py-2 opacity-100'}`}>
            <p className="text-[10px] uppercase font-semibold tracking-[0.1em] text-gray-400 dark:text-gray-500 mb-2 px-3 truncate">
              Main Menu
            </p>
          </div>
          
          <div className="relative space-y-1.5 min-w-0">
            {activeIndex !== -1 && (
              <div 
                className="absolute left-1 right-1 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out pointer-events-none z-0 bg-blue-500"
                style={{ 
                  top: `${pillOffset}px`,
                  height: `${pillHeight}px`,
                }}
              />
            )}

            {menuItems.map((item) => (
              <SidebarItem
                key={item.path}
                {...item}
                collapsed={collapsed}
                active={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                }}
              />
            ))}
          </div>

          <div className={`transition-all duration-300 mt-6 ${collapsed ? 'px-0 flex justify-center' : 'px-3'}`}>
            {collapsed && (
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 transition-all">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        </nav>

        {/* Footer - Simplified to Sign Out Only */}
          <div className={`p-4 pb-12 md:pb-8 border-t border-gray-200 ${collapsed ? 'flex flex-col items-center gap-4' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center transition-all duration-300 group rounded-xl
              ${collapsed ? 'w-10 h-10 justify-center hover:bg-red-50' : 'w-full gap-3 px-4 py-3 hover:bg-gray-100'}
              text-gray-600 hover:text-red-600`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={`text-sm font-medium transition-all duration-300 truncate overflow-hidden ${collapsed ? 'opacity-0 scale-95 max-w-0' : 'opacity-100 scale-100 max-w-[100px] ml-3'}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Container Optimized */}
      <div className={`
        flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
        will-change-[margin]
        ${collapsed ? 'md:ml-16' : 'md:ml-72'}
      `}>
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-xl transition-colors">
                <Menu className="w-5 h-5 text-gray-600 hover:text-gray-900" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${
                    location.pathname === '/dashboard' ? 'from-blue-500 to-cyan-500' :
                    location.pathname === '/bookings' ? 'from-orange-500 to-amber-500' :
                    location.pathname === '/masters' ? 'from-emerald-500 to-teal-500' :
                    location.pathname === '/staff' ? 'from-purple-500 to-violet-500' : 'from-rose-500 to-pink-500'}`}
                />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold tracking-tight truncate text-gray-900">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xs truncate text-gray-400">
                    Constitution Club Hotel Management
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50/50 border border-blue-100/50 shadow-sm shadow-blue-500/5">
              <Clock className="w-4.5 h-4.5 text-blue-500/70" />
              <span className="text-lg font-bold tabular-nums text-blue-600/90 whitespace-nowrap">
                {currentTime}
              </span>
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pt-3 px-4 pb-2 md:pt-4 md:px-8 lg:px-10">
            <Outlet />
          </div>

          {/* Footer - Compact */}
          <footer className="relative border-t shrink-0 border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="px-6 py-2.5 flex flex-col md:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] md:text-xs">
                <span className="text-gray-400">© {new Date().getFullYear()}</span>
                <span className="font-medium text-gray-600">Constitution Club of India</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-gray-500">System Live</span>
                </div>
                <div className="w-px h-3 bg-gray-300"></div>
                <span className="text-[10px] md:text-xs text-blue-500 font-medium whitespace-nowrap">Developed by Beacon Coders</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}