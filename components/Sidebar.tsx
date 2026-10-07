import React from 'react';
import { 
  LayoutDashboard, Users, CalendarCheck, BookOpenCheck, Settings, Wallet, 
  Church, GraduationCap, LogOut, School, Package, MonitorPlay, FileText, Mail, Search, ClipboardList, Menu, X,
  ChevronLeft, ChevronRight, Zap, BookOpen, ShieldCheck, UserCheck
} from 'lucide-react';
import { Teacher, hasPermission } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  currentUser: Teacher | null;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

interface MenuGroup {
  groupLabel?: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, currentUser, onLogout,
  isCollapsed, setIsCollapsed
}) => {
  const isVisualExpanded = !isCollapsed;
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuGroups: MenuGroup[] = [
    {
      groupLabel: 'Tổng quan',
      items: [
        { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50/80', border: 'border-blue-200' },
        { id: 'classes', label: 'Lớp Học', icon: School, color: 'text-emerald-600', bg: 'bg-emerald-50/80', border: 'border-emerald-200' },
        { id: 'curriculum', label: 'Chương Trình', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50/80', border: 'border-amber-200' },
      ]
    },
    {
      groupLabel: 'Học vụ & Giáo lý',
      items: [
        { id: 'students', label: 'Học Viên', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50/80', border: 'border-violet-200' },
        { id: 'teachers', label: 'Giáo Lý Viên', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50/80', border: 'border-indigo-200' },
        { id: 'attendance', label: 'Điểm Danh', icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50/80', border: 'border-amber-200' },
        { id: 'grades', label: 'Bảng Điểm', icon: BookOpenCheck, color: 'text-rose-600', bg: 'bg-rose-50/80', border: 'border-rose-200' },
        { id: 'academic_affairs', label: 'Học Vụ', icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-50/80', border: 'border-cyan-200' },
        { id: 'communication', label: 'Liên Lạc', icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50/80', border: 'border-sky-200' },
      ]
    },
    {
      groupLabel: 'Hậu cần & Vật tư',
      items: [
        { id: 'inventory', label: 'Kho & Vật Tư', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50/80', border: 'border-orange-200' },
        { id: 'devices', label: 'Thiết Bị', icon: MonitorPlay, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200' },
        { id: 'finance', label: 'Thủ Quỹ', icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50/80', border: 'border-teal-200' },
        { id: 'meeting-minutes', label: 'Biên Bản', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50/80', border: 'border-purple-200' },
      ]
    },
    {
      groupLabel: 'Công cụ & Hệ thống',
      items: [
        { id: 'lookup', label: 'Tra Cứu', icon: Search, color: 'text-blue-500', bg: 'bg-blue-50/80', border: 'border-blue-200' },
        { id: 'settings', label: 'Cài Đặt', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
      ]
    }
  ];

  // Helper to filter allowed items in each group
  const isItemVisible = (itemId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (itemId === 'settings' || itemId === 'curriculum') return true;
    return hasPermission(currentUser, itemId, 'view');
  };

  return (
    <>
      {/* Mobile slide-out backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-[90] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside 
        className={`bg-white border-r border-slate-200/80 flex flex-col h-screen fixed left-0 top-0 z-[100] transition-all duration-300 ease-in-out select-none
          ${isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'} 
          ${isVisualExpanded ? 'md:w-64 md:shadow-none' : 'md:w-20 md:shadow-none'}
        `}
      >
        {/* Toggle Collapse Button (Desktop only) */}
        <button
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebar_collapsed', newState ? 'true' : 'false');
          }}
          className="hidden md:flex absolute -right-3.5 top-5 w-7 h-7 bg-white border border-slate-200/90 rounded-full items-center justify-center shadow-sm hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition-all z-[110] cursor-pointer"
          title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          aria-label="Toggle menu collapse"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>

        {/* Header Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 bg-white overflow-hidden shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-sm flex items-center justify-center shrink-0 ring-2 ring-blue-100">
               <Church className="text-white w-5 h-5" strokeWidth={2.2} />
            </div>
            
            {/* Show brand label only when not collapsed (or on mobile) */}
            <div className={`flex flex-col truncate transition-opacity duration-200 ${isVisualExpanded ? 'opacity-100' : 'md:opacity-0 md:w-0'}`}>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-sm leading-tight tracking-tight whitespace-nowrap">Gx. Tân Thành</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase whitespace-nowrap">Hệ thống Giáo lý</span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Navigation Groups */}
        <nav className={`flex-1 py-3 flex flex-col gap-4 w-full px-3 custom-scrollbar overflow-y-auto ${!isVisualExpanded ? 'md:px-2' : ''}`}>
          {menuGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => isItemVisible(item.id));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {/* Group Header Label */}
                {group.groupLabel && isVisualExpanded && (
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.groupLabel}
                  </div>
                )}
                {!isVisualExpanded && gIdx > 0 && (
                  <div className="hidden md:block my-2 border-t border-slate-100" />
                )}

                {/* Group Items */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileOpen(false);
                        }}
                        className={`group relative w-full flex items-center rounded-xl transition-all duration-150 text-left cursor-pointer
                          ${isVisualExpanded ? 'px-3 py-2' : 'md:justify-center md:px-0 py-2.5'}
                          ${isActive 
                            ? `${item.bg} text-slate-900 font-bold shadow-xs border ${item.border}` 
                            : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900 border border-transparent'
                          }
                        `}
                        title={!isVisualExpanded ? item.label : undefined}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${isActive ? 'bg-white shadow-xs' : 'bg-transparent'}`}>
                          <Icon 
                            className={`w-4 h-4 transition-all duration-150 ${item.color} ${isActive ? 'scale-110' : 'opacity-80 group-hover:opacity-100'}`} 
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                        </div>
                        
                        {/* Text Label */}
                        <span className={`text-[13px] transition-opacity duration-200 ml-2.5 whitespace-nowrap truncate font-medium
                          ${isVisualExpanded ? 'opacity-100' : 'md:hidden md:opacity-0 md:w-0'} 
                          ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}
                        `}>
                          {item.label}
                        </span>

                        {/* Active dot indicator on the right */}
                        {isActive && isVisualExpanded && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}

                        {/* Hover Tooltip (Only shown when collapsed on desktop) */}
                        {!isVisualExpanded && (
                          <span className="absolute left-16 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 hidden md:inline">
                            {item.label}
                            <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile & Logout Area */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-2 overflow-hidden shrink-0">
          <div className={`flex items-center gap-2.5 ${isVisualExpanded ? 'px-1.5 py-1' : 'md:justify-center px-0'}`}>
             <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-blue-200">
                 {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
             </div>
             
             <div className={`flex flex-col truncate transition-opacity duration-200 ${isVisualExpanded ? 'opacity-100' : 'md:hidden md:opacity-0 md:w-0'}`}>
                <span className="text-xs font-bold text-slate-800 leading-tight truncate">
                   {currentUser?.fullName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                   <span className="text-[10px] text-slate-500 font-medium truncate">
                      {currentUser?.saintName || 'GLV'}
                   </span>
                   <span className="text-slate-300">•</span>
                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isAdmin ? 'Admin' : 'GLV'}
                   </span>
                </div>
             </div>
          </div>

          <button 
            onClick={onLogout}
            className={`flex items-center text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-200 rounded-xl transition-all group relative cursor-pointer
              ${isVisualExpanded ? 'w-full gap-2.5 px-3 py-1.5' : 'md:justify-center md:px-0 py-2'}
            `}
          >
             <LogOut size={15} strokeWidth={2.2} className="shrink-0 transition-transform group-hover:-translate-x-0.5" /> 
             
             <span className={`text-xs font-semibold transition-opacity duration-200 whitespace-nowrap ${isVisualExpanded ? 'opacity-100' : 'md:hidden md:opacity-0'}`}>
                Đăng xuất
             </span>

             {/* Logout Tooltip when collapsed */}
             {!isVisualExpanded && (
               <span className="absolute left-16 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 hidden md:inline">
                  Đăng xuất
                  <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-600 rotate-45" />
               </span>
             )}
          </button>
        </div>
      </aside>
    </>
  );
};

