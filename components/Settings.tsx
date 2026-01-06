
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_SAINTS } from '../constants';
import { Calendar, Layers, Save, Plus, Trash2, Cross, CheckCircle2, GripVertical, Clock, AlertCircle, Building, GraduationCap, FileText, Lock, UserCog, Edit, Check, X, MonitorPlay } from 'lucide-react';
import { Saint, SchoolYear, ClassRoom, Grade, TermConfig, ScoreColumn, Teacher, DeviceConfig, InventoryItem } from '../types';

interface SettingsProps {
    years: SchoolYear[];
    setYears: (years: SchoolYear[]) => void;
    classes: ClassRoom[];
    setClasses: (classes: ClassRoom[]) => void;
    grades: Grade[];
    setGrades: (grades: Grade[]) => void;
    termConfigs: TermConfig[];
    setTermConfigs: (configs: TermConfig[]) => void;
    scoreColumns: ScoreColumn[];
    setScoreColumns: (cols: ScoreColumn[]) => void;
    currentUser: Teacher | null;
    deviceConfig: DeviceConfig;
    setDeviceConfig: (config: DeviceConfig) => void;
    inventory: InventoryItem[];
    setInventory: (items: InventoryItem[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ years, setYears, classes, setClasses, grades, setGrades, termConfigs, setTermConfigs, scoreColumns, setScoreColumns, currentUser, deviceConfig, setDeviceConfig, inventory, setInventory }) => {
  const [saints, setSaints] = useState<Saint[]>(MOCK_SAINTS);
  const [newSaintName, setNewSaintName] = useState('');
  const [newSaintGender, setNewSaintGender] = useState<'Male'|'Female'>('Male');
  const [toast, setToast] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // --- GENERAL INFO STATE ---
  const [parishName, setParishName] = useState('Giáo Xứ Tân Thành');
  const [priestName, setPriestName] = useState('Giuse Nguyễn Văn Cha');
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

  // Device settings local state
  const [openTime, setOpenTime] = useState(deviceConfig.openTime);
  const [closeTime, setCloseTime] = useState(deviceConfig.closeTime);
  const [startDate, setStartDate] = useState(deviceConfig.startDate);
  const [endDate, setEndDate] = useState(deviceConfig.endDate);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    const active = years.find(y => y.isActive);
    if (active) setActiveYearForTerms(active.id);
    else if (years.length > 0) setActiveYearForTerms(years[0].id);
  }, [years]);

  // Define configs for the active year
  const hk1Config = useMemo(() => termConfigs.find(c => c.yearId === activeYearForTerms && c.term === 'HK1'), [termConfigs, activeYearForTerms]);
  const hk2Config = useMemo(() => termConfigs.find(c => c.yearId === activeYearForTerms && c.term === 'HK2'), [termConfigs, activeYearForTerms]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [newYearName, setNewYearName] = useState('');
  const [newGradeName, setNewGradeName] = useState(''); 
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(grades[0]?.id || '');

  const activeYear = years.find(y => y.isActive);
  const classesInActiveYear = useMemo(() => {
      return classes.filter(c => c.yearId === activeYear?.id);
  }, [classes, activeYear]);

  // --- HELPERS ---
  const hk1Columns = useMemo(() => scoreColumns.filter(c => c.term === 'HK1'), [scoreColumns]);
  const hk2Columns = useMemo(() => scoreColumns.filter(c => c.term === 'HK2'), [scoreColumns]);

  // Filter device items from inventory
  const deviceItems = useMemo(() => {
      // Logic borrowed from DeviceRegistration to identify devices
      return inventory.filter(i => i.category === 'OTHER' || i.name.toLowerCase().includes('máy') || i.name.toLowerCase().includes('loa') || i.name.toLowerCase().includes('mic'));
  }, [inventory]);

  const updateTermDate = (term: 'HK1' | 'HK2', field: 'startDate' | 'endDate', value: string) => {
      const prev = termConfigs;
      const existingIdx = prev.findIndex(c => c.yearId === activeYearForTerms && c.term === term);
      if (existingIdx > -1) {
          const newConfigs = [...prev];
          newConfigs[existingIdx] = { ...newConfigs[existingIdx], [field]: value };
          setTermConfigs(newConfigs);
      } else {
          const newConfig: TermConfig = {
              id: `term_${Date.now()}`,
              yearId: activeYearForTerms,
              term: term,
              startDate: field === 'startDate' ? value : '',
              endDate: field === 'endDate' ? value : ''
          };
          setTermConfigs([...prev, newConfig]);
      }
  };

  const handleSaveTerms = () => showToast("Đã cập nhật mốc thời gian học kỳ thành công!");
  const handleSaveGeneral = () => showToast("Đã lưu thông tin chung giáo xứ!");
  
  const handleSaveScoreColumns = () => showToast("Đã lưu cấu hình cột điểm và hệ số!");

  const handleSaveDeviceConfig = () => {
      setDeviceConfig({ openTime, closeTime, startDate, endDate });
      showToast("Đã lưu cấu hình thời gian đăng ký thiết bị!");
  };

  const handleAddDevice = () => {
      if (!newDeviceName) return;
      const newDevice: InventoryItem = {
          id: `DEV_${Date.now()}`,
          name: newDeviceName,
          category: 'OTHER',
          quantity: 1, // Default
          minQuantity: 0,
          unit: 'Cái',
          price: 0
      };
      setInventory([...inventory, newDevice]);
      setNewDeviceName('');
      showToast('Đã thêm thiết bị mới vào kho!');
  };

  const handleDeleteDevice = (id: string) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này khỏi danh sách?")) {
          setInventory(inventory.filter(i => i.id !== id));
          showToast('Đã xóa thiết bị!');
      }
  };

  const handleChangePassword = () => {
      if(!currentPass || !newPass || !confirmPass) return alert("Vui lòng nhập đầy đủ thông tin");
      if(newPass !== confirmPass) return alert("Mật khẩu mới không khớp");
      showToast("Đã đổi mật khẩu thành công!");
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
  }

  // --- SCORE CONFIG ACTIONS ---
  const addScoreColumn = (term: 'HK1' | 'HK2') => {
      setScoreColumns([...scoreColumns, { id: `col_${Date.now()}`, name: 'Cột mới', weight: 1, term }]);
  };
  const removeScoreColumn = (id: string) => setScoreColumns(scoreColumns.filter(c => c.id !== id));
  const updateScoreColumn = (id: string, field: keyof ScoreColumn, value: any) => {
      setScoreColumns(scoreColumns.map(c => c.id === id ? { ...c, [field]: value } : c));
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

  // --- GRADE DRAG & DROP ---
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

  // --- CLASS DRAG & DROP ---
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

  // --- GRADE EDITING HANDLERS ---
  const handleStartEditGrade = (grade: Grade) => {
      setEditingGradeId(grade.id);
      setEditGradeName(grade.name);
  };
  const handleSaveGrade = () => {
      if (!editGradeName.trim()) return;
      setGrades(grades.map(g => g.id === editingGradeId ? { ...g, name: editGradeName } : g));
      setEditingGradeId(null);
      showToast("Đã cập nhật tên khối lớp!");
  };
  const handleDeleteGrade = (id: string) => {
      if(window.confirm("Bạn có chắc chắn muốn xóa khối này?")) {
          setGrades(grades.filter(g => g.id !== id));
          showToast("Đã xóa khối lớp!");
      }
  };
  
  const handleAddGrade = () => {
      if (newGradeName) {
          setGrades([...grades, { id: `g_${Date.now()}`, name: newGradeName }]);
          showToast(`Đã thêm khối lớp mới!`);
          setNewGradeName('');
      }
  };

  // --- CLASS EDITING HANDLERS ---
  const handleStartEditClass = (cls: ClassRoom) => {
      setEditingClassId(cls.id);
      setEditClassName(cls.name);
  };
  const handleSaveClass = () => {
      if (!editClassName.trim()) return;
      setClasses(classes.map(c => c.id === editingClassId ? { ...c, name: editClassName } : c));
      setEditingClassId(null);
      showToast("Đã cập nhật tên lớp học!");
  };
  const handleDeleteClass = (id: string) => {
      if(window.confirm("Bạn có chắc chắn muốn xóa lớp này?")) {
          setClasses(classes.filter(c => c.id !== id));
          showToast("Đã xóa lớp học!");
      }
  };

  const handleAddSaint = () => { if (newSaintName) { setSaints([...saints, { id: `s${Date.now()}`, name: newSaintName, gender: newSaintGender }]); showToast(`Đã thêm "${newSaintName}"!`); setNewSaintName(''); } };
  const handleRemoveSaint = (id: string) => { setSaints(saints.filter(s => s.id !== id)); showToast("Đã xóa tên thánh!"); };
  const handleAddYear = () => { if (newYearName) { setYears([...years, { id: newYearName.replace(/\s/g, '-'), name: newYearName, isActive: false }]); showToast(`Đã thêm niên khóa mới!`); setNewYearName(''); } };
  const handleSetActiveYear = (id: string) => { setYears(years.map(y => ({ ...y, isActive: y.id === id }))); showToast("Đã đổi năm học hiện tại!"); };
  const handleAddClass = () => { if (newClassName && activeYear) { setClasses([...classes, { id: `c_${Date.now()}`, name: newClassName, gradeId: newClassGrade, yearId: activeYear.id, mainTeacher: 'Chưa phân công' }]); showToast(`Đã thêm lớp mới!`); setNewClassName(''); } };

  return (
    <div className="p-6 h-screen overflow-y-auto custom-scrollbar relative bg-slate-50/50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={24} />
              <span className="font-bold">{toast}</span>
           </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-slate-800 mb-8 px-2 border-l-8 border-blue-600">Cài Đặt Hệ Thống</h2>
      
      <div className={`grid grid-cols-1 gap-8 mb-20 ${isAdmin ? 'xl:grid-cols-2' : ''}`}>

        {isAdmin && (
        <>
            {/* 1. THÔNG TIN CHUNG */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <Building className="text-blue-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Thông tin chung</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên Giáo Xứ / Đơn Vị</label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={parishName} onChange={e => setParishName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Linh Mục Phụ Trách / Tuyên Úy</label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={priestName} onChange={e => setPriestName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Địa chỉ</label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Điện thoại liên hệ</label>
                        <input type="text" className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveGeneral} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow flex items-center gap-2">
                        <Save size={18}/> Lưu Thông Tin
                    </button>
                </div>
            </div>

            {/* 2. Quản Lý Năm Học */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-3 mb-6 border-b pb-4"><Calendar className="text-blue-600 w-6 h-6" /><h3 className="font-bold text-xl text-slate-800">Quản Lý Năm Học</h3></div>
            <div className="space-y-6">
                <div><label className="block text-sm font-bold text-slate-500 uppercase mb-3">Danh sách niên khóa</label><div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar border rounded-xl p-3 bg-slate-50">{years.map(y => (<div key={y.id} className={`flex justify-between items-center p-3 rounded-lg shadow-sm transition-all border-b border-slate-200 last:border-0 ${y.isActive ? 'bg-blue-600 text-white border-blue-500 scale-[1.02]' : 'bg-white'}`}><span className={y.isActive ? 'font-extrabold' : 'font-medium text-slate-700'}>{y.name} {y.isActive && '(Hiện tại)'}</span>{!y.isActive && (<button onClick={() => handleSetActiveYear(y.id)} className="text-xs px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-md font-bold text-slate-600 hover:bg-slate-200 transition-colors">Đặt làm hiện tại</button>)}</div>))}</div></div>
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100"><h4 className="font-bold text-blue-800 text-sm mb-4 uppercase">Tạo Năm Học Mới</h4><div className="flex gap-3"><input type="text" placeholder="Tên niên khóa (VD: 2024-2025)" className="flex-1 p-3 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newYearName} onChange={(e) => setNewYearName(e.target.value)}/><button onClick={handleAddYear} className="flex items-center justify-center gap-2 px-6 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"><Plus size={18}/> Thêm</button></div></div>
            </div>
            </div>

            {/* 3. Cấu hình Thời gian Học Kỳ */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
                <div className="flex items-center gap-3 mb-6 border-b pb-4"><Clock className="text-rose-600 w-6 h-6" /><h3 className="font-bold text-xl text-slate-800">Cấu Hình Thời Gian Học Kỳ</h3></div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chọn năm học cấu hình</label>
                        <select 
                            className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700 bg-slate-50"
                            value={activeYearForTerms}
                            onChange={(e) => setActiveYearForTerms(e.target.value)}
                        >
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs mb-3 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Học Kỳ 1</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-blue-600 font-bold uppercase">Bắt đầu</label>
                                    <input type="date" className="w-full p-2 text-xs border border-blue-200 rounded-lg outline-none" value={hk1Config?.startDate || ''} onChange={(e) => updateTermDate('HK1', 'startDate', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-blue-600 font-bold uppercase">Kết thúc</label>
                                    <input type="date" className="w-full p-2 text-xs border border-blue-200 rounded-lg outline-none" value={hk1Config?.endDate || ''} onChange={(e) => updateTermDate('HK1', 'endDate', e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-bold text-purple-800 text-xs mb-3 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Học Kỳ 2</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-purple-600 font-bold uppercase">Bắt đầu</label>
                                    <input type="date" className="w-full p-2 text-xs border border-purple-200 rounded-lg outline-none" value={hk2Config?.startDate || ''} onChange={(e) => updateTermDate('HK2', 'startDate', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-purple-600 font-bold uppercase">Kết thúc</label>
                                    <input type="date" className="w-full p-2 text-xs border border-purple-200 rounded-lg outline-none" value={hk2Config?.endDate || ''} onChange={(e) => updateTermDate('HK2', 'endDate', e.target.value)}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>Mốc thời gian này sẽ được dùng để tự động phân loại số buổi vắng vào bảng điểm HK1 hoặc HK2.</span>
                    </div>

                    <button onClick={handleSaveTerms} className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-md transition-all uppercase text-sm">
                        <Save size={18}/> Lưu Cấu Hình Thời Gian
                    </button>
                </div>
            </div>

            {/* 4. Quản lý Khối lớp */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-3 mb-6 border-b pb-4"><Layers className="text-purple-600 w-6 h-6" /><h3 className="font-bold text-xl text-slate-800">Quản Lý Khối Lớp</h3></div>
            <div className="space-y-6">
                <div className="flex gap-3 bg-purple-50 p-5 rounded-xl border border-purple-100">
                    <input 
                        type="text" 
                        placeholder="Tên khối lớp mới..." 
                        className="flex-1 p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm text-sm" 
                        value={newGradeName} 
                        onChange={(e) => setNewGradeName(e.target.value)} 
                    />
                    <button 
                        onClick={handleAddGrade}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-md transition-all uppercase text-xs tracking-widest whitespace-nowrap"
                    >
                        Thêm Khối
                    </button>
                </div>
                <div className="border border-slate-300 rounded-2xl overflow-hidden h-[500px] overflow-y-auto custom-scrollbar shadow-inner bg-slate-50 p-1">
                    <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                        <tbody className="bg-transparent">
                            {grades.map(g => {
                                const isEditing = editingGradeId === g.id;
                                const isDragged = draggedGradeId === g.id;
                                const isOver = dragOverGradeId === g.id;
                                
                                return (
                                <tr 
                                    key={g.id} 
                                    draggable={!isEditing}
                                    onDragStart={(e) => handleGradeDragStart(e, g.id)}
                                    onDragOver={handleGradeDragOver}
                                    onDragEnter={() => handleGradeDragEnter(g.id)}
                                    onDragEnd={handleGradeDragEnd}
                                    onDrop={(e) => handleGradeDrop(e, g.id)}
                                    className={`group transition-all duration-200 border-b border-slate-200 cursor-grab bg-white shadow-sm hover:shadow-md rounded-xl overflow-hidden ${isDragged ? 'opacity-40 border-dashed border-2 border-purple-400' : ''} ${isOver ? 'ring-2 ring-purple-400 translate-x-2' : ''}`}
                                >
                                    <td className="p-3 text-slate-300 group-hover:text-purple-500 transition-colors rounded-l-xl border-b border-slate-200"><GripVertical size={20} /></td>
                                    <td className="p-3 font-bold text-slate-800 text-sm tracking-tight border-b border-slate-200">
                                        {isEditing ? (
                                            <input 
                                                autoFocus
                                                className="w-full p-1 border border-purple-300 rounded outline-none text-purple-700"
                                                value={editGradeName}
                                                onChange={(e) => setEditGradeName(e.target.value)}
                                            />
                                        ) : (
                                            g.name
                                        )}
                                    </td>
                                    <td className="p-3 text-right rounded-r-xl border-b border-slate-200">
                                        <div className="flex justify-end gap-1">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSaveGrade} className="p-2 text-green-500 hover:bg-green-50 rounded transition-colors"><Check size={18}/></button>
                                                    <button onClick={() => setEditingGradeId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X size={18}/></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleStartEditGrade(g)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteGrade(g.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>

            {/* 5. Danh Sách Lớp Học */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-3 mb-6 border-b pb-4"><Layers className="text-emerald-600 w-6 h-6" /><h3 className="font-bold text-xl text-slate-800">Lớp Học ({activeYear?.name})</h3></div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                    <input type="text" placeholder="Tên lớp..." className="p-3 border border-emerald-200 rounded-xl outline-none text-sm shadow-sm" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                    <div className="flex gap-2">
                        <select className="flex-1 p-3 border border-emerald-200 rounded-xl bg-white text-sm shadow-sm font-bold text-emerald-800" value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)}>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                        <button onClick={handleAddClass} className="px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-md text-xl">+</button>
                    </div>
                </div>
                <div className="border border-slate-300 rounded-2xl overflow-hidden h-[500px] overflow-y-auto custom-scrollbar shadow-inner bg-slate-50 p-1">
                    <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                        <tbody className="bg-transparent">
                            {classesInActiveYear.map(c => {
                                const isEditing = editingClassId === c.id;
                                const isDragged = draggedClassId === c.id;
                                const isOver = dragOverClassId === c.id;

                                return (
                                <tr 
                                    key={c.id} 
                                    draggable={!isEditing}
                                    onDragStart={(e) => handleClassDragStart(e, c.id)}
                                    onDragOver={handleClassDragOver}
                                    onDragEnter={() => handleClassDragEnter(c.id)}
                                    onDragEnd={handleClassDragEnd}
                                    onDrop={(e) => handleClassDrop(e, c.id)}
                                    className={`group transition-all duration-200 border-b border-slate-200 cursor-grab bg-white shadow-sm hover:shadow-md rounded-xl overflow-hidden ${isDragged ? 'opacity-40 border-dashed border-2 border-emerald-400' : ''} ${isOver ? 'ring-2 ring-emerald-400 translate-x-2' : ''}`}
                                >
                                    <td className="p-3 text-slate-300 group-hover:text-emerald-500 transition-colors rounded-l-xl border-b border-slate-200"><GripVertical size={20} /></td>
                                    <td className="p-3 font-bold text-slate-800 text-sm border-b border-slate-200">
                                        {isEditing ? (
                                            <input 
                                                autoFocus
                                                className="w-full p-1 border border-emerald-300 rounded outline-none text-emerald-700"
                                                value={editClassName}
                                                onChange={(e) => setEditClassName(e.target.value)}
                                            />
                                        ) : (
                                            c.name
                                        )}
                                    </td>
                                    <td className="p-3 font-semibold text-emerald-600/70 text-xs border-b border-slate-200">{grades.find(g => g.id === c.gradeId)?.name}</td>
                                    <td className="p-3 text-right rounded-r-xl border-b border-slate-200">
                                        <div className="flex justify-end gap-1">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSaveClass} className="p-2 text-green-500 hover:bg-green-50 rounded transition-colors"><Check size={18}/></button>
                                                    <button onClick={() => setEditingClassId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X size={18}/></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleStartEditClass(c)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteClass(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>

            {/* 6. Cấu hình Thang điểm & Xếp loại */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <GraduationCap className="text-emerald-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Cấu Hình Thang Điểm & Xếp Loại</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-4">Điểm Đạt (Lên lớp)</h4>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Điểm trung bình tối thiểu</label>
                                <input type="number" step="0.1" className="w-full p-2 border rounded-lg font-black text-emerald-600" value={passScore} onChange={e => setPassScore(Number(e.target.value))} />
                            </div>
                            <div className="text-xs text-slate-500 italic flex-1">
                                Học viên có ĐTB năm dưới mức này sẽ được xếp loại "Ở lại lớp"
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-4">Thang xếp loại</h4>
                        <div className="space-y-2">
                            {gradingScale.map((g, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" className={`w-24 p-2 border rounded-lg font-bold text-sm ${g.color}`} value={g.label} onChange={(e) => {
                                        const newScale = [...gradingScale];
                                        newScale[idx].label = e.target.value;
                                        setGradingScale(newScale);
                                    }}/>
                                    <span className="text-slate-400 font-bold">≥</span>
                                    <input type="number" step="0.1" className="w-20 p-2 border rounded-lg font-mono text-sm" value={g.min} onChange={(e) => {
                                        const newScale = [...gradingScale];
                                        newScale[idx].min = Number(e.target.value);
                                        setGradingScale(newScale);
                                    }}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6B. Cấu hình Mượn Thiết Bị */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <MonitorPlay className="text-cyan-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Cấu hình Đăng Ký Thiết Bị</h3>
                </div>
                <div className="space-y-6">
                    {/* Time Config */}
                    <div className="grid grid-cols-2 gap-4 bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                        <div>
                            <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Giờ mở cổng</label>
                            <input type="time" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Giờ đóng cổng</label>
                            <input type="time" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Từ ngày</label>
                            <input type="date" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Đến ngày</label>
                            <input type="date" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    
                    <button onClick={handleSaveDeviceConfig} className="w-full py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-all shadow text-sm">
                        Lưu Cấu Hình Thời Gian
                    </button>

                    {/* Manage Device List */}
                    <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-3">Danh sách thiết bị cho mượn</h4>
                        <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                className="flex-1 p-2 border rounded-lg text-sm" 
                                placeholder="Nhập tên thiết bị (VD: Loa kéo)..."
                                value={newDeviceName}
                                onChange={e => setNewDeviceName(e.target.value)}
                            />
                            <button onClick={handleAddDevice} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 flex items-center gap-1">
                                <Plus size={16}/> Thêm
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                            {deviceItems.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <tbody>
                                        {deviceItems.map(d => (
                                            <tr key={d.id} className="border-b border-slate-200 last:border-0 hover:bg-white">
                                                <td className="p-3 font-medium text-slate-700">{d.name}</td>
                                                <td className="p-3 text-right w-12">
                                                    <button onClick={() => handleDeleteDevice(d.id)} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có thiết bị nào.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. Cấu hình Cột điểm (MỚI) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <FileText className="text-violet-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Cấu Hình Cột Điểm & Hệ Số</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* HK1 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 border-blue-200">
                            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Học Kỳ 1</h4>
                            <button onClick={() => addScoreColumn('HK1')} className="text-[10px] flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"><Plus size={12}/> Thêm cột</button>
                        </div>
                        <div className="space-y-2">
                            {hk1Columns.map(col => {
                                const isDragging = draggedColId === col.id;
                                const isOver = dragOverColId === col.id;
                                return (
                                <div key={col.id} draggable onDragStart={(e) => handleColDragStart(e, col.id)} onDragOver={handleColDragOver} onDragEnter={() => handleColDragEnter(col.id)} onDragEnd={handleColDragEnd} onDrop={(e) => handleColDrop(e, col.id)} className={`flex gap-2 items-center bg-blue-50/50 p-2 rounded-lg border transition-all ${isDragging ? 'opacity-30 border-blue-500 border-dashed' : 'border-blue-100'} ${isOver ? 'ring-2 ring-blue-300 translate-x-1' : ''}`}>
                                    <div className="cursor-grab text-slate-300 hover:text-blue-500"><GripVertical size={16}/></div>
                                    <input className="flex-1 text-sm p-1.5 border rounded outline-none font-bold" value={col.name} onChange={e => updateScoreColumn(col.id, 'name', e.target.value)} />
                                    <div className="flex flex-col"><span className="text-[8px] font-bold text-blue-400 uppercase">Hệ số</span><select className="text-xs p-1 border rounded font-bold" value={col.weight} onChange={e => updateScoreColumn(col.id, 'weight', Number(e.target.value))}><option value={0}>x0</option><option value={1}>x1</option><option value={2}>x2</option><option value={3}>x3</option></select></div>
                                    <button onClick={() => removeScoreColumn(col.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            )})}
                        </div>
                    </div>
                    {/* HK2 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 border-purple-200">
                            <h4 className="font-bold text-purple-700 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Học Kỳ 2</h4>
                            <button onClick={() => addScoreColumn('HK2')} className="text-[10px] flex items-center gap-1 font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"><Plus size={12}/> Thêm cột</button>
                        </div>
                        <div className="space-y-2">
                            {hk2Columns.map(col => {
                                const isDragging = draggedColId === col.id;
                                const isOver = dragOverColId === col.id;
                                return (
                                <div key={col.id} draggable onDragStart={(e) => handleColDragStart(e, col.id)} onDragOver={handleColDragOver} onDragEnter={() => handleColDragEnter(col.id)} onDragEnd={handleColDragEnd} onDrop={(e) => handleColDrop(e, col.id)} className={`flex gap-2 items-center bg-purple-50/50 p-2 rounded-lg border transition-all ${isDragging ? 'opacity-30 border-purple-500 border-dashed' : 'border-purple-100'} ${isOver ? 'ring-2 ring-purple-300 translate-x-1' : ''}`}>
                                    <div className="cursor-grab text-slate-300 hover:text-purple-500"><GripVertical size={16}/></div>
                                    <input className="flex-1 text-sm p-1.5 border rounded outline-none font-bold" value={col.name} onChange={e => updateScoreColumn(col.id, 'name', e.target.value)} />
                                    <div className="flex flex-col"><span className="text-[8px] font-bold text-purple-400 uppercase">Hệ số</span><select className="text-xs p-1 border rounded font-bold" value={col.weight} onChange={e => updateScoreColumn(col.id, 'weight', Number(e.target.value))}><option value={0}>x0</option><option value={1}>x1</option><option value={2}>x2</option><option value={3}>x3</option></select></div>
                                    <button onClick={() => removeScoreColumn(col.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveScoreColumns} className="px-6 py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-all shadow flex items-center gap-2">
                        <Save size={18}/> Lưu Cấu Hình Điểm
                    </button>
                </div>
            </div>
            
            {/* 8. Quản Lý Tên Thánh */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4"><Cross className="text-amber-600 w-6 h-6" /><h3 className="font-bold text-xl text-slate-800">Quản Lý Tên Thánh</h3></div>
            <div className="space-y-6">
                <div className="flex gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100"><input type="text" placeholder="Nhập tên thánh..." className="flex-1 p-3 border border-amber-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" value={newSaintName} onChange={(e) => setNewSaintName(e.target.value)}/><select className="p-3 border border-amber-200 rounded-xl text-sm bg-white" value={newSaintGender} onChange={(e) => setNewSaintGender(e.target.value as 'Male'|'Female')}><option value="Male">Nam</option><option value="Female">Nữ</option></select><button onClick={handleAddSaint} className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-extrabold shadow-md transition-all">+</button></div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar bg-slate-50"><table className="w-full text-left text-sm border-collapse"><thead className="bg-slate-100 border-b border-slate-300 sticky top-0 z-10"><tr><th className="p-4 font-bold text-slate-600">Tên Thánh</th><th className="p-4 font-bold text-slate-600 w-24">Giới tính</th><th className="p-4 w-16"></th></tr></thead><tbody className="bg-white">{saints.map(s => (<tr key={s.id} className="hover:bg-amber-50/50 transition-colors border-b border-slate-200"><td className="p-4 font-bold text-slate-700">{s.name}</td><td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${s.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{s.gender === 'Male' ? 'Nam' : 'Nữ'}</span></td><td className="p-4 text-right"><button onClick={() => handleRemoveSaint(s.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div>
            </div>
            </div>
        </>
        )}

        {/* 9. Tài khoản & Bảo mật (Visible to Everyone) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <UserCog className="text-slate-600 w-6 h-6" />
                <h3 className="font-bold text-xl text-slate-800">Tài Khoản & Bảo Mật</h3>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={currentPass} onChange={e => setCurrentPass(e.target.value)}/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={newPass} onChange={e => setNewPass(e.target.value)}/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nhập lại mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}/>
                    </div>
                </div>
                <button onClick={handleChangePassword} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 shadow mt-2">
                    Đổi Mật Khẩu
                </button>
            </div>
        </div>

      </div>
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};
