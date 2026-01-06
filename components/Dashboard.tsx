
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_STUDENTS, MOCK_CLASSES, MOCK_ANNOUNCEMENTS } from '../constants';
import { Users, User, UserCheck, Bell, FileText, School, CalendarRange } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Teacher, ClassRoom, SchoolYear } from '../types';

interface DashboardProps {
    currentUser: Teacher | null;
    classes: ClassRoom[];
    years: SchoolYear[];
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, classes, years }) => {
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
    return MOCK_STUDENTS.filter(s => classIds.includes(s.classId));
  }, [classesInYear, myClasses, isAdmin]);

  const totalStudents = studentsInScope.length;
  const maleCount = studentsInScope.filter(s => s.gender === 'Male').length;
  const femaleCount = studentsInScope.filter(s => s.gender === 'Female').length;

  const studentsByClassData = (isAdmin ? classesInYear : myClasses).map(c => ({
    name: c.name,
    count: MOCK_STUDENTS.filter(s => s.classId === c.id).length
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
             <h2 className="text-2xl font-bold text-slate-800">
                 {isAdmin ? 'Tổng Quan' : `Xin chào, ${currentUser?.saintName} ${currentUser?.fullName}`}
             </h2>
             {!isAdmin && <p className="text-slate-500 text-sm">Chúc bạn một ngày phục vụ tràn đầy hồng ân!</p>}
         </div>
         
         {/* Only Admin sees the Year Selector here. GLV sees static info below. */}
         {isAdmin && (
             <select 
                className="w-full md:w-auto px-4 py-2 border rounded-lg bg-white shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
             >
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
             </select>
         )}
      </div>

      {/* GLV SPECIFIC BANNER */}
      {!isAdmin && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <School size={120} />
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <div className="flex items-center gap-2 mb-2 text-blue-100 uppercase text-xs font-bold tracking-widest">
                          <CalendarRange size={16} /> Năm Học Hiện Tại
                      </div>
                      <h3 className="text-2xl font-black">{currentYearName}</h3>
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-2 text-blue-100 uppercase text-xs font-bold tracking-widest">
                          <Users size={16} /> Lớp Phụ Trách
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {myClasses.length > 0 ? (
                              myClasses.map(c => (
                                  <span key={c.id} className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg font-bold border border-white/30">
                                      {c.name}
                                  </span>
                              ))
                          ) : (
                              <span className="italic opacity-80">Chưa được phân công lớp</span>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {/* Stats Cards: 1 column on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Tổng học viên {isAdmin ? '' : 'lớp'}</p>
            <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <User size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Nam</p>
            <p className="text-2xl font-bold text-slate-800">{maleCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-pink-100 rounded-full text-pink-600">
            <UserCheck size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Nữ</p>
            <p className="text-2xl font-bold text-slate-800">{femaleCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-lg mb-4 text-slate-800">Phân Bố Học Viên {isAdmin ? 'Theo Lớp' : 'Trong Lớp'}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentsByClassData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} width={30} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="count" name="Số lượng" radius={[4, 4, 0, 0]}>
                  {studentsByClassData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-slate-800">Bảng Thông Báo</h3>
            <button className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-64">
            {MOCK_ANNOUNCEMENTS.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border-l-4 ${item.type === 'NOTICE' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                   {item.type === 'NOTICE' ? <Bell size={14} className="text-blue-600" /> : <FileText size={14} className="text-green-600" />}
                   <span className="text-xs font-semibold uppercase text-slate-500">{item.type === 'NOTICE' ? 'Thông báo' : 'Biên bản'}</span>
                   <span className="text-xs text-slate-400 ml-auto">{item.date}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                <p className="text-slate-600 text-sm mt-1 line-clamp-2">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
