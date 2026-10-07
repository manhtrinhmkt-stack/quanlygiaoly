
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_SAINTS } from '../constants';
import { Building, Layers, GraduationCap, MonitorPlay, UserCog, UserCheck, History, Mail, BookOpen } from 'lucide-react';
import { Saint, SchoolYear, ClassRoom, Grade, TermConfig, ScoreColumn, Teacher, DeviceConfig, InventoryItem, AttendanceConfig, AcademicConfig } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';

// Sub-components
import { GeneralInfo } from './settings/GeneralInfo';
import { AcademicManagement } from './settings/AcademicManagement';
import { GradingConfig } from './settings/GradingConfig';
import { DeviceConfig as DeviceConfigComp } from './settings/DeviceConfig';
import { SaintsManagement } from './settings/SaintsManagement';
import { AccountSecurity } from './settings/AccountSecurity';
import { AttendanceConfigComp } from './settings/AttendanceConfig';
import { SystemHistory } from './settings/SystemHistory';

interface SettingsProps {
    years: SchoolYear[];
    setYears: (years: SchoolYear[]) => void;
    classes: ClassRoom[];
    setClasses: (classes: ClassRoom[]) => void;
    grades: Grade[];
    setGrades: (grades: Grade[]) => void;
    termConfigs: TermConfig[];
    setTermConfigs: React.Dispatch<React.SetStateAction<TermConfig[]>>;
    scoreColumns: ScoreColumn[];
    setScoreColumns: React.Dispatch<React.SetStateAction<ScoreColumn[]>>;
    academicConfig: AcademicConfig;
    setAcademicConfig: (cfg: AcademicConfig) => void;
    currentUser: Teacher | null;
    deviceConfig: DeviceConfig;
    setDeviceConfig: (config: DeviceConfig) => void;
    inventory: InventoryItem[];
    setInventory: (items: InventoryItem[]) => void;
    attendanceConfig: AttendanceConfig;
    setAttendanceConfig: (config: AttendanceConfig) => void;
    resendApiKey: string;
    setResendApiKey: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    years, setYears, classes, setClasses, grades, setGrades, 
    termConfigs, setTermConfigs, scoreColumns, setScoreColumns, academicConfig, setAcademicConfig,
    currentUser, deviceConfig, setDeviceConfig, inventory, setInventory,
    attendanceConfig, setAttendanceConfig, resendApiKey, setResendApiKey
}) => {
  const [saints, setSaints] = useState<Saint[]>(MOCK_SAINTS);
  const [newSaintName, setNewSaintName] = useState('');
  const [newSaintGender, setNewSaintGender] = useState<'Male'|'Female'>('Male');
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'catalog' | 'grading' | 'attendance' | 'email' | 'devices' | 'security' | 'history'>('general');

  const isAdmin = currentUser?.role === 'ADMIN';

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  // --- TABS DEFINITION ---
  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Building, show: isAdmin },
    { id: 'academic', label: 'Niên khóa & Lớp', icon: Layers, show: isAdmin },
    { id: 'catalog', label: 'Danh mục', icon: BookOpen, show: isAdmin }, // Added BookOpen as a placeholder icon for catalog
    { id: 'grading', label: 'Học vụ & Điểm', icon: GraduationCap, show: isAdmin },
    { id: 'attendance', label: 'Điểm danh', icon: UserCheck, show: isAdmin },
    { id: 'email', label: 'Cấu hình Email', icon: Mail, show: isAdmin },
    { id: 'devices', label: 'Thiết bị', icon: MonitorPlay, show: isAdmin },
    { id: 'security', label: 'Bảo mật', icon: UserCog, show: true },
    { id: 'history', label: 'Lịch sử hệ thống', icon: History, show: isAdmin },
  ].filter(t => t.show);

  // --- GENERAL INFO STATE ---
  const [parishName, setParishName] = useState('Giáo Xứ Tân Thành');
  const [priestName, setPriestName] = useState('Giuse Nguyễn Văn Cha');
  const [headOfBoardName, setHeadOfBoardName] = useState('');
  const [address, setAddress] = useState('123 Đường Chúa Cứu Thế, Quận 3, TP.HCM');
  const [phone, setPhone] = useState('028 3838 3838');

  // --- GRADING CONFIG STATE ---
  const [passScore, setPassScore] = useState(5.0);
  const [gradingScale, setGradingScale] = useState([
      { label: 'Giỏi', min: 8.0, color: 'text-green-600' },
      { label: 'Khá', min: 6.5, color: 'text-blue-600' },
      { label: 'Trung Bình', min: 5.0, color: 'text-orange-600' },
      { label: 'Yếu', min: 0.0, color: 'text-red-600' }
  ]);

  // --- PASSWORD CHANGE STATE ---
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Drag states
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [draggedGradeId, setDraggedGradeId] = useState<string | null>(null);
  const [dragOverGradeId, setDragOverGradeId] = useState<string | null>(null);
  const [draggedClassId, setDraggedClassId] = useState<string | null>(null);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);

  // --- EDITING STATES FOR GRADES & CLASSES ---
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editGradeName, setEditGradeName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');

  const [activeYearForTerms, setActiveYearForTerms] = useState('');
  const [gradingScopeType, setGradingScopeType] = useState<'GLOBAL' | 'GRADE'>('GLOBAL');
  const [gradingScopeId, setGradingScopeId] = useState<string>('');

  const handleApplyToAllGrades = () => {
    if (gradingScopeType !== 'GRADE' || !gradingScopeId) {
        toast.error("Vui lòng chọn một khối lớp để áp dụng!");
        return;
    }
    
    const currentGradeCols = scoreColumns.filter(c => c.gradeId === gradingScopeId);
    if (currentGradeCols.length === 0) {
        toast.error("Khối lớp hiện tại chưa có cấu hình cột điểm nào!");
        return;
    }

    const otherGrades = grades.filter(g => g.id !== gradingScopeId);
    
    triggerConfirm(
      "Áp dụng cấu hình điểm",
      `Bạn có chắc muốn áp dụng cấu hình này cho tất cả ${otherGrades.length} khối lớp còn lại? Thao tác này sẽ ghi đè cấu hình hiện có của các khối đó.`,
      () => {
        // Remove all existing columns for other grades
        let newScoreColumns = scoreColumns.filter(c => !c.gradeId || c.gradeId === gradingScopeId);

        // Duplicate current columns for each other grade
        otherGrades.forEach(grade => {
            currentGradeCols.forEach(col => {
                newScoreColumns.push({
                    ...col,
                    id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    gradeId: grade.id
                });
            });
        });

        setScoreColumns(newScoreColumns);
        toast.success(`Đã áp dụng cấu hình thành công cho tất cả các khối lớp khác!`);
      }
    );
  };

  // Device settings local state
  const [openTime, setOpenTime] = useState(deviceConfig.openTime);
  const [closeTime, setCloseTime] = useState(deviceConfig.closeTime);
  const [startDate, setStartDate] = useState(deviceConfig.startDate);
  const [endDate, setEndDate] = useState(deviceConfig.endDate);
  const [openMonth, setOpenMonth] = useState(deviceConfig.openMonth || '');
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    const active = years.find(y => y.isActive);
    if (active) setActiveYearForTerms(active.id);
    else if (years.length > 0) setActiveYearForTerms(years[0].id);
  }, [years]);

  const hk1Config = useMemo(() => termConfigs.find(c => c.yearId === activeYearForTerms && c.term === 'HK1'), [termConfigs, activeYearForTerms]);
  const hk2Config = useMemo(() => termConfigs.find(c => c.yearId === activeYearForTerms && c.term === 'HK2'), [termConfigs, activeYearForTerms]);

  useEffect(() => {
    if (!hk1Config || !hk2Config) return;
    
    const countDaysInRange = (startStr: string, endStr: string, allowedDays: number[]) => {
        if (!startStr || !endStr) return 0;
        const start = new Date(startStr);
        const end = new Date(endStr);
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (allowedDays.includes(current.getDay())) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    };
    
    const totalRequiredHK1 = countDaysInRange(hk1Config.startDate, hk1Config.endDate, attendanceConfig.allowedDays);
    const totalRequiredHK2 = countDaysInRange(hk2Config.startDate, hk2Config.endDate, attendanceConfig.allowedDays);

    if (attendanceConfig.isAutoCalculate && 
       (attendanceConfig.totalMassRequiredHK1 !== totalRequiredHK1 || 
        attendanceConfig.totalMassRequiredHK2 !== totalRequiredHK2 || 
        attendanceConfig.totalClassRequiredHK1 !== totalRequiredHK1 || 
        attendanceConfig.totalClassRequiredHK2 !== totalRequiredHK2)) {
        setAttendanceConfig({
            ...attendanceConfig,
            totalMassRequiredHK1: totalRequiredHK1,
            totalMassRequiredHK2: totalRequiredHK2,
            totalClassRequiredHK1: totalRequiredHK1,
            totalClassRequiredHK2: totalRequiredHK2
        });
    }
  }, [hk1Config?.startDate, hk1Config?.endDate, hk2Config?.startDate, hk2Config?.endDate, attendanceConfig.allowedDays, attendanceConfig.isAutoCalculate]);

  const [newYearName, setNewYearName] = useState('');
  const [newGradeName, setNewGradeName] = useState(''); 
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(grades[0]?.id || '');
  const [newClassYear, setNewClassYear] = useState(years[0]?.id || '');

  const activeYear = years.find(y => y.isActive);
  const classesInActiveYear = useMemo(() => {
      return classes.filter(c => c.yearId === activeYear?.id);
  }, [classes, activeYear]);

  const hk1Columns = useMemo(() => {
      return scoreColumns.filter(c => 
          c.term === 'HK1' && 
          (gradingScopeType === 'GLOBAL' ? !c.gradeId : c.gradeId === gradingScopeId)
      );
  }, [scoreColumns, gradingScopeType, gradingScopeId]);

  const hk2Columns = useMemo(() => {
      return scoreColumns.filter(c => 
          c.term === 'HK2' && 
          (gradingScopeType === 'GLOBAL' ? !c.gradeId : c.gradeId === gradingScopeId)
      );
  }, [scoreColumns, gradingScopeType, gradingScopeId]);

  const deviceItems = useMemo(() => {
      return inventory.filter(i => i.category === 'OTHER' || i.name.toLowerCase().includes('máy') || i.name.toLowerCase().includes('loa') || i.name.toLowerCase().includes('mic'));
  }, [inventory]);

  const updateTermDate = (term: 'HK1' | 'HK2', field: 'startDate' | 'endDate', value: string) => {
      setTermConfigs(prev => {
          const existingIdx = prev.findIndex(c => c.yearId === activeYearForTerms && c.term === term);
          if (existingIdx > -1) {
              const newConfigs = [...prev];
              newConfigs[existingIdx] = { ...newConfigs[existingIdx], [field]: value };
              return newConfigs;
          } else {
              const newConfig: TermConfig = {
                  id: `term_${Date.now()}`,
                  yearId: activeYearForTerms,
                  term: term,
                  startDate: field === 'startDate' ? value : '',
                  endDate: field === 'endDate' ? value : '',
                  weight: 1
              };
              return [...prev, newConfig];
          }
      });
  };

  const updateTermWeight = (term: 'HK1' | 'HK2', weight: number) => {
      setTermConfigs(prev => {
          const existingIdx = prev.findIndex(c => c.yearId === activeYearForTerms && c.term === term);
          if (existingIdx > -1) {
              const newConfigs = [...prev];
              newConfigs[existingIdx] = { ...newConfigs[existingIdx], weight };
              return newConfigs;
          } else {
              const newConfig: TermConfig = {
                  id: `term_${Date.now()}`,
                  yearId: activeYearForTerms,
                  term: term,
                  startDate: '',
                  endDate: '',
                  weight
              };
              return [...prev, newConfig];
          }
      });
  };

  const handleSaveTerms = () => toast.success("Đã cập nhật mốc thời gian học kỳ thành công!");
  const handleSaveAcademic = () => toast.success("Đã lưu cấu hình niên khóa, khối lớp và lớp học!");
  const handleSaveGeneral = () => toast.success("Đã lưu thông tin chung giáo xứ!");
  const handleSaveScoreColumns = () => toast.success("Đã lưu cấu hình cột điểm và hệ số!");
  const handleSaveGrading = () => toast.success("Đã lưu cấu hình học vụ và xếp loại!");
  const handleSaveDeviceConfig = () => {
      setDeviceConfig({ openTime, closeTime, startDate, endDate, openMonth });
      toast.success("Đã lưu cấu hình thời gian đăng ký thiết bị!");
  };

  const handleAddDevice = () => {
      if (!newDeviceName) return;
      const newDevice: InventoryItem = {
          id: `DEV_${Date.now()}`,
          name: newDeviceName,
          category: 'OTHER',
          quantity: 1,
          minQuantity: 0,
          unit: 'Cái',
          price: 0
      };
      setInventory([...inventory, newDevice]);
      setNewDeviceName('');
      toast.success('Đã thêm thiết bị mới vào kho!');
  };

  const handleDeleteDevice = (id: string) => {
      setInventory(inventory.filter(i => i.id !== id));
      toast.success('Đã xóa thiết bị!');
  };

  const handleChangePassword = () => {
      if(!currentPass || !newPass || !confirmPass) return toast.error("Vui lòng nhập đầy đủ thông tin");
      if(newPass !== confirmPass) return toast.error("Mật khẩu mới không khớp");
      toast.success("Đã đổi mật khẩu thành công!");
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
  }

  const addScoreColumn = (term: 'HK1' | 'HK2') => {
      const newCol: ScoreColumn = { 
          id: `col_${Date.now()}`, 
          name: 'Cột mới', 
          weight: 1, 
          term 
      };
      if (gradingScopeType === 'GRADE') newCol.gradeId = gradingScopeId;
      
      setScoreColumns([...scoreColumns, newCol]);
  };
  const removeScoreColumn = (id: string) => setScoreColumns(scoreColumns.filter(c => c.id !== id));
  const updateScoreColumn = (id: string, field: keyof ScoreColumn, value: any) => {
      setScoreColumns(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleColDragStart = (e: React.DragEvent, id: string) => { setDraggedColId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleColDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleColDragEnter = (id: string) => { if (draggedColId && draggedColId !== id) setDragOverColId(id); };
  const handleColDragEnd = () => { setDraggedColId(null); setDragOverColId(null); };
  const handleColDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault(); setDragOverColId(null);
      if (!draggedColId || draggedColId === targetId) return;
      const sourceIndex = scoreColumns.findIndex(c => c.id === draggedColId);
      const targetIndex = scoreColumns.findIndex(c => c.id === targetId);
      const newCols = [...scoreColumns];
      const [removed] = newCols.splice(sourceIndex, 1);
      newCols.splice(targetIndex, 0, removed);
      setScoreColumns(newCols);
      setDraggedColId(null);
  };

  const handleGradeDragStart = (e: React.DragEvent, id: string) => { setDraggedGradeId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleGradeDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleGradeDragEnter = (id: string) => { if (draggedGradeId && draggedGradeId !== id) setDragOverGradeId(id); };
  const handleGradeDragEnd = () => { setDraggedGradeId(null); setDragOverGradeId(null); };
  const handleGradeDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault(); setDragOverGradeId(null);
      if (!draggedGradeId || draggedGradeId === targetId) return;
      const sourceIndex = grades.findIndex(g => g.id === draggedGradeId);
      const targetIndex = grades.findIndex(g => g.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;
      const newGrades = [...grades];
      const [removed] = newGrades.splice(sourceIndex, 1);
      newGrades.splice(targetIndex, 0, removed);
      setGrades(newGrades);
      setDraggedGradeId(null);
  };

  const handleClassDragStart = (e: React.DragEvent, id: string) => { setDraggedClassId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleClassDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleClassDragEnter = (id: string) => { if (draggedClassId && draggedClassId !== id) setDragOverClassId(id); };
  const handleClassDragEnd = () => { setDraggedClassId(null); setDragOverClassId(null); };
  const handleClassDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault(); setDragOverClassId(null);
      if (!draggedClassId || draggedClassId === targetId) return;
      const sourceIndex = classes.findIndex(c => c.id === draggedClassId);
      const targetIndex = classes.findIndex(c => c.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;
      const newClasses = [...classes];
      const [removed] = newClasses.splice(sourceIndex, 1);
      newClasses.splice(targetIndex, 0, removed);
      setClasses(newClasses);
      setDraggedClassId(null);
  };

  const handleStartEditGrade = (grade: Grade) => { setEditingGradeId(grade.id); setEditGradeName(grade.name); };
  const handleSaveGrade = () => {
      if (!editGradeName.trim()) return;
      setGrades(grades.map(g => g.id === editingGradeId ? { ...g, name: editGradeName } : g));
      setEditingGradeId(null);
      toast.success("Đã cập nhật tên khối lớp!");
  };
  const handleDeleteGrade = (id: string) => {
      if (classes.some(c => c.gradeId === id)) return toast.error("Không thể xóa khối lớp vì đã có lớp học liên quan!");
      triggerConfirm(
          "Xác nhận xóa khối",
          "Bạn có chắc chắn muốn xóa khối lớp này không? Hành động này không thể hoàn tác.",
          () => {
              setGrades(grades.filter(g => g.id !== id));
              toast.success("Đã xóa khối lớp!");
          }
      );
  };
  const handleAddGrade = () => {
      if (newGradeName) {
          setGrades([...grades, { id: `g_${Date.now()}`, name: newGradeName }]);
          toast.success(`Đã thêm khối lớp mới!`);
          setNewGradeName('');
      }
  };

  const handleStartEditClass = (cls: ClassRoom) => { setEditingClassId(cls.id); setEditClassName(cls.name); };
  const handleSaveClass = () => {
      if (!editClassName.trim()) return;
      setClasses(classes.map(c => c.id === editingClassId ? { ...c, name: editClassName } : c));
      setEditingClassId(null);
      toast.success("Đã cập nhật tên lớp học!");
  };
  const handleDeleteClass = (id: string) => {
      triggerConfirm(
          "Xác nhận xóa lớp học",
          "Bạn có chắc chắn muốn xóa lớp học này không? Hành động này không thể hoàn tác.",
          () => {
              setClasses(classes.filter(c => c.id !== id));
              toast.success("Đã xóa lớp học!");
          }
      );
  };

  const handleSaveSaints = () => toast.success("Đã lưu danh sách tên thánh!");
  const handleAddSaint = () => { if (newSaintName) { setSaints([...saints, { id: `s${Date.now()}`, name: newSaintName, gender: newSaintGender }]); toast.success(`Đã thêm "${newSaintName}"!`); setNewSaintName(''); } };
  const handleRemoveSaint = (id: string) => {
      triggerConfirm(
          "Xác nhận xóa tên thánh",
          "Bạn có chắc chắn muốn xóa tên thánh này khỏi danh mục không?",
          () => {
              setSaints(saints.filter(s => s.id !== id));
              toast.success("Đã xóa tên thánh!");
          }
      );
  };
  const handleAddYear = () => { if (newYearName) { setYears([...years, { id: newYearName.replace(/\s/g, '-'), name: newYearName, isActive: false }]); toast.success(`Đã thêm niên khóa mới!`); setNewYearName(''); } };
  const handleDeleteYear = (id: string) => {
      if (classes.some(c => c.yearId === id)) return toast.error("Không thể xóa năm học vì đã có lớp học liên quan!");
      triggerConfirm(
          "Xác nhận xóa niên khóa",
          "Bạn có chắc chắn muốn xóa niên khóa này không? Hành động này không thể hoàn tác.",
          () => {
              setYears(years.filter(y => y.id !== id));
              toast.success("Đã xóa năm học!");
          }
      );
  };
  const handleSetActiveYear = (id: string) => { setYears(years.map(y => ({ ...y, isActive: y.id === id }))); toast.success("Đã đổi năm học hiện tại!"); };
  const handleToggleLockYear = (id: string) => {
      setYears(years.map(y => y.id === id ? { ...y, isLocked: !y.isLocked } : y));
      const year = years.find(y => y.id === id);
      const isNowLocked = !year?.isLocked;
      toast.success(isNowLocked ? `Đã khóa niên khóa ${year?.name} thành công!` : `Đã mở khóa niên khóa ${year?.name} thành công!`);
  };
  const handleAddClass = () => { if (newClassName && newClassYear) { setClasses([...classes, { id: `c_${Date.now()}`, name: newClassName, gradeId: newClassGrade, yearId: newClassYear, mainTeacher: 'Chưa phân công' }]); toast.success(`Đã thêm lớp mới!`); setNewClassName(''); } };

  return (
    <div className="p-6 h-screen overflow-y-auto custom-scrollbar relative bg-slate-50/50">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 px-2 border-l-8 border-blue-600">
        Cài Đặt Hệ Thống
      </h2>
      
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className={`grid grid-cols-1 gap-8 mb-20`}>
            {activeTab === 'general' && (
                <div className="contents">
                    <GeneralInfo 
                        parishName={parishName} setParishName={setParishName}
                        priestName={priestName} setPriestName={setPriestName}
                        headOfBoardName={headOfBoardName} setHeadOfBoardName={setHeadOfBoardName}
                        address={address} setAddress={setAddress}
                        phone={phone} setPhone={setPhone}
                        handleSaveGeneral={handleSaveGeneral}
                    />
                </div>
            )}
            {activeTab === 'academic' && (
                <div className="contents">
                    <AcademicManagement 
                        years={years} handleSetActiveYear={handleSetActiveYear} handleAddYear={handleAddYear} handleDeleteYear={handleDeleteYear} newYearName={newYearName} setNewYearName={setNewYearName}
                        isAdmin={isAdmin} handleToggleLockYear={handleToggleLockYear}
                        grades={grades} handleAddGrade={handleAddGrade} newGradeName={newGradeName} setNewGradeName={setNewGradeName} editingGradeId={editingGradeId} setEditingGradeId={setEditingGradeId} editGradeName={editGradeName} setEditGradeName={setEditGradeName} handleStartEditGrade={handleStartEditGrade} handleSaveGrade={handleSaveGrade} handleDeleteGrade={handleDeleteGrade} handleGradeDragStart={handleGradeDragStart} handleGradeDragOver={handleGradeDragOver} handleGradeDragEnter={handleGradeDragEnter} handleGradeDragEnd={handleGradeDragEnd} handleGradeDrop={handleGradeDrop} draggedGradeId={draggedGradeId} dragOverGradeId={dragOverGradeId}
                        classesInActiveYear={classesInActiveYear} activeYear={activeYear} newClassName={newClassName} setNewClassName={setNewClassName} newClassGrade={newClassGrade} setNewClassGrade={setNewClassGrade} newClassYear={newClassYear} setNewClassYear={setNewClassYear} handleAddClass={handleAddClass} editingClassId={editingClassId} setEditingClassId={setEditingClassId} editClassName={editClassName} setEditClassName={setEditClassName} handleStartEditClass={handleStartEditClass} handleSaveClass={handleSaveClass} handleDeleteClass={handleDeleteClass} handleClassDragStart={handleClassDragStart} handleClassDragOver={handleClassDragOver} handleClassDragEnter={handleClassDragEnter} handleClassDragEnd={handleClassDragEnd} handleClassDrop={handleClassDrop} draggedClassId={draggedClassId} dragOverClassId={dragOverClassId}
                    />
                </div>
            )}
            {activeTab === 'catalog' && (
                <div className="contents">
                    <SaintsManagement 
                        saints={saints} newSaintName={newSaintName} setNewSaintName={setNewSaintName} newSaintGender={newSaintGender} setNewSaintGender={setNewSaintGender} handleAddSaint={handleAddSaint} handleRemoveSaint={handleRemoveSaint} handleSaveSaints={handleSaveSaints}
                    />
                </div>
            )}
            {activeTab === 'grading' && (
                <div className="contents">
                    <GradingConfig 
                        years={years} activeYearForTerms={activeYearForTerms} setActiveYearForTerms={setActiveYearForTerms} hk1Config={hk1Config} hk2Config={hk2Config} updateTermDate={updateTermDate} updateTermWeight={updateTermWeight} handleSaveTerms={handleSaveTerms}
                        hk1Columns={hk1Columns} hk2Columns={hk2Columns} addScoreColumn={addScoreColumn} removeScoreColumn={removeScoreColumn} updateScoreColumn={updateScoreColumn} handleColDragStart={handleColDragStart} handleColDragOver={handleColDragOver} handleColDragEnter={handleColDragEnter} handleColDragEnd={handleColDragEnd} handleColDrop={handleColDrop} draggedColId={draggedColId} dragOverColId={dragOverColId} handleSaveScoreColumns={handleSaveScoreColumns}
                        academicConfig={academicConfig} setAcademicConfig={setAcademicConfig}
                        passScore={passScore} setPassScore={setPassScore} gradingScale={gradingScale} setGradingScale={setGradingScale}
                        grades={grades} classes={classesInActiveYear}
                        scopeType={gradingScopeType} setScopeType={setGradingScopeType}
                        scopeId={gradingScopeId} setScopeId={setGradingScopeId}
                        handleApplyToAllGrades={handleApplyToAllGrades}
                        handleSaveGrading={handleSaveGrading}
                    />
                </div>
            )}
            {activeTab === 'attendance' && (
                <div className="contents">
                    <AttendanceConfigComp 
                        attendanceConfig={attendanceConfig} 
                        setAttendanceConfig={setAttendanceConfig} 
                    />
                </div>
            )}
            {activeTab === 'email' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Mail size={24} className="text-blue-600" />
                        Cấu hình dịch vụ Email (Resend)
                    </h3>
                    <div className="max-w-2xl space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Resend API Key</label>
                            <input 
                                type="password"
                                placeholder="re_..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Lấy mã API tại <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">resend.com</a>. 
                                Mã này dùng để gửi thông báo và bảng điểm qua email.
                            </p>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => toast.success("Đã lưu cấu hình API Key!")}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
                            >
                                Lưu cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'devices' && (
                <div className="contents">
                    <DeviceConfigComp 
                        openTime={openTime} setOpenTime={setOpenTime} closeTime={closeTime} setCloseTime={setCloseTime} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} openMonth={openMonth} setOpenMonth={setOpenMonth} handleSaveDeviceConfig={handleSaveDeviceConfig}
                        deviceItems={deviceItems} newDeviceName={newDeviceName} setNewDeviceName={setNewDeviceName} handleAddDevice={handleAddDevice} handleDeleteDevice={handleDeleteDevice}
                    />
                </div>
            )}
            {activeTab === 'security' && (
                <div className="contents">
                    <AccountSecurity 
                        currentPass={currentPass} setCurrentPass={setCurrentPass}
                        newPass={newPass} setNewPass={setNewPass}
                        confirmPass={confirmPass} setConfirmPass={setConfirmPass}
                        handleChangePassword={handleChangePassword}
                    />
                </div>
            )}
            {activeTab === 'history' && (
                <div className="contents">
                    <SystemHistory />
                </div>
            )}
      </div>

      <ConfirmDialog
        isOpen={confirmState?.isOpen || false}
        title={confirmState?.title || ""}
        message={confirmState?.message || ""}
        confirmLabel="Đồng ý"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (confirmState?.onConfirm) {
            confirmState.onConfirm();
          }
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
        type="danger"
      />
    </div>
  );
};
