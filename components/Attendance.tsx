
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord, TermConfig, Teacher, AttendanceConfig } from '../types';
import { Save, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceProps {
    students: Student[];
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    termConfigs: TermConfig[];
    currentUser: Teacher | null;
    attendanceConfig: AttendanceConfig;
    attendanceData: Record<string, AttendanceStatus>;
    setAttendanceData: React.Dispatch<React.SetStateAction<Record<string, AttendanceStatus>>>;
}

type AttendanceStatus = 'C' | 'P' | 'K' | ''; // C: Có, P: Phép, K: Không

export const Attendance: React.FC<AttendanceProps> = ({ students, classes, years, grades, setRecords, termConfigs, currentUser, attendanceConfig, attendanceData, setAttendanceData }) => {
  const [selectedYear, setSelectedYear] = useState(years.find(y => y.isActive)?.id || '');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceType, setAttendanceType] = useState<'mass' | 'class'>('class');

  const isAdmin = currentUser?.role === 'ADMIN';
  const isYearLocked = years.find(y => y.id === selectedYear)?.isLocked && !isAdmin;

  const classesInYear = useMemo(() => {
      if (!currentUser) return [];
      const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
      return classes.filter(c => {
          const isYearMatch = c.yearId === selectedYear;
          if (!isYearMatch) return false;
          if (isAdmin) return true;
          return (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
                 (c.assistants && c.assistants.includes(teacherName));
      });
  }, [classes, selectedYear, currentUser, isAdmin]);

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
        .filter(s => 
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.id.includes(searchTerm) ||
            (s.saintName && s.saintName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => (a.fullName.split(' ').pop() || '').localeCompare(b.fullName.split(' ').pop() || '', 'vi'));
  }, [students, selectedClass, searchTerm]);

  const attendanceDaysInMonth = useMemo(() => {
      if (!selectedMonth) return [];
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const days = [];
      const daysConfig = attendanceConfig?.allowedDays || [0];
      while (date.getMonth() === month - 1) {
          if (daysConfig.includes(date.getDay())) {
              days.push(new Date(date));
          }
          date.setDate(date.getDate() + 1);
      }
      return days;
  }, [selectedMonth, attendanceConfig]);

  // Update selectedDate when month or allowed days change
  useEffect(() => {
      if (attendanceDaysInMonth.length > 0) {
          if (!selectedDate || attendanceDaysInMonth.every(d => d.toISOString().split('T')[0] !== selectedDate)) {
              setSelectedDate(attendanceDaysInMonth[0].toISOString().split('T')[0]);
          }
      } else {
          setSelectedDate(null);
      }
  }, [attendanceDaysInMonth, selectedMonth]);

  const handleStatusChange = (studentId: string, date: string, type: 'mass' | 'class', status: AttendanceStatus) => {
    const key = `${studentId}-${date}-${type}`;
    setAttendanceData(prev => ({
        ...prev,
        [key]: status
    }));
  };

  const getDayInfo = (date: Date) => {
      const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = weekdays[date.getDay()];
      const dayNum = date.getDate().toString().padStart(2, '0');
      const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
      return {
          dayName,
          dayNum,
          monthNum,
          formatted: `${dayName} ${dayNum}/${monthNum}`,
          short: `${dayNum}`
      };
  };

  const handleSave = () => {
      const monthDateStr = `${selectedMonth}-15`;
      
      let term: 'HK1' | 'HK2' = 'HK1';
      
      const config1 = termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK1');
      const config2 = termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK2');

      if (config1 && monthDateStr >= config1.startDate && monthDateStr <= config1.endDate) {
          term = 'HK1';
      } else if (config2 && monthDateStr >= config2.startDate && monthDateStr <= config2.endDate) {
          term = 'HK2';
      } else {
          const m = parseInt(selectedMonth.split('-')[1]);
          term = (m >= 9 || m <= 1) ? 'HK1' : 'HK2';
      }

      setRecords(prev => {
          const newRecords = [...prev];
          
          filteredStudents.forEach(student => {
              let currentP = 0;
              let currentK = 0;
              
              attendanceDaysInMonth.forEach(sunday => {
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

      toast.success(`Đã lưu & đồng bộ vắng mặt vào ${term === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2'} thành công!`);
  };

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-50 overflow-hidden">
      {isYearLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <span className="text-amber-600 shrink-0">🔒</span>
              <span>Niên khóa này đã bị khóa. Toàn bộ thông tin điểm danh hiển thị ở chế độ Chỉ Đọc. Người dùng có vai trò Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để cập nhật điểm danh.</span>
          </div>
      )}
      
      {/* Header with Month/Year Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Điểm danh</h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                <span className="text-slate-500 text-xs font-bold">Tháng/Năm:</span>
                <input 
                    type="month" 
                    className="bg-transparent outline-none font-bold text-slate-700 text-sm focus:ring-0 cursor-pointer"
                    value={selectedMonth} 
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                    }} 
                />
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
               <select 
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setSelectedGrade('all'); setSelectedClass(''); }}
              >
                {years.map(y => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
              
              <select 
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedGrade}
                onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass(''); }}
              >
                <option value="all">Tất cả khối</option>
                {grades.filter(g => classes.some(c => c.gradeId === g.id && c.yearId === selectedYear)).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              <select 
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Chọn lớp --</option>
                {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm mr-2 font-bold text-xs gap-1">
                  <button 
                    onClick={() => setAttendanceType('mass')}
                    className={`px-3 py-1 rounded-md transition-all ${attendanceType === 'mass' ? 'bg-purple-600 text-white shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      LỄ
                  </button>
                  <button 
                    onClick={() => setAttendanceType('class')}
                    className={`px-3 py-1 rounded-md transition-all ${attendanceType === 'class' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      HỌC
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm học viên..." 
                    className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
      </div>

      {/* Date Selection Strip */}
      {selectedClass && attendanceDaysInMonth.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 mb-1.5">Chọn ngày:</h3>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                {attendanceDaysInMonth.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const info = getDayInfo(day);
                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center justify-center w-11 h-12 rounded-md border transition-all ${selectedDate === dateStr ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-200'}`}
                        >
                            <span className="text-[9px] font-bold opacity-70">{info.dayName}</span>
                            <span className="text-sm font-black">{info.dayNum}</span>
                        </button>
                    )
                })}
            </div>
          </div>
      )}

      {/* Date Configuration Safety Check Notice */}
      {selectedClass && attendanceDaysInMonth.length === 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 mb-6 shadow-sm">
              <p className="text-sm font-bold text-amber-800">
                  Không tìm thấy buổi điểm danh nào phù hợp trong tháng này.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                  Vui lòng kiểm tra lại thiết lập cấu hình ngày điểm danh trong Cài đặt hệ thống (Ví dụ: bật ngày Chủ Nhật).
              </p>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 pr-1">
        {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <p className="text-slate-500 text-sm font-bold">Chưa có học viên nào hoặc không tìm thấy học viên phù hợp.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredStudents.map((s, idx) => {
                    return (
                        <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center relative group hover:shadow-md transition-all">
                            <div className="absolute top-3 left-4 text-[10px] font-bold text-slate-400">
                                {idx + 1} / {filteredStudents.length}
                            </div>

                            <div className="text-center mb-3 mt-2">
                                <div className="font-extrabold text-slate-800 text-sm mb-0.5">{s.saintName} {s.fullName}</div>
                                <div className="text-[10px] font-bold text-slate-400">{s.id}</div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 justify-center w-full pt-3 border-t border-slate-100">
                                {selectedDate && (
                                  <>
                                    <button onClick={() => handleStatusChange(s.id, selectedDate, attendanceType, 'C')} className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${attendanceData[`${s.id}-${selectedDate}-${attendanceType}`] === 'C' ? 'bg-green-500 text-white border-green-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>C</button>
                                    <button onClick={() => handleStatusChange(s.id, selectedDate, attendanceType, 'P')} className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${attendanceData[`${s.id}-${selectedDate}-${attendanceType}`] === 'P' ? 'bg-orange-400 text-white border-orange-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>P</button>
                                    <button onClick={() => handleStatusChange(s.id, selectedDate, attendanceType, 'K')} className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${attendanceData[`${s.id}-${selectedDate}-${attendanceType}`] === 'K' ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}>K</button>
                                  </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 flex items-center gap-6 z-50 animate-slide-up">
          <div className="flex gap-6 text-xs font-bold">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> <span className="text-slate-600">C: Có mặt</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400"></span> <span className="text-slate-600">P: Có phép</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span> <span className="text-slate-600">K: Không phép</span></div>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button 
              onClick={() => {
                  if (isYearLocked) {
                      toast.error("Niên khóa này đã bị khóa. Không thể lưu điểm danh!");
                      return;
                  }
                  handleSave();
              }} 
              className={`px-8 py-2.5 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all transform ${isYearLocked ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
              disabled={isYearLocked}
          >
              <Save size={18} /> Lưu Điểm Danh
          </button>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};
