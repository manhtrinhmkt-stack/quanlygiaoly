
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  ArrowRightLeft,  
  BookOpen, 
  FilePlus, 
  FileText,
  Users,
  ChevronRight,
  Printer,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  Merge,
  ListFilter
} from 'lucide-react';
import { ClassPlacement } from './ClassPlacement';
import { DroppedStudents } from './DroppedStudents';
import { DuplicateMergeTab } from './DuplicateMergeTab';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord, ScoreColumn, TermConfig, Teacher } from '../types';

interface AcademicAffairsProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  classes: ClassRoom[];
  years: SchoolYear[];
  grades: Grade[];
  currentUser: Teacher;
  records: AcademicRecord[];
  setRecords: (records: AcademicRecord[]) => void;
  scoreColumns: ScoreColumn[];
  termConfigs: TermConfig[];
}

export const AcademicAffairs: React.FC<AcademicAffairsProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<'placement' | 'dropped' | 'sacraments' | 'applications' | 'documents' | 'merge'>('placement');

  const getClassName = (classId: string) => {
    const cls = props.classes.find(c => c.id === classId);
    return cls ? cls.name : 'N/A';
  };

  const tabs = [
    { id: 'placement', label: 'Xếp lớp', icon: ArrowRightLeft },
    { id: 'dropped', label: 'Quản lý nghỉ học', icon: Users },
    { id: 'merge', label: 'Gộp trùng', icon: ListFilter },
    { id: 'sacraments', label: 'Cập nhật Bí tích', icon: BookOpen },
    { id: 'applications', label: 'Tiếp nhận đơn mới', icon: FilePlus },
    { id: 'documents', label: 'Giấy tờ', icon: FileText },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-start items-center mb-6 gap-4">
          <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                  activeSubTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {activeSubTab === 'placement' && (
            <ClassPlacement {...props} />
          )}
          {activeSubTab === 'dropped' && (
            <DroppedStudents students={props.students} setStudents={props.setStudents} classes={props.classes} years={props.years} grades={props.grades} records={props.records} />
          )}
          {activeSubTab === 'merge' && (
            <DuplicateMergeTab students={props.students} setStudents={props.setStudents} records={props.records} setRecords={props.setRecords} />
          )}
          {activeSubTab === 'sacraments' && (
            <SacramentsRegistry 
              students={props.students} 
              getClassName={getClassName} 
              years={props.years}
              grades={props.grades}
              classes={props.classes}
              records={props.records}
              currentUser={props.currentUser}
            />
          )}
          {activeSubTab === 'applications' && (
            <NewApplications years={props.years} classes={props.classes} grades={props.grades} />
          )}
          {activeSubTab === 'documents' && (
            <DocumentExport students={props.students} classes={props.classes} years={props.years} getClassName={getClassName} />
          )}
        </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SacramentsRegistry: React.FC<{ 
  students: Student[], 
  getClassName: (id: string) => string,
  years: SchoolYear[],
  grades: Grade[],
  classes: ClassRoom[],
  records: AcademicRecord[],
  currentUser: Teacher | null
}> = ({ students, getClassName, years, grades, classes, records, currentUser }) => {
  const [selectedSacrament, setSelectedSacrament] = useState('confirmation'); 
  const [filterYear, setFilterYear] = useState(years.find(y => y.isActive)?.id || '');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const isYearLocked = years.find(y => y.id === filterYear)?.isLocked && currentUser?.role !== 'ADMIN';

  const [bulkData, setBulkData] = useState({
    date: new Date().toISOString().split('T')[0],
    bishop: '',
    parish: 'Tân Thành',
    note: ''
  });

  const [studentSacramentData, setStudentSacramentData] = useState<Record<string, { date?: string, celebrant?: string, godparent?: string, parish?: string }>>({});

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Filter logic
  const filteredGrades = grades;
  const filteredClasses = classes.filter(c => {
    const gradeMatches = filterGrade ? c.gradeId === filterGrade : true;
    return c.yearId === filterYear && gradeMatches;
  });

  const displayedStudents = useMemo(() => {
    return students.filter(s => {
      const classMatches = filterClass ? s.classId === filterClass : true;
      const classInYear = classes.find(c => c.id === s.classId && c.yearId === filterYear);
      
      let gradeMatches = true;
      if (filterGrade) {
        const cls = classes.find(c => c.id === s.classId);
        gradeMatches = cls ? cls.gradeId === filterGrade : false;
      }

      return classInYear && classMatches && gradeMatches;
    });
  }, [students, filterYear, filterGrade, filterClass, classes]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === displayedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(displayedStudents.map(s => s.id));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {isYearLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <span className="text-amber-600 shrink-0">🔒</span>
              <span>Niên khóa đang lọc đã bị khóa. Toàn bộ thông tin bí tích hiển thị ở chế độ Chỉ Đọc. Người dùng có vai trò Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để cập nhật bí tích.</span>
          </div>
      )}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Cập nhật Bí tích hàng loạt
            </h3>
            <div className="text-xs font-bold text-slate-500">
              Đã chọn: <span className="text-blue-600">{selectedStudents.length}</span> học viên
            </div>
            <select 
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Năm học</label>
              <select 
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setFilterGrade(''); setFilterClass(''); }}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Khối</label>
              <select 
                value={filterGrade}
                onChange={e => { setFilterGrade(e.target.value); setFilterClass(''); }}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả khối</option>
                {filteredGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lớp</label>
              <select 
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả lớp</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bí tích</label>
              <select 
                value={selectedSacrament}
                onChange={e => setSelectedSacrament(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="eucharist">Rước Lễ</option>
                <option value="confirmation">Thêm Sức</option>
                <option value="solemn">Bao Đồng</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày (Hàng loạt)</label>
              <input 
                type="date" 
                value={bulkData.date}
                onChange={e => setBulkData({...bulkData, date: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Đức Cha / Linh mục (Hàng loạt)</label>
              <input 
                type="text" 
                placeholder="Người ban bí tích..."
                value={bulkData.bishop}
                onChange={e => setBulkData({...bulkData, bishop: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nơi lãnh nhận (Gx)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold text-slate-400 text-sm">Gx.</span>
                <input 
                  type="text" 
                  value={bulkData.parish}
                  onChange={e => setBulkData({...bulkData, parish: e.target.value})}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <th className="p-2 w-8">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300" 
                  checked={displayedStudents.length > 0 && selectedStudents.length === displayedStudents.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-2">Học viên</th>
              <th className="p-2">Lớp</th>
              <th className="p-2 text-center">Kết quả</th>
              <th className="p-2">Ngày lãnh nhận</th>
              <th className="p-2">Đức Cha / LM</th>
              {selectedSacrament === 'confirmation' && (
                <th className="p-2">Người đỡ đầu</th>
              )}
              <th className="p-2">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedStudents.map(student => {
              const record = records.find(r => r.studentId === student.id && r.yearId === filterYear);
              const result = record?.result === 'Không đạt' ? 'Rớt' : (record?.result || 'Chưa có');
              const sData = studentSacramentData[student.id] || {};
              
              return (
              <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors text-xs ${selectedStudents.includes(student.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="p-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                </td>
                <td className="p-2">
                  <div className="font-bold text-slate-800 leading-tight">
                    <span className="text-[9px] text-slate-400 font-medium block leading-none mb-0.5">{student.saintName}</span>
                    {student.fullName}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono tracking-tighter">#{student.id}</div>
                </td>
                <td className="p-2 text-[10px] font-medium text-slate-600">{getClassName(student.classId)}</td>
                <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${result === 'Đạt' ? 'bg-green-100 text-green-700' : (result === 'Rớt' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')}`}>
                        {result}
                    </span>
                </td>
                <td className="p-2">
                   <input 
                    type="date" 
                    className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] outline-none focus:ring-1 focus:ring-blue-500" 
                    value={sData.date || bulkData.date}
                    onChange={e => setStudentSacramentData({...studentSacramentData, [student.id]: {...sData, date: e.target.value}})}
                  />
                </td>
                <td className="p-2">
                   <input 
                    type="text" 
                    className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] outline-none focus:ring-1 focus:ring-blue-500" 
                    placeholder="Tên..."
                    value={sData.celebrant || bulkData.bishop}
                    onChange={e => setStudentSacramentData({...studentSacramentData, [student.id]: {...sData, celebrant: e.target.value}})}
                  />
                </td>
                {selectedSacrament === 'confirmation' && (
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] outline-none focus:ring-1 focus:ring-blue-500" 
                      placeholder="Người đỡ đầu..."
                      value={sData.godparent || ''}
                      onChange={e => setStudentSacramentData({...studentSacramentData, [student.id]: {...sData, godparent: e.target.value}})}
                    />
                  </td>
                )}
                <td className="p-2">
                   <input type="text" className="w-full p-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-[10px]" placeholder="..." />
                </td>
              </tr>
              );
            })}
            {displayedStudents.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic text-xs">
                  Không tìm thấy học viên nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4">
        <p className="text-xs text-slate-400 italic">Lưu ý: Chỉ những học viên được chọn mới được cập nhật dữ liệu.</p>
        <button 
          onClick={() => {
            if (isYearLocked) {
              toast.error("Niên khóa này đã bị khóa. Không thể cập nhật bí tích!");
              return;
            }
            if (selectedStudents.length === 0) {
              toast.error('Vui lòng chọn học viên!');
              return;
            }
            toast.success(`Đã cập nhật dữ liệu bí tích cho ${selectedStudents.length} học viên!`);
          }}
          className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${isYearLocked ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
          disabled={isYearLocked}
        >
          <CheckCircle2 size={18} /> Lưu vào sổ ({selectedStudents.length})
        </button>
      </div>
    </div>
  );
};

const NewApplications: React.FC<{ years: SchoolYear[], classes: ClassRoom[], grades: Grade[] }> = ({ years, classes, grades }) => {
  const [selectedYear, setSelectedYear] = useState(years.find(y => y.isActive)?.id || years[0]?.id || '');
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingAppId, setApprovingAppId] = useState<number | null>(null);
  const [approveYear, setApproveYear] = useState('');
  const [approveGrade, setApproveGrade] = useState('');
  const [approveClass, setApproveClass] = useState('');

  const handleApproveConfirm = () => {
    if (!approvingAppId || !approveClass) return;
    toast.success('Đã duyệt hồ sơ!');
    setApprovingAppId(null);
    setApproveClass('');
  };

  const handleRejectConfirm = () => {
    if (!rejectingAppId || !rejectReason) return;
    toast.success('Đã từ chối hồ sơ!');
    setRejectingAppId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FilePlus className="text-emerald-600" /> Danh sách đơn đăng ký mới
          </h3>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Học viên</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Ngày đăng ký</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">SĐT</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map(i => {
            const status = i % 3 === 0 ? 'Từ chối' : (i % 3 === 1 ? 'Đã xếp lớp' : 'Đã tiếp nhận');
            const statusColor = status === 'Từ chối' ? 'bg-red-50 text-red-600' : (status === 'Đã tiếp nhận' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600');
            return (
            <React.Fragment key={i}>
            <tr className={`hover:bg-slate-50 transition-all ${selectedApp === i ? 'bg-blue-50/50' : ''}`} onClick={() => setSelectedApp(selectedApp === i ? null : i)}>
              <td className="p-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <User size={20} />
                    </div>
                    <div className="font-bold text-slate-800">Maria Nguyễn Thị {i === 1 ? 'An' : 'Bình'}</div>
                 </div>
              </td>
              <td className="p-4 text-sm font-bold text-slate-600">15/05/2026 09:30</td>
              <td className="p-4 text-sm font-bold text-slate-600">0908 123 45{i}</td>
              <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>{status}</span>
              </td>
              <td className="p-4 text-right">
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setApprovingAppId(i); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700">
                        Duyệt
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setRejectingAppId(i); }}
                        className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg font-bold text-xs hover:bg-red-100">
                        Từ chối
                    </button>
                </div>
              </td>
            </tr>
            {selectedApp === i && (
                <tr>
                    <td colSpan={5} className="p-0">
                        <div className="p-6 bg-blue-50/30 border-t border-blue-100 animate-in fade-in zoom-in duration-200">
                            <p className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider underline decoration-blue-200 underline-offset-4">Thông tin đầy đủ</p>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên thánh & Họ tên</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">Maria Nguyễn Thị An</div>
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ngày sinh</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">15/05/2015</div>
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Giới tính</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">Nữ</div>
                                </div>
                                <div className="col-span-12">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">an.nguyen@email.com</div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên bố</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">Nguyễn Văn Cường</div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SĐT Bố</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">0908123456</div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên mẹ</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">Trần Thị Lan</div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SĐT Mẹ</label>
                                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white">0908123457</div>
                                </div>

                                <div className="col-span-12 mt-4 space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Bí tích Rửa tội</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div><span className="text-slate-400">Ngày:</span> <span className="font-bold text-blue-900">10/06/2015</span></div>
                                            <div><span className="text-slate-400">Cử hành bởi:</span> <span className="font-bold text-blue-900">Cha X</span></div>
                                            <div><span className="text-slate-400">Đỡ đầu:</span> <span className="font-bold text-blue-900">Ông Y</span></div>
                                            <div><span className="text-slate-400">Tại:</span> <span className="font-bold text-blue-900">Gx. Tân Định</span></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Bí tích Rước lễ</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div><span className="text-slate-400">Ngày:</span> <span className="font-bold text-emerald-900">Chưa có</span></div>
                                            <div><span className="text-slate-400">Tại:</span> <span className="font-bold text-emerald-900">—</span></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1.5">Bí tích Thêm sức</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div><span className="text-slate-400">Ngày:</span> <span className="font-bold text-purple-900">Chưa có</span></div>
                                            <div><span className="text-slate-400">Cử hành bởi:</span> <span className="font-bold text-purple-900">—</span></div>
                                            <div><span className="text-slate-400">Đỡ đầu:</span> <span className="font-bold text-purple-900">—</span></div>
                                            <div><span className="text-slate-400">Tại:</span> <span className="font-bold text-purple-900">—</span></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Tuyên hứa Bao đồng</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div><span className="text-slate-400">Ngày:</span> <span className="font-bold text-orange-900">Chưa có</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-12">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ghi chú</label>
                                    <div className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white min-h-[60px]">Học viên ngoan, cần hỗ trợ thêm về kiến thức Giáo lý sơ cấp.</div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sổ gia đình công giáo</label>
                                    <a href="#" className="flex items-center gap-2 text-xs font-bold text-blue-600 underline">so_gia_dinh_cong_giao.pdf</a>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ảnh liên quan</label>
                                    <a href="#" className="flex items-center gap-2 text-xs font-bold text-blue-600 underline">anh_lien_quan.jpg</a>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
            </React.Fragment>
            );
          })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingAppId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <h3 className="font-bold text-lg">Từ chối đơn</h3>
                <textarea 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="Nhập lý do từ chối..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                />
                <div className="flex gap-2">
                    <button onClick={() => setRejectingAppId(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Hủy</button>
                    <button onClick={handleRejectConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Từ chối</button>
                </div>
            </div>
        </div>
      )}

      {/* Approve Modal */}
      {approvingAppId !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                  <h3 className="font-bold text-lg">Duyệt và xếp lớp</h3>
                  <select className="w-full p-2 border rounded-lg" onChange={(e) => { setApproveYear(e.target.value); setApproveGrade(''); setApproveClass(''); }}>
                      <option value="">Chọn năm học</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded-lg" disabled={!approveYear} onChange={(e) => { setApproveGrade(e.target.value); setApproveClass(''); }}>
                      <option value="">Chọn khối</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded-lg" disabled={!approveGrade} onChange={(e) => setApproveClass(e.target.value)}>
                      <option value="">Chọn lớp</option>
                      {classes.filter(c => c.yearId === approveYear && c.gradeId === approveGrade).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                      <button onClick={() => setApprovingAppId(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Hủy</button>
                      <button onClick={handleApproveConfirm} disabled={!approveClass} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">Lưu</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DocumentExport: React.FC<{ students: Student[], classes: ClassRoom[], years: SchoolYear[], getClassName: (id: string) => string }> = ({ students, classes, years, getClassName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  ).slice(0, 5);

  const docTypes = [
    { id: 'TRANSFER', title: 'Giấy chuyển xứ', desc: 'Dùng cho học viên chuyển sinh hoạt sang giáo xứ khác', color: 'bg-blue-600' },
    { id: 'PROFILE', title: 'Chứng nhận học giáo lý', desc: 'Xác nhận quá trình học tập tại giáo xứ', color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Printer className="text-blue-600" /> Xuất giấy tờ & Chứng nhận
        </h3>

        <div className="max-w-xl mb-8 relative">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tìm học viên cần cấp giấy</label>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Nhập tên hoặc mã học viên..." 
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setSelectedStudent(null); }}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400">
                    <Users size={20} />
                </div>
            </div>

            {searchTerm && !selectedStudent && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                    className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${s.status === 'DROPPED' ? 'opacity-60 grayscale bg-slate-50/50' : ''}`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {s.saintName} {s.fullName} 
                        {s.status === 'DROPPED' && <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded-md font-black uppercase">Đã nghỉ</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{getClassName(s.classId)} • #{s.id}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            )}
        </div>

        {selectedStudent && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm font-black text-lg">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <div>
                <div className="font-black text-slate-800">{selectedStudent.saintName} {selectedStudent.fullName}</div>
                <div className="text-xs text-slate-500 font-bold">Mã số: {selectedStudent.id} • Lớp: {getClassName(selectedStudent.classId)}</div>
              </div>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-600">
              Thay đổi
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docTypes.map((doc, idx) => (
                <div key={idx} className={`p-5 border rounded-2xl flex items-start gap-4 transition-all ${selectedStudent ? 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/10' : 'border-slate-50 opacity-50 grayscale select-none'}`}>
                    <div className={`w-12 h-12 ${doc.color} rounded-xl flex items-center justify-center text-white shrink-0 shadow-md`}>
                        <FileText size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{doc.title}</h4>
                        <p className="text-xs text-slate-500 mb-4">{doc.desc}</p>
                        {doc.id === 'TRANSFER' && (
                            <input type="text" placeholder="Nhập tên giáo xứ chuyển đến..." className="w-full p-2 mb-4 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                        <button 
                          disabled={!selectedStudent}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer size={14} className="group-hover:scale-110 transition-transform" />
                            XUẤT PHIẾU
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-slate-500" /> Lịch sử xuất gần đây
              </h3>
              <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                  <FileText size={16} />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800">Giấy chuyển xứ - Giuse Trần Văn {i === 1 ? 'A' : 'B'}</p>
                                  <p className="text-[10px] text-slate-500">Xuất bởi: GLV. Maria Hằng • 14:30 14/05/2026</p>
                              </div>
                          </div>
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-[10px] font-bold">Hoàn tất</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
