
import React, { useState, useEffect } from 'react';
import { MOCK_SAINTS } from '../constants';
import { Teacher, ClassRoom, SchoolYear } from '../types';
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Check, UserCog, ShieldCheck, Lock, LayoutDashboard, School, Users, ArrowRightLeft, CalendarCheck, BookOpenCheck, Package, Wallet, Settings, Activity, GraduationCap, MonitorPlay, FileText, QrCode, Mail, User, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';

interface TeachersProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  classes: ClassRoom[];
  years: SchoolYear[];
  currentUser?: Teacher | null;
}

const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
};

export const Teachers: React.FC<TeachersProps> = ({ teachers, setTeachers, classes, years, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const isReadOnly = !isAdmin && (selectedTeacher ? selectedTeacher.id !== currentUser?.id : true);
  
  // Delete Confirmation State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  
  // Saint Selector State
  const [saintInput, setSaintInput] = useState('');
  const [saintSearch, setSaintSearch] = useState('');
  const [showSaintDropdown, setShowSaintDropdown] = useState(false);

  // Form States
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  // Sort States
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'role' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const ALL_TABS = [
      { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard },
      { id: 'classes', label: 'Lớp Học', icon: School },
      { id: 'students', label: 'Học Viên', icon: Users },
      { id: 'teachers', label: 'Giáo Lý Viên', icon: GraduationCap },
      { id: 'attendance', label: 'Điểm Danh', icon: CalendarCheck },
      { id: 'grades', label: 'Bảng Điểm', icon: BookOpenCheck },
      { id: 'academic_affairs', label: 'Học Vụ', icon: ClipboardList },
      { id: 'communication', label: 'Liên Lạc', icon: Mail },
      { id: 'inventory', label: 'Kho & Vật Tư', icon: Package },
      { id: 'devices', label: 'Thiết bị', icon: MonitorPlay },
      { id: 'finance', label: 'Thủ quỹ', icon: Wallet },
      { id: 'meeting-minutes', label: 'Biên Bản', icon: FileText },
      { id: 'lookup', label: 'Tra cứu', icon: Search },
      { id: 'settings', label: 'Cài Đặt', icon: Settings },
  ];

  const filteredTeachers = teachers.filter(t => {
    return t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           t.saintName.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      const nameA = a.fullName.split(' ').pop() || '';
      const nameB = b.fullName.split(' ').pop() || '';
      comparison = nameA.localeCompare(nameB, 'vi');
      if (comparison === 0) {
        comparison = a.fullName.localeCompare(b.fullName, 'vi');
      }
    } else if (sortBy === 'id') {
      comparison = a.id.localeCompare(b.id);
    } else if (sortBy === 'role') {
      comparison = a.role.localeCompare(b.role);
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const openTeacherDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Initialize permissions dynamically for backward compatibility
    const permissions = teacher.permissions || {};
    const allowedTabs = teacher.allowedTabs || [];
    const updatedPermissions = { ...permissions };
    
    ALL_TABS.forEach(tab => {
        if (!updatedPermissions[tab.id]) {
            const hasTab = allowedTabs.includes(tab.id);
            updatedPermissions[tab.id] = {
                view: hasTab,
                edit: hasTab,
                delete: hasTab
            };
        }
    });

    setFormData({
        ...teacher,
        permissions: updatedPermissions
    });
    setSaintInput(teacher.saintName);
    setSaintSearch(teacher.saintName);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedTeacher(null);
    
    const initialPermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
    const defaultTabs = ['dashboard', 'classes', 'attendance', 'communication', 'lookup'];
    
    ALL_TABS.forEach(tab => {
        const isDefault = defaultTabs.includes(tab.id);
        initialPermissions[tab.id] = {
            view: isDefault,
            edit: isDefault,
            delete: isDefault
        };
    });

    setFormData({
        id: `glv${Date.now()}`,
        role: 'GLV',
        status: 'ACTIVE',
        permissions: initialPermissions,
        allowedTabs: defaultTabs
    });
    setSaintInput('');
    setSaintSearch('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
    setFormData({});
  };

  const handleSave = () => {
      if (isReadOnly) {
          toast.error('Bạn không có quyền thực hiện thao tác này!');
          return;
      }

      if (!formData.fullName || !formData.saintName) {
          toast.error('Vui lòng nhập đầy đủ Tên Thánh và Họ Tên');
          return;
      }

      if (selectedTeacher) {
          // Update existing
          setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? { ...t, ...formData } as Teacher : t));
          toast.success('Cập nhật thông tin thành công');
      } else {
          // Add new
          const newTeacher: Teacher = {
              ...formData as Teacher,
              id: formData.id || `glv${Date.now()}`,
          };
          setTeachers(prev => [...prev, newTeacher]);
          toast.success('Thêm Giáo Lý Viên mới thành công');
      }
      closeModal();
  };

  const handleTogglePermissionAction = (tabId: string, action: 'view' | 'edit' | 'delete') => {
      if (!isAdmin) {
          toast.error("Chỉ Quản trị viên mới được thay đổi phân quyền!");
          return;
      }
      
      const currentPermissions = formData.permissions || {};
      const tabPerm = currentPermissions[tabId] || { view: false, edit: false, delete: false };
      
      const newTabPerm = { ...tabPerm };
      if (action === 'view') {
          newTabPerm.view = !tabPerm.view;
          if (!newTabPerm.view) {
              newTabPerm.edit = false;
              newTabPerm.delete = false;
          }
      } else {
          newTabPerm[action] = !tabPerm[action];
          if (newTabPerm[action]) {
              newTabPerm.view = true;
          }
      }
      
      const updatedPermissions = {
          ...currentPermissions,
          [tabId]: newTabPerm
      };
      
      const updatedAllowedTabs = Object.keys(updatedPermissions).filter(key => updatedPermissions[key].view);

      setFormData({
          ...formData,
          permissions: updatedPermissions,
          allowedTabs: updatedAllowedTabs
      });
  };

  const handleDeleteTeacher = () => {
    if (teacherToDelete) {
        setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
        toast.success(`Đã xóa Giáo Lý Viên: ${teacherToDelete.fullName}`);
        setTeacherToDelete(null);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Quản Lý Giáo Lý Viên</h2>
        {isAdmin && (
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-bold text-sm"
          >
            <Plus size={18} /> Thêm Mới
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo Tên Thánh, Họ tên..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0 items-center justify-end">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
          <select
            className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700 bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Họ tên</option>
            <option value="id">Mã GLV</option>
            <option value="role">Vai trò</option>
            <option value="status">Trạng thái</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 shrink-0 font-bold text-xs flex items-center justify-center gap-1 min-w-[85px] bg-white transition-all shadow-sm"
          >
            {sortOrder === 'asc' ? 'Thấp-Cao ▲' : 'Cao-Thấp ▼'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-300">
                <th className="px-3 py-2 font-semibold w-16 text-center">STT</th>
                <th className="px-3 py-2 font-semibold w-24">Mã GLV</th>
                <th className="px-3 py-2 font-semibold">Tên Thánh & Họ Tên</th>
                <th className="px-3 py-2 font-semibold text-center">Tình Trạng</th>
                <th className="px-3 py-2 font-semibold">Vai trò</th>
                <th className="px-3 py-2 font-semibold">Liên Hệ</th>
                <th className="px-3 py-2 font-semibold">Học Vấn GL</th>
                <th className="px-3 py-2 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="">
              {filteredTeachers.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors border-b border-slate-200 text-sm">
                  <td className="px-3 py-2 text-center text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{t.id}</td>
                  <td className="px-3 py-2 flex items-center gap-3">
                    {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.fullName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <User size={20} className="text-slate-400" />
                        </div>
                    )}
                    <div>
                        <div className="font-semibold text-slate-800">{t.saintName} {t.fullName}</div>
                        <div className="text-xs text-slate-500">{safeFormatDate(t.dob)} - {t.birthPlace}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {t.status === 'INACTIVE' ? (
                       <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-bold border border-slate-300">Nghỉ</span>
                    ) : (
                       <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full font-bold border border-green-200">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {t.role === 'ADMIN' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">Quản Trị</span>
                    ) : (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">Giáo Lý Viên</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    <div>{t.phone}</div>
                    <div className="text-xs text-blue-600">{t.email}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-1">
                      {(t.educationLevel || '').split(', ').map((lvl, i) => lvl && (
                        <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full font-bold border border-purple-100">
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => openTeacherDetail(t)} 
                        className={`p-1.5 rounded-lg ${isAdmin || (currentUser && t.id === currentUser.id) ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-500 hover:bg-slate-100'}`}
                        title={isAdmin || (currentUser && t.id === currentUser.id) ? "Cập nhật" : "Xem chi tiết"}
                      >
                        <Edit size={16} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => setTeacherToDelete(t)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {(showModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedTeacher ? 'Cập Nhật Hồ Sơ GLV' : 'Thêm Giáo Lý Viên'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
               <div className="flex gap-8 flex-col lg:flex-row">
                   
                   {/* Left Column: Basic Info */}
                   <div className="flex-1 space-y-4">
                       <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-2 mb-4">Thông tin cá nhân</h4>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 mb-1">Mã GLV</label>
                               <input type="text" disabled value={formData.id} className="w-full p-2 border rounded-md bg-slate-100" />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Thánh</label>
                               <div className="relative">
                                   <input 
                                       className="w-full p-2 border rounded-md font-bold" 
                                       value={saintSearch} 
                                       onChange={(e) => {
                                           setSaintSearch(e.target.value);
                                           setShowSaintDropdown(true);
                                           if (e.target.value === '') {
                                               setSaintInput('');
                                               setFormData({...formData, saintName: ''});
                                           }
                                       }}
                                       onFocus={() => setShowSaintDropdown(true)}
                                       placeholder="Tìm tên thánh..."
                                   />
                                   {showSaintDropdown && (
                                       <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                           {MOCK_SAINTS.filter(s => s.name.toLowerCase().includes(saintSearch.toLowerCase())).length > 0 ? (
                                               MOCK_SAINTS.filter(s => s.name.toLowerCase().includes(saintSearch.toLowerCase())).map(s => (
                                                   <button 
                                                       key={s.id} 
                                                       className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-bold text-slate-700 flex justify-between items-center"
                                                       onClick={() => {
                                                           setSaintInput(s.name);
                                                           setSaintSearch(s.name);
                                                           setFormData({...formData, saintName: s.name});
                                                           setShowSaintDropdown(false);
                                                       }}
                                                   >
                                                       <span>{s.name}</span>
                                                       <span className="text-[10px] text-slate-400 uppercase">{s.gender === 'Male' ? 'Nam' : 'Nữ'}</span>
                                                   </button>
                                               ))
                                           ) : (
                                               <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy tên thánh</div>
                                           )}
                                       </div>
                                   )}
                                   {showSaintDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSaintDropdown(false)}></div>}
                               </div>
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-1">Họ và Tên</label>
                           <input type="text" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded-md" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-md" />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Địa chỉ</label>
                              <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded-md" />
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày sinh</label>
                             <input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-2 border rounded-md" />
                          </div>
                          <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1">Số điện thoại</label>
                             <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-md" />
                          </div>
                       </div>
                       
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-1">Học vấn Giáo Lý</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['TNTT Cấp 1', 'TNTT Cấp 2', 'GLV Cấp 1', 'GLV Cấp 2', 'GLV Cấp 3'].map((level) => {
                                    const currentLevels = (formData.educationLevel || '').split(', ').filter(l => l !== '');
                                    const isSelected = currentLevels.includes(level);
                                    return (
                                        <label key={level} className={`cursor-pointer px-2 py-1.5 rounded text-xs text-center border transition-all ${isSelected ? 'bg-blue-100 border-blue-400 font-bold text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={isSelected} 
                                                onChange={() => {
                                                    let newLevels;
                                                    if (isSelected) {
                                                        newLevels = currentLevels.filter(l => l !== level);
                                                    } else {
                                                        newLevels = [...currentLevels, level];
                                                    }
                                                    setFormData({...formData, educationLevel: newLevels.join(', ')});
                                                }} 
                                            />
                                            {level}
                                        </label>
                                    );
                                })}
                            </div>
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú</label>
                           <textarea 
                             value={formData.note || ''} 
                             onChange={e => setFormData({...formData, note: e.target.value})} 
                             className="w-full p-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                             rows={3}
                             placeholder="Ghi chú thêm về năng khiếu, kinh nghiệm..."
                           ></textarea>
                       </div>
                   </div>

                   {/* Right Column: Account & Permissions */}
                   <div className="flex-1 space-y-6">
                       
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                                <UserCog size={14}/> Thông tin đăng nhập
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-xs font-semibold text-slate-500 mb-1">Tên đăng nhập</label>
                                     <input type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-2 border rounded-md font-bold text-blue-700" placeholder="Username..."/>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-semibold text-slate-500 mb-1">Mật khẩu</label>
                                     <input type="text" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-md" placeholder="Password..."/>
                                 </div>
                            </div>
                       </div>

                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
                               <ShieldCheck size={14}/> Phân quyền & Vai trò
                           </h4>
                           <div className="grid grid-cols-2 gap-4 mb-4">
                               <div>
                                   <label className="block text-xs font-semibold text-slate-500 mb-1">Vai trò hệ thống</label>
                                   <select 
                                      className="w-full p-2 border rounded-md font-bold" 
                                      value={formData.role || 'GLV'} 
                                      onChange={e => setFormData({...formData, role: e.target.value as 'ADMIN' | 'GLV'})}
                                   >
                                       <option value="GLV">Giáo Lý Viên (Giới hạn)</option>
                                       <option value="ADMIN">Quản Trị Viên (Toàn quyền)</option>
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-xs font-semibold text-slate-500 mb-1">Tình trạng</label>
                                   <select 
                                      className={`w-full p-2 border rounded-md font-bold ${formData.status === 'INACTIVE' ? 'text-slate-500 bg-slate-100' : 'text-green-700 bg-green-50'}`}
                                      value={formData.status || 'ACTIVE'} 
                                      onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                                   >
                                       <option value="ACTIVE">Đang hoạt động</option>
                                       <option value="INACTIVE">Nghỉ</option>
                                   </select>
                               </div>
                           </div>

                           {formData.role === 'ADMIN' ? (
                               <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
                                   <Check size={16}/> Tài khoản này có toàn quyền truy cập hệ thống.
                               </div>
                           ) : (
                               <div>
                                   <div className="space-y-3">
                                       <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto custom-scrollbar shadow-sm">
                                           <table className="w-full text-left border-collapse">
                                               <thead>
                                                   <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                                                       <th className="p-2.5">Chức năng</th>
                                                       <th className="p-2.5 text-center w-16">Xem</th>
                                                       <th className="p-2.5 text-center w-16">Sửa</th>
                                                       <th className="p-2.5 text-center w-16">Xóa</th>
                                                   </tr>
                                               </thead>
                                               <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                                   {ALL_TABS.filter(tab => tab.id !== 'settings').map(tab => {
                                                       const perm = formData.permissions?.[tab.id] || { view: false, edit: false, delete: false };
                                                       return (
                                                           <tr key={tab.id} className="hover:bg-slate-50/50 transition-colors">
                                                               <td className="p-2 flex items-center gap-2 font-semibold text-slate-700">
                                                                   <span className="text-slate-400 shrink-0"><tab.icon size={14} /></span>
                                                                   <span className="truncate">{tab.label}</span>
                                                               </td>
                                                               <td className="p-2 text-center">
                                                                   <input 
                                                                       type="checkbox" 
                                                                       checked={perm.view} 
                                                                       onChange={() => handleTogglePermissionAction(tab.id, 'view')}
                                                                       disabled={!isAdmin}
                                                                       className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                                                                   />
                                                               </td>
                                                               <td className="p-2 text-center">
                                                                   <input 
                                                                       type="checkbox" 
                                                                       checked={perm.edit} 
                                                                       onChange={() => handleTogglePermissionAction(tab.id, 'edit')}
                                                                       disabled={!isAdmin}
                                                                       className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                                                                   />
                                                               </td>
                                                               <td className="p-2 text-center">
                                                                   <input 
                                                                       type="checkbox" 
                                                                       checked={perm.delete} 
                                                                       onChange={() => handleTogglePermissionAction(tab.id, 'delete')}
                                                                       disabled={!isAdmin}
                                                                       className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                                                                   />
                                                               </td>
                                                           </tr>
                                                       );
                                                   })}
                                               </tbody>
                                           </table>
                                       </div>
                                   </div>
                               </div>
                           )}
                       </div>

                   </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-bold uppercase tracking-wider text-xs">
                {isReadOnly ? 'Đóng' : 'Hủy'}
              </button>
              {!isReadOnly && (
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold uppercase tracking-wider shadow-sm text-xs">
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!teacherToDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa Giáo Lý Viên ${teacherToDelete?.saintName || ''} ${teacherToDelete?.fullName || ''} không? Hành động này không thể hoàn tác.`}
        confirmLabel="Đồng ý"
        cancelLabel="Hủy"
        onConfirm={handleDeleteTeacher}
        onCancel={() => setTeacherToDelete(null)}
        type="danger"
      />
    </div>
  );
};
