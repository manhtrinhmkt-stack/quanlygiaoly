
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SAINTS } from '../constants';
import { 
  Users, User, UserCheck, School, CalendarRange, GraduationCap, BookOpen, 
  TrendingUp, Wallet, Package, MonitorPlay, Award, Clock, CalendarCheck, 
  BookOpenCheck, Search, ChevronRight, Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Teacher, ClassRoom, SchoolYear, Student, AcademicRecord, Transaction, InventoryItem, DeviceRequest } from '../types';

interface DashboardProps {
    currentUser: Teacher | null;
    classes: ClassRoom[];
    years: SchoolYear[];
    students: Student[];
    teachers: Teacher[];
    records: AcademicRecord[];
    transactions: Transaction[];
    inventory: InventoryItem[];
    deviceRequests: DeviceRequest[];
    setActiveTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    currentUser, classes, years, students, teachers, 
    records, transactions, inventory, deviceRequests,
    setActiveTab
}) => {
  const [selectedYear, setSelectedYear] = useState('');

  // Default to active year
  useEffect(() => {
    const active = years.find(y => y.isActive);
    if (active) setSelectedYear(active.id);
  }, [years]);

  // Identify Role
  const isAdmin = currentUser?.role === 'ADMIN';

  // Get Active Year Name
  const currentYearName = years.find(y => y.id === selectedYear)?.name || '---';

  // Logic for GLV: Find their classes in the selected year
  const myClasses = useMemo(() => {
      if (isAdmin || !currentUser) return [];
      const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
      return classes.filter(c => 
          c.yearId === selectedYear && 
          ((c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
          (c.assistants && c.assistants.includes(teacherName)))
      );
  }, [classes, currentUser, selectedYear, isAdmin]);

  // Logic for Admin: Filter all classes by year
  const classesInYear = useMemo(() => {
    return classes.filter(c => c.yearId === selectedYear);
  }, [selectedYear, classes]);

  // Filter students belonging to relevant classes (Admin: all in year, GLV: only their classes)
  const studentsInScope = useMemo(() => {
    const targetClasses = isAdmin ? classesInYear : myClasses;
    const classIds = targetClasses.map(c => c.id);
    return students.filter(s => classIds.includes(s.classId));
  }, [classesInYear, myClasses, isAdmin, students]);

  const totalStudents = studentsInScope.length;
  const maleCount = studentsInScope.filter(s => s.gender === 'Male').length;
  const femaleCount = studentsInScope.filter(s => s.gender === 'Female').length;

  const studentsByClassData = (isAdmin ? classesInYear : myClasses).map(c => {
    const classStudents = students.filter(s => s.classId === c.id);
    return {
      name: c.name,
      male: classStudents.filter(s => s.gender === 'Male').length,
      female: classStudents.filter(s => s.gender === 'Female').length,
      total: classStudents.length
    };
  });

  // Attendance Summary
  const attendanceRate = useMemo(() => {
    const studentIds = studentsInScope.map(s => s.id);
    const relevantRecords = records.filter(r => studentIds.includes(r.studentId));
    if (relevantRecords.length === 0) return 0;
    
    // Total possible based on 15 sessions per term
    const totalPossible = relevantRecords.length * 15; 
    const totalAbsents = relevantRecords.reduce((sum, r) => sum + (r.absentP || 0) + (r.absentK || 0), 0);
    const rate = ((totalPossible - totalAbsents) / totalPossible) * 100;
    return Math.max(0, Math.min(100, parseFloat(rate.toFixed(1))));
  }, [studentsInScope, records]);

  // --- STUDENT AGE DISTRIBUTION ---
  const ageDistribution = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const distribution: Record<string, number> = {
      'Dưới 7': 0,
      '7-10 tuổi': 0,
      '11-14 tuổi': 0,
      '15-18 tuổi': 0,
      'Trên 18': 0
    };

    studentsInScope.forEach(s => {
      if (!s.dob) return;
      const birthYear = s.dob ? parseInt(s.dob.split('-')[0]) : currentYear;
      const age = currentYear - birthYear;
      if (age < 7) distribution['Dưới 7']++;
      else if (age <= 10) distribution['7-10 tuổi']++;
      else if (age <= 14) distribution['11-14 tuổi']++;
      else if (age <= 18) distribution['15-18 tuổi']++;
      else distribution['Trên 18']++;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [studentsInScope]);

  // --- SCORE DISTRIBUTION (1-10) ---
  const scoreDistributionData = useMemo(() => {
    const studentIds = studentsInScope.map(s => s.id);
    const relevantRecords = records.filter(r => studentIds.includes(r.studentId));
    
    const counts: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) {
      counts[i.toString()] = 0;
    }

    const studentAverages: Record<string, number[]> = {};
    relevantRecords.forEach(r => {
        if (!studentAverages[r.studentId]) studentAverages[r.studentId] = [];
        studentAverages[r.studentId].push(r.average);
    });

    Object.values(studentAverages).forEach(avgs => {
        const finalAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
        const roundedScore = Math.round(finalAvg);
        if (roundedScore >= 1 && roundedScore <= 10) {
          counts[roundedScore.toString()]++;
        }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [studentsInScope, records]);

  // Quick Action items
  const quickActions = [
    { label: 'Điểm Danh', desc: 'Chuyên cần Chúa Nhật', icon: CalendarCheck, tab: 'attendance', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300' },
    { label: 'Bảng Điểm', desc: 'Cập nhật điểm kiểm tra', icon: BookOpenCheck, tab: 'grades', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300' },
    { label: 'Mượn Thiết Bị', desc: 'Đăng ký phòng / máy chiếu', icon: MonitorPlay, tab: 'devices', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', hover: 'hover:border-fuchsia-300' },
    { label: 'Tra Cứu Nhanh', desc: 'Tìm kiếm hồ sơ học viên', icon: Search, tab: 'lookup', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300' },
  ];

  return (
    <div className="space-y-6">
      
      {/* HERO / WELCOME BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl shadow-sm p-5 md:p-6 text-white relative overflow-hidden">
        {/* Subtle decorative background church icon */}
        <div className="absolute right-4 bottom-[-15px] opacity-10 pointer-events-none">
          <School size={160} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-blue-200 text-xs font-bold tracking-wide uppercase">
              <Sparkles size={14} className="text-amber-300" />
              <span>Gx. Tân Thành • Hệ Thống Quản Lý Giáo Lý</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              {isAdmin ? 'Bảng Điều Khiển Tổng Quan' : `Xin chào, ${currentUser?.saintName} ${currentUser?.fullName}`}
            </h1>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-xl">
              {isAdmin 
                ? `Quản lý dữ liệu toàn xứ đoàn năm học ${currentYearName}. Theo dõi tiến độ học vụ, điểm số và chuyên cần.`
                : 'Chúc bạn một ngày phục vụ tràn đầy hồng ân và niềm vui bên các em thiếu nhi!'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                <span className="text-xs font-semibold text-blue-100">Năm học:</span>
                <select 
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map(y => <option key={y.id} value={y.id} className="text-slate-800">{y.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white flex items-center gap-2">
              <Clock size={14} className="text-amber-300" />
              <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* GLV Class tags inside banner if GLV */}
        {!isAdmin && myClasses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-200">Lớp phụ trách:</span>
            {myClasses.map(c => (
              <span key={c.id} className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold border border-white/30">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS BAR */}
      {setActiveTab && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thao tác nhanh</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((qa, idx) => {
              const Icon = qa.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(qa.tab)}
                  className={`bg-white border border-slate-200/80 p-3.5 rounded-xl text-left shadow-xs transition-all duration-150 ${qa.hover} hover:shadow-sm hover:-translate-y-0.5 group cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${qa.bg} ${qa.color} group-hover:scale-105 transition-transform`}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">{qa.label}</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{qa.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STATS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Học Viên</span>
            <div className="text-2xl font-black text-slate-900 leading-none">{totalStudents}</div>
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> {maleCount} Nam
              <span className="text-slate-300">•</span>
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500" /> {femaleCount} Nữ
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} strokeWidth={2.2} />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Tỷ lệ Chuyên cần</span>
            <div className="text-2xl font-black text-slate-900 leading-none">{attendanceRate}%</div>
            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
              <TrendingUp size={12} />
              <span>Chuyên cần trung bình</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} strokeWidth={2.2} />
          </div>
        </div>

        {/* Male Students */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Nam Thiếu Nhi</span>
            <div className="text-2xl font-black text-slate-900 leading-none">{maleCount}</div>
            <div className="text-[11px] text-slate-400 font-semibold pt-1">
              {totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0}% tổng sĩ số
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <User size={24} strokeWidth={2.2} />
          </div>
        </div>

        {/* Female Students */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Nữ Thiếu Nhi</span>
            <div className="text-2xl font-black text-slate-900 leading-none">{femaleCount}</div>
            <div className="text-[11px] text-slate-400 font-semibold pt-1">
              {totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0}% tổng sĩ số
            </div>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <UserCheck size={24} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Students Distribution by Class */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Phân Bố Sĩ Số {isAdmin ? 'Các Lớp Trong Xứ Đoàn' : 'Lớp Phụ Trách'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Thống kê tỷ lệ Nam / Nữ theo từng phân lớp</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Nam
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Nữ
                </div>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsByClassData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} interval={0} angle={-15} textAnchor="end" height={40} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis allowDecimals={false} width={30} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="male" name="Nam" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={26} />
                  <Bar dataKey="female" name="Nữ" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution Chart */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" /> Phân Bổ Độ Tuổi Học Viên
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Số lượng học viên chia theo các nhóm tuổi</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} width={80} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{backgroundColor: '#0f172a', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '12px'}}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} label={{ position: 'right', fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Academic Score Distribution Bar Chart */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-amber-500" /> Phổ Điểm Học Lực
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Thống kê phân bổ thang điểm từ 1 đến 10</p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis allowDecimals={false} width={30} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="value" name="Số học viên" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed font-medium">
            Điểm trung bình được tổng hợp từ các cột điểm định kỳ và bài kiểm tra giáo lý của học viên.
          </div>
        </div>
      </div>
    </div>
  );
};
