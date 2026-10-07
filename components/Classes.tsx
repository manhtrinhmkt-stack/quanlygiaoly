
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_TEACHERS } from '../constants';
import { ClassRoom, SchoolYear, Student, Grade, Teacher } from '../types';
import { Users, User, UserCheck, Edit, X, Save, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';

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

  const isAdmin = currentUser?.role === 'ADMIN';
  const isYearLocked = years.find(y => y.id === selectedYear)?.isLocked && !isAdmin;

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
    if (isYearLocked) {
        toast.error("Niên khóa này đã bị khóa. Không thể lưu thay đổi lớp học!");
        return;
    }
    if (editingClass) {
        const mainTeacher = mainTeacherInput.trim();
        const assistantList = assistants
            .map(s => s.trim())
            .filter(s => s !== '');

        // Check for duplicate assistants
        const uniqueAssistants = new Set(assistantList);
        if (uniqueAssistants.size !== assistantList.length) {
            toast.error("Có GLV phụ trách bị trùng lặp!");
            return;
        }

        // Check if main teacher is in assistants
        if (mainTeacher && assistantList.includes(mainTeacher)) {
            toast.error("GLV chủ nhiệm không được trùng với GLV phụ trách!");
            return;
        }

        // Check if any teacher is already assigned to another class
        const allTeachersInThisClass = [mainTeacher, ...assistantList].filter(t => t !== '');
        for (const teacherName of allTeachersInThisClass) {
            if (assignedTeachers.has(teacherName)) {
                toast.error(`GLV ${teacherName} đã được sắp vào lớp khác!`);
                return;
            }
        }

        const combinedAssistants = assistantList.join(', ');

        const finalClassData = { 
            ...editingClass, 
            mainTeacher: mainTeacher, 
            assistants: combinedAssistants 
        };

        const updatedClasses = classes.map(c => c.id === editingClass.id ? finalClassData : c);
        setClasses(updatedClasses);
        toast.success(`Đã cập nhật thông tin lớp ${editingClass.name} thành công!`);
        setEditingClass(null);
    }
  };

  const assignedTeachers = useMemo(() => {
      const assigned = new Set<string>();
      classes.forEach(c => {
          if (editingClass && c.id === editingClass.id) return;
          if (c.mainTeacher) assigned.add(c.mainTeacher.trim());
          if (c.assistants) {
              c.assistants.split(',').forEach(s => assigned.add(s.trim()));
          }
      });
      return assigned;
  }, [classes, editingClass]);

  const sortedTeachers = useMemo(() => {
      return [...MOCK_TEACHERS].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, []);

  const getFilteredTeachers = (input: string) => {
      // Filter out INACTIVE teachers AND already assigned teachers
      const availableTeachers = sortedTeachers.filter(t => 
          t.status !== 'INACTIVE' && 
          !assignedTeachers.has(`${t.saintName} ${t.fullName}`)
      );
      
      if (!input) return availableTeachers;
      const lowerInput = input.toLowerCase();
      return availableTeachers.filter(t => 
          t.fullName.toLowerCase().includes(lowerInput) || 
          t.saintName.toLowerCase().includes(lowerInput)
      );
  };

  const filteredMainTeacherSuggestions = useMemo(() => getFilteredTeachers(mainTeacherInput), [mainTeacherInput, sortedTeachers, assignedTeachers]);

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
      {isYearLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <span className="text-amber-600 shrink-0">🔒</span>
              <span>Niên khóa này đã bị khóa. Toàn bộ thông tin phân công lớp học hiển thị ở chế độ Chỉ Đọc. Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để chỉnh sửa phân công.</span>
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
                                     <td className="px-4 py-3 text-slate-600 font-medium" title={c.assistants}>{c.assistants || '---'}</td>
                                     {isAdmin && !isYearLocked && (
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-2xl text-slate-800">Cập nhật Lớp học: <span className="text-blue-600">{editingClass.name}</span></h3>
                    <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tên Lớp</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl bg-slate-100 text-slate-500 text-base font-medium" 
                                value={editingClass.name} 
                                disabled 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Số Phòng Học</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base transition-all" 
                                value={editingClass.room || ''} 
                                onChange={(e) => setEditingClass({...editingClass, room: e.target.value})}
                                placeholder="Nhập số phòng..."
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-700 mb-2">GLV Chủ Nhiệm</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    className="w-full p-3 pl-4 pr-10 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base transition-all"
                                    value={mainTeacherInput}
                                    onChange={(e) => {
                                        setMainTeacherInput(e.target.value);
                                        setShowMainTeacherSuggestions(true);
                                    }}
                                    onFocus={() => setShowMainTeacherSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowMainTeacherSuggestions(false), 200)}
                                    placeholder="Nhập tên GLV..."
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                            {showMainTeacherSuggestions && (
                                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto mt-1 custom-scrollbar">
                                    {filteredMainTeacherSuggestions.length > 0 ? (
                                        filteredMainTeacherSuggestions.map(t => (
                                            <div 
                                                key={t.id}
                                                className="p-3 hover:bg-blue-50 cursor-pointer text-base flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
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
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-4">GLV Phụ Trách</label>
                        <div className="grid grid-cols-1 gap-4">
                             {assistants.map((val, idx) => {
                                const suggestions = getFilteredTeachers(val);
                                return (
                                    <div key={idx} className="relative">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                className="w-full p-3 pl-4 pr-10 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white transition-all"
                                                placeholder={`GLV Phụ trách ${idx + 1}`}
                                                value={val}
                                                onChange={(e) => updateAssistant(idx, e.target.value)}
                                                onFocus={() => toggleAssistSuggestion(idx, true)}
                                                onBlur={() => setTimeout(() => toggleAssistSuggestion(idx, false), 200)}
                                            />
                                             <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        </div>
                                        {showAssistSuggestions[idx] && (
                                            <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto mt-1 custom-scrollbar">
                                                {suggestions.length > 0 ? (
                                                    suggestions.map(t => (
                                                        <div 
                                                            key={t.id}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer text-base flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
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
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 mt-auto">
                    <button onClick={() => setEditingClass(null)} className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-base transition-all">Hủy</button>
                    <button onClick={handleSaveClass} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 text-base shadow-lg shadow-blue-200 transition-all">
                        <Save size={20} /> Lưu Thay Đổi
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
