
import React, { useState, useMemo } from 'react';
import { Search, User, Users, CheckCircle2, AlertCircle, ArrowRight, Trash2, Merge } from 'lucide-react';
import { Student, AcademicRecord } from '../types';
import { toast } from 'sonner';

interface DuplicateMergeTabProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    records: AcademicRecord[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
}

type Criteria = 'NAME_DOB_PARENTS' | 'NAME_DOB_FATHER' | 'NAME_DOB_MOTHER' | 'NAME_DOB' | 'NAME';

export const DuplicateMergeTab: React.FC<DuplicateMergeTabProps> = ({ students, setStudents, records, setRecords }) => {
    const [criteria, setCriteria] = useState<Criteria>('NAME_DOB');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [masterId, setMasterId] = useState<string | null>(null);

    const duplicateGroups = useMemo(() => {
        const groups: { [key: string]: Student[] } = {};

        students.forEach(s => {
            let key = '';
            const name = s.fullName.trim().toLowerCase();
            const dob = s.dob || '';
            const father = (s.fatherName || '').trim().toLowerCase();
            const mother = (s.motherName || '').trim().toLowerCase();

            switch (criteria) {
                case 'NAME_DOB_PARENTS':
                    key = `${name}|${dob}|${father}|${mother}`;
                    break;
                case 'NAME_DOB_FATHER':
                    key = `${name}|${dob}|${father}`;
                    break;
                case 'NAME_DOB_MOTHER':
                    key = `${name}|${dob}|${mother}`;
                    break;
                case 'NAME_DOB':
                    key = `${name}|${dob}`;
                    break;
                case 'NAME':
                    key = name;
                    break;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });

        // Filter only groups with more than 1 student
        return Object.entries(groups)
            .filter(([_, list]) => list.length > 1)
            .map(([key, list]) => ({ key, list }));
    }, [students, criteria]);

    const handleMerge = () => {
        if (!selectedGroup || !masterId) return;

        const group = duplicateGroups.find(g => g.key === selectedGroup);
        if (!group) return;

        const master = group.list.find(s => s.id === masterId);
        if (!master) return;

        const others = group.list.filter(s => s.id !== masterId);
        const otherIds = others.map(s => s.id);

        // 1. Update master student with missing info from others
        const updatedMaster = { ...master };
        others.forEach(other => {
            // Fill missing fields
            if (!updatedMaster.fatherName) updatedMaster.fatherName = other.fatherName;
            if (!updatedMaster.motherName) updatedMaster.motherName = other.motherName;
            if (!updatedMaster.fatherPhone) updatedMaster.fatherPhone = other.fatherPhone;
            if (!updatedMaster.motherPhone) updatedMaster.motherPhone = other.motherPhone;
            if (!updatedMaster.address) updatedMaster.address = other.address;
            if (!updatedMaster.baptismDate) updatedMaster.baptismDate = other.baptismDate;
            if (!updatedMaster.baptismPlace) updatedMaster.baptismPlace = other.baptismPlace;
            if (!updatedMaster.eucharistDate) updatedMaster.eucharistDate = other.eucharistDate;
            if (!updatedMaster.eucharistPlace) updatedMaster.eucharistPlace = other.eucharistPlace;
            if (!updatedMaster.confirmationDate) updatedMaster.confirmationDate = other.confirmationDate;
            if (!updatedMaster.confirmationPlace) updatedMaster.confirmationPlace = other.confirmationPlace;
            if (!updatedMaster.note) updatedMaster.note = (updatedMaster.note || '') + (other.note ? ' | ' + other.note : '');
        });

        // 2. Update students list
        setStudents(prev => {
            const filtered = prev.filter(s => !otherIds.includes(s.id));
            return filtered.map(s => s.id === masterId ? updatedMaster : s);
        });

        // 3. Update academic records
        setRecords(prev => prev.map(r => {
            if (otherIds.includes(r.studentId)) {
                return { ...r, studentId: masterId };
            }
            return r;
        }));

        toast.success(`Đã gộp ${others.length} học viên vào ${master.fullName}`);
        setSelectedGroup(null);
        setMasterId(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 bg-white border-b border-slate-200 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 mb-4">Kiểm tra và gộp trùng dữ liệu</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu chí kiểm tra</label>
                        <select 
                            className="w-full p-3 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
                            value={criteria}
                            onChange={(e) => {
                                setCriteria(e.target.value as Criteria);
                                setSelectedGroup(null);
                                setMasterId(null);
                            }}
                        >
                            <option value="NAME_DOB_PARENTS">Họ tên + Ngày sinh + Cha & Mẹ</option>
                            <option value="NAME_DOB_FATHER">Họ tên + Ngày sinh + Cha</option>
                            <option value="NAME_DOB_MOTHER">Họ tên + Ngày sinh + Mẹ</option>
                            <option value="NAME_DOB">Họ tên + Ngày sinh</option>
                            <option value="NAME">Họ tên</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-700">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">Tìm thấy <span className="font-bold">{duplicateGroups.length}</span> nhóm học viên có khả năng bị trùng lặp.</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Groups List */}
                <div className="w-full md:w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
                    {duplicateGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-8 text-center">
                            <CheckCircle2 size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">Không tìm thấy dữ liệu trùng lặp theo tiêu chí này.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {duplicateGroups.map((group) => (
                                <button
                                    key={group.key}
                                    onClick={() => {
                                        setSelectedGroup(group.key);
                                        setMasterId(group.list[0].id);
                                    }}
                                    className={`w-full p-4 text-left hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedGroup === group.key ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                                >
                                    <div>
                                        <p className="font-bold text-slate-800">{group.list[0].fullName}</p>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {group.list.length} bản ghi trùng lặp
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-300 group-hover:text-slate-600 transition-all ${selectedGroup === group.key ? 'text-blue-600 translate-x-1' : ''}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Group Details & Merge Action */}
                <div className="flex-1 bg-slate-50 overflow-y-auto p-6">
                    {selectedGroup ? (
                        <div className="w-full space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Users size={18} /> Chi tiết nhóm trùng lặp
                                    </h3>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {duplicateGroups.find(g => g.key === selectedGroup)?.list.length} Học viên
                                    </span>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-slate-500 font-medium italic">
                                        * Chọn học viên "Chính" (Master) để giữ lại. Các học viên khác sẽ bị xóa và dữ liệu học tập sẽ được chuyển sang học viên chính.
                                    </p>

                                    <div className="space-y-3">
                                        {duplicateGroups.find(g => g.key === selectedGroup)?.list.map((student) => (
                                            <div 
                                                key={student.id}
                                                onClick={() => setMasterId(student.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${masterId === student.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${masterId === student.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                                    {masterId === student.id && <CheckCircle2 size={14} />}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Họ và tên</p>
                                                        <p className="font-bold text-slate-800">{student.saintName} {student.fullName}</p>
                                                        <p className="text-xs text-slate-500">Mã: {student.id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ngày sinh / Giới tính</p>
                                                        <p className="font-bold text-slate-700">{student.dob || 'N/A'}</p>
                                                        <p className="text-xs text-slate-500">{student.gender === 'Male' ? 'Nam' : 'Nữ'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Cha / Mẹ</p>
                                                        <p className="font-bold text-slate-700">{student.fatherName || 'N/A'}</p>
                                                        <p className="font-bold text-slate-700">{student.motherName || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-2">Học lực Giáo lý</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className="text-slate-500 font-bold uppercase text-[10px]">
                                                                <tr>
                                                                    <th className="text-left py-1">Niên khóa</th>
                                                                    <th className="text-left py-1">Lớp</th>
                                                                    <th className="text-center py-1">TBHKI</th>
                                                                    <th className="text-center py-1">TBHKII</th>
                                                                    <th className="text-center py-1">TB Cả năm</th>
                                                                    <th className="text-left py-1">Kết quả</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {records.filter(r => r.studentId === student.id).map((r, index) => (
                                                                    <tr key={`${student.id}-${r.id || index}`}>
                                                                        <td className="py-1 font-bold text-slate-700">{r.yearId}</td>
                                                                        <td className="py-1 font-bold text-slate-700">{r.classId}</td>
                                                                        <td className="py-1 text-center font-mono">{r.scoreHK1 || '-'}</td>
                                                                        <td className="py-1 text-center font-mono">{r.scoreHK2 || '-'}</td>
                                                                        <td className="py-1 text-center font-bold text-blue-600 font-mono">{r.average || '-'}</td>
                                                                        <td className="py-1 font-bold text-slate-700">{r.result || '...'}</td>
                                                                    </tr>
                                                                ))}
                                                                {records.filter(r => r.studentId === student.id).length === 0 && (
                                                                    <tr key={`no-records-${student.id}`}>
                                                                        <td colSpan={6} className="py-2 text-center text-slate-400 italic">Chưa có điểm</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                                    <button
                                        onClick={handleMerge}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                        disabled={!masterId}
                                    >
                                        <Merge size={20} /> Thực hiện gộp dữ liệu
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Merge size={64} className="mb-4 opacity-10" />
                            <p className="font-bold">Chọn một nhóm bên trái để xem chi tiết và gộp trùng.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
