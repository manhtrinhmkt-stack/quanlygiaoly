
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Table, UserCheck, XCircle, CheckCircle2, ListChecks, Download, Settings2, Trash2, X, AlertCircle, ChevronDown, ChevronRight, GripVertical, Calendar, School, Info, Printer, UserCog, Check, Users, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AcademicRecord, Student, ClassRoom, SchoolYear, Grade, ScoreColumn, Teacher, TermConfig, AttendanceConfig, AcademicConfig, hasPermission } from '../types';

interface GradesProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    classes: ClassRoom[];
    years: SchoolYear[];
    records: AcademicRecord[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    grades: Grade[];
    scoreColumns: ScoreColumn[];
    termConfigs: TermConfig[];
    currentUser: Teacher | null;
    attendanceConfig: AttendanceConfig;
    attendanceData: Record<string, string>;
    academicConfig: AcademicConfig;
}

const COL_WIDTHS = {
    index: 30,
    studentInfo: 220, 
    score: 50,
    absent: 30,
    avg: 45,
    final: 50,
    rank: 75,
    ranking: 40
};

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

export const Grades: React.FC<GradesProps> = ({ students, setStudents, classes, years, records, setRecords, grades, scoreColumns, termConfigs, currentUser, attendanceConfig, attendanceData, academicConfig }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState<'entry' | 'summary' | 'review'>('entry');
  const [draftScores, setDraftScores] = useState<Record<string, Record<string, number>>>({});

  // Sort states
  const [sortBy, setSortBy] = useState<'name' | 'avgYear' | 'ranking' | 'avg1' | 'avg2'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const initialDraft: Record<string, Record<string, number>> = {};
    records.forEach(r => {
      initialDraft[`${r.studentId}-${r.term}`] = { ...r.scores };
    });
    setDraftScores(initialDraft);
  }, [records]);

  const handleScoreChange = (studentId: string, term: string, columnId: string, value: string) => {
    const score = value === '' ? 0 : parseFloat(value);
    const key = `${studentId}-${term}`;
    setDraftScores(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [columnId]: isNaN(score) ? 0 : Math.min(10, Math.max(0, score))
      }
    }));
  };
  
  // Mobile accordion states
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isYearLocked = years.find(y => y.id === selectedYear)?.isLocked && !isAdmin;
  const canEditGrades = hasPermission(currentUser, 'grades', 'edit');
  
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

  const filteredStudents = students
    .filter(s => s.classId === selectedClass && s.status === 'ACTIVE')
    .sort((a, b) => {
        const nameA = a.fullName.split(' ').pop() || '';
        const nameB = b.fullName.split(' ').pop() || '';
        return nameA.localeCompare(nameB, 'vi');
    });
  const currentClass = classes.find(c => c.id === selectedClass);

  const currentHK1Columns = useMemo(() => {
    if (!selectedClass) return [];
    
    const currentGradeId = classes.find(c => c.id === selectedClass)?.gradeId;
    const gradeCols = scoreColumns.filter(c => c.term === 'HK1' && c.gradeId === currentGradeId);
    if (gradeCols.length > 0) return gradeCols;
    
    return scoreColumns.filter(c => c.term === 'HK1' && !c.gradeId);
  }, [scoreColumns, selectedClass, classes]);

  const currentHK2Columns = useMemo(() => {
    if (!selectedClass) return [];
    
    const currentGradeId = classes.find(c => c.id === selectedClass)?.gradeId;
    const gradeCols = scoreColumns.filter(c => c.term === 'HK2' && c.gradeId === currentGradeId);
    if (gradeCols.length > 0) return gradeCols;
    
    return scoreColumns.filter(c => c.term === 'HK2' && !c.gradeId);
  }, [scoreColumns, selectedClass, classes]);

  // Backward compatibility aliases
  const hk1Columns = currentHK1Columns;
  const hk2Columns = currentHK2Columns;

  const hk1Config = useMemo(() => termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK1'), [termConfigs, selectedYear]);
  const hk2Config = useMemo(() => termConfigs.find(c => c.yearId === selectedYear && c.term === 'HK2'), [termConfigs, selectedYear]);

  const getRecord = (studentId: string, specificTerm: 'HK1' | 'HK2') => {
    return records.find(r => r.studentId === studentId && r.term === specificTerm) || {
      studentId, term: specificTerm, scores: {}, scorePray: 0, scoreExam: 0, average: 0, absentP: 0, absentK: 0,
      tbht: 0, tbcc: 0
    };
  };

  const getAttendanceStats = (studentId: string, term: 'HK1' | 'HK2') => {
      const config = term === 'HK1' ? hk1Config : hk2Config;
      if (!config) return { classPresent: 0, massPresent: 0, p: 0, k: 0 };

      const start = new Date(config.startDate);
      const end = new Date(config.endDate);
      
      let classPresent = 0;
      let massPresent = 0;
      let p = 0;
      let k = 0;

      // Iterate through all days in range to count attendance
      // Note: This is an expensive operation if done in every render cycle for every row.
      // In a real app, attendance summary would be pre-calculated or memoized.
      const curr = new Date(start);
      while (curr <= end) {
          if (attendanceConfig.allowedDays.includes(curr.getDay())) {
              const dateStr = curr.toISOString().split('T')[0];
              
              const classKey = `${studentId}-${dateStr}-class`;
              const massKey = `${studentId}-${dateStr}-mass`;

              const classStatus = attendanceData[classKey];
              const massStatus = attendanceData[massKey];

              if (classStatus === 'C') classPresent++;
              if (massStatus === 'C') massPresent++;
              
              if (classStatus === 'P' || massStatus === 'P') p++;
              if (classStatus === 'K' || massStatus === 'K') k++;
          }
          curr.setDate(curr.getDate() + 1);
      }

      return { classPresent, massPresent, p, k };
  };

  const calculateAvg = (record: AcademicRecord, scores?: Record<string, number>) => {
      // 1. Calculate Academic Part (TBHT)
      let totalScore = 0;
      let totalWeight = 0;
      const termColumns = record.term === 'HK1' ? currentHK1Columns : currentHK2Columns;
      termColumns.forEach(col => {
          const score = (scores && scores[col.id] !== undefined) ? scores[col.id] : ((record.scores && record.scores[col.id] !== undefined) ? record.scores[col.id] : 0);
          totalScore += score * col.weight;
          totalWeight += col.weight;
      });
      const tbht = totalWeight > 0 ? (totalScore / totalWeight) : 0;

      // 2. Calculate Attendance Part (TBCC)
      const stats = getAttendanceStats(record.studentId, record.term as any);
      
      const totalMassRequired = record.term === 'HK1' ? attendanceConfig.totalMassRequiredHK1 : attendanceConfig.totalMassRequiredHK2;
      const totalClassRequired = record.term === 'HK1' ? attendanceConfig.totalClassRequiredHK1 : attendanceConfig.totalClassRequiredHK2;

      const massScore = totalMassRequired > 0 
          ? (stats.massPresent / totalMassRequired) * 10 
          : 10;
      
      const classScore = totalClassRequired > 0 
          ? (stats.classPresent / totalClassRequired) * 10 
          : 10;

      // TBCC is average of Mass and Class scores
      const tbcc = (massScore + classScore) / 2;
      
      // Check for attendance threshold (Điểm khống chế)
      let finalTbcc = tbcc;
      // If attendance threshold is set and tbcc is below it, we might flag it, 
      // but here we just calculate the average normally.

      // 3. Final Average (TBHK)
      const finalAvg = (tbht * academicConfig.academicWeight + tbcc * academicConfig.attendanceWeight) / 100;

      return {
          tbht: parseFloat(tbht.toFixed(1)),
          tbcc: parseFloat(tbcc.toFixed(1)),
          average: parseFloat(finalAvg.toFixed(1)),
          p: stats.p,
          k: stats.k
      };
  };

  const handleSaveGrades = () => {
     if (!canEditGrades) {
         toast.error("Bạn không có quyền sửa điểm số!");
         return;
     }
     const updatedRecords = records.map(r => {
         const key = `${r.studentId}-${r.term}`;
         const scores = draftScores[key] || r.scores;
         const results = calculateAvg(r, scores);
         return { 
           ...r, 
           scores: scores, 
           average: results.average,
           tbht: results.tbht,
           tbcc: results.tbcc,
           absentP: results.p,
           absentK: results.k,
           needsAttention: results.tbcc < academicConfig.attendanceLimit
         };
     });
     setRecords(updatedRecords);
     toast.success(`Đã lưu bảng điểm lớp ${currentClass?.name}!`);
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
      const results1 = calculateAvg(r1);
      const results2 = calculateAvg(r2);
      
      const avg1 = results1.average;
      const avg2 = results2.average;
      
      const w1 = hk1Config?.weight || 1;
      const w2 = hk2Config?.weight || 1;
      // Formula: TB Cả Năm = [(TBHK1 x Hệ số HK1) + (TBHK2 x Hệ số HK2)] / (Hệ số HK1 + Hệ số HK2)
      const finalAvg = (avg1 * w1 + avg2 * w2) / (w1 + w2);
      
      return { 
        ...s, 
        avg1, avg2, 
        tbht1: results1.tbht, tbcc1: results1.tbcc,
        tbht2: results2.tbht, tbcc2: results2.tbcc,
        avgYear: parseFloat(finalAvg.toFixed(1)), 
        rank: getRank(finalAvg), 
        isPassed: finalAvg >= 5.0,
        absentP1: results1.p,
        absentK1: results1.k,
        absentP2: results2.p,
        absentK2: results2.k,
        nameForSort: s.fullName.split(' ').pop() || ''
      };
    });
    const sortedByScore = [...list].sort((a, b) => b.avgYear - a.avgYear);
    const rankedMap = new Map();
    sortedByScore.forEach((s, index) => { rankedMap.set(s.id, index + 1); });
    return list.map(s => ({ ...s, ranking: rankedMap.get(s.id) })).sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
            comparison = a.nameForSort.localeCompare(b.nameForSort, 'vi');
            if (comparison === 0) {
                comparison = a.fullName.localeCompare(b.fullName, 'vi');
            }
        } else if (sortBy === 'avgYear') {
            comparison = a.avgYear - b.avgYear;
        } else if (sortBy === 'ranking') {
            comparison = a.ranking - b.ranking;
        } else if (sortBy === 'avg1') {
            comparison = (a.avg1 || 0) - (b.avg1 || 0);
        } else if (sortBy === 'avg2') {
            comparison = (a.avg2 || 0) - (b.avg2 || 0);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, records, scoreColumns, attendanceData, sortBy, sortOrder]);

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
      if (!canEditGrades) {
          toast.error("Bạn không có quyền điều chỉnh kết quả lên lớp!");
          return;
      }
      const autoResult = avg >= 5.0 ? 'PASS' : 'RETAIN';
      const effectiveResult = currentResult || autoResult;
      const newResult = effectiveResult === 'PASS' ? 'RETAIN' : 'PASS';
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, promotionResult: newResult } : s));
  };

  const handleSaveReview = () => {
      if (!canEditGrades) {
          toast.error("Bạn không có quyền lưu kết quả xét duyệt!");
          return;
      }
      toast.success("Đã lưu kết quả xét duyệt!");
  };

  // --- EXPORT LOGIC ---
  const handleExportExcel = () => {
    if (!currentClass) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `BẢNG ĐIỂM TỔNG HỢP: ${currentClass.name.toUpperCase()}\n`;
    csvContent += `Năm học: ${currentYearName}\n`;
    csvContent += `GLV Phụ trách: ${currentClass.mainTeacher || ''}\n\n`;
    
    // Headers
    const headers = ["STT", "Mã SV", "Tên Thánh", "Họ và Tên"];
    hk1Columns.forEach(c => headers.push(`HK1_${c.name}`));
    headers.push("TB_HK1");
    hk2Columns.forEach(c => headers.push(`HK2_${c.name}`));
    headers.push("TB_HK2");
    headers.push("TB_NAM", "XEP_LOAI", "HANG");
    
    csvContent += headers.join(",") + "\n";

    processedStudentsYear.forEach((s, idx) => {
      const r1 = getRecord(s.id, 'HK1');
      const r2 = getRecord(s.id, 'HK2');
      
      const row = [
        idx + 1,
        s.id,
        s.saintName,
        s.fullName,
        ...hk1Columns.map(c => r1.scores?.[c.id] ?? ''),
        s.avg1 || '',
        ...hk2Columns.map(c => r2.scores?.[c.id] ?? ''),
        s.avg2 || '',
        s.avgYear ? s.avgYear.toFixed(1) : '',
        s.rank?.label || '',
        s.ranking || ''
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_diem_${currentClass.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file Excel!");
  };

  const handleExportWord = (type: 'INDIVIDUAL' | 'CLASS', studentId?: string) => {
    let content = '';
    let filename = '';

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export Word</title></head><body>";
    const footer = "</body></html>";

    if (type === 'INDIVIDUAL' && studentId) {
      const s = processedStudentsYear.find(stu => stu.id === studentId);
      if (!s) return;
      filename = `Phieu_diem_${s.fullName.replace(/\s+/g, '_')}.doc`;
      const r1 = getRecord(s.id, 'HK1');
      const r2 = getRecord(s.id, 'HK2');
      
      content = `
        <div style="font-family: 'Times New Roman', serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">PHIẾU BÁO ĐIỂM CÁ NHÂN</h2>
            <p style="margin: 5px 0;">Năm học: ${currentYearName}</p>
          </div>
          <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px;">
            <p><b>Họ tên:</b> ${s.saintName} ${s.fullName}</p>
            <p><b>Lớp:</b> ${currentClass?.name}</p>
            <p><b>Ngày sinh:</b> ${safeFormatDate(s.dob)}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <tr style="background-color: #f0f0f0;">
              <th colspan="${hk1Columns.length + 2}" style="border: 1px solid #000; padding: 5px;">HỌC KỲ 1</th>
              <th colspan="${hk2Columns.length + 2}" style="border: 1px solid #000; padding: 5px;">HỌC KỲ 2</th>
            </tr>
            <tr style="background-color: #f8f8f8;">
              ${hk1Columns.map(c => `<th style="border: 1px solid #000; padding: 5px;">${c.name}</th>`).join('')}
              <th style="border: 1px solid #000; padding: 5px;">Vắng</th>
              <th style="border: 1px solid #000; padding: 5px;">TB HK1</th>
              ${hk2Columns.map(c => `<th style="border: 1px solid #000; padding: 5px;">${c.name}</th>`).join('')}
              <th style="border: 1px solid #000; padding: 5px;">Vắng</th>
              <th style="border: 1px solid #000; padding: 5px;">TB HK2</th>
            </tr>
            <tr>
              ${hk1Columns.map(c => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${r1.scores?.[c.id] ?? '-'}</td>`).join('')}
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${(s.absentP1 || 0) + (s.absentK1 || 0)}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"><b>${s.avg1 || '-'}</b></td>
              ${hk2Columns.map(c => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${r2.scores?.[c.id] ?? '-'}</td>`).join('')}
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${(s.absentP2 || 0) + (s.absentK2 || 0)}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"><b>${s.avg2 || '-'}</b></td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <p><b>ĐIỂM TRUNG BÌNH CẢ NĂM: ${s.avgYear ? s.avgYear.toFixed(1) : '-'}</b></p>
            <p><b>XẾP LOẠI: ${s.rank?.label || '-'}</b></p>
            <p><b>XẾP HẠNG: ${s.ranking || '-'}</b></p>
          </div>
          <table style="width: 100%; border: none; margin-top: 40px;">
            <tr>
              <td style="text-align: center; width: 50%;">
                <p><b>Phụ Huynh</b></p>
                <br/><br/><br/>
              </td>
              <td style="text-align: center; width: 50%;">
                <p><i>Ngày ..... tháng ..... năm .......</i></p>
                <p><b>Giáo Lý Viên</b></p>
                <br/><br/><br/>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    const sourceHTML = header + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file Word!");
  };

  // --- PRINT LOGIC ---
  const handlePrint = (type: 'CLASS' | 'STUDENT' | 'ALL_STUDENTS', studentId?: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return toast.error("Vui lòng cho phép popup để in.");

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
                    <p><span class="label">Ngày sinh:</span> ${safeFormatDate(s.dob)}</p>
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
      } else if (type === 'ALL_STUDENTS' && currentClass) {
          content = processedStudentsYear.map(s => {
            const r1 = getRecord(s.id, 'HK1');
            const r2 = getRecord(s.id, 'HK2');
            return `
                <div style="page-break-after: always;">
                    <div class="header">
                        <h3>PHIẾU BÁO ĐIỂM CÁ NHÂN</h3>
                        <p>Năm học: ${currentYearName}</p>
                    </div>
                    <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px;">
                        <p><span class="label">Họ tên:</span> ${s.saintName} ${s.fullName}</p>
                        <p><span class="label">Lớp:</span> ${currentClass?.name}</p>
                        <p><span class="label">Ngày sinh:</span> ${safeFormatDate(s.dob)}</p>
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
                </div>
            `;
          }).join('');
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
      {isYearLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <span>Dữ liệu điểm số và xếp loại của niên khóa này đã được khóa lại. Toàn bộ thông tin hiển thị ở chế độ Chỉ Đọc. Người dùng có vai trò Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để chỉnh sửa nếu cần.</span>
          </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
                <div className="flex flex-wrap gap-2 items-center">
                    <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white outline-none shadow-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name.replace('Năm học ', 'NH ')}</option>)}
                    </select>
                    <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white outline-none shadow-sm" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                        <option value="all">Tất cả Khối</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name.replace('Khối ', '')}</option>)}
                    </select>
                    <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white text-blue-700 outline-none shadow-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {availableClasses.length === 0 && <option value="">Không có lớp</option>}
                    </select>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
                        <Calendar size={16} className="text-slate-400"/>
                        <span className="text-sm font-bold text-slate-700">{currentYearName}</span>
                    </div>
                    {glvMyClasses.length > 1 ? (
                        <div className="flex gap-1">
                            {glvMyClasses.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClass(c.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm ${selectedClass === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-blue-600 px-3 py-2 rounded-lg border border-blue-500 shadow-sm flex items-center gap-2">
                            <School size={16} className="text-white/80"/>
                            <span className="text-sm font-bold text-white">{getClassName(selectedClass)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300 w-full md:w-auto">
           <button onClick={() => setViewMode('entry')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'entry' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><Table size={16}/> <span className="md:inline hidden">Nhập Điểm</span><span className="md:hidden inline">Nhập Điểm</span></button>
           <button onClick={() => setViewMode('review')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'review' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><UserCog size={16}/> <span className="md:inline hidden">Xét Duyệt</span><span className="md:hidden inline">Xét Duyệt</span></button>
           <button onClick={() => setViewMode('summary')} className={`flex-1 md:flex-none justify-center px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'summary' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}><ListChecks size={16}/> <span className="md:inline hidden">Báo Cáo & Thống Kê</span><span className="md:hidden inline">Báo Cáo</span></button>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
              <Info size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-800 uppercase tracking-tight">Lưu ý: Các ô để trống tương đương với 0 điểm.</p>
          </div>
          <div className="text-xs text-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <span><b className="font-black">TBHT:</b> Trung bình Học tập</span>
            <span><b className="font-black">TBCC:</b> Trung bình Chuyên cần</span>
            <span><b className="font-black">TBHK:</b> Trung bình Học kỳ</span>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white md:rounded-xl md:shadow-md md:border md:border-slate-300 flex-1 overflow-hidden flex flex-col bg-transparent">
        {viewMode === 'entry' ? (
        <>
            {/* Quick Sort Panel */}
            {processedStudentsYear.length > 0 && (
              <div className="bg-slate-100/80 p-3 border-b border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm shrink-0">
                <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider">
                  <ListChecks size={15} className="text-blue-500" /> Sắp xếp danh hiệu & bế mạc:
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto self-end justify-end">
                  <select
                    className="px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-bold text-slate-700 bg-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="name">Họ và Tên</option>
                    <option value="avgYear">Điểm Cả Năm</option>
                    <option value="ranking">Hạng Học Viên</option>
                    <option value="avg1">Điểm TB HK1</option>
                    <option value="avg2">Điểm TB HK2</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-bold text-xs bg-white shadow-sm flex items-center gap-1 min-w-[100px] justify-center"
                  >
                    {sortOrder === 'asc' ? 'Thế tăng ▲' : 'Thế giảm ▼'}
                  </button>
                </div>
              </div>
            )}

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
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-blue-600">TB: {s.avg1 || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 grid grid-cols-3 gap-3">
                                                {hk1Columns.map(col => (
                                                    <div key={`m-hk1-${col.id}`}>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{col.name}</label>
                                                        {col.weight === 0 ? (
                                                            <select
                                                                className={`w-full p-2 text-center font-bold border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50 focus:bg-white text-xs ${
                                                                    (r1.scores ? (r1.scores[col.id] ?? 0) : 0) >= 5 ? 'text-green-600' : 'text-red-500'
                                                                }`}
                                                                value={r1.scores ? (r1.scores[col.id] ?? 0) : 0}
                                                                onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                            >
                                                                <option value={0}>✗</option>
                                                                <option value={10}>✓</option>
                                                            </select>
                                                        ) : (
                                                            <input 
                                                                type="number" 
                                                                className="no-spinner w-full p-2 text-center font-bold text-slate-800 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50 focus:bg-white text-xs"
                                                                value={r1.scores ? (r1.scores[col.id] ?? '') : ''} 
                                                                onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                                placeholder="-"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* HK2 SECTION */}
                                        <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100 flex justify-between items-center">
                                                <span className="text-xs font-black text-purple-700 uppercase">Học Kỳ 2</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-purple-600">TB: {s.avg2 || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 grid grid-cols-3 gap-3">
                                                {hk2Columns.map(col => (
                                                    <div key={`m-hk2-${col.id}`}>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{col.name}</label>
                                                        {col.weight === 0 ? (
                                                            <select
                                                                className={`w-full p-2 text-center font-bold border rounded focus:ring-2 focus:ring-purple-400 outline-none bg-slate-50 focus:bg-white text-xs ${
                                                                    (r2.scores ? (r2.scores[col.id] ?? 0) : 0) >= 5 ? 'text-green-600' : 'text-red-500'
                                                                }`}
                                                                value={r2.scores ? (r2.scores[col.id] ?? 0) : 0}
                                                                onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                            >
                                                                <option value={0}>✗</option>
                                                                <option value={10}>✓</option>
                                                            </select>
                                                        ) : (
                                                            <input 
                                                                type="number" 
                                                                className="no-spinner w-full p-2 text-center font-bold text-slate-800 border rounded focus:ring-2 focus:ring-purple-400 outline-none bg-slate-50 focus:bg-white text-xs"
                                                                value={r2.scores ? (r2.scores[col.id] ?? '') : ''} 
                                                                onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                                placeholder="-"
                                                            />
                                                        )}
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
                        <tr className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-50 uppercase tracking-tighter text-[10px]">
                            <th style={{ width: COL_WIDTHS.index }} className="px-1 py-2 text-center sticky left-0 bg-slate-100 z-[51] border-b border-r border-slate-300">#</th>
                            <th style={{ width: COL_WIDTHS.studentInfo }} className="px-2 py-2 sticky left-[30px] bg-slate-100 z-[51] border-b border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">Học viên</th>
                            
                            <th colSpan={hk1Columns.length + 5} className="p-1 text-center bg-blue-100/60 border-b border-r border-blue-300 text-blue-800 border-t border-t-blue-400">
                                <div className="flex items-center justify-center gap-2">
                                    <span>HỌC KỲ 1</span>
                                </div>
                            </th>
                            <th colSpan={hk2Columns.length + 5} className="p-1 text-center bg-purple-100/60 border-b border-r border-purple-300 text-purple-800 border-t border-t-purple-400">
                                <div className="flex items-center justify-center gap-2">
                                    <span>HỌC KỲ 2</span>
                                </div>
                            </th>
                            
                            <th style={{ width: COL_WIDTHS.final }} className="px-1 py-2 text-center border-b border-r border-slate-300 bg-slate-200">Cả Năm</th>
                            <th style={{ width: COL_WIDTHS.rank }} className="px-1 py-2 text-center border-b border-r border-slate-300 bg-slate-200">Xếp Loại</th>
                            <th style={{ width: COL_WIDTHS.ranking }} className="px-1 py-2 text-center border-b border-slate-300 bg-yellow-50 text-yellow-800">Hạng</th>
                        </tr>
                        {/* Header Row 2 */}
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-[33px] z-[49] text-[9px]">
                             <th className="sticky left-0 bg-slate-50 z-[50] border-b border-r border-slate-300"></th>
                             <th className="sticky left-[30px] bg-slate-50 z-[50] border-b border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)]"></th>

                             {hk1Columns.map(col => (
                                 <th key={`h-hk1-${col.id}`} style={{ width: COL_WIDTHS.score }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50">
                                     <div className="flex flex-col items-center">
                                         <span>{col.name}</span>
                                     </div>
                                 </th>
                             ))}
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50 text-xs" title="Trung bình Học tập">TBHT</th>
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50 text-xs" title="Trung bình Chuyên cần">TBCC</th>
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-blue-300 bg-blue-100 text-blue-800 font-black">TBHK</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-blue-200 bg-blue-50/50 text-amber-600" title="Vắng Có Phép">P</th>
                             <th style={{ width: COL_WIDTHS.absent }} className="px-1 py-2 text-center border-b border-r border-blue-300 bg-blue-50/50 text-red-600" title="Vắng Không Phép">K</th>

                             {hk2Columns.map(col => (
                                 <th key={`h-hk2-${col.id}`} style={{ width: COL_WIDTHS.score }} className="px-1 py-2 text-center border-b border-r border-purple-200 bg-purple-50/50">
                                     <div className="flex flex-col items-center">
                                         <span>{col.name}</span>
                                     </div>
                                 </th>
                             ))}
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-purple-200 bg-purple-50/50 text-xs" title="Trung bình Học tập">TBHT</th>
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-purple-200 bg-purple-50/50 text-xs" title="Trung bình Chuyên cần">TBCC</th>
                             <th style={{ width: COL_WIDTHS.avg }} className="px-1 py-2 text-center border-b border-r border-purple-300 bg-purple-100 text-purple-800 font-black">TBHK</th>
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
                                <tr key={s.id} className="hover:bg-blue-50/20 group transition-colors border-b border-slate-200 text-xs">
                                    <td className="px-1 py-1.5 text-center text-slate-500 font-bold sticky left-0 bg-white group-hover:bg-slate-50 z-40 border-r border-slate-300 tracking-tighter">{idx + 1}</td>
                                    <td className="px-2 py-1.5 sticky left-[30px] bg-white group-hover:bg-slate-50 z-40 border-r border-slate-400 shadow-[2px_0_4px_rgba(0,0,0,0.1)] flex justify-between items-center overflow-hidden">
                                        <div className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                                            <span className="text-slate-400 font-medium text-[9px] block leading-none mb-0.5">{s.saintName}</span>
                                            {s.fullName}
                                        </div>
                                         <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                                             <button onClick={() => handlePrint('STUDENT', s.id)} className="p-0.5 hover:bg-slate-200 rounded text-slate-500" title="In phiếu điểm"><Printer size={12}/></button>
                                         </div>
                                     </td>

                                     {/* HK1 INPUTS */}
                                    {hk1Columns.map(col => (
                                        <td key={`c-hk1-${col.id}`} className="px-1 py-1 border-r border-slate-200 text-center min-w-[90px]">
                                            {col.weight === 0 ? (
                                                <select
                                                    className={`w-full h-8 text-center bg-transparent border border-transparent rounded font-bold text-xs focus:ring-1 focus:ring-blue-400 outline-none cursor-pointer ${
                                                        (draftScores[`${s.id}-HK1`]?.[col.id] ?? (r1.scores?.[col.id] ?? 0)) >= 5 ? 'text-green-600 bg-green-50/50' : 'text-red-500 bg-red-50/50'
                                                    }`}
                                                    value={draftScores[`${s.id}-HK1`]?.[col.id] ?? (r1.scores?.[col.id] ?? 0)}
                                                    onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                    tabIndex={1}
                                                >
                                                    <option value={0} className="text-red-500 font-bold bg-white">✗</option>
                                                    <option value={10} className="text-green-600 font-bold bg-white">✓</option>
                                                </select>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    className="no-spinner w-full h-8 text-center bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded outline-none font-medium text-slate-700 transition-all"
                                                    value={draftScores[`${s.id}-HK1`]?.[col.id] ?? (r1.scores?.[col.id] ?? '')} 
                                                    onChange={(e) => handleScoreChange(s.id, 'HK1', col.id, e.target.value)}
                                                    tabIndex={1}
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-xs font-bold text-emerald-600">{s.tbht1 || '-'}</td>
                                    <td className={`px-1 py-1 border-r border-slate-200 text-center text-xs font-bold ${s.tbcc1 < academicConfig.attendanceLimit ? 'text-red-600' : 'text-amber-600'}`}>
                                        {s.tbcc1 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-blue-200 bg-blue-50/30 text-center font-black text-blue-700">
                                        {s.avg1 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-xs font-bold text-slate-500">{s.absentP1 || '-'}</td>
                                    <td className="px-1 py-1 border-r border-blue-200 text-center text-xs font-bold text-red-500">{s.absentK1 || '-'}</td>
 
                                     {/* HK2 INPUTS */}
                                    {hk2Columns.map(col => (
                                        <td key={`c-hk2-${col.id}`} className="px-1 py-1 border-r border-slate-200 text-center min-w-[90px]">
                                            {col.weight === 0 ? (
                                                <select
                                                    className={`w-full h-8 text-center bg-transparent border border-transparent rounded font-bold text-xs focus:ring-1 focus:ring-purple-400 outline-none cursor-pointer ${
                                                        (draftScores[`${s.id}-HK2`]?.[col.id] ?? (r2.scores?.[col.id] ?? 0)) >= 5 ? 'text-green-600 bg-green-50/50' : 'text-red-500 bg-red-50/50'
                                                    }`}
                                                    value={draftScores[`${s.id}-HK2`]?.[col.id] ?? (r2.scores?.[col.id] ?? 0)}
                                                    onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                    tabIndex={2}
                                                >
                                                    <option value={0} className="text-red-500 font-bold bg-white">✗</option>
                                                    <option value={10} className="text-green-600 font-bold bg-white">✓</option>
                                                </select>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    className="no-spinner w-full h-8 text-center bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-purple-400 rounded outline-none font-medium text-slate-700 transition-all"
                                                    value={draftScores[`${s.id}-HK2`]?.[col.id] ?? (r2.scores?.[col.id] ?? '')} 
                                                    onChange={(e) => handleScoreChange(s.id, 'HK2', col.id, e.target.value)}
                                                    tabIndex={2}
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-xs font-bold text-emerald-600">{s.tbht2 || '-'}</td>
                                    <td className={`px-1 py-1 border-r border-slate-200 text-center text-xs font-bold ${s.tbcc2 < academicConfig.attendanceLimit ? 'text-red-600' : 'text-amber-600'}`}>
                                        {s.tbcc2 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-purple-200 bg-purple-50/30 text-center font-black text-purple-700">
                                        {s.avg2 || '-'}
                                    </td>
                                    <td className="px-1 py-1 border-r border-slate-200 text-center text-xs font-bold text-slate-500">{s.absentP2 || '-'}</td>
                                    <td className="px-1 py-1 border-r border-purple-200 text-center text-xs font-bold text-red-600">{s.absentK2 || '-'}</td>

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
                    <button 
                        onClick={() => {
                            if (isYearLocked) {
                                toast.error("Niên khóa này đã bị khóa. Không thể lưu bảng điểm!");
                                return;
                            }
                            if (!canEditGrades) {
                                toast.error("Bạn không có quyền lưu bảng điểm!");
                                return;
                            }
                            handleSaveGrades();
                        }} 
                        className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${isYearLocked || !canEditGrades ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 transform'}`}
                        disabled={isYearLocked || !canEditGrades}
                    >
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
                                    const autoPass = avg >= 5.0 && s.tbcc1 >= academicConfig.attendanceLimit && s.tbcc2 >= academicConfig.attendanceLimit;
                                    const attendanceNote = (s.tbcc1 < academicConfig.attendanceLimit || s.tbcc2 < academicConfig.attendanceLimit) ? 'Điểm chuyên cần < mức quy định' : '';
                                    const manualPass = s.promotionResult ? s.promotionResult === 'PASS' : autoPass;
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.saintName} {s.fullName}</td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">{avg.toFixed(1)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {autoPass ? <span className="text-green-600 font-bold text-xs">Đủ điều kiện</span> : 
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-red-500 font-bold text-xs">Chưa đạt</span>
                                                        <span className="text-[10px] text-red-400 italic">({attendanceNote || 'Điểm TB < 5.0'})</span>
                                                    </div>
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        if (isYearLocked) {
                                                            toast.error("Niên khóa này đã bị khóa. Không thể điều chỉnh kết quả!");
                                                            return;
                                                        }
                                                        handleTogglePromotion(s.id, s.promotionResult, avg);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${manualPass ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'} ${isYearLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                    disabled={isYearLocked}
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
                    <button 
                        onClick={() => {
                            if (isYearLocked) {
                                toast.error("Niên khóa này đã bị khóa. Không thể lưu kết quả!");
                                return;
                            }
                            if (!canEditGrades) {
                                toast.error("Bạn không có quyền lưu kết quả!");
                                return;
                            }
                            handleSaveReview();
                        }} 
                        className={`px-6 py-3 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transform transition-all ${isYearLocked || !canEditGrades ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                        disabled={isYearLocked || !canEditGrades}
                    >
                        <Save size={18}/> Lưu Kết Quả Xét Duyệt
                    </button>
                </div>
            </div>
        ) : (
            // SUMMARY & REPORTS VIEW
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
                {/* Report Actions Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-black mb-1">Báo Cáo & Kết Quả Học Tập</h3>
                            <p className="text-blue-100 text-sm">Xuất các báo cáo tổng hợp và phiếu điểm cho lớp {currentClass?.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative group">
                                <button onClick={() => handlePrint('CLASS')} className="px-4 py-2 bg-white text-blue-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-md">
                                    <Printer size={18}/> In Sổ Điểm Lớp
                                </button>
                                <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <FileSpreadsheet size={14} className="text-green-600"/> Xuất Excel Sổ Điểm
                                    </button>
                                </div>
                            </div>
                            <div className="relative group">
                                <button onClick={() => handlePrint('ALL_STUDENTS')} className="px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <Users size={18}/> In Phiếu Điểm Cả Lớp
                                </button>
                                <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button onClick={() => toast.info("Tính năng xuất Word hàng loạt đang được phát triển. Vui lòng in hoặc xuất từng phiếu.")} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <FileText size={14} className="text-blue-600"/> Xuất Word (Từng phiếu)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
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
