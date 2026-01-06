
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord, TermConfig, Teacher } from '../types';
import { CheckCircle2, Info, Save, Calendar, UserCheck, Search, ChevronDown, ChevronRight, School } from 'lucide-react';

interface AttendanceProps {
    students: Student[];
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    termConfigs: TermConfig[];
    currentUser: Teacher | null;
}

type AttendanceStatus = 'P' | 'K' | ''; // Trống = Hiện diện, P: Phép, K: Không phép

export const Attendance: React.FC<AttendanceProps> = ({ students, classes, years, grades, setRecords, termConfigs, currentUser }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [toast, setToast] = useState<string | null>(null);
  
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});

  const isAdmin = currentUser?.role === 'ADMIN';

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter allowed classes
  const allowedClasses = useMemo(() => {
      if (!currentUser) return [];
      if (isAdmin) return classes;
      
      const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
      return classes.filter(c => 
          (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
          (c.assistants && c.assistants.includes(teacherName))
      );
  }, [classes, currentUser, isAdmin]);

  // Initial Logic
  useEffect(() => {
     const active = years.find(y => y.isActive);
     const activeYearId = active ? active.id : (years[0]?.id || '');
     setSelectedYear(activeYearId);

     // If GLV, auto select the class context
     if (!isAdmin && activeYearId) {
         const myClassesInYear = allowedClasses.filter(c => c.yearId === activeYearId);
         if (myClassesInYear.length > 0) {
             setSelectedClass(myClassesInYear[0].id);
         } else {
             setSelectedClass('');
         }
     }
  }, [years, isAdmin, allowedClasses]);

  const classesInYear = useMemo(() => {
      return allowedClasses.filter(c => c.yearId === selectedYear);
  }, [allowedClasses, selectedYear]);

  const availableClasses = useMemo(() => {
    if (selectedGrade === 'all') return classesInYear;
    return classesInYear.filter(c => c.gradeId === selectedGrade);
  }, [classesInYear, selectedGrade]);

  // Handle default selection for ADMIN if list changes or empty
  useEffect(() => {
      if (isAdmin) {
          if (availableClasses.length > 0 && !availableClasses.find(c => c.id === selectedClass)) {
              setSelectedClass(availableClasses[0].id);
          } else if (availableClasses.length === 0) {
              setSelectedClass('');
          }
      }
  }, [availableClasses, selectedClass, isAdmin]);

  // Only show ACTIVE students in attendance list, sorted A-Z by name
  const filteredStudents = useMemo(() => {
      return students
        .filter(s => s.classId === selectedClass && s.status === 'ACTIVE')
        .sort((a, b) => (a.fullName.split(' ').pop() || '').localeCompare(b.fullName.split(' ').pop() || '', 'vi'));
  }, [students, selectedClass]);

  const sundaysInMonth = useMemo(() => {
      if (!selectedMonth) return [];
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const sundays = [];
      while (date.getMonth() === month - 1) {
          if (date.getDay() === 0) {
              sundays.push(new Date(date));
          }
          date.setDate(date.getDate() + 1);
      }
      return sundays;
  }, [selectedMonth]);

  const handleStatusChange = (studentId: string, date: string, type: 'mass' | 'class', status: AttendanceStatus) => {
    const key = `${studentId}-${date}-${type}`;
    setAttendanceData(prev => ({
        ...prev,
        [key]: status
    }));
  };

  const handleSave = () => {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const monthDateStr = `${selectedMonth}-15`;
      
      let term: 'HK1' | 'HK2' = 'HK1';
      
      const config1 = termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK1');
      const config2 = termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK2');

      if (config1 && monthDateStr >= config1.startDate && monthDateStr <= config1.endDate) {
          term = 'HK1';
      } else if (config2 && monthDateStr >= config2.startDate && monthDateStr <= config2.endDate) {
          term = 'HK2';
      } else {
          const m = parseInt(monthStr);
          term = (m >= 9 || m <= 1) ? 'HK1' : 'HK2';
      }

      setRecords(prev => {
          const newRecords = [...prev];
          
          filteredStudents.forEach(student => {
              let currentP = 0;
              let currentK = 0;
              
              sundaysInMonth.forEach(sunday => {
                  const dateStr = sunday.toISOString().split('T')[0];
                  // Mass absences
                  const massStatus = attendanceData[`${student.id}-${dateStr}-mass`];
                  if (massStatus === 'P') currentP++;
                  else if (massStatus === 'K') currentK++;
                  
                  // Class absences
                  const classStatus = attendanceData[`${student.id}-${dateStr}-class`];
                  if (classStatus === 'P') currentP++;
                  else if (classStatus === 'K') currentK++;
              });

              const existingIdx = newRecords.findIndex(r => r.studentId === student.id && r.term === term);
              if (existingIdx > -1) {
                  newRecords[existingIdx] = {
                      ...newRecords[existingIdx],
                      absentP: (newRecords[existingIdx].absentP || 0) + currentP,
                      absentK: (newRecords[existingIdx].absentK || 0) + currentK
                  };
              } else {
                  newRecords.push({
                      studentId: student.id,
                      term: term,
                      scores: {},
                      scorePray: 0,
                      scoreExam: 0,
                      average: 0,
                      absentP: currentP,
                      absentK: currentK
                  });
              }
          });
          
          return newRecords;
      });

      showToast(`Đã lưu & đồng bộ vắng mặt vào ${term === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2'} thành công!`);
  };

  const getStatusStyle = (status: AttendanceStatus | undefined) => {
      switch (status) {
          case 'P': return 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-inner ring-1 ring-amber-600';
          case 'K': return 'bg-red-600 text-white border-red-700 font-extrabold shadow-inner ring-1 ring-red-700';
          default: return 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:bg-slate-50';
      }
  };

  const currentYearName = years.find(y => y.id === selectedYear)?.name || '---';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'N/A';

  // GLV specific: Allowed classes in current year for Tabs
  const glvMyClasses = useMemo(() => {
      if (isAdmin) return [];
      return classesInYear;
  }, [isAdmin, classesInYear]);

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-50 md:bg-white/50">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={24} />
              <span className="font-bold">{toast}</span>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Điểm Danh</h2>
        <div className="flex items-center gap-3 text-sm md:text-base text-slate-600 bg-white px-3 py-2 rounded-lg border shadow-sm font-medium w-full md:w-auto">
            <Calendar size={18} className="text-blue-600" />
            <input 
                type="month" 
                className="bg-transparent outline-none font-bold text-blue-700 uppercase"
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
            />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {isAdmin ? (
            <>
                <select className="px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{years.map(y => <option key={y.id} value={y.id}>{y.name.replace('Năm học ', '')}</option>)}</select>
                <div className="flex gap-2">
                    <select className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}><option value="all">Tất cả Khối</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name.replace('Khối ', '')}</option>)}</select>
                    <select className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700 bg-blue-50" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}{availableClasses.length === 0 && <option value="">Không có lớp</option>}</select>
                </div>
            </>
        ) : (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400"/>
                    <span className="text-sm font-bold text-slate-700">{currentYearName}</span>
                </div>
                {glvMyClasses.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {glvMyClasses.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClass(c.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${selectedClass === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    // Single class - just show name
                    <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                        <School size={16} className="text-blue-500"/>
                        <span className="text-sm font-bold text-blue-800">{getClassName(selectedClass)}</span>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="bg-blue-600 text-white p-4 mb-4 flex items-center gap-3 shadow-lg rounded-xl animate-fade-in border-b-4 border-blue-800 md:mx-0">
        <div className="bg-white/20 p-2 rounded-lg"><Info size={20} className="text-white" /></div>
        <div className="flex flex-col text-xs md:text-sm">
            <span className="font-extrabold tracking-wide uppercase">Lưu ý:</span>
            <span className="opacity-95">Trống = Hiện diện. P = Phép, K = Không phép.</span>
        </div>
      </div>

      <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-300 flex-1 overflow-hidden flex flex-col bg-transparent">
        <div className="md:hidden overflow-y-auto h-full space-y-4 pb-24">
            {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">{idx + 1}</span>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{s.saintName} {s.fullName}</div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {sundaysInMonth.map((sunday, i) => {
                                const dateStr = sunday.toISOString().split('T')[0];
                                const massStatus = attendanceData[`${s.id}-${dateStr}-mass`];
                                const classStatus = attendanceData[`${s.id}-${dateStr}-class`];
                                return (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex flex-col min-w-[60px]">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">CN {i + 1}</span>
                                            <span className="text-xs font-bold text-blue-600">{sunday.getDate()}/{sunday.getMonth() + 1}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[9px] font-bold text-purple-400 uppercase">Lễ</span>
                                                <select 
                                                    value={massStatus || ''} 
                                                    onChange={(e) => handleStatusChange(s.id, dateStr, 'mass', e.target.value as AttendanceStatus)}
                                                    className={`h-8 w-16 text-center rounded text-xs border outline-none font-bold transition-all ${getStatusStyle(massStatus)}`}
                                                >
                                                    <option value=""></option>
                                                    <option value="P">P</option>
                                                    <option value="K">K</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[9px] font-bold text-blue-400 uppercase">Học</span>
                                                <select 
                                                    value={classStatus || ''} 
                                                    onChange={(e) => handleStatusChange(s.id, dateStr, 'class', e.target.value as AttendanceStatus)}
                                                    className={`h-8 w-16 text-center rounded text-xs border outline-none font-bold transition-all ${getStatusStyle(classStatus)}`}
                                                >
                                                    <option value=""></option>
                                                    <option value="P">P</option>
                                                    <option value="K">K</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200">Vui lòng chọn lớp để hiển thị danh sách</div>
            )}
        </div>

        <div className="hidden md:block overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse border-separate border-spacing-0">
             <thead>
               <tr className="bg-slate-100 text-slate-800 text-sm">
                 <th rowSpan={2} className="px-3 py-2 w-12 text-center sticky left-0 bg-slate-100 z-30 border-b border-r border-slate-400 font-bold">STT</th>
                 <th rowSpan={2} className="px-3 py-2 min-w-[200px] sticky left-12 bg-slate-100 z-30 border-b border-r border-slate-400 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] font-bold">Học Viên</th>
                 {sundaysInMonth.map((sunday, idx) => {
                    const isEven = idx % 2 === 0;
                    const bgClass = isEven ? 'bg-slate-50' : 'bg-blue-50';
                    return (
                        <th key={idx} colSpan={2} className={`px-3 py-2 text-center border-b border-r border-slate-400 ${bgClass}`}>
                            <div className="flex flex-col">
                                <span className={`font-bold ${isEven ? 'text-slate-700' : 'text-blue-800'}`}>CN {idx + 1}</span>
                                <span className="text-xs font-normal text-slate-500">{sunday.getDate()}/{sunday.getMonth() + 1}</span>
                            </div>
                        </th>
                    );
                 })}
                 <th rowSpan={2} className="px-3 py-2 text-center border-b border-slate-400 min-w-[150px] font-bold">Ghi chú</th>
               </tr>
               <tr className="text-xs uppercase tracking-tighter font-bold bg-slate-50">
                    {sundaysInMonth.map((_, idx) => {
                        const isEven = idx % 2 === 0;
                        const bgClass = isEven ? 'bg-slate-50' : 'bg-blue-50/50';
                        return (
                            <React.Fragment key={idx}>
                                <th className={`px-2 py-1 text-center border-b border-r border-slate-400 min-w-[50px] text-purple-700 ${bgClass}`}>Lễ</th>
                                <th className={`px-2 py-1 text-center border-b border-r border-slate-400 min-w-[50px] text-blue-700 ${bgClass}`}>Học</th>
                            </React.Fragment>
                        );
                    })}
               </tr>
             </thead>
             <tbody className="">
               {filteredStudents.length > 0 ? (
                 filteredStudents.map((s, idx) => (
                 <tr key={s.id} className="hover:bg-blue-50/30 group transition-colors border-b border-slate-300 text-base">
                   <td className="px-3 py-2 text-center text-slate-600 sticky left-0 bg-white group-hover:bg-slate-50 z-20 border-r border-slate-300 font-bold">{idx + 1}</td>
                   <td className="px-3 py-2 sticky left-12 bg-white group-hover:bg-slate-50 z-20 border-r border-slate-300 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    <div className="font-bold text-slate-800">{s.saintName} {s.fullName}</div>
                   </td>
                   {sundaysInMonth.map((sunday, i) => {
                       const dateStr = sunday.toISOString().split('T')[0];
                       const isEven = i % 2 === 0;
                       const cellClass = isEven ? 'bg-white group-hover:bg-blue-50/20' : 'bg-blue-50/10 group-hover:bg-blue-50/30';
                       const massStatus = attendanceData[`${s.id}-${dateStr}-mass`];
                       const classStatus = attendanceData[`${s.id}-${dateStr}-class`];
                       return (
                           <React.Fragment key={i}>
                               <td className={`p-1 border-r border-slate-300 text-center ${cellClass}`}>
                                   <div className="relative">
                                     <select 
                                        value={massStatus || ''} 
                                        onChange={(e) => handleStatusChange(s.id, dateStr, 'mass', e.target.value as AttendanceStatus)}
                                        className={`w-full text-center py-1.5 rounded text-sm border cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none appearance-none font-bold transition-all ${getStatusStyle(massStatus)}`}
                                     >
                                         <option value="" className="bg-white text-slate-400 font-normal"></option>
                                         <option value="P" className="bg-amber-500 text-white font-bold">P</option>
                                         <option value="K" className="bg-red-600 text-white font-bold">K</option>
                                     </select>
                                     {!massStatus && <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>}
                                   </div>
                               </td>
                               <td className={`p-1 border-r border-slate-300 text-center ${cellClass}`}>
                                   <div className="relative">
                                     <select 
                                        value={classStatus || ''} 
                                        onChange={(e) => handleStatusChange(s.id, dateStr, 'class', e.target.value as AttendanceStatus)}
                                        className={`w-full text-center py-1.5 rounded text-sm border cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none appearance-none font-bold transition-all ${getStatusStyle(classStatus)}`}
                                     >
                                         <option value="" className="bg-white text-slate-400 font-normal"></option>
                                         <option value="P" className="bg-amber-500 text-white font-bold">P</option>
                                         <option value="K" className="bg-red-600 text-white font-bold">K</option>
                                     </select>
                                     {!classStatus && <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>}
                                   </div>
                               </td>
                           </React.Fragment>
                       );
                   })}
                   <td className="px-3 py-2 border-r border-slate-300">
                     <input type="text" className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm py-1 transition-all" placeholder="..." />
                   </td>
                 </tr>
               ))) : (
                  <tr><td colSpan={sundaysInMonth.length * 2 + 3} className="p-12 text-center text-slate-400 italic bg-slate-50 text-lg">Vui lòng chọn lớp để hiển thị danh sách học viên</td></tr>
               )}
             </tbody>
           </table>
        </div>
        {filteredStudents.length > 0 && (
            <div className="p-4 md:p-5 border-t border-slate-300 bg-slate-100 flex flex-col md:flex-row justify-between items-center sticky bottom-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] gap-3 md:gap-0">
                 <div className="flex gap-4 md:gap-8 text-xs md:text-base w-full md:w-auto overflow-x-auto">
                     <div className="flex items-center gap-2 font-medium whitespace-nowrap"><span className="w-4 h-4 md:w-6 md:h-6 bg-white border border-slate-300 rounded shadow-sm"></span> <span className="text-slate-600">Trống: Có mặt</span></div>
                     <div className="flex items-center gap-2 font-medium whitespace-nowrap"><span className="w-4 h-4 md:w-6 md:h-6 bg-amber-500 border border-amber-600 rounded shadow-sm text-[10px] md:text-xs flex items-center justify-center font-black text-white">P</span> <span className="text-amber-700 font-bold">Phép</span></div>
                     <div className="flex items-center gap-2 font-medium whitespace-nowrap"><span className="w-4 h-4 md:w-6 md:h-6 bg-red-600 border border-red-700 rounded shadow-sm text-[10px] md:text-xs flex items-center justify-center font-black text-white">K</span> <span className="text-red-700 font-bold">K.Phép</span></div>
                 </div>
                 <button onClick={handleSave} className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm md:text-base">
                     <Save size={20}/> Lưu Điểm Danh
                 </button>
            </div>
        )}
      </div>
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        select { text-align-last: center; }
      `}</style>
    </div>
  );
};
