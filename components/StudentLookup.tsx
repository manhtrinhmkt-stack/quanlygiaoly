
import React, { useState, useMemo } from 'react';
import { Search, User, Phone, MapPin, Hash, GraduationCap } from 'lucide-react';
import { Student, ClassRoom, SchoolYear, Grade } from '../types';

interface StudentLookupProps {
  students: Student[];
  classes: ClassRoom[];
  years: SchoolYear[];
  grades: Grade[];
}

export const StudentLookup: React.FC<StudentLookupProps> = ({ students, classes, years, grades }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classesInYear = useMemo(() => {
    if (selectedYear === 'all') return classes;
    return classes.filter(c => c.yearId === selectedYear);
  }, [classes, selectedYear]);

  const availableClasses = useMemo(() => {
    if (selectedGrade === 'all') return classesInYear;
    return classesInYear.filter(c => c.gradeId === selectedGrade);
  }, [classesInYear, selectedGrade]);

  const formatDate = (dateStr?: string) => {
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

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const cls = classes.find(c => c.id === s.classId);
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.saintName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = selectedYear === 'all' || cls?.yearId === selectedYear;
      const matchesGrade = selectedGrade === 'all' || cls?.gradeId === selectedGrade;
      const matchesClass = selectedClass === 'all' ? true : (selectedClass === 'unassigned' ? !s.classId : s.classId === selectedClass);
      
      return matchesSearch && matchesYear && matchesGrade && matchesClass;
    });
  }, [students, searchTerm, selectedYear, selectedGrade, selectedClass, classes]);

  const getClassLabel = (classId?: string) => {
    if (!classId) return 'Chưa xếp lớp';
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Không xác định';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Search className="text-orange-500" size={24} />
              Tra Cứu Thiếu Nhi
            </h2>
            <p className="text-xs text-slate-500 font-medium">Tìm kiếm thông tin thiếu nhi toàn đoàn (Chỉ xem)</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm tên, mã, tên thánh..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none w-full sm:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedGrade('all');
                setSelectedClass('all');
              }}
            >
              <option value="all">Tất cả năm học</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClass('all');
              }}
            >
              <option value="all">Tất cả khối</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">Tất cả các lớp</option>
              <option value="unassigned">Chưa xếp lớp</option>
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map(student => {
              const isDropped = student.status === 'DROPPED';
              return (
              <div key={student.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all relative ${isDropped ? 'opacity-60 grayscale' : ''}`}>
                {isDropped && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="border-4 border-rose-500/30 text-rose-500/30 font-black text-4xl px-4 py-2 rounded-xl rotate-[-15deg] uppercase tracking-widest whitespace-nowrap">
                      Đã nghỉ
                    </div>
                  </div>
                )}
                <div className={`p-4 border-b border-slate-50 ${isDropped ? 'bg-slate-100' : 'bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 tracking-tighter">
                      #{student.id}
                    </span>
                    <div className="flex gap-1">
                      {isDropped && <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-1 rounded-lg">ĐÃ NGHỈ</span>}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${student.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {student.gender === 'Male' ? 'NAM' : 'NỮ'}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 leading-tight">
                    {student.saintName} {student.fullName}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    <GraduationCap size={14} className={isDropped ? 'text-slate-400' : 'text-emerald-500'} />
                    <span className={`text-xs font-bold ${isDropped ? 'text-slate-500' : 'text-emerald-700'}`}>{getClassLabel(student.classId)}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-600 leading-relaxed font-medium">
                      {student.address || 'Không có địa chỉ'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ngày sinh</p>
                      <p className="text-xs font-bold text-slate-700">{formatDate(student.dob) || '--/--/----'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {(student.fatherName || student.fatherPhone) && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Cha</span>
                          {student.fatherName && <span className="text-xs font-bold text-slate-700 tracking-tight">{student.fatherName}</span>}
                        </div>
                        {student.fatherPhone && <a href={`tel:${student.fatherPhone}`} className="text-xs font-mono font-bold text-blue-600 hover:underline">{student.fatherPhone}</a>}
                      </div>
                    )}
                    {(student.motherName || student.motherPhone) && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Mẹ</span>
                          {student.motherName && <span className="text-xs font-bold text-slate-700 tracking-tight">{student.motherName}</span>}
                        </div>
                        {student.motherPhone && <a href={`tel:${student.motherPhone}`} className="text-xs font-mono font-bold text-blue-600 hover:underline">{student.motherPhone}</a>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Không tìm thấy thiếu nhi phù hợp</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedClass('all'); }}
              className="mt-4 text-orange-500 text-sm font-bold hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-slate-200 p-3 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Tổng cộng: {filteredStudents.length} hồ sơ ({filteredStudents.filter(s => s.gender === 'Male').length} Nam, {filteredStudents.filter(s => s.gender === 'Female').length} Nữ)
        </p>
      </div>
    </div>
  );
};
