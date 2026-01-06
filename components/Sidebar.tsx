
import React from 'react';
import { 
  LayoutDashboard, Users, CalendarCheck, BookOpenCheck, Settings, Wallet, 
  Church, GraduationCap, LogOut, School, ArrowRightLeft, Package, MonitorPlay
} from 'lucide-react';
import { Teacher } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean; 
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  currentUser: Teacher | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, currentUser, onLogout 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'classes', label: 'Lớp Học', icon: School, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'students', label: 'Học Viên', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { id: 'placement', label: 'Xếp Lớp', icon: ArrowRightLeft, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { id: 'attendance', label: 'Chuyên Cần', icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'grades', label: 'Bảng Điểm', icon: BookOpenCheck, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { id: 'devices', label: 'Thiết bị', icon: MonitorPlay, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
    { id: 'teachers', label: 'Giáo Lý Viên', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'inventory', label: 'Kho & Vật Tư', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'finance', label: 'Thủ Quỹ', icon: Wallet, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'settings', label: 'Cài Đặt', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN') return true;
      if (item.id === 'settings') return true; 
      return currentUser.allowedTabs?.includes(item.id);
  });

  return (
    <div 
      className={`bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-[100] transition-transform duration-300 ease-in-out 
        ${isMobileOpen ? 'translate-x-0 w-16' : '-translate-x-full'} 
        md:translate-x-0 md:w-16 shadow-xl
      `}
    >
      {/* Header Logo */}
      <div className="h-14 flex items-center justify-center border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-200/50 flex items-center justify-center">
           <Church className="text-white w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Navigation - Removed overflow-hidden to allow tooltips */}
      <nav className="flex-1 py-3 flex flex-col items-center gap-2 w-full px-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 
                ${isActive ? `${item.bg} shadow-sm ring-1 ring-inset ${item.border}` : 'hover:bg-slate-50 bg-transparent'}
              `}
            >
              {/* Icon always shows color */}
              <Icon 
                className={`w-5 h-5 transition-all duration-200 ${item.color} ${isActive ? 'scale-110 drop-shadow-sm' : 'opacity-70 grayscale-[0.3] group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110'}`} 
                strokeWidth={2.5}
              />
              
              {/* Tooltip - Fixed positioning strategy for reliability */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[110] shadow-xl border border-slate-700 pointer-events-none origin-left scale-95 group-hover:scale-100">
                  {/* Arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-slate-800"></div>
                  {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer / User / Logout */}
      <div className="p-3 border-t border-slate-100 flex flex-col items-center gap-3 bg-slate-50/50">
        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-600 text-xs" title={`${currentUser?.saintName} ${currentUser?.fullName}`}>
            {currentUser?.fullName.charAt(0)}
        </div>

        <button 
          onClick={onLogout}
          className="w-9 h-9 flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group relative"
        >
           <LogOut size={18} strokeWidth={2.5}/> 
           <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[110] shadow-xl pointer-events-none origin-left scale-95 group-hover:scale-100">
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-rose-600"></div>
              Đăng xuất
           </div>
        </button>
      </div>
    </div>
  );
};
