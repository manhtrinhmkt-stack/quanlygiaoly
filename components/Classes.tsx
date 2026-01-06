
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_TEACHERS } from '../constants';
import { ClassRoom, SchoolYear, Student, Grade, Teacher } from '../types';
import { Users, User, UserCheck, Edit, X, Save, CheckCircle2, Search } from 'lucide-react';

interface ClassesProps {
    classes: ClassRoom[];
    setClasses: (classes: ClassRoom[]) => void;
    students: Student[];
    years: SchoolYear[];
    grades: Grade[];
    currentUser: Teacher | null;
}

export const Classes: React.FC<ClassesProps> = ({ classes, setClasses, students, years, grades, currentUser }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  
  const [mainTeacherInput, setMainTeacherInput] = useState('');
  const [showMainTeacherSuggestions, setShowMainTeacherSuggestions] = useState(false);

  const [assistants, setAssistants] = useState<string[]>(['', '', '']);
  const [showAssistSuggestions, setShowAssistSuggestions] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
     const active = years.find(y => y.isActive);
     if (active) setSelectedYear(active.id);
  }, [years]);

  useEffect(() => {
    if (editingClass) {
        const parts = editingClass.assistants ? editingClass.assistants.split(',').map(s => s.trim()) : [];
        setAssistants([parts[0] || '', parts[1] || '', parts[2] || '']);
        setMainTeacherInput(editingClass.mainTeacher || '');
    }
  }, [editingClass]);

  // Show all classes regardless of user role
  const filteredClasses = useMemo(() => {
      return classes.filter(c => {
          const matchYear = c.yearId === selectedYear;
          const matchGrade = selectedGrade === 'all' || c.gradeId === selectedGrade;
          return matchYear && matchGrade;
      });
  }, [classes, selectedYear, selectedGrade]);

  const getClassStats = (classId: string) => {
      const classStudents = students.filter(s => s.classId === classId);
      return {
          total: classStudents.length,
          male: classStudents.filter(s => s.gender === 'Male').length,
          female: classStudents.filter(s => s.gender === 'Female').length
      };
  };

  const handleEditClass = (c: ClassRoom) => {
    setEditingClass({ ...c });
  };

  const handleSaveClass = () => {
    if (editingClass) {
        const combinedAssistants = assistants
            .map(s => s.trim())
            .filter(s => s !== '')
            .join(', ');

        const finalClassData = { 
            ...editingClass, 
            mainTeacher: mainTeacherInput, 
            assistants: combinedAssistants 
        };

        const updatedClasses = classes.map(c => c.id === editingClass.id ? finalClassData : c);
        setClasses(updatedClasses);
        showToast(`Đã cập nhật thông tin lớp ${editingClass.name} thành công!`);
        setEditingClass(null);
    }
  };

  const sortedTeachers = useMemo(() => {
      return [...MOCK_TEACHERS].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, []);

  const getFilteredTeachers = (input: string) => {
      // Filter out INACTIVE teachers
      const activeTeachers = sortedTeachers.filter(t => t.status !== 'INACTIVE');
      
      if (!input) return activeTeachers;
      const lowerInput = input.toLowerCase();
      return activeTeachers.filter(t => 
          t.fullName.toLowerCase().includes(lowerInput) || 
          t.saintName.toLowerCase().includes(lowerInput)
      );
  };

  const filteredMainTeacherSuggestions = useMemo(() => getFilteredTeachers(mainTeacherInput), [mainTeacherInput, sortedTeachers]);

  const updateAssistant = (index: number, value: string) => {
      const newAssistants = [...assistants];
      newAssistants[index] = value;
      setAssistants(newAssistants);
      
      const newShow = [...showAssistSuggestions];
      newShow[index] = true;
      setShowAssistSuggestions(newShow);
  };

  const selectAssistant = (index: number, value: string) => {
      const newAssistants = [...assistants];
      newAssistants[index] = value;
      setAssistants(newAssistants);
      
      const newShow = [...showAssistSuggestions];
      newShow[index] = false;
      setShowAssistSuggestions(newShow);
  }

  const toggleAssistSuggestion = (index: number, status: boolean) => {
      const newShow = [...showAssistSuggestions];
      newShow[index] = status;
      setShowAssistSuggestions(newShow);
  }

  return (
    <div className="p-6 h-screen flex flex-col relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={24} />
              <span className="font-bold">{toast}</span>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Danh Sách Lớp Học</h2>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
         <select 
            className="px-4 py-2.5 border rounded-lg bg-white font-medium min-w-[150px] text-base"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
         >
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
         </select>

         <select 
            className="px-4 py-2.5 border rounded-lg bg-white min-w-[150px] text-base"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
         >
            <option value="all">Tất cả Khối</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
         </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
         <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-slate-50 text-slate-600 text-base border-b border-slate-300">
                         <th className="px-4 py-3 w-16 text-center font-bold">STT</th>
                         <th className="px-4 py-3 font-bold">Tên Lớp</th>
                         <th className="px-4 py-3 font-bold">Khối</th>
                         <th className="px-4 py-3 text-center font-bold">Sĩ số</th>
                         <th className="px-4 py-3 text-center font-bold">Nam</th>
                         <th className="px-4 py-3 text-center font-bold">Nữ</th>
                         <th className="px-4 py-3 text-center font-bold">Phòng Học</th>
                         <th className="px-4 py-3 font-bold">GLV Chủ Nhiệm</th>
                         <th className="px-4 py-3 font-bold">GLV Phụ Trách</th>
                         {isAdmin && <th className="px-4 py-3 w-16 text-center"></th>}
                     </tr>
                 </thead>
                 <tbody className="">
                     {filteredClasses.length > 0 ? (
                         filteredClasses.map((c, index) => {
                             const stats = getClassStats(c.id);
                             const gradeName = grades.find(g => g.id === c.gradeId)?.name;
                             
                             return (
                                 <tr key={c.id} className="hover:bg-slate-50 border-b border-slate-200 text-base text-slate-700">
                                     <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                                     <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                                     <td className="px-4 py-3 text-slate-600">{gradeName}</td>
                                     <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">{stats.total}</td>
                                     <td className="px-4 py-3 text-center text-slate-600">{stats.male}</td>
                                     <td className="px-4 py-3 text-center text-slate-600">{stats.female}</td>
                                     <td className="px-4 py-3 text-center font-medium text-slate-700">{c.room || '--'}</td>
                                     <td className="px-4 py-3 font-medium text-slate-800">{c.mainTeacher || '---'}</td>
                                     <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={c.assistants}>{c.assistants || '---'}</td>
                                     {isAdmin && (
                                         <td className="px-4 py-3 text-center">
                                             <button onClick={() => handleEditClass(c)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                                                 <Edit size={18} />
                                             </button>
                                         </td>
                                     )}
                                 </tr>
                             );
                         })
                     ) : (
                         <tr><td colSpan={isAdmin ? 10 : 9} className="p-10 text-center text-slate-400 text-lg">Không có lớp học nào phù hợp</td></tr>
                     )}
                 </tbody>
             </table>
         </div>
         <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-8 justify-end text-base font-medium text-slate-600">
             <div className="flex items-center gap-2"><Users size={18}/> Tổng: {filteredClasses.reduce((acc, c) => acc + getClassStats(c.id).total, 0)}</div>
             <div className="flex items-center gap-2"><User size={18}/> Nam: {filteredClasses.reduce((acc, c) => acc + getClassStats(c.id).male, 0)}</div>
             <div className="flex items-center gap-2"><UserCheck size={18}/> Nữ: {filteredClasses.reduce((acc, c) => acc + getClassStats(c.id).female, 0)}</div>
         </div>
      </div>

      {editingClass && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xl text-slate-800">Cập nhật Lớp học</h3>
                    <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600"><X size={22}/></button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-base font-bold text-slate-700 mb-2">Tên Lớp</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg bg-slate-100 text-slate-500 text-base" 
                            value={editingClass.name} 
                            disabled 
                        />
                    </div>
                    <div>
                        <label className="block text-base font-bold text-slate-700 mb-2">Số Phòng Học</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base" 
                            value={editingClass.room || ''} 
                            onChange={(e) => setEditingClass({...editingClass, room: e.target.value})}
                            placeholder="Nhập số phòng..."
                        />
                    </div>
                    
                    <div className="relative">
                        <label className="block text-base font-bold text-slate-700 mb-2">GLV Chủ Nhiệm</label>
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full p-3 pl-4 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
                                value={mainTeacherInput}
                                onChange={(e) => {
                                    setMainTeacherInput(e.target.value);
                                    setShowMainTeacherSuggestions(true);
                                }}
                                onFocus={() => setShowMainTeacherSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowMainTeacherSuggestions(false), 200)}
                                placeholder="Nhập tên GLV..."
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        {showMainTeacherSuggestions && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1 custom-scrollbar">
                                {filteredMainTeacherSuggestions.length > 0 ? (
                                    filteredMainTeacherSuggestions.map(t => (
                                        <div 
                                            key={t.id}
                                            className="p-3 hover:bg-blue-50 cursor-pointer text-base flex items-center justify-between border-b border-slate-50 last:border-0"
                                            onClick={() => {
                                                setMainTeacherInput(`${t.saintName} ${t.fullName}`);
                                                setShowMainTeacherSuggestions(false);
                                            }}
                                        >
                                            <span>{t.saintName} {t.fullName}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-slate-400 text-center italic">Không tìm thấy GLV phù hợp</div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="block text-base font-bold text-slate-700 mb-3">GLV Phụ Trách</label>
                        <div className="space-y-3">
                             {assistants.map((val, idx) => {
                                const suggestions = getFilteredTeachers(val);
                                return (
                                    <div key={idx} className="relative">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                className="w-full p-3 pl-4 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white"
                                                placeholder={`GLV Phụ trách ${idx + 1}`}
                                                value={val}
                                                onChange={(e) => updateAssistant(idx, e.target.value)}
                                                onFocus={() => toggleAssistSuggestion(idx, true)}
                                                onBlur={() => setTimeout(() => toggleAssistSuggestion(idx, false), 200)}
                                            />
                                             <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        </div>
                                        {showAssistSuggestions[idx] && (
                                            <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1 custom-scrollbar">
                                                {suggestions.length > 0 ? (
                                                    suggestions.map(t => (
                                                        <div 
                                                            key={t.id}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer text-base flex items-center justify-between border-b border-slate-50 last:border-0"
                                                            onClick={() => selectAssistant(idx, `${t.saintName} ${t.fullName}`)}
                                                        >
                                                            <span>{t.saintName} {t.fullName}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-slate-400 text-center italic">Không tìm thấy</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                             })}
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-auto">
                    <button onClick={() => setEditingClass(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-base">Hủy</button>
                    <button onClick={handleSaveClass} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 text-base">
                        <Save size={20} /> Lưu Thay Đổi
                    </button>
                </div>
            </div>
        </div>
      )}
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};
