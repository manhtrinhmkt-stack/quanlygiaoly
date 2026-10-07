
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { AttendanceManagement } from './components/AttendanceManagement';
import { Grades } from './components/Grades';
import { Finance } from './components/Finance';
import { Settings } from './components/Settings';
import { Classes } from './components/Classes';
import { AcademicAffairs } from './components/AcademicAffairs';
import { Inventory } from './components/Inventory';
import { MeetingMinutes } from './src/components/MeetingMinutes';
import { Login } from './components/Login';
import { DeviceRegistration } from './components/DeviceRegistration';
import { Communication } from './components/Communication';
import { StudentLookup } from './components/StudentLookup';
import { Curriculum } from './components/Curriculum';
import { MOCK_STUDENTS, MOCK_CLASSES, MOCK_YEARS, MOCK_FINANCE, MOCK_ACADEMIC_RECORDS, MOCK_GRADES, MOCK_TERM_CONFIGS, MOCK_INVENTORY, MOCK_SCORE_COLUMNS, MOCK_DEVICE_REQUESTS, MOCK_TEACHERS, MOCK_ATTENDANCE_DATA, MOCK_CURRICULUM } from './constants';
import { Student, ClassRoom, SchoolYear, Transaction, AcademicRecord, Grade, TermConfig, InventoryItem, ScoreColumn, Teacher, DeviceRequest, DeviceConfig, AttendanceConfig, CommunicationLog, AcademicConfig, CurriculumItem, hasPermission } from './types';
import { Menu, Church, Search, Calendar, Bell, ChevronRight, User } from 'lucide-react';
import { Toaster } from 'sonner';

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  dashboard: { title: 'Trang Chủ & Tổng Quan', category: 'Tổng quan' },
  classes: { title: 'Quản Lý Lớp Học', category: 'Tổng quan' },
  curriculum: { title: 'Chương Trình Đào Tạo', category: 'Tổng quan' },
  students: { title: 'Danh Sách Học Viên', category: 'Học vụ & Giáo lý' },
  teachers: { title: 'Đội Ngũ Giáo Lý Viên', category: 'Học vụ & Giáo lý' },
  attendance: { title: 'Điểm Danh & Chuyên Cần', category: 'Học vụ & Giáo lý' },
  grades: { title: 'Bảng Điểm & Học Lực', category: 'Học vụ & Giáo lý' },
  academic_affairs: { title: 'Học Vụ & Xếp Loại', category: 'Học vụ & Giáo lý' },
  communication: { title: 'Liên Lạc & Thông Báo Phụ Huynh', category: 'Học vụ & Giáo lý' },
  inventory: { title: 'Quản Lý Kho & Sách Vở', category: 'Hậu cần & Vật tư' },
  devices: { title: 'Đăng Ký & Mượn Thiết Bị', category: 'Hậu cần & Vật tư' },
  finance: { title: 'Sổ Quỹ & Tài Chính', category: 'Hậu cần & Vật tư' },
  'meeting-minutes': { title: 'Biên Bản Họp Ban Giáo Lý', category: 'Hậu cần & Vật tư' },
  lookup: { title: 'Tra Cứu Thông Tin Nhanh', category: 'Công cụ' },
  settings: { title: 'Cấu Hình Hệ Thống', category: 'Cài đặt' },
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [showParentMeetingMinutes, setShowParentMeetingMinutes] = useState(false);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
      return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  
  // --- DATA STATE ---
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [classes, setClasses] = useState<ClassRoom[]>(MOCK_CLASSES);
  const [years, setYears] = useState<SchoolYear[]>(MOCK_YEARS);
  const [grades, setGrades] = useState<Grade[]>(MOCK_GRADES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_FINANCE);
  const [records, setRecords] = useState<AcademicRecord[]>(MOCK_ACADEMIC_RECORDS);
  const [termConfigs, setTermConfigs] = useState<TermConfig[]>(MOCK_TERM_CONFIGS);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig>({ academicWeight: 80, attendanceWeight: 20, attendanceLimit: 5.0 });
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [scoreColumns, setScoreColumns] = useState<ScoreColumn[]>(MOCK_SCORE_COLUMNS);
  const [deviceRequests, setDeviceRequests] = useState<DeviceRequest[]>(MOCK_DEVICE_REQUESTS);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({ 
      openTime: '07:00', 
      closeTime: '17:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });
  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfig>({
      allowedDays: [0], // Default to Sunday
      totalMassRequiredHK1: 0,
      totalMassRequiredHK2: 0,
      totalClassRequiredHK1: 0,
      totalClassRequiredHK2: 0,
      isAutoCalculate: false
  });
  const [attendanceData, setAttendanceData] = useState<Record<string, 'C' | 'P' | 'K' | ''>>(MOCK_ATTENDANCE_DATA);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [resendApiKey, setResendApiKey] = useState('');
  
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(() => {
      const saved = localStorage.getItem('curriculum_data');
      return saved ? JSON.parse(saved) : MOCK_CURRICULUM;
  });

  useEffect(() => {
      localStorage.setItem('curriculum_data', JSON.stringify(curriculum));
  }, [curriculum]);

  // Check permissions when activeTab changes
  useEffect(() => {
      if (currentUser && currentUser.role !== 'ADMIN') {
          // Allow settings and curriculum by default regardless of allowedTabs
          if (activeTab !== 'settings' && activeTab !== 'curriculum' && !hasPermission(currentUser, activeTab, 'view')) {
              // Redirect to first allowed tab if current is forbidden
              const tabs = ['dashboard', 'classes', 'students', 'teachers', 'attendance', 'grades', 'academic_affairs', 'communication', 'inventory', 'devices', 'finance', 'meeting-minutes', 'lookup'];
              const firstAllowed = tabs.find(t => hasPermission(currentUser, t, 'view'));
              if (firstAllowed) {
                  setActiveTab(firstAllowed);
              } else {
                  setActiveTab('dashboard'); // Fallback
              }
          }
      }
  }, [activeTab, currentUser]);

  const handleLogin = (user: Teacher) => {
      setCurrentUser(user);
      // Reset tab to dashboard or first allowed tab on login
      if (user.role !== 'ADMIN') {
          const tabs = ['dashboard', 'classes', 'students', 'teachers', 'attendance', 'grades', 'academic_affairs', 'communication', 'inventory', 'devices', 'finance', 'meeting-minutes', 'lookup'];
          const firstAllowed = tabs.find(t => hasPermission(user, t, 'view'));
          setActiveTab(firstAllowed || 'dashboard');
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setActiveTab('dashboard');
  };

  if (!currentUser) {
      if (showParentMeetingMinutes) {
          return (
              <div className="min-h-screen bg-slate-100 p-4">
                  <button onClick={() => setShowParentMeetingMinutes(false)} className="mb-4 text-blue-600 font-bold">← Quay lại</button>
                  <MeetingMinutes mode="PARENT" />
              </div>
          );
      }
      return <Login onLogin={handleLogin} teachers={teachers} setShowParentMeetingMinutes={setShowParentMeetingMinutes} />;
  }

  const renderContent = () => {
    // Double check permission before rendering (except settings and curriculum)
    if (activeTab !== 'settings' && activeTab !== 'curriculum' && !hasPermission(currentUser, activeTab, 'view')) {
        return (
            <div className="flex h-full items-center justify-center flex-col text-slate-400">
                <div className="text-4xl font-bold mb-2">403</div>
                <div className="text-sm">Bạn không có quyền truy cập chức năng này.</div>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard currentUser={currentUser} classes={classes} years={years} students={students} teachers={teachers} records={records} transactions={transactions} inventory={inventory} deviceRequests={deviceRequests} setActiveTab={setActiveTab} />;
      case 'classes': return <Classes classes={classes} setClasses={setClasses} students={students} years={years} grades={grades} currentUser={currentUser} />;
      case 'curriculum': return <Curriculum curriculum={curriculum} setCurriculum={setCurriculum} classes={classes} currentUser={currentUser} />;
      case 'students': return <Students students={students} setStudents={setStudents} classes={classes} years={years} records={records} setRecords={setRecords} grades={grades} currentUser={currentUser} setMainTab={setActiveTab} />;
      case 'academic_affairs': return <AcademicAffairs students={students} setStudents={setStudents} classes={classes} years={years} grades={grades} currentUser={currentUser} records={records} setRecords={setRecords} scoreColumns={scoreColumns} termConfigs={termConfigs} />;
      case 'teachers': return <Teachers teachers={teachers} setTeachers={setTeachers} classes={classes} years={years} currentUser={currentUser} />;
      case 'attendance': return <AttendanceManagement students={students} classes={classes} years={years} grades={grades} setRecords={setRecords} termConfigs={termConfigs} currentUser={currentUser} attendanceConfig={attendanceConfig} attendanceData={attendanceData} setAttendanceData={setAttendanceData} />;
      case 'grades': return <Grades students={students} setStudents={setStudents} classes={classes} years={years} records={records} setRecords={setRecords} grades={grades} scoreColumns={scoreColumns} termConfigs={termConfigs} currentUser={currentUser} attendanceConfig={attendanceConfig} attendanceData={attendanceData} academicConfig={academicConfig}/>;
      case 'devices': return <DeviceRegistration requests={deviceRequests} setRequests={setDeviceRequests} currentUser={currentUser} inventory={inventory} config={deviceConfig} />;
      case 'inventory': return <Inventory items={inventory} setItems={setInventory} currentUser={currentUser} />;
      case 'meeting-minutes': return <MeetingMinutes mode="SECRETARY" />;
      case 'communication': return <Communication students={students} classes={classes} years={years} grades={grades} records={records} termConfigs={termConfigs} scoreColumns={scoreColumns} currentUser={currentUser} logs={communicationLogs} setLogs={setCommunicationLogs} resendApiKey={resendApiKey} />;
      case 'lookup': return <StudentLookup students={students} classes={classes} years={years} grades={grades} />;
      case 'finance': return <Finance transactions={transactions} setTransactions={setTransactions} years={years} currentUser={currentUser} />;
      case 'settings': return <Settings years={years} setYears={setYears} classes={classes} setClasses={setClasses} grades={grades} setGrades={setGrades} termConfigs={termConfigs} setTermConfigs={setTermConfigs} academicConfig={academicConfig} setAcademicConfig={setAcademicConfig} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} currentUser={currentUser} deviceConfig={deviceConfig} setDeviceConfig={setDeviceConfig} inventory={inventory} setInventory={setInventory} attendanceConfig={attendanceConfig} setAttendanceConfig={setAttendanceConfig} resendApiKey={resendApiKey} setResendApiKey={setResendApiKey} />;
      default: return <Dashboard currentUser={currentUser} classes={classes} years={years} students={students} teachers={teachers} records={records} transactions={transactions} inventory={inventory} deviceRequests={deviceRequests} />;
    }
  };

  const activeYear = years.find(y => y.isActive) || years[0];
  const currentTabMeta = TAB_TITLES[activeTab] || { title: 'Quản Lý Giáo Lý', category: 'Hệ thống' };
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden text-slate-800">
      <Toaster position="top-right" richColors />

      {/* Global Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
        }}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main App Container */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Global Top App Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between shadow-xs">
          {/* Left section: Mobile trigger & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Mở danh mục"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="hidden sm:inline hover:text-slate-600 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                Gx. Tân Thành
              </span>
              <ChevronRight size={14} className="hidden sm:inline text-slate-300" />
              <span className="hidden md:inline text-slate-500 font-medium">{currentTabMeta.category}</span>
              <ChevronRight size={14} className="hidden md:inline text-slate-300" />
              <span className="text-slate-900 font-bold text-sm truncate">{currentTabMeta.title}</span>
            </div>
          </div>

          {/* Right section: Year badge, quick search & user chip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search trigger */}
            {activeTab !== 'lookup' && (
              <button 
                onClick={() => setActiveTab('lookup')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="Tra cứu học viên nhanh"
              >
                <Search size={14} className="text-slate-400" />
                <span className="hidden lg:inline">Tra cứu nhanh</span>
              </button>
            )}

            {/* Active Year Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/80 border border-blue-200/70 text-blue-700 rounded-xl text-xs font-bold shadow-xs">
              <Calendar size={13} className="text-blue-500 shrink-0" />
              <span className="truncate max-w-[120px]">{activeYear ? activeYear.name : 'Năm học'}</span>
            </div>

            {/* User Quick Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs">
                {currentUser?.fullName.charAt(0)}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[110px]">
                  {currentUser?.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {isAdmin ? 'Quản trị viên' : (currentUser?.saintName || 'Giáo lý viên')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
