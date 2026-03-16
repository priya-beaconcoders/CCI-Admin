

// 📁 layout/AdminLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  LogOut,
  Home,
  ChevronRight,
  Menu,
  X,
  Building2,
  Clock,
  Activity,
  Star,
  Moon,
  Sun
} from "lucide-react";
import { useState, useEffect } from "react";
import SidebarItem from "../components/SidebarItem";
import logo from "../assets/logo-india.png";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [notifications] = useState(0); // Notifications removed as requested
  



  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Menu items with consistent color scheme
  const menuItems = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      path: "/dashboard",
      color: "primary",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BookOpen,
      title: "Bookings",
      path: "/bookings",
      color: "orange",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: Home,
      title: "Masters",
      path: "/masters",
      color: "green",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Staff",
      path: "/staff",
      color: "purple",
      gradient: "from-purple-500 to-violet-500"
    },
    // {
    //   icon: SettingsIcon,
    //   title: "Settings",
    //   path: "/settings",
    //   color: "gray",
    //   gradient: "from-gray-600 to-gray-700"
    // },
    {
      icon: FileText,
      title: "Reports",
      path: "/reports",
      color: "rose",
      gradient: "from-rose-500 to-pink-500"
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = menuItems.find(item => item.path === location.pathname);
    return item ? item.title : "Dashboard";
  };

  // Current time display
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      darkMode 
        ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-gray-50'
    }`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50
        w-80 h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
        ${darkMode 
          ? 'bg-gray-900/95 backdrop-blur-xl border-r border-gray-800' 
          : 'bg-white/95 backdrop-blur-xl border-r border-gray-200'
        }
        shadow-2xl
      `}>
        {/* Logo Section - Updated with proper logo handling */}
        <div className={`h-24 flex items-center gap-4 px-6 ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500'
        }`}>
          <div className="relative">
            {/* Logo - Now with proper styling */}
            <img 
              src={logo} 
              alt="Constitution Club of India" 
              className="h-16 w-16 object-contain"
              style={{
                filter: darkMode ? 'none' : 'brightness(1.1) contrast(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/64/1e40af/ffffff?text=CCI";
              }}
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
              darkMode ? 'border-gray-900' : 'border-white'
            }`}>
              <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
            </div>
          </div>
          <div className="flex flex-col">
            {/* Club Name with Orange, Green, White Gradient */}
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wide text-white drop-shadow-md">
                <span className="bg-gradient-to-r from-amber-400 via-white to-emerald-400 bg-clip-text text-transparent">
                  Constitution Club
                </span>
              </span>
              <span className="text-xs text-white/90 tracking-tight mt-[-2px]">
                <span className="bg-gradient-to-r from-orange-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  of India
                </span>
              </span>
              <p className="text-xs text-emerald-300/90 font-medium mt-1">• Luxury Hospitality •</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}


        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-2 py-3">
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 flex items-center gap-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
              Navigation
            </p>
            {menuItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                title={item.title}
                active={location.pathname === item.path}
                gradient={item.gradient}
                darkMode={darkMode}
                onClick={() => {
                  navigate(item.path);
                  window.innerWidth < 1024 && setSidebarOpen(false);
                }}
              />
            ))}
          </div>

          {/* Current Time */}
          <div className={`px-4 py-4 rounded-xl mx-2 ${
            darkMode 
              ? 'bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
              : 'bg-gradient-to-r from-blue-50/60 to-cyan-50/60 border border-blue-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Current Time</span>
              </div>
              <span className={`text-lg font-bold ${
                darkMode ? 'text-cyan-300' : 'text-cyan-600'
              }`}>{currentTime}</span>
            </div>
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-200/30 dark:border-gray-800/30">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                darkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                darkMode ? 'left-7' : 'left-1'
              }`}></div>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              darkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800/60 border border-gray-700/50 hover:border-gray-600/50' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              darkMode ? 'bg-gray-800/60' : 'bg-gray-100'
            }`}>
              <LogOut className={`w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <span>Sign Out</span>
            <ChevronRight className={`w-4 h-4 ml-auto ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
          </button>
          
          {/* Footer Text */}
          <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-800/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
            </div>
            <p className={`text-xs ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>CCI HMS v2.1 • Premium</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`sticky top-0 z-40 ${
          darkMode 
            ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50' 
            : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50'
        }`}>
          <div className="h-16 px-6 flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl transition-colors"
              >
                <Menu className={`w-5 h-5 ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`} />
              </button>
              
              {/* Page Title */}
              <div className="flex items-center gap-3">
                <div className={`
                  w-2 h-8 rounded-full bg-gradient-to-b
                  ${location.pathname === '/dashboard' ? 'from-blue-500 to-cyan-500' :
                    location.pathname === '/bookings' ? 'from-orange-500 to-amber-500' :
                    location.pathname === '/masters' ? 'from-emerald-500 to-teal-500' :
                    location.pathname === '/staff' ? 'from-purple-500 to-violet-500' :
                    location.pathname === '/settings' ? 'from-gray-600 to-gray-700' :
                    'from-rose-500 to-pink-500'}
                `}></div>
                <div>
                  <h1 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getPageTitle()}
                  </h1>
                  <p className={`text-sm flex items-center gap-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Building2 className="w-3 h-3" />
                    Constitution Club Hotel Management
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            {/* <div className="flex items-center gap-4">
              {/* Search *
              <div className="relative hidden md:block">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="text"
                  placeholder="Search..."
                  className={`pl-10 pr-4 py-2 w-64 rounded-xl text-sm transition-colors ${
                    darkMode 
                      ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300 placeholder-gray-500 focus:bg-gray-800 focus:border-blue-500/50' 
                      : 'bg-gray-100/50 border border-gray-200/50 text-gray-700 placeholder-gray-400 focus:bg-white focus:border-blue-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              {/* Notifications - Removed as requested */}
              {/* <button className={`relative p-2 rounded-xl transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-900'
              }`}>
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    {notifications}
                  </span>
                )}
              </button> */}

              {/* Refresh Button 
              <button 
                onClick={fetchDashboardData}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-900'
                }`}
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

            </div> */}
          </div>

          {/* Breadcrumb */}
          <div className={`px-6 py-2 border-t ${
            darkMode 
              ? 'border-gray-800/50 bg-gray-900/30' 
              : 'border-gray-100/50 bg-white/30'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-1 transition-colors ${
                  darkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-3 h-3" />
                Home
              </button>
              <ChevronRight className={`w-3 h-3 ${
                darkMode ? 'text-gray-700' : 'text-gray-300'
              }`} />
              <span className={`font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {getPageTitle()}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
          
          {/* Footer */}
          <footer className={`border-t ${
            darkMode 
              ? 'border-gray-800/50 bg-gray-900/50' 
              : 'border-gray-200/50 bg-white/50'
          }`}>
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                  </div>
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Constitution Club of India • Luxury Hospitality
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Activity className="w-3 h-3 text-green-500" />
                    <span>Live</span>
                  </div>
                  <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>•</span>
                  <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>v2.1.0</span>
                  <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>•</span>
                  <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>© {new Date().getFullYear()}</span>
                  <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>•</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3" />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30 text-center">
                <p className={`text-xs ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Developed and managed by Beacon Coders
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}