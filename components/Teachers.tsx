
import React, { useState, useEffect } from 'react';
import { MOCK_TEACHERS, MOCK_SAINTS } from '../constants';
import { Teacher } from '../types';
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Check, UserCog, ShieldCheck, Lock, LayoutDashboard, School, Users, ArrowRightLeft, CalendarCheck, BookOpenCheck, Package, Wallet, Settings, Activity } from 'lucide-react';

export const Teachers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  // Delete Confirmation State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  
  // Saint Selector State
  const [showSaintSuggestions, setShowSaintSuggestions] = useState(false);
  const [saintInput, setSaintInput] = useState('');

  // Form States
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  const ALL_TABS = [
      { id: 'dashboard', label: 'Trang Chủ', icon: LayoutDashboard },
      { id: 'classes', label: 'Lớp Học', icon: School },
      { id: 'students', label: 'Học Viên', icon: Users },
      { id: 'placement', label: 'Xếp Lớp', icon: ArrowRightLeft },
      { id: 'attendance', label: 'Chuyên Cần', icon: CalendarCheck },
      { id: 'grades', label: 'Bảng Điểm', icon: BookOpenCheck },
      { id: 'teachers', label: 'Giáo Lý Viên', icon: GraduationCapIcon }, 
      { id: 'inventory', label: 'Kho & Vật Tư', icon: Package },
      { id: 'finance', label: 'Thủ Quỹ', icon: Wallet },
      // Settings removed from selectable permissions as it is now default
  ];

  // Helper because Lucide component can't be used directly in map as value sometimes
  function GraduationCapIcon(props: any) { return <UserCog {...props}/> } 

  const filteredTeachers = MOCK_TEACHERS.filter(t => {
    return t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           t.saintName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredSaints = MOCK_SAINTS.filter(s => 
    s.name.toLowerCase().includes(saintInput.toLowerCase())
  );

  const openTeacherDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({...teacher});
    setSaintInput(teacher.saintName);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedTeacher(null);
    setFormData({
        id: `glv${Date.now()}`,
        role: 'GLV',
        status: 'ACTIVE',
        allowedTabs: ['dashboard', 'classes', 'attendance'] // Default permissions
    });
    setSaintInput('');
    setShowModal(true);
  }

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
    setFormData({});
    setShowSaintSuggestions(false);
  };

  const handleSave = () => {
      // Logic to save to backend/state would go here
      // For now we just close modal
      console.log("Saved data:", formData);
      closeModal();
  };

  const togglePermission = (tabId: string) => {
      const currentTabs = formData.allowedTabs || [];
      if (currentTabs.includes(tabId)) {
          setFormData({ ...formData, allowedTabs: currentTabs.filter(t => t !== tabId) });
      } else {
          setFormData({ ...formData, allowedTabs: [...currentTabs, tabId] });
      }
  };

  const handleDeleteTeacher = () => {
    if (teacherToDelete) {
        alert(`Đã xóa Giáo Lý Viên: ${teacherToDelete.fullName}`);
        setTeacherToDelete(null);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Quản Lý Giáo Lý Viên</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} /> Thêm Mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo Tên Thánh, Họ tên..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                <th className="px-3 py-2 font-semibold">Tài Khoản</th>
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
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{t.saintName} {t.fullName}</div>
                    <div className="text-xs text-slate-500">{new Date(t.dob).toLocaleDateString('vi-VN')} - {t.birthPlace}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {t.status === 'INACTIVE' ? (
                       <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-bold border border-slate-300">Nghỉ</span>
                    ) : (
                       <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full font-bold border border-green-200">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600 font-mono text-xs">
                     {t.username || '--'}
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
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                      {t.educationLevel}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openTeacherDetail(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setTeacherToDelete(t)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
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
                           <div className="relative">
                               <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Thánh</label>
                               <input 
                                  type="text" 
                                  className="w-full p-2 border rounded-md" 
                                  placeholder="Nhập và chọn"
                                  value={saintInput}
                                  onChange={(e) => {
                                    setSaintInput(e.target.value);
                                    setFormData({...formData, saintName: e.target.value});
                                    setShowSaintSuggestions(true);
                                  }}
                                  onFocus={() => setShowSaintSuggestions(true)}
                                  onBlur={() => setTimeout(() => setShowSaintSuggestions(false), 200)}
                               />
                               {showSaintSuggestions && (
                                 <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                   {filteredSaints.map(s => (
                                     <div key={s.id} className="p-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setSaintInput(s.name); setFormData({...formData, saintName: s.name}); setShowSaintSuggestions(false); }}>
                                        {s.name}
                                     </div>
                                   ))}
                                 </div>
                               )}
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-1">Họ và Tên</label>
                           <input type="text" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded-md" />
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
                           <select className="w-full p-2 border rounded-md" value={formData.educationLevel || ''} onChange={e => setFormData({...formData, educationLevel: e.target.value})}>
                               <option value="">-- Chọn --</option>
                               <option value="TNTT Cấp 1">TNTT Cấp 1</option>
                               <option value="TNTT Cấp 2">TNTT Cấp 2</option>
                               <option value="GLV Cấp 1">GLV Cấp 1</option>
                               <option value="GLV Cấp 2">GLV Cấp 2</option>
                               <option value="GLV Cấp 3">GLV Cấp 3</option>
                           </select>
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
                                   <label className="block text-xs font-semibold text-slate-500 mb-2">Chức năng được phép truy cập:</label>
                                   <div className="grid grid-cols-2 gap-2">
                                       {ALL_TABS.map(tab => (
                                           <div 
                                              key={tab.id} 
                                              className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${formData.allowedTabs?.includes(tab.id) ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                              onClick={() => togglePermission(tab.id)}
                                           >
                                               <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.allowedTabs?.includes(tab.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                   {formData.allowedTabs?.includes(tab.id) && <Check size={12} className="text-white"/>}
                                               </div>
                                               <span className="text-xs font-bold">{tab.label}</span>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>

                   </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">Hủy</button>
              <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">Lưu Thông Tin</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa</h3>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa Giáo Lý Viên <span className="font-bold text-slate-800">{teacherToDelete.saintName} {teacherToDelete.fullName}</span> không? 
              <br/><span className="text-sm italic text-red-500">Hành động này không thể hoàn tác.</span>
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTeacherToDelete(null)} 
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDeleteTeacher} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
