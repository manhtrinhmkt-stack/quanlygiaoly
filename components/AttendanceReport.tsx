
import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, TermConfig, Teacher, AttendanceConfig } from '../types';
import { FileDown, Search, Filter, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceReportProps {
    students: Student[];
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    termConfigs: TermConfig[];
    currentUser: Teacher | null;
    attendanceConfig: AttendanceConfig;
    attendanceData: Record<string, 'C' | 'P' | 'K' | ''>;
}

export const AttendanceReport: React.FC<AttendanceReportProps> = ({ 
    students, 
    classes, 
    years, 
    grades, 
    termConfigs, 
    currentUser, 
    attendanceConfig, 
    attendanceData 
}) => {
    const [selectedYear, setSelectedYear] = useState(years.find(y => y.isActive)?.id || '');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [reportType, setReportType] = useState<'MONTH' | 'HK1' | 'HK2'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = currentUser?.role === 'ADMIN';

    const classesInYear = useMemo(() => {
        return classes.filter(c => c.yearId === selectedYear);
    }, [classes, selectedYear]);

    const availableClasses = useMemo(() => {
        let list = classesInYear;
        if (selectedGrade !== 'all') {
            list = list.filter(c => c.gradeId === selectedGrade);
        }
        if (!isAdmin && currentUser) {
            const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
            list = list.filter(c => 
                (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
                (c.assistants && c.assistants.includes(teacherName))
            );
        }
        return list;
    }, [classesInYear, selectedGrade, isAdmin, currentUser]);

    const filteredStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students
            .filter(s => s.classId === selectedClass && s.status === 'ACTIVE')
            .filter(s => 
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.id.includes(searchTerm) ||
                (s.saintName && s.saintName.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => (a.fullName.split(' ').pop() || '').localeCompare(b.fullName.split(' ').pop() || '', 'vi'));
    }, [students, selectedClass, searchTerm]);

    const reportDays = useMemo(() => {
        const days: Date[] = [];
        const allowedDays = attendanceConfig?.allowedDays || [0];
        
        if (reportType === 'MONTH') {
            const [year, month] = selectedMonth.split('-').map(Number);
            const date = new Date(year, month - 1, 1);
            while (date.getMonth() === month - 1) {
                if (allowedDays.includes(date.getDay())) {
                    days.push(new Date(date));
                }
                date.setDate(date.getDate() + 1);
            }
        } else {
            // HK1 or HK2
            const term = reportType;
            const config = termConfigs.find(c => c.yearId === selectedYear && c.term === term);
            if (config && config.startDate && config.endDate) {
                const start = new Date(config.startDate);
                const end = new Date(config.endDate);
                const date = new Date(start);
                while (date <= end) {
                    if (allowedDays.includes(date.getDay())) {
                        days.push(new Date(date));
                    }
                    date.setDate(date.getDate() + 1);
                }
            } else {
                // Fallback estimate if no config
                const startMonth = term === 'HK1' ? 8 : 1; // Sept or Feb
                const endMonth = term === 'HK1' ? 0 : 5; // Jan or June (next year for Jan)
                const activeYear = years.find(y => y.id === selectedYear);
                if (activeYear) {
                    // Try to parse years from name like "2023-2024"
                    const yearsMatch = activeYear.name.match(/\d{4}/g);
                    const startYear = yearsMatch ? parseInt(yearsMatch[0]) : new Date().getFullYear();
                    const endYear = yearsMatch && yearsMatch[1] ? parseInt(yearsMatch[1]) : startYear + 1;
                    
                    const actualStartYear = term === 'HK1' ? startYear : endYear;
                    const actualEndYear = term === 'HK1' ? endYear : endYear;
                    
                    const date = new Date(actualStartYear, startMonth, 1);
                    const endDate = new Date(actualEndYear, endMonth, 31);
                    while (date <= endDate) {
                        if (allowedDays.includes(date.getDay())) {
                            days.push(new Date(date));
                        }
                        date.setDate(date.getDate() + 1);
                    }
                }
            }
        }
        return days;
    }, [reportType, selectedMonth, selectedYear, termConfigs, years, attendanceConfig]);

    const getAttendanceStatus = (studentId: string, date: Date, type: 'mass' | 'class') => {
        const dateStr = date.toISOString().split('T')[0];
        return attendanceData[`${studentId}-${dateStr}-${type}`] || '';
    };

    const handleExport = () => {
        if (!selectedClass) {
            toast.error("Vui lòng chọn lớp để xuất báo cáo");
            return;
        }

        const className = classes.find(c => c.id === selectedClass)?.name || 'Lop';
        const yearName = years.find(y => y.id === selectedYear)?.name || 'NamHoc';
        const fileName = `DiemDanh_${className}_${reportType}_${selectedMonth}_${yearName}.csv`;

        // Create CSV Content
        let csv = '\uFEFF'; // BOM for UTF-8
        csv += `BÁO CÁO CHUYÊN CẦN - ${reportType === 'MONTH' ? `THÁNG ${selectedMonth}` : reportType}\n`;
        csv += `Năm học: ${yearName}\n`;
        csv += `Lớp: ${className}\n\n`;

        // Header row
        csv += 'STT,Mã học viên,Tên thánh,Họ và tên,';
        reportDays.forEach(day => {
            const dateStr = day.getDate().toString().padStart(2, '0') + '/' + (day.getMonth() + 1).toString().padStart(2, '0');
            csv += `${dateStr} (Lễ),${dateStr} (Học),`;
        });
        csv += 'Lễ (Có mặt),Lễ (Phép),Lễ (Không phép),Học (Có mặt),Học (Phép),Học (Không phép),Tổng vắng (Lễ),Tổng vắng (Học),Tỉ lệ chuyên cần (%)\n';

        // Data rows
        filteredStudents.forEach((s, idx) => {
            let row = `${idx + 1},${s.id},${s.saintName || ''},${s.fullName},`;
            let mC = 0, mP = 0, mK = 0;
            let cC = 0, cP = 0, cK = 0;
            
            reportDays.forEach(day => {
                const mStatus = getAttendanceStatus(s.id, day, 'mass');
                const cStatus = getAttendanceStatus(s.id, day, 'class');
                
                if (mStatus === 'C') mC++;
                else if (mStatus === 'P') mP++;
                else if (mStatus === 'K') mK++;

                if (cStatus === 'C') cC++;
                else if (cStatus === 'P') cP++;
                else if (cStatus === 'K') cK++;
                
                row += `${mStatus || '-'},${cStatus || '-'},`;
            });

            const totalSessions = reportDays.length * 2;
            const massAbsences = mP + mK;
            const classAbsences = cP + cK;
            const totalAbsences = massAbsences + classAbsences;
            const attendanceRate = totalSessions > 0 ? ((totalSessions - totalAbsences) / totalSessions * 100).toFixed(1) : '100';

            row += `${mC},${mP},${mK},${cC},${cP},${cK},${massAbsences},${classAbsences},${attendanceRate}\n`;
            csv += row;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        toast.success("Đã xuất báo cáo chuyên cần thành công!");
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 md:p-6 overflow-hidden">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Năm học</label>
                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedYear}
                        onChange={(e) => { setSelectedYear(e.target.value); setSelectedClass(''); }}
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>{y.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Khối</label>
                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedGrade}
                        onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass(''); }}
                    >
                        <option value="all">Tất cả</option>
                        {grades.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lớp</label>
                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">-- Chọn lớp --</option>
                        {availableClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Loại báo cáo</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                        <button 
                            onClick={() => setReportType('MONTH')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${reportType === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tháng
                        </button>
                        <button 
                            onClick={() => setReportType('HK1')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${reportType === 'HK1' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            HK1
                        </button>
                        <button 
                            onClick={() => setReportType('HK2')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${reportType === 'HK2' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            HK2
                        </button>
                    </div>
                </div>

                {reportType === 'MONTH' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tháng</label>
                        <input 
                            type="month"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tìm kiếm</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tên hoặc mã..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                    <FileDown size={16} /> Xuất Báo Cáo
                </button>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-full">
                    {!selectedClass ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">Vui lòng chọn lớp để xem báo cáo chuyên cần</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="sticky top-0 z-20 bg-slate-50">
                                <tr>
                                    <th className="px-1 py-3 text-[10px] font-black text-slate-500 uppercase border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-30 w-10 min-w-[40px] max-w-[40px] text-center">STT</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase border-b border-r-2 border-slate-300 sticky left-[40px] bg-slate-50 z-30 min-w-[180px] max-w-[180px]">Học viên</th>
                                    {reportDays.map((day, i) => (
                                        <th key={i} className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase border-b border-r-2 border-slate-300 text-center bg-slate-100/50" colSpan={2}>
                                            {day.getDate().toString().padStart(2, '0')}/{ (day.getMonth() + 1).toString().padStart(2, '0') }
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase border-b border-r border-slate-200 text-center bg-amber-100/50" colSpan={3}>Tổng Lễ</th>
                                    <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase border-b border-r border-slate-200 text-center bg-blue-100/50" colSpan={3}>Tổng Học</th>
                                    <th className="px-2 py-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 text-center bg-green-50 w-20 min-w-[80px]">%.Cần</th>
                                </tr>
                                <tr className="bg-slate-50/80">
                                    <th className="sticky left-0 bg-slate-50 border-r border-slate-200 z-20 w-10 min-w-[40px] max-w-[40px]"></th>
                                    <th className="sticky left-[40px] bg-slate-50 border-r-2 border-slate-300 z-20 min-w-[180px] max-w-[180px]"></th>
                                    {reportDays.map((_, i) => (
                                        <React.Fragment key={i}>
                                            <th className="px-1 py-1 text-[8px] font-bold text-slate-400 text-center border-b border-r border-slate-100 bg-amber-50/30 w-12 min-w-[48px]">Lễ</th>
                                            <th className="px-1 py-1 text-[8px] font-bold text-slate-400 text-center border-b border-r-2 border-slate-300 bg-blue-50/30 w-12 min-w-[48px]">Học</th>
                                        </React.Fragment>
                                    ))}
                                    {/* Summary headers */}
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-green-50/50 w-10 min-w-[40px]">C</th>
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-orange-50/50 w-10 min-w-[40px]">P</th>
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-red-50/50 w-10 min-w-[40px]">K</th>
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-green-50/50 w-10 min-w-[40px]">C</th>
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-orange-50/50 w-10 min-w-[40px]">P</th>
                                    <th className="px-1 py-1 text-[8px] font-black text-slate-400 text-center border-b border-r border-slate-100 bg-red-50/50 w-10 min-w-[40px]">K</th>
                                    <th className="border-b border-slate-200 bg-green-50 w-20 min-w-[80px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((s, idx) => {
                                    let mC = 0, mP = 0, mK = 0;
                                    let cC = 0, cP = 0, cK = 0;
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-1 py-2.5 text-[10px] font-bold text-slate-400 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10 text-center w-10 min-w-[40px] max-w-[40px]">{idx + 1}</td>
                                            <td className="px-4 py-2.5 border-r-2 border-slate-300 sticky left-[40px] bg-white group-hover:bg-slate-50 z-10 min-w-[180px] max-w-[180px] truncate" title={`${s.saintName || ''} ${s.fullName}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-extrabold text-slate-800 leading-tight truncate">{s.saintName ? `${s.saintName} ` : ''}{s.fullName}</span>
                                                </div>
                                            </td>
                                            {reportDays.map((day, i) => {
                                                const mStatus = getAttendanceStatus(s.id, day, 'mass');
                                                const cStatus = getAttendanceStatus(s.id, day, 'class');
                                                
                                                if (mStatus === 'C') mC++;
                                                else if (mStatus === 'P') mP++;
                                                else if (mStatus === 'K') mK++;

                                                if (cStatus === 'C') cC++;
                                                else if (cStatus === 'P') cP++;
                                                else if (cStatus === 'K') cK++;

                                                return (
                                                    <React.Fragment key={i}>
                                                        <td className={`px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 w-12 min-w-[48px] ${mStatus === 'C' ? 'text-green-500' : mStatus === 'P' ? 'text-orange-400' : mStatus === 'K' ? 'text-rose-500' : 'text-slate-300'}`}>
                                                            {mStatus || '-'}
                                                        </td>
                                                        <td className={`px-1 py-2 text-[10px] font-black text-center border-r-2 border-slate-300 w-12 min-w-[48px] ${cStatus === 'C' ? 'text-green-500' : cStatus === 'P' ? 'text-orange-400' : cStatus === 'K' ? 'text-rose-500' : 'text-slate-300'}`}>
                                                            {cStatus || '-'}
                                                        </td>
                                                    </React.Fragment>
                                                )
                                            })}
                                            {/* Summary values */}
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-green-50/20 text-green-600 w-10 min-w-[40px]">{mC}</td>
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-orange-50/20 text-orange-600 w-10 min-w-[40px]">{mP}</td>
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-red-50/20 text-red-600 w-10 min-w-[40px]">{mK}</td>
                                            
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-green-50/20 text-green-600 w-10 min-w-[40px]">{cC}</td>
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-orange-50/20 text-orange-600 w-10 min-w-[40px]">{cP}</td>
                                            <td className="px-1 py-2 text-[10px] font-black text-center border-r border-slate-100 bg-red-50/20 text-red-600 w-10 min-w-[40px]">{cK}</td>

                                            <td className="px-2 py-2 text-[10px] font-black text-center bg-green-50/30 text-green-700 w-20 min-w-[80px]">
                                                {reportDays.length > 0 ? (((reportDays.length * 2 - (mP + mK + cP + cK)) / (reportDays.length * 2)) * 100).toFixed(0) : 100}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Legend */}
            {selectedClass && (
                <div className="mt-4 flex flex-wrap gap-6 items-center px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">C: Có mặt</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P: Có phép</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">K: Không phép</span>
                    </div>
                    <div className="flex-1"></div>
                    <div className="text-[10px] font-bold text-slate-400">
                        Tổng số buổi: <span className="text-slate-700">{reportDays.length * 2}</span> (Lễ: {reportDays.length}, Học: {reportDays.length})
                    </div>
                </div>
            )}
        </div>
    );
};
