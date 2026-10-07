import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord } from '../types';
import { User, RefreshCw, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

interface DroppedStudentsProps {
    students: Student[];
    setStudents: (students: Student[]) => void;
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    records: AcademicRecord[];
}

export const DroppedStudents: React.FC<DroppedStudentsProps> = ({ students, setStudents, classes, years, grades, records }) => {
    const [selectedYear, setSelectedYear] = useState<'all' | string>('all');
    const [selectedGrade, setSelectedGrade] = useState<'all' | string>('all');
    const [selectedClass, setSelectedClass] = useState<'all' | string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [restoreStudent, setRestoreStudent] = useState<Student | null>(null);
    const [restoreYear, setRestoreYear] = useState('');
    const [restoreGrade, setRestoreGrade] = useState('');
    const [restoreClass, setRestoreClass] = useState('');

    const classesInYear = useMemo(() => {
        if (selectedYear === 'all') return classes;
        return classes.filter(c => c.yearId === selectedYear);
    }, [classes, selectedYear]);

    const availableClasses = useMemo(() => {
        if (selectedGrade === 'all') return classesInYear;
        return classesInYear.filter(c => c.gradeId === selectedGrade);
    }, [classesInYear, selectedGrade]);

    const droppedStudents = useMemo(() => {
        return students.filter(s => s.status === 'DROPPED').filter(s => {
            const cls = classes.find(c => c.id === s.classId);
            const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (s.id && s.id.includes(searchTerm)) || 
                                (s.saintName && s.saintName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchYear = selectedYear === 'all' || cls?.yearId === selectedYear;
            const matchGrade = selectedGrade === 'all' || cls?.gradeId === selectedGrade;
            const matchClass = selectedClass === 'all' || s.classId === selectedClass;
            
            return matchSearch && matchYear && matchGrade && matchClass;
        });
    }, [students, searchTerm, selectedYear, selectedGrade, selectedClass, classes]);

    const handleRestoreConfirm = () => {
        if (!restoreStudent || !restoreClass) return;
        
        const targetClass = classes.find(c => c.id === restoreClass);
        const isYearLocked = years.find(y => y.id === targetClass?.yearId)?.isLocked;
        if (isYearLocked) {
            toast.error("Niên khóa của lớp này đã bị khóa. Không thể khôi phục học viên vào niên khóa đã khóa!");
            return;
        }

        const updatedStudents = students.map(s => {
            if (s.id === restoreStudent.id) {
                return { ...s, status: 'ACTIVE' as const, classId: restoreClass, leaveReason: '', leaveYear: '' };
            }
            return s;
        });
        setStudents(updatedStudents);
        toast.success(`Đã khôi phục học viên ${restoreStudent.saintName} ${restoreStudent.fullName}`);
        setRestoreStudent(null);
        setRestoreClass('');
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-red-500" /> Danh sách học viên đã nghỉ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm tên, tên thánh, mã..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
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
                </div>
                <div>
                    <select 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={selectedGrade}
                        onChange={(e) => {
                            setSelectedGrade(e.target.value);
                            setSelectedClass('all');
                        }}
                    >
                        <option value="all">Tất cả khối</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div>
                    <select 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="all">Tất cả lớp học</option>
                        {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs uppercase text-slate-500 font-bold">
                            <th className="px-4 py-3">Học viên</th>
                            <th className="px-4 py-3">Ngày sinh</th>
                            <th className="px-4 py-3">Địa chỉ</th>
                            <th className="px-4 py-3">Lý do nghỉ</th>
                            <th className="px-4 py-3">Năm học nghỉ</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {droppedStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50 text-sm font-medium">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800">{student.saintName} {student.fullName}</div>
                                    <div className="text-xs text-slate-400">#{student.id}</div> 
                                </td>
                                <td className="px-4 py-3">{student.dob}</td>
                                <td className="px-4 py-3">{student.address || '--'}</td>
                                <td className="px-4 py-3 text-red-600">{student.leaveReason || '--'}</td>
                                <td className="px-4 py-3">{student.leaveYear || '--'}</td>
                                <td className="px-4 py-3">
                                    <button 
                                        onClick={() => setRestoreStudent(student)}
                                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg"
                                    >
                                        <RefreshCw size={14} /> Tiếp nhận lại
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Restore Modal */}
            {restoreStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="font-bold text-lg">Tiếp nhận lại: {restoreStudent.saintName} {restoreStudent.fullName}</h3>
                        <select className="w-full p-2 border rounded-lg" onChange={(e) => { setRestoreYear(e.target.value); setRestoreGrade(''); setRestoreClass(''); }}>
                            <option value="">Chọn năm học</option>
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                        <select className="w-full p-2 border rounded-lg" disabled={!restoreYear} onChange={(e) => { setRestoreGrade(e.target.value); setRestoreClass(''); }}>
                            <option value="">Chọn khối</option>
                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <select className="w-full p-2 border rounded-lg" disabled={!restoreGrade} onChange={(e) => setRestoreClass(e.target.value)}>
                            <option value="">Chọn lớp</option>
                            {classes.filter(c => c.yearId === restoreYear && c.gradeId === restoreGrade).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setRestoreStudent(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Hủy</button>
                            <button onClick={handleRestoreConfirm} disabled={!restoreClass} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
