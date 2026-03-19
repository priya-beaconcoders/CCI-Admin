// 📁 components/SidebarItem.jsx
import { ChevronRight } from "lucide-react";

export default function SidebarItem({ 
  icon: Icon, 
  title, 
  active, 
  collapsed,
  onClick 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group w-full flex items-center h-10 min-w-0 overflow-hidden z-10
        px-3 transition-all duration-300 leading-none
        ${collapsed ? 'justify-center' : 'gap-3'}
        rounded-xl
        ${active 
          ? 'text-white'
          : 'text-gray-500 hover:text-blue-600'
        }
      `}
    >
      {/* WRAPPER FOR STABLE LAYOUT */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* ICON - Stable vertical axis */}
        <Icon className={`
          w-5 h-5 flex-shrink-0 transition-all duration-300
          ${active 
            ? 'text-white' 
            : 'text-gray-400 group-hover:text-blue-500'
          }
        `} />

        {/* TEXT - Stable animatable max-width */}
        <span className={`
          text-sm font-medium tracking-tight truncate whitespace-nowrap
          transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed 
            ? 'opacity-0 scale-95 max-w-0 ml-0' 
            : 'opacity-100 scale-100 max-w-[140px] ml-0'
          }
        `}>
          {title}
        </span>
      </div>

      {/* ACTIVE PULSE - Fades and scales */}
      <div 
        className={`
          absolute right-2 w-1.5 h-1.5 rounded-full bg-white/40
          transition-all duration-300
          ${(collapsed || !active) ? 'opacity-0 scale-0' : 'opacity-100 animate-pulse'}
        `}
      />

      {/* ARROW - Stable animatable max-width */}
      <ChevronRight
        className={`
          w-3.5 h-3.5 ml-auto flex-shrink-0
          transition-all duration-300 ease-in-out
          ${collapsed 
            ? 'opacity-0 scale-75 max-w-0' 
            : active 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 max-w-[20px]'
          }
        `}
      />

      {/* TOOLTIP */}
      <div className={`
        absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold rounded-md
        bg-gray-900 text-white whitespace-nowrap
        shadow-xl pointer-events-none z-50 transition-all duration-200
        ${collapsed 
          ? 'opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0' 
          : 'opacity-0 pointer-events-none'
        }
      `}>
        {title}
      </div>
    </button>
  );
}