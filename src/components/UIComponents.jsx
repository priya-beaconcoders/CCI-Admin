import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

/**
 * PRODUCTION-GRADE UI SYSTEM
 * Standardized spacing, alignment, and loading states.
 */

/* ================= PAGE LAYOUT ================= */
export const PageLayout = ({ children, className = "" }) => (
  <div
    className={`
      flex-1 w-full flex flex-col min-h-0 lg:overflow-hidden
      px-2 py-3 lg:px-3
      pb-[calc(28px+env(safe-area-inset-bottom))]
      ${className}
    `}
  >
    <div className="flex-1 flex flex-col min-h-0 lg:overflow-visible space-y-4 bg-gray-50">
      {children}
    </div>
  </div>
);

/* ================= ACTION ICON ================= */
// Static ring map — Tailwind does NOT support dynamic class strings like `focus:ring-${color}/20`
const ringMap = {
  "blue-500":    "focus:ring-blue-500/20",
  "orange-500":  "focus:ring-orange-500/20",
  "emerald-500": "focus:ring-emerald-500/20",
  "red-500":     "focus:ring-red-500/20",
  "rose-500":    "focus:ring-rose-500/20",
  "indigo-500":  "focus:ring-indigo-500/20",
};

export const ActionIcon = ({ children, onClick, title, className = "", disabled = false, ringColor = "blue-500" }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 ${ringMap[ringColor] ?? "focus:ring-blue-500/20"} ${className}`}
  >
    {children}
  </button>
);

/* ================= EMPTY STATE ================= */
export const EmptyState = ({ icon: Icon, title, message, actionText, onAction }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-3 min-h-[180px] sm:min-h-[240px] bg-white/50 border-t border-gray-50 uppercase tracking-tight">
    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
      {Icon && <Icon className="w-6 h-6" />}
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 font-medium max-w-[240px] leading-relaxed mx-auto">{message}</p>
    </div>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-2 h-9 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
      >
        <Plus className="w-3.5 h-3.5" />
        {actionText}
      </button>
    )}
  </div>
);

/* ================= CONTENT CARD ================= */
export const ContentCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col min-h-0 overflow-hidden ${className}`}>
    {children}
  </div>
);

/* ================= PAGINATION ================= */
export const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange, themeColor = "blue" }) => {
  const isEmpty = !totalItems || totalItems === 0;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [8, 10, 50, 100];
  const start = currentPage * itemsPerPage + 1;
  const end = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  // Dynamic theme classes
  const btnActiveTheme = themeColor === 'orange' ? 'bg-orange-600 text-white shadow-md' :
                        themeColor === 'emerald' ? 'bg-emerald-600 text-white shadow-md' :
                        'bg-blue-600 text-white shadow-md';
  const dropdownTheme = themeColor === 'orange' ? 'bg-orange-50 text-orange-600' :
                        themeColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-blue-50 text-blue-600';
  const dropdownHoverTheme = themeColor === 'orange' ? 'hover:bg-orange-50/50 hover:text-orange-600' :
                             themeColor === 'emerald' ? 'hover:bg-emerald-50/50 hover:text-emerald-600' :
                             'hover:bg-blue-50/50 hover:text-blue-600';

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 shrink-0 flex flex-row items-center justify-between gap-1 bg-white/95 backdrop-blur-md px-3 py-2 border-t border-gray-100 shadow-[0_-8px_15px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-tight whitespace-nowrap leading-tight">
          <span className="hidden min-[400px]:inline text-gray-400">Showing </span>
          <span className="text-gray-900">{start}–{end}</span>
          <span className="text-gray-400 px-1">of</span>
          <span className="text-gray-900">{totalItems}</span>
        </p>
        
        <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
          <div className="relative flex items-center h-5" ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 bg-transparent border-none text-xs font-bold text-gray-900 h-full py-0 pr-4 cursor-pointer focus:outline-none"
            >
              <span>{itemsPerPage}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 absolute right-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
              <div className="absolute bottom-full mb-2 left-0 min-w-[60px] bg-white border border-gray-100 rounded-xl shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                {options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => {
                      onItemsPerPageChange(opt);
                      onPageChange(0);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${itemsPerPage === opt ? dropdownTheme : 'text-gray-700 ' + dropdownHoverTheme}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0 || isEmpty}
          className="h-8 pr-3 pl-2 flex items-center gap-1 text-xs font-bold rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="hidden sm:flex gap-1 mx-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i ? btnActiveTheme : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {i+1}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1 || totalPages === 0 || isEmpty}
          className="h-8 pl-3 pr-2 flex items-center gap-1 text-xs font-bold rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white shadow-sm"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ================= SKELETONS ================= */

export const MobileCardSkeleton = () => (
  <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-gray-50 animate-pulse shrink-0" />
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-2 w-24 bg-gray-50 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gray-50 animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-gray-50 animate-pulse" />
      </div>
    </div>
  </div>
);

// Skeleton should be lightweight — no backdrop-blur, no shadow
export const HeaderSkeleton = ({ hasSubtitle = true }) => (
  <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-3 h-14 flex items-center justify-between gap-2">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="w-9 h-9 rounded-lg bg-gray-50 animate-pulse shrink-0" />
      <div className="space-y-1.5 hidden sm:block">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        {hasSubtitle && <div className="h-2.5 w-40 bg-gray-50 rounded animate-pulse" />}
      </div>
      <div className="h-10 flex-1 max-w-[180px] bg-gray-50 rounded-lg animate-pulse ml-1" />
    </div>
    <div className="h-10 w-24 bg-blue-50/50 rounded-lg animate-pulse shrink-0" />
  </div>
);
