
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Table, UserCheck, XCircle, CheckCircle2, ListChecks, Download, Settings2, Trash2, X, AlertCircle, ChevronDown, ChevronRight, Calculator, GripVertical, Calendar, School, Info, Printer, UserCog, Check } from 'lucide-react';
import { AcademicRecord, Student, ClassRoom, SchoolYear, Grade, ScoreColumn, Teacher } from '../types';

interface GradesProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    classes: ClassRoom[];
    years: SchoolYear[];
    records: AcademicRecord[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    grades: Grade[];
    scoreColumns: ScoreColumn[];
    currentUser: Teacher | null;
}

const COL_WIDTHS = {
    index: 40,
    studentInfo: 280, // Reduced from 350 to be more compact
    score: 60,
    absent: 35,
    avg: 50,
    final: 60,
    rank: 85,
    ranking: 50
};

export const Grades: React.FC<GradesProps> = ({ students, setStudents, classes, years, records, setRecords, grades, scoreColumns, currentUser }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState<'entry' | 'summary' | 'review'>('entry');
  const [toast, setToast] = useState<string | null>(null);
  
  // Mobile accordion states
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

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

  const classesInYear = useMemo(() => allowedClasses.filter(c => c.yearId === selectedYear), [allowedClasses, selectedYear]);

  const availableClasses = useMemo(() => {
    if (selectedGrade === 'all') return classesInYear;
    return classesInYear.filter(c => c.gradeId === selectedGrade);
  }, [classesInYear, selectedGrade]);

  useEffect(() => {
      if (isAdmin) {
          if (availableClasses.length > 0 && !availableClasses.find(c => c.id === selectedClass)) {
              setSelectedClass(availableClasses[0].id);
          } else if (availableClasses.length === 0) {
              setSelectedClass('');
          }
      }
  }, [availableClasses, selectedClass, isAdmin]);

  const filteredStudents = students.filter(s => s.classId === selectedClass && s.status === 'ACTIVE');
  const currentClass = classes.find(c => c.id === selectedClass);

  const hk1Columns = useMemo(() => scoreColumns.filter(c => c.term === 'HK1'), [scoreColumns]);
  const hk2Columns = useMemo(() => scoreColumns.filter(c => c.term === 'HK2'), [scoreColumns]);

  const getRecord = (studentId: string, specificTerm: 'HK1' | 'HK2') => {
    return records.find(r => r.studentId === studentId && r.term === specificTerm) || {
      studentId, term: specificTerm, scores: {}, scorePray: 0, scoreExam: 0, average: 0, absentP: 0, absentK: 0
    };
  };

  const handleScoreChange = (studentId: string, term: 'HK1' | 'HK2', field: string, value: string) => {
    let numValue = value === '' ? 0 : (parseFloat(value) || 0);
    if (numValue > 10) numValue = 10;
    if (numValue < 0) numValue = 0;
    
    setRecords(prev => {
        const existingIndex = prev.findIndex(r => r.studentId === studentId && r.term === term);
        const newRecords = [...prev];
        if (existingIndex > -1) {
            newRecords[existingIndex] = { ...prev[existingIndex], scores: { ...prev[existingIndex].scores, [field]: numValue } };
            return newRecords;
        } else {
             return [...newRecords, { studentId, term, scores: { [field]: numValue }, scorePray: 0, scoreExam: 0, average: 0, absentP: 0, absentK: 0 }];
        }
    });
  };

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

  const handleSaveGrades = () => {
     const updatedRecords = records.map(r => {
         const student = filteredStudents.find(s => s.id === r.studentId);
         if (student) {
            return { ...r, average: calculateAvg(r) };
         }
         return r;
     });
     setRecords(updatedRecords);
     showToast(`Đã lưu bảng điểm lớp ${currentClass?.name}!`);
  };

  const getRank = (avg: number) => {
    if (avg === 0) return { label: '-', color: 'text-slate-400 bg-slate-50' };
    if (avg < 5) return { label: 'Yếu', color: 'text-red-600 bg-red-50' };
    if (avg < 6.5) return { label: 'TB', color: 'text-orange-600 bg-orange-50' };
    if (avg < 8) return { label: 'Khá', color: 'text-blue-600 bg-blue-50' };
    return { label: 'Giỏi', color: 'text-green-600 bg-green-50' };
  };

  const processedStudentsYear = useMemo(() => {
    let list = filteredStudents.map(s => {
      const r1 = getRecord(s.id, 'HK1');
      const r2 = getRecord(s.id, 'HK2');
      const avg1 = calculateAvg(r1);
      const avg2 = calculateAvg(r2);
      const finalAvg = (avg1 > 0 || avg2 > 0) ? (avg1 + avg2) / 2 : 0;
      return { 
        ...s, 
        avg1, avg2, avgYear: finalAvg, 
        rank: getRank(finalAvg), 
        isPassed: finalAvg >= 5.0,
        absentP1: r1.absentP || 0,
        absentK1: r1.absentK || 0,
        absentP2: r2.absentP || 0,
        absentK2: r2.absentK || 0,
        nameForSort: s.fullName.split(' ').pop() || ''
      };
    });
    const sortedByScore = [...list].sort((a, b) => b.avgYear - a.avgYear);
    const rankedMap = new Map();
    sortedByScore.forEach((s, index) => { rankedMap.set(s.id, index + 1); });
    return list.map(s => ({ ...s, ranking: rankedMap.get(s.id) })).sort((a, b) => a.nameForSort.localeCompare(b.nameForSort, 'vi'));
  }, [filteredStudents, records, scoreColumns]);

  const passedStudents = processedStudentsYear.filter(s => s.isPassed);
  const failedStudents = processedStudentsYear.filter(s => !s.isPassed);

  const currentYearName = years.find(y => y.id === selectedYear)?.name || '---';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'N/A';

  // GLV specific: Allowed classes in current year for Tabs
  const glvMyClasses = useMemo(() => {
      if (isAdmin) return [];
      return classesInYear;
  }, [isAdmin, classesInYear]);

  // --- REVIEW LOGIC ---
  const handleTogglePromotion = (studentId: string, currentResult: 'PASS' | 'RETAIN' | undefined, avg: number) => {
      const autoResult = avg >= 5.0 ? 'PASS' : 'RETAIN';
      const effectiveResult = currentResult || autoResult;
      const newResult = effectiveResult === 'PASS' ? 'RETAIN' : 'PASS';
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, promotionResult: newResult } : s));
  };

  const handleSaveReview = () => {
      showToast("Đã lưu kết quả xét duyệt!");
  };

  // --- PRINT LOGIC ---
  const handlePrint = (type: 'CLASS' | 'STUDENT', studentId?: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Vui lòng cho phép popup để in.");

      const styles = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; line-height: 1.4; font-size: 12px; }
            h1, h2, h3 { text-align: center; margin: 5px 0; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; font-size: 11px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 50px; }
            .signature-block { text-align: center; width: 40%; }
            @media print {
                @page { margin: 1cm; size: landscape; }
                body { padding: 0; }
            }
        </style>
      `;

      let content = '';

      if (type === 'CLASS' && currentClass) {
          content = `
            <div class="header">
                <h3>BẢNG ĐIỂM TỔNG HỢP</h3>
                <p>Lớp: <b>${currentClass.name}</b> - Năm học: ${currentYearName}</p>
                <p>GLV Phụ trách: ${currentClass.mainTeacher || '....................'}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 30px;">STT</th>
                        <th rowspan="2" style="width: 180px;">Họ và Tên</th>
                        <th colspan="${hk1Columns.length + 1}">HỌC KỲ 1</th>
                        <th colspan="${hk2Columns.length + 1}">HỌC KỲ 2</th>
                        <th rowspan="2" style="width: 40px;">TB Năm</th>
                        <th rowspan="2" style="width: 50px;">Xếp Loại</th>
                        <th rowspan="2" style="width: 30px;">Hạng</th>
                    </tr>
                    <tr>
                        ${hk1Columns.map(c => `<th>${c.name}</th>`).join('')}
                        <th>TB</th>
                        ${hk2Columns.map(c => `<th>${c.name}</th>`).join('')}
                        <th>TB</th>
                    </tr>
                </thead>
                <tbody>
                    ${processedStudentsYear.map((s, idx) => {
                        const r1 = getRecord(s.id, 'HK1');
                        const r2 = getRecord(s.id, 'HK2');
                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td class="text-left" style="padding-left: 5px;">${s.saintName} ${s.fullName}</td>
                                ${hk1Columns.map(c => `<td>${r1.scores?.[c.id] ?? ''}</td>`).join('')}
                                <td><b>${s.avg1 || '-'}</b></td>
                                ${hk2Columns.map(c => `<td>${r2.scores?.[c.id] ?? ''}</td>`).join('')}
                                <td><b>${s.avg2 || '-'}</b></td>
                                <td><b>${s.avgYear ? s.avgYear.toFixed(1) : '-'}</b></td>
                                <td>${s.rank?.label || '-'}</td>
                                <td>${s.ranking || '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="signature">
                <div class="signature-block">
                    <p><b>Cha Tuyên Úy</b></p>
                </div>
                <div class="signature-block">
                    <p><i>Ngày ..... tháng ..... năm .......</i></p>
                    <p><b>Giáo Lý Viên Phụ Trách</b></p>
                </div>
            </div>
          `;
      } else if (type === 'STUDENT' && studentId) {
          const s = processedStudentsYear.find(stu => stu.id === studentId);
          if (s) {
            const r1 = getRecord(s.id, 'HK1');
            const r2 = getRecord(s.id, 'HK2');
            content = `
                <div class="header">
                    <h3>PHIẾU BÁO ĐIỂM CÁ NHÂN</h3>
                    <p>Năm học: ${currentYearName}</p>
                </div>
                <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px;">
                    <p><span class="label">Họ tên:</span> ${s.saintName} ${s.fullName}</p>
                    <p><span class="label">Lớp:</span> ${currentClass?.name}</p>
                    <p><span class="label">Ngày sinh:</span> ${new Date(s.dob).toLocaleDateString('vi-VN')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th colspan="${hk1Columns.length + 2}">HỌC KỲ 1</th>
                            <th colspan="${hk2Columns.length + 2}">HỌC KỲ 2</th>
                        </tr>
                        <tr>
                            ${hk1Columns.map(c => `<th>${c.name}</th>`).join('')}
                            <th>Vắng</th>
                            <th>TB HK1</th>
                            ${hk2Columns.map(c => `<th>${c.name}</th>`).join('')}
                            <th>Vắng</th>
                            <th>TB HK2</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            ${hk1Columns.map(c => `<td>${r1.scores?.[c.id] ?? '-'}</td>`).join('')}
                            <td>${(s.absentP1 || 0) + (s.absentK1 || 0)}</td>
                            <td><b>${s.avg1 || '-'}</b></td>
                            ${hk2Columns.map(c => `<td>${r2.scores?.[c.id] ?? '-'}</td>`).join('')}
                            <td>${(s.absentP2 || 0) + (s.absentK2 || 0)}</td>
                            <td><b>${s.avg2 || '-'}</b></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top: 20px; font-size: 14px;">
                    <p><b>ĐIỂM TRUNG BÌNH CẢ NĂM: ${s.avgYear ? s.avgYear.toFixed(1) : '-'}</b></p>
                    <p><b>XẾP LOẠI: ${s.rank?.label || '-'}</b></p>
                    <p><b>XẾP HẠNG: ${s.ranking || '-'}</b></p>
                </div>
                <div class="signature">
                    <div class="signature-block">
                        <p><b>Phụ Huynh</b></p>
                    </div>
                    <div class="signature-block">
                        <p><i>Ngày ..... tháng ..... năm .......</i></p>
                        <p><b>Giáo Lý Viên</b></p>
                    </div>
                </div>
            `;
          }
      }

      printWindow.document.write(`<html><head><title>In Bảng Điểm</title>${styles}</head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 500);
  };

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-50 text-slate-900">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">{toast}</span>
           </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sổ Điểm & Tổng Kết</h2>
        <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300 w-full md:w-auto">
           <button onClick={() => setViewMode('entry')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'entry' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><Table size={16}/> <span className="md:inline hidden">Sổ Điểm</span><span className="md:hidden inline">Nhập Điểm</span></button>
           <button onClick={() => setViewMode('summary')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'summary' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><ListChecks size={16}/> <span className="md:inline hidden">Thống Kê</span><span className="md:hidden inline">Tổng Kết</span></button>
           <button onClick={() => setViewMode('review')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'review' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><UserCog size={16}/> <span className="md:inline hidden">Xét Duyệt</span><span className="md:hidden inline">Xét Duyệt</span></button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-5 flex justify-between items-center flex-wrap gap-3">
        {isAdmin ? (
            // ADMIN FILTERS
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full md:w-auto">
                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 outline-none" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{years.map(y => <option key={y.id} value={y.id}>{y.name.replace('Năm học ', '')}</option>)}</select>
                <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 outline-none" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}><option value="all">Tất cả Khối</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name.replace('Khối ', '')}</option>)}</select>
                    <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 text-blue-800 outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}{availableClasses.length === 0 && <option value="">Không có lớp</option>}</select>
                </div>
            </div>
        ) : (
            // GLV FILTERS (SIMPLIFIED)
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400"/>
                    <span className="text-sm font-bold text-slate-700">{currentYearName}</span>
                </div>
                {/* Check if teacher has multiple classes, show tabs if so */}
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

        <div className="flex items-center gap-2 w-full md:w-auto">
             <button onClick={() => handlePrint('CLASS')} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs hover:bg-slate-50 font-bold uppercase shadow-sm transition-all whitespace-nowrap"><Printer size={16}/> In Bảng Điểm Lớp</button>
             <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-green-600 text-white border border-green-700 rounded-lg text-xs hover:bg-green-700 font-bold uppercase shadow-sm transition-all whitespace-nowrap"><Download size={16}/> Xuất Excel</button>
        </div>
      </div>

      {/* Note Section */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 flex items-center gap-3 rounded-r-lg shadow-sm">
          <Info size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-800 uppercase tracking-tight">Lưu ý: Các ô để trống tương đương với 0 điểm.</p>
      </div>

      {/* Main Content Area */}
      <div className="bg-white md:rounded-xl md:shadow-md md:border md:border-slate-300 flex-1 overflow-hidden flex flex-col bg-transparent">
        {viewMode === 'entry' ? (
        <>
            {/* MOBILE: CARD VIEW FOR GRADE ENTRY */}
            <div className="md:hidden overflow-y-auto h-full space-y-3 pb-24">
                {processedStudentsYear.length > 0 ? (
                    processedStudentsYear.map(s => {
                        const r1 = getRecord(s.id, 'HK1');
                        const r2 = getRecord(s.id, 'HK2');
                        const isOpen = openStudentId === s.id;
                        
                        return (
                            <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                                    onClick={() => setOpenStudentId(isOpen ? null : s.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${isOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{s.ranking || '-'}</div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{s.saintName} {s.fullName}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                 <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${s.rank ? s.rank.color : ''}`}>{s.rank ? s.rank.label : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Trung Bình</div>
                                            <div className="text-lg font-black text-blue-700">{s.avgYear && s.avgYear > 0 ? s.avgYear.toFixed(1) : '--'}</div>
                                        </div>
                                        {isOpen ? <ChevronDown size={20} className="text-slate-400"/> : <ChevronRight size={20} className="text-slate-400"/>}
                                    </div>
                                </div>
                                
                                {isOpen && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-4 animate-fade-in">
                                        <button onClick={(e) => { e.stopPropagation(); handlePrint('STUDENT', s.id); }} className="w-full py-2 bg-white border border-slate-300 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm"><Printer size={14}/> In Phiếu Điểm Cá Nhân</button>
                                        {/* HK1 SECTION */}
                                        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                                            <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex justify-between items-center">
                                                <span className="text-xs font-black text-blue-700 uppercase">Học Kỳ 1</span>
                                                <span className="text-xs font-bold text-blue-600">TB: {s.avg1 || '-'}</span>
                                            </div>
                                            <div className="p-3 grid grid-cols-3 gap-3">
                                                {hk1Columns.map(col => (
                                                    <div key={`m-hk1-${col.id}`}>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{col.name}</label>
                                                        <input 
                                                            type="number" 
                                                            className="no-spinner w-full p-2 text-center font-bold text-slate-800 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50 focus:bg-white"
                                                            value={r1.scores ? (r1.scores[col.id] ?? '') : ''} 
                                                            onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                            placeholder="-"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* HK2 SECTION */}
                                        <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100 flex justify-between items-center">
                                                <span className="text-xs font-black text-purple-700 uppercase">Học Kỳ 2</span>
                                                <span className="text-xs font-bold text-purple-600">TB: {s.avg2 || '-'}</span>
                                            </div>
                                            <div className="p-3 grid grid-cols-3 gap-3">
                                                {hk2Columns.map(col => (
                                                    <div key={`m-hk2-${col.id}`}>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{col.name}</label>
                                                        <input 
                                                            type="number" 
                                                            className="no-spinner w-full p-2 text-center font-bold text-slate-800 border rounded focus:ring-2 focus:ring-purple-400 outline-none bg-slate-50 focus:bg-white"
                                                            value={r2.scores ? (r2.scores[col.id] ?? '') : ''} 
                                                            onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                            placeholder="-"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="p-10 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 mx-4">
                        Vui lòng chọn lớp để nhập điểm.
                    </div>
                )}
            </div>

            {/* DESKTOP: TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1 relative">
                <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '100%' }}>
                    <thead>
                        {/* Header Row 1 */}
                        <tr className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-50 uppercase tracking-tighter text-xs">
                            <th style={{ width: COL_WIDTHS.index }} className="px-2 py-3 text-center sticky left-0 bg-slate-100 z-[51] border-b border-r border-slate-300">#</th>
                            <th style={{ width: COL_WIDTHS.studentInfo }} className="px-4 py-3 sticky left-[40px] bg-slate-100 z-[51] border-b border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">Họ và Tên Học Viên</th>
                            
                            <th colSpan={hk1Columns.length + 3} className="p-2 text-center bg-blue-100/60 border-b border-r border-blue-300 text-blue-800 border-t border-t-blue-400">HỌC KỲ 1</th>
                            <th colSpan={hk2Columns.length + 3} className="p-2 text-center bg-purple-100/60 border-b border-r border-purple-300 text-purple-800 border-t border-t-purple-400">HỌC KỲ 2</th>
                            
                            <th style={{ width: COL_WIDTHS.final }} className="px-2 py-3 text-center border-b border-r border-slate-300 bg-slate-200">Cả Năm</th>
                            <th style={{ width: COL_WIDTHS.rank }} className="px-2 py-3 text-center border-b border-r border-slate-300 bg-slate-200">Xếp Loại</th>
                            <th style={{ width: COL_WIDTHS.ranking }} className="px-2 py-3 text-center border-b border-slate-300 bg-yellow-50 text-yellow-800">Hạng</th>
                        </tr>
                        {/* Header Row 2 */}
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-[41px] z-[49] text-[11px]">
                             <th className="sticky left-0 bg-slate-50 z-[50] border-b border-r border-slate-300"></th>
                             <th className="sticky left-[40px] bg-slate-50 z-[50] border-b border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)]"></th>

                             {hk1Columns.map(col => (
                                 <th key={`h-hk1-${col.id}`} style={{ width: COL_WIDTHS.score }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50">
                                     <div className="flex flex-col items-center">
                                         <span>{col.name}</span>
                                     </div>
                                 </th>
                             ))}
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-blue-300 bg-blue-100 text-blue-800 font-black">TB</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50 text-amber-600" title="Vắng Có Phép">P</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-blue-300 bg-blue-50/50 text-red-600" title="Vắng Không Phép">K</th>

                             {hk2Columns.map(col => (
                                 <th key={`h-hk2-${col.id}`} style={{ width: COL_WIDTHS.score }} className="px-1 py-2 text-center border-b border-r border-purple-200 bg-purple-50/50">
                                     <div className="flex flex-col items-center">
                                         <span>{col.name}</span>
                                     </div>
                                 </th>
                             ))}
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-purple-300 bg-purple-100 text-purple-800 font-black">TB</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-purple-200 bg-blue-50/50 text-amber-600" title="Vắng Có Phép">P</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-purple-300 bg-blue-50/50 text-red-600" title="Vắng Không Phép">K</th>

                             <th className="bg-slate-100 border-b border-r border-slate-300"></th>
                             <th className="bg-slate-100 border-b border-r border-slate-300"></th>
                             <th className="bg-yellow-50 border-b border-slate-300"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedStudentsYear.length > 0 ? (
                            processedStudentsYear.map((s, idx) => {
                                const r1 = getRecord(s.id, 'HK1');
                                const r2 = getRecord(s.id, 'HK2');
                                
                                return (
                                <tr key={s.id} className="hover:bg-blue-50/20 group transition-colors border-b border-slate-200 text-sm">
                                    <td className="px-2 py-2 text-center text-slate-500 font-bold sticky left-0 bg-white group-hover:bg-slate-50 z-40 border-r border-slate-300">{idx + 1}</td>
                                    <td className="px-4 py-2 sticky left-[40px] bg-white group-hover:bg-slate-50 z-40 border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)] flex justify-between items-center">
                                        <div className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{s.saintName} {s.fullName}</div>
                                        <button onClick={() => handlePrint('STUDENT', s.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-opacity" title="In phiếu điểm"><Printer size={14}/></button>
                                    </td>

                                    {/* HK1 INPUTS */}
                                    {hk1Columns.map(col => (
                                        <td key={`c-hk1-${col.id}`} className="px-1 py-1 border-r border-slate-200 text-center">
                                            <input 
                                                type="number" 
                                                className="no-spinner w-full h-8 text-center bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded outline-none font-medium text-slate-700 transition-all"
                                                value={r1.scores ? (r1.scores[col.id] ?? '') : ''} 
                                                onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                tabIndex={1}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-1 py-1 border-r border-blue-200 bg-blue-50/30 text-center font-black text-blue-700">
                                        {s.avg1 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-[10px] font-bold text-amber-600">{s.absentP1 || '-'}</td>
                                    <td className="px-1 py-1 border-r border-blue-200 text-center text-[10px] font-bold text-red-600">{s.absentK1 || '-'}</td>

                                    {/* HK2 INPUTS */}
                                    {hk2Columns.map(col => (
                                        <td key={`c-hk2-${col.id}`} className="px-1 py-1 border-r border-slate-200 text-center">
                                            <input 
                                                type="number" 
                                                className="no-spinner w-full h-8 text-center bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-purple-400 rounded outline-none font-medium text-slate-700 transition-all"
                                                value={r2.scores ? (r2.scores[col.id] ?? '') : ''} 
                                                onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                tabIndex={2}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-1 py-1 border-r border-purple-200 bg-purple-50/30 text-center font-black text-purple-700">
                                        {s.avg2 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-[10px] font-bold text-amber-600">{s.absentP2 || '-'}</td>
                                    <td className="px-1 py-1 border-r border-purple-200 text-center text-[10px] font-bold text-red-600">{s.absentK2 || '-'}</td>

                                    <td className="px-2 py-2 border-r border-slate-300 text-center font-black text-slate-800 bg-slate-50 group-hover:bg-slate-100">{s.avgYear && s.avgYear > 0 ? s.avgYear.toFixed(1) : '-'}</td>
                                    <td className="px-2 py-2 border-r border-slate-300 text-center bg-slate-50 group-hover:bg-slate-100">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.rank ? s.rank.color : ''}`}>{s.rank ? s.rank.label : '-'}</span>
                                    </td>
                                    <td className="px-2 py-2 text-center font-black text-slate-400 bg-yellow-50/50 group-hover:bg-yellow-100/50">{s.ranking}</td>
                                </tr>
                            )})
                        ) : (
                            <tr><td colSpan={20} className="p-20 text-center text-slate-400 italic text-lg">Vui lòng chọn lớp để xem bảng điểm</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {processedStudentsYear.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-300 flex justify-end sticky bottom-0 z-50">
                    <button onClick={handleSaveGrades} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 transform active:scale-95 transition-all">
                        <Save size={20}/> Lưu Bảng Điểm
                    </button>
                </div>
            )}
        </>
        ) : viewMode === 'review' ? (
            // REVIEW (MANUAL PROMOTION) VIEW
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-blue-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Xét Duyệt Lên Lớp</h3>
                                <p className="text-xs text-slate-500">Điều chỉnh kết quả lên lớp/ở lại lớp thủ công cho từng học viên.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span> Đạt
                                <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span> Rớt
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">STT</th>
                                    <th className="px-6 py-4">Học Viên</th>
                                    <th className="px-6 py-4 text-center">ĐTB Năm</th>
                                    <th className="px-6 py-4 text-center">Tự Động</th>
                                    <th className="px-6 py-4 text-center">Xét Duyệt</th>
                                    <th className="px-6 py-4 text-center w-32">Kết Quả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {processedStudentsYear.map((s, idx) => {
                                    const avg = s.avgYear || 0;
                                    const autoPass = avg >= 5.0;
                                    const manualPass = s.promotionResult ? s.promotionResult === 'PASS' : autoPass;
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.saintName} {s.fullName}</td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">{avg.toFixed(1)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {autoPass ? <span className="text-green-600 font-bold text-xs">Đủ điều kiện</span> : <span className="text-red-500 font-bold text-xs">Chưa đạt</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleTogglePromotion(s.id, s.promotionResult, avg)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${manualPass ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                                >
                                                    {manualPass ? 'Cho Lên Lớp' : 'Ở lại'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {manualPass ? (
                                                    <div className="flex items-center justify-center gap-1 text-green-600 font-black uppercase text-xs"><CheckCircle2 size={16}/> Đạt</div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 text-red-600 font-black uppercase text-xs"><XCircle size={16}/> Rớt</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                    <button onClick={handleSaveReview} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 transform active:scale-95 transition-all">
                        <Save size={18}/> Lưu Kết Quả Xét Duyệt
                    </button>
                </div>
            </div>
        ) : (
            // SUMMARY VIEW
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                       <div className="text-4xl font-black text-blue-600 mb-2">{filteredStudents.length}</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng Học Viên</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                       <div className="text-4xl font-black text-green-600 mb-2">{passedStudents.length}</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Được Lên Lớp</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                       <div className="text-4xl font-black text-red-600 mb-2">{failedStudents.length}</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ở Lại Lớp</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                       <div className="text-4xl font-black text-slate-700 mb-2">{filteredStudents.length > 0 ? (processedStudentsYear.reduce((acc, s) => acc + (s.avgYear || 0), 0) / filteredStudents.length).toFixed(1) : '0.0'}</div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">ĐTB Cả Lớp</div>
                   </div>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                       <h3 className="font-bold text-lg text-slate-800">Danh Sách Khen Thưởng (Giỏi)</h3>
                       <button className="text-blue-600 text-sm font-bold flex items-center gap-1"><Download size={16}/> Xuất DS</button>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-left">
                           <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                               <tr>
                                   <th className="px-6 py-4">Hạng</th>
                                   <th className="px-6 py-4">Học Viên</th>
                                   <th className="px-6 py-4 text-center">ĐTB</th>
                                   <th className="px-6 py-4 text-center">Danh Hiệu</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {processedStudentsYear.filter(s => s.rank && s.rank.label === 'Giỏi').map(s => (
                                   <tr key={s.id} className="hover:bg-slate-50">
                                       <td className="px-6 py-4">
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${s.ranking === 1 ? 'bg-yellow-100 text-yellow-700' : s.ranking === 2 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                                               {s.ranking}
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 font-bold text-slate-800">{s.saintName} {s.fullName}</td>
                                       <td className="px-6 py-4 text-center font-black text-blue-600">{s.avgYear ? s.avgYear.toFixed(1) : '0.0'}</td>
                                       <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Học Sinh Giỏi</span></td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
            </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        
        /* Hide number input spinners */
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};
