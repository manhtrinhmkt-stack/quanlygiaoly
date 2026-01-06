
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { Attendance } from './components/Attendance';
import { Grades } from './components/Grades';
import { Finance } from './components/Finance';
import { Settings } from './components/Settings';
import { Classes } from './components/Classes';
import { ClassPlacement } from './components/ClassPlacement';
import { Inventory } from './components/Inventory';
import { Login } from './components/Login';
import { DeviceRegistration } from './components/DeviceRegistration';
import { MOCK_STUDENTS, MOCK_CLASSES, MOCK_YEARS, MOCK_FINANCE, MOCK_ACADEMIC_RECORDS, MOCK_GRADES, MOCK_TERM_CONFIGS, MOCK_INVENTORY, MOCK_SCORE_COLUMNS, MOCK_DEVICE_REQUESTS } from './constants';
import { Student, ClassRoom, SchoolYear, Transaction, AcademicRecord, Grade, TermConfig, InventoryItem, ScoreColumn, Teacher, DeviceRequest, DeviceConfig } from './types';
import { Menu, Church } from 'lucide-react';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- DATA STATE ---
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [classes, setClasses] = useState<ClassRoom[]>(MOCK_CLASSES);
  const [years, setYears] = useState<SchoolYear[]>(MOCK_YEARS);
  const [grades, setGrades] = useState<Grade[]>(MOCK_GRADES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_FINANCE);
  const [records, setRecords] = useState<AcademicRecord[]>(MOCK_ACADEMIC_RECORDS);
  const [termConfigs, setTermConfigs] = useState<TermConfig[]>(MOCK_TERM_CONFIGS);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [scoreColumns, setScoreColumns] = useState<ScoreColumn[]>(MOCK_SCORE_COLUMNS);
  const [deviceRequests, setDeviceRequests] = useState<DeviceRequest[]>(MOCK_DEVICE_REQUESTS);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({ 
      openTime: '07:00', 
      closeTime: '17:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  // Check permissions when activeTab changes
  useEffect(() => {
      if (currentUser && currentUser.role !== 'ADMIN' && currentUser.allowedTabs) {
          // Allow settings by default regardless of allowedTabs
          if (activeTab !== 'settings' && !currentUser.allowedTabs.includes(activeTab)) {
              // Redirect to first allowed tab if current is forbidden
              if (currentUser.allowedTabs.length > 0) {
                  setActiveTab(currentUser.allowedTabs[0]);
              } else {
                  setActiveTab('dashboard'); // Fallback
              }
          }
      }
  }, [activeTab, currentUser]);

  const handleLogin = (user: Teacher) => {
      setCurrentUser(user);
      // Reset tab to dashboard or first allowed tab on login
      if (user.role !== 'ADMIN' && user.allowedTabs && user.allowedTabs.length > 0) {
          setActiveTab(user.allowedTabs[0]);
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setActiveTab('dashboard');
  };

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Double check permission before rendering (except settings)
    if (activeTab !== 'settings' && currentUser.role !== 'ADMIN' && currentUser.allowedTabs && !currentUser.allowedTabs.includes(activeTab)) {
        return (
            <div className="flex h-full items-center justify-center flex-col text-slate-400">
                <div className="text-4xl font-bold mb-2">403</div>
                <div className="text-sm">Bạn không có quyền truy cập chức năng này.</div>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard currentUser={currentUser} classes={classes} years={years} />;
      case 'classes': return <Classes classes={classes} setClasses={setClasses} students={students} years={years} grades={grades} currentUser={currentUser} />;
      case 'students': return <Students students={students} setStudents={setStudents} classes={classes} years={years} records={records} grades={grades} currentUser={currentUser} />;
      case 'placement': return <ClassPlacement students={students} setStudents={setStudents} classes={classes} years={years} grades={grades} currentUser={currentUser} records={records} scoreColumns={scoreColumns} />;
      case 'teachers': return <Teachers />;
      case 'attendance': return <Attendance students={students} classes={classes} years={years} grades={grades} setRecords={setRecords} termConfigs={termConfigs} currentUser={currentUser} />;
      case 'grades': return <Grades students={students} setStudents={setStudents} classes={classes} years={years} records={records} setRecords={setRecords} grades={grades} scoreColumns={scoreColumns} currentUser={currentUser} />;
      case 'devices': return <DeviceRegistration requests={deviceRequests} setRequests={setDeviceRequests} currentUser={currentUser} inventory={inventory} config={deviceConfig} />;
      case 'inventory': return <Inventory items={inventory} setItems={setInventory} />;
      case 'finance': return <Finance transactions={transactions} setTransactions={setTransactions} />;
      case 'settings': return <Settings years={years} setYears={setYears} classes={classes} setClasses={setClasses} grades={grades} setGrades={setGrades} termConfigs={termConfigs} setTermConfigs={setTermConfigs} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} currentUser={currentUser} deviceConfig={deviceConfig} setDeviceConfig={setDeviceConfig} inventory={inventory} setInventory={setInventory} />;
      default: return <Dashboard currentUser={currentUser} classes={classes} years={years} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans relative">
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Church size={16} />
                </div>
                <span className="font-bold text-slate-800 text-sm uppercase">Gx. Tân Thành</span>
            </div>
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false); // Close mobile menu on select
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main 
        className={`flex-1 transition-all duration-300 ease-in-out pt-16 md:pt-0 md:ml-16 w-full`}
      >
        {renderContent()}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
