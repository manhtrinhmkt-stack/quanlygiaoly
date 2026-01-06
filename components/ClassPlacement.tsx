
import React, { useState, useMemo, useEffect } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, Teacher, AcademicRecord, ScoreColumn } from '../types';
import { ArrowRight, Search, CheckCircle2, Users, ArrowRightLeft, ArrowUpRight, GraduationCap, Filter, Globe, List, AlertCircle, X, Check, XCircle } from 'lucide-react';

interface ClassPlacementProps {
    students: Student[];
    setStudents: (students: Student[]) => void;
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    currentUser: Teacher | null;
    records?: AcademicRecord[];
    scoreColumns?: ScoreColumn[];
}

type Mode = 'TRANSFER' | 'PROMOTION';
type SearchMode = 'CLASS' | 'GLOBAL';

export const ClassPlacement: React.FC<ClassPlacementProps> = ({ students, setStudents, classes, years, grades, currentUser, records = [], scoreColumns = [] }) => {
  const [mode, setMode] = useState<Mode>('TRANSFER'); 
  const [searchMode, setSearchMode] = useState<SearchMode>('CLASS');
  const [toast, setToast] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // === FILTER STATE ===
  // Source (Nguồn)
  const [srcYear, setSrcYear] = useState('');
  const [srcGrade, setSrcGrade] = useState('all');
  const [srcClassId, setSrcClassId] = useState('');
  const [srcSearch, setSrcSearch] = useState('');

  // Target (Đích)
  const [tgtYear, setTgtYear] = useState('');
  const [tgtGrade, setTgtGrade] = useState('all');
  const [tgtClassId, setTgtClassId] = useState('');

  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Init default years
  useEffect(() => {
    const active = years.find(y => y.isActive);
    if (!active) return;
    setSrcYear(active.id);
    setTgtYear(active.id); 
  }, [years]);

  // Reset selection when source changes
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [srcClassId, searchMode]);

  // Allowed Classes Logic
  const allowedClasses = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === 'ADMIN') return classes;
      
      const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
      return classes.filter(c => 
          (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
          (c.assistants && c.assistants.includes(teacherName))
      );
  }, [classes, currentUser]);

  // Logic to filter Source Classes
  const srcClasses = useMemo(() => {
    // If Admin, show all. If GLV, only show allowed classes in dropdown
    return allowedClasses.filter(c => c.yearId === srcYear && (srcGrade === 'all' || c.gradeId === srcGrade));
  }, [allowedClasses, srcYear, srcGrade]);

  // Logic to filter Target Classes
  const tgtClasses = useMemo(() => {
    // Target classes also restricted to what the teacher can see/manage
    return allowedClasses.filter(c => c.yearId === tgtYear && (tgtGrade === 'all' || c.gradeId === tgtGrade));
  }, [allowedClasses, tgtYear, tgtGrade]);

  // Calculate Average Helper (similar to Grades.tsx)
  const calculateAvg = (record: AcademicRecord) => {
      let totalScore = 0;
      let totalWeight = 0;
      const termColumns = scoreColumns.filter(c => c.term === record.term);
      termColumns.forEach(col => {
          const score = (record.scores && record.scores[col.id] !== undefined) ? record.scores[col.id] : 0;
          totalScore += score * col.weight;
          totalWeight += col.weight;
      });
      return totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(1)) : 0;
  };

  // Determine Pass Status for a student
  const getPassStatus = (student: Student) => {
      if (student.promotionResult) return student.promotionResult; // Use manual override if exists
      
      // Otherwise calculate from records
      const r1 = records.find(r => r.studentId === student.id && r.term === 'HK1');
      const r2 = records.find(r => r.studentId === student.id && r.term === 'HK2');
      
      const avg1 = r1 ? calculateAvg(r1) : 0;
      const avg2 = r2 ? calculateAvg(r2) : 0;
      
      const avgYear = (avg1 > 0 || avg2 > 0) ? (avg1 + avg2) / 2 : 0;
      return avgYear >= 5.0 ? 'PASS' : 'RETAIN';
  };

  // Students in Source
  const srcStudents = useMemo(() => {
    let list: Student[] = [];
    
    if (searchMode === 'CLASS') {
        if (!srcClassId) return [];
        list = students.filter(s => s.classId === srcClassId);
    } else {
        if (!srcSearch) return [];
        list = students; 
    }

    if (srcSearch) {
        const q = srcSearch.toLowerCase();
        list = list.filter(s => s.fullName.toLowerCase().includes(q) || s.saintName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    
    // Only show students belonging to allowed classes if GLV
    if (currentUser?.role !== 'ADMIN') {
        const allowedIds = allowedClasses.map(c => c.id);
        list = list.filter(s => allowedIds.includes(s.classId));
    }
    
    return list.slice(0, 100); 
  }, [students, srcClassId, srcSearch, searchMode, allowedClasses, currentUser]);

  // Students in Target Class (for preview)
  const tgtStudents = useMemo(() => {
    if (!tgtClassId) return [];
    return students.filter(s => s.classId === tgtClassId);
  }, [students, tgtClassId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedStudentIds(srcStudents.map(s => s.id));
    } else {
        setSelectedStudentIds([]);
    }
  };

  const handleSelectPassed = () => {
      const passedIds = srcStudents.filter(s => getPassStatus(s) === 'PASS').map(s => s.id);
      setSelectedStudentIds(passedIds);
  }

  const toggleSelect = (id: string) => {
      setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExecute = () => {
      if (selectedStudentIds.length === 0) return alert("Chưa chọn học viên nào!");
      if (!tgtClassId) return alert("Chưa chọn lớp đích!");
      setShowConfirmModal(true);
  };

  const confirmTransfer = () => {
      const tgtClass = classes.find(c => c.id === tgtClassId);
      const updatedStudents = students.map(s => {
          if (selectedStudentIds.includes(s.id)) {
              return { ...s, classId: tgtClassId };
          }
          return s;
      });
      setStudents(updatedStudents);
      setToast(`Đã chuyển thành công ${selectedStudentIds.length} học viên!`);
      setSelectedStudentIds([]);
      setShowConfirmModal(false);
  };

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Chưa xếp lớp';

  return (
    <div className="p-6 h-screen flex flex-col bg-slate-100 relative">
       {/* Toast */}
       {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={24} />
              <span className="font-bold">{toast}</span>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Xếp Lớp & Điều Chuyển</h2>
            <p className="text-slate-500 text-sm">Quản lý danh sách học viên giữa các lớp</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
            <button 
                onClick={() => setMode('TRANSFER')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${mode === 'TRANSFER' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <ArrowRightLeft size={16} /> Chuyển Lớp (Trong năm)
            </button>
            <button 
                onClick={() => setMode('PROMOTION')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${mode === 'PROMOTION' ? 'bg-green-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <ArrowUpRight size={16} /> Lên Lớp (Niên khóa mới)
            </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* LEFT: SOURCE */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200">
                  <div className="flex border-b border-slate-200">
                      <button 
                        onClick={() => setSearchMode('CLASS')}
                        className={`flex-1 py-3 text-xs font-bold uppercase flex justify-center items-center gap-2 transition-colors ${searchMode === 'CLASS' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                         <List size={14}/> Theo Lớp
                      </button>
                      <button 
                         onClick={() => setSearchMode('GLOBAL')}
                         className={`flex-1 py-3 text-xs font-bold uppercase flex justify-center items-center gap-2 transition-colors ${searchMode === 'GLOBAL' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                         <Globe size={14}/> Tìm Học Viên
                      </button>
                  </div>
                  
                  <div className="p-4">
                    {searchMode === 'CLASS' ? (
                        <div className="space-y-2">
                             <div className="grid grid-cols-2 gap-2">
                                <select className="input-select" value={srcYear} onChange={e => setSrcYear(e.target.value)}>
                                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                </select>
                                <select className="input-select" value={srcGrade} onChange={e => setSrcGrade(e.target.value)}>
                                    <option value="all">Tất cả Khối</option>
                                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <select className={`input-select w-full font-bold ${srcClassId ? 'text-slate-800' : 'text-slate-400'}`} value={srcClassId} onChange={e => setSrcClassId(e.target.value)}>
                                <option value="">-- Chọn Lớp Nguồn --</option>
                                {srcClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Nhập tên học viên để tìm..." 
                                className="w-full pl-9 pr-3 py-2 text-sm border border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-200 outline-none"
                                value={srcSearch}
                                onChange={e => setSrcSearch(e.target.value)}
                                autoFocus
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={16}/>
                            <div className="text-[10px] text-slate-400 mt-1 italic text-right">*Tìm trong toàn bộ hệ thống</div>
                        </div>
                    )}
                  </div>
              </div>

              {/* Source List */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                 {searchMode === 'CLASS' && srcClassId && (
                     <div className="px-2 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10 flex flex-col gap-2">
                         <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                             <input 
                                type="text" 
                                placeholder="Lọc tên trong lớp này..." 
                                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100"
                                value={srcSearch}
                                onChange={e => setSrcSearch(e.target.value)}
                             />
                         </div>
                         {mode === 'PROMOTION' && (
                             <div className="flex gap-2">
                                <button onClick={handleSelectPassed} className="flex-1 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded hover:bg-green-100 border border-green-200 transition-all">Chọn tất cả Đạt</button>
                             </div>
                         )}
                     </div>
                 )}
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                     {(searchMode === 'GLOBAL' && srcSearch) || (searchMode === 'CLASS' && srcClassId) ? (
                         srcStudents.length > 0 ? (
                             <div className="space-y-1">
                                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2">
                                     <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" onChange={handleSelectAll} checked={srcStudents.length > 0 && selectedStudentIds.length === srcStudents.length}/>
                                     <span className="text-sm font-bold text-slate-600">Chọn tất cả ({srcStudents.length})</span>
                                 </div>
                                 {srcStudents.map(s => {
                                     const passStatus = getPassStatus(s);
                                     return (
                                     <div 
                                        key={s.id} 
                                        onClick={() => toggleSelect(s.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                     >
                                         <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded cursor-pointer pointer-events-none" 
                                            checked={selectedStudentIds.includes(s.id)} 
                                            readOnly
                                         />
                                         <div className="flex-1">
                                             <div className="flex justify-between items-center">
                                                <div className="text-sm font-bold text-slate-800">{s.saintName} {s.fullName}</div>
                                                {mode === 'PROMOTION' && (
                                                    passStatus === 'PASS' ? (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black border border-green-200 uppercase flex items-center gap-1"><Check size={10}/> Đạt</span>
                                                    ) : (
                                                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black border border-red-200 uppercase flex items-center gap-1"><XCircle size={10}/> Hỏng</span>
                                                    )
                                                )}
                                                {searchMode === 'GLOBAL' && mode !== 'PROMOTION' && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">{getClassName(s.classId)}</span>}
                                             </div>
                                             <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.id} - {new Date(s.dob).toLocaleDateString('vi-VN')}</div>
                                         </div>
                                     </div>
                                 )})}
                             </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                 <span className="text-sm italic">Không tìm thấy học viên</span>
                             </div>
                         )
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                             <GraduationCap size={48} className="mb-2"/>
                             <span className="text-sm font-medium">
                                 {searchMode === 'CLASS' ? 'Vui lòng chọn lớp nguồn' : 'Nhập tên để tìm kiếm'}
                             </span>
                         </div>
                     )}
                 </div>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-500 text-right">
                  Đã chọn: {selectedStudentIds.length} / {srcStudents.length}
              </div>
          </div>

          {/* MIDDLE: ACTIONS */}
          <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-full w-[1px] bg-slate-200 my-10 hidden lg:block"></div>
              <button 
                onClick={handleExecute}
                disabled={selectedStudentIds.length === 0 || !tgtClassId}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${selectedStudentIds.length > 0 && tgtClassId ? 'bg-blue-600 text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                title="Thực hiện chuyển lớp"
              >
                  <ArrowRight size={24} />
              </button>
              <div className="h-full w-[1px] bg-slate-200 my-10 hidden lg:block"></div>
          </div>

          {/* RIGHT: TARGET */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
             <div className={`p-4 border-b border-slate-200 ${mode === 'PROMOTION' ? 'bg-green-50' : 'bg-blue-50'}`}>
                  <div className={`flex items-center gap-2 mb-3 font-bold uppercase text-xs tracking-wider ${mode === 'PROMOTION' ? 'text-green-800' : 'text-blue-800'}`}>
                      <Users size={14}/> Lớp Đích
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                      <select className="input-select" value={tgtYear} onChange={e => setTgtYear(e.target.value)}>
                          {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                      </select>
                      <select className="input-select" value={tgtGrade} onChange={e => setTgtGrade(e.target.value)}>
                          <option value="all">Tất cả Khối</option>
                          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                  </div>
                  <select className={`input-select w-full font-bold ${tgtClassId ? 'text-slate-800' : 'text-slate-400'} ${mode === 'PROMOTION' ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`} value={tgtClassId} onChange={e => setTgtClassId(e.target.value)}>
                      <option value="">-- Chọn Lớp Đích --</option>
                      {tgtClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>

              {/* Target Preview List */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                     {tgtClassId ? (
                         <div className="space-y-1">
                             <div className="text-xs font-bold text-slate-400 uppercase p-2">Danh sách hiện tại ({tgtStudents.length})</div>
                             {tgtStudents.map((s, idx) => (
                                 <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                     <div className="flex items-center gap-3">
                                         <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">{idx + 1}</span>
                                         <div>
                                             <div className="text-sm font-medium text-slate-700">{s.saintName} {s.fullName}</div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {tgtStudents.length === 0 && <div className="p-8 text-center text-sm text-slate-400 italic">Lớp chưa có học viên</div>}
                         </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                             <Users size={48} className="mb-2"/>
                             <span className="text-sm font-medium">Vui lòng chọn lớp đích</span>
                         </div>
                     )}
                  </div>
              </div>
          </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-slate-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 text-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full border border-blue-100">
                            <AlertCircle size={28} strokeWidth={2.5}/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Xác nhận chuyển lớp</h3>
                    </div>
                    <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24}/>
                    </button>
                </div>
                
                <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                    Bạn có chắc chắn muốn chuyển <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{selectedStudentIds.length} học viên</span> sang lớp <span className="font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{classes.find(c => c.id === tgtClassId)?.name}</span> không?
                </p>
                
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowConfirmModal(false)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 text-sm">
                        Hủy bỏ
                    </button>
                    <button onClick={confirmTransfer} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm flex items-center gap-2">
                        <CheckCircle2 size={18}/> Xác nhận
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        .input-select {
            width: 100%;
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid #cbd5e1;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
        }
        .input-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};
