
import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord, TermConfig, Teacher, CommunicationLog, ScoreColumn } from '../types';
import { Send, History, FileText, Bell, Search, CheckCircle2, AlertCircle, Clock, Users, User } from 'lucide-react';
import { toast } from 'sonner';

interface CommunicationProps {
    students: Student[];
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    records: AcademicRecord[];
    termConfigs: TermConfig[];
    scoreColumns: ScoreColumn[];
    currentUser: Teacher | null;
    logs: CommunicationLog[];
    setLogs: React.Dispatch<React.SetStateAction<CommunicationLog[]>>;
    resendApiKey: string;
}

export const Communication: React.FC<CommunicationProps> = ({ 
    students, classes, years, grades, records, termConfigs, scoreColumns, currentUser, logs, setLogs, resendApiKey
}) => {
    const [activeTab, setActiveTab] = useState<'notification' | 'transcript' | 'history'>('notification');
    const [selectedYear, setSelectedYear] = useState(years.find(y => y.isActive)?.id || '');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Notification state
    const [notifTitle, setNotifTitle] = useState('');
    const [notifContent, setNotifContent] = useState('');
    
    // Transcript state
    const [transcriptTerm, setTranscriptTerm] = useState<'HK1' | 'HK2' | 'YEAR'>('HK1');

    const isAdmin = currentUser?.role === 'ADMIN';

    const filteredClasses = useMemo(() => {
        const classesInYear = classes.filter(c => c.yearId === selectedYear);
        if (selectedGrade === 'all') return classesInYear;
        return classesInYear.filter(c => c.gradeId === selectedGrade);
    }, [classes, selectedYear, selectedGrade]);

    const classStudents = useMemo(() => {
        return students.filter(s => s.classId === selectedClass && s.status === 'ACTIVE');
    }, [students, selectedClass]);

    const filteredStudents = useMemo(() => {
        return classStudents.filter(s => 
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.id.includes(searchTerm)
        );
    }, [classStudents, searchTerm]);

    const handleToggleStudent = (id: string) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === classStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(classStudents.map(s => s.id));
        }
    };

    const sendEmail = async (to: string, subject: string, html: string) => {
        if (!resendApiKey) {
            throw new Error("Chưa cấu hình Resend API Key trong phần Cài đặt!");
        }

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: resendApiKey,
                to,
                subject,
                html
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Gửi email thất bại");
        }
        return result;
    };

    const handleSendNotification = async () => {
        if (!selectedClass) {
            toast.error("Vui lòng chọn lớp!");
            return;
        }
        if (selectedStudents.length === 0) {
            toast.error("Vui lòng chọn ít nhất một học viên!");
            return;
        }
        if (!notifTitle || !notifContent) {
            toast.error("Vui lòng nhập tiêu đề và nội dung!");
            return;
        }

        const loadingToast = toast.loading(`Đang gửi thông báo đến ${selectedStudents.length} học viên...`);
        let successCount = 0;
        let failCount = 0;

        for (const studentId of selectedStudents) {
            const student = students.find(s => s.id === studentId);
            if (!student?.email) {
                failCount++;
                continue;
            }

            try {
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #2563eb;">Thông báo từ Ban Giáo Lý</h2>
                        <p>Kính gửi Phụ huynh em <b>${student.saintName} ${student.fullName}</b>,</p>
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">${notifTitle}</h3>
                            <p style="white-space: pre-wrap;">${notifContent}</p>
                        </div>
                        <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                            Đây là email tự động từ hệ thống quản lý Giáo lý Gx. Tân Thành. Vui lòng không trả lời email này.
                        </p>
                    </div>
                `;
                await sendEmail(student.email, notifTitle, html);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`Failed to send to ${student.email}:`, error);
            }
        }

        const newLog: CommunicationLog = {
            id: `LOG-${Date.now()}`,
            type: 'NOTIFICATION',
            title: notifTitle,
            content: notifContent,
            recipients: selectedStudents,
            sentAt: new Date().toISOString(),
            senderId: currentUser?.id || 'unknown',
            status: failCount === 0 ? 'SUCCESS' : 'FAILED',
            error: failCount > 0 ? `Thất bại ${failCount}/${selectedStudents.length} học viên` : undefined
        };

        setLogs(prev => [newLog, ...prev]);
        toast.dismiss(loadingToast);
        
        if (successCount > 0) {
            toast.success(`Đã gửi thành công cho ${successCount} học viên!`);
            setNotifTitle('');
            setNotifContent('');
        }
        if (failCount > 0) {
            toast.error(`Gửi thất bại cho ${failCount} học viên (có thể do thiếu email hoặc lỗi API).`);
        }
    };

    const generateTranscriptHtml = (student: Student, term: 'HK1' | 'HK2' | 'YEAR') => {
        const studentRecords = records.filter(r => r.studentId === student.id);
        const yearName = years.find(y => y.id === selectedYear)?.name || '';
        const className = classes.find(c => c.id === selectedClass)?.name || '';

        let tableRows = '';
        
        if (term === 'HK1' || term === 'HK2') {
            const record = studentRecords.find(r => r.term === term);
            if (record) {
                tableRows = `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${term === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${record.average.toFixed(1)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${record.absentP}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${record.absentK}</td>
                    </tr>
                `;
            }
        } else {
            const r1 = studentRecords.find(r => r.term === 'HK1');
            const r2 = studentRecords.find(r => r.term === 'HK2');
            const avgYear = (r1 && r2) ? (r1.average + r2.average) / 2 : (r1?.average || r2?.average || 0);
            
            tableRows = `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">Học kỳ 1</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r1?.average.toFixed(1) || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r1?.absentP || 0}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r1?.absentK || 0}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">Học kỳ 2</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r2?.average.toFixed(1) || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r2?.absentP || 0}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r2?.absentK || 0}</td>
                </tr>
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td style="padding: 8px; border: 1px solid #ddd;">Cả năm</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${avgYear.toFixed(1)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(r1?.absentP || 0) + (r2?.absentP || 0)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(r1?.absentK || 0) + (r2?.absentK || 0)}</td>
                </tr>
            `;
        }

        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #2563eb; margin-bottom: 5px;">BẢNG ĐIỂM GIÁO LÝ</h2>
                    <p style="margin: 0; color: #64748b;">Năm học: ${yearName} | Lớp: ${className}</p>
                </div>
                
                <p>Kính gửi Phụ huynh em <b>${student.saintName} ${student.fullName}</b>,</p>
                <p>Ban Giáo Lý xin gửi đến quý phụ huynh kết quả học tập của em như sau:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Học kỳ</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Điểm TB</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Nghỉ P</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Nghỉ K</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: right;">
                    <p style="margin: 0; font-style: italic;">Ban Giáo Lý Gx. Tân Thành</p>
                </div>

                <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 40px;">
                    Đây là email tự động từ hệ thống quản lý Giáo lý. Vui lòng không trả lời email này.
                </p>
            </div>
        `;
    };

    const handleSendTranscript = async () => {
        if (!selectedClass) {
            toast.error("Vui lòng chọn lớp!");
            return;
        }
        if (selectedStudents.length === 0) {
            toast.error("Vui lòng chọn ít nhất một học viên!");
            return;
        }

        const termLabel = transcriptTerm === 'HK1' ? 'Học kỳ 1' : transcriptTerm === 'HK2' ? 'Học kỳ 2' : 'Cả năm';
        const loadingToast = toast.loading(`Đang gửi bảng điểm ${termLabel} đến ${selectedStudents.length} học viên...`);
        
        let successCount = 0;
        let failCount = 0;

        for (const studentId of selectedStudents) {
            const student = students.find(s => s.id === studentId);
            if (!student?.email) {
                failCount++;
                continue;
            }

            try {
                const html = generateTranscriptHtml(student, transcriptTerm);
                await sendEmail(student.email, `Bảng điểm ${termLabel} - ${student.saintName} ${student.fullName}`, html);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`Failed to send transcript to ${student.email}:`, error);
            }
        }

        const newLog: CommunicationLog = {
            id: `LOG-${Date.now()}`,
            type: 'TRANSCRIPT',
            title: `Bảng điểm ${termLabel}`,
            content: `Gửi bảng điểm ${termLabel} năm học ${years.find(y => y.id === selectedYear)?.name}`,
            recipients: selectedStudents,
            sentAt: new Date().toISOString(),
            senderId: currentUser?.id || 'unknown',
            status: failCount === 0 ? 'SUCCESS' : 'FAILED',
            error: failCount > 0 ? `Thất bại ${failCount}/${selectedStudents.length} học viên` : undefined,
            term: transcriptTerm
        };

        setLogs(prev => [newLog, ...prev]);
        toast.dismiss(loadingToast);

        if (successCount > 0) {
            toast.success(`Đã gửi bảng điểm thành công cho ${successCount} học viên!`);
        }
        if (failCount > 0) {
            toast.error(`Gửi thất bại cho ${failCount} học viên (có thể do thiếu email hoặc lỗi API).`);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Liên lạc & Thông báo</h1>
                    <p className="text-slate-500 text-sm">Gửi thông báo và bảng điểm qua Email cho phụ huynh/học viên</p>
                </div>
            </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-6 w-fit">
                    <button 
                        onClick={() => setActiveTab('notification')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notification' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Bell size={18} />
                        Gửi Thông báo
                    </button>
                    <button 
                        onClick={() => setActiveTab('transcript')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'transcript' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText size={18} />
                        Gửi Bảng điểm
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <History size={18} />
                        Lịch sử gửi
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Selection Panel (Only for sending) */}
                    {activeTab !== 'history' && (
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-blue-600" />
                                    Chọn đối tượng
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Năm học</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedYear}
                                            onChange={(e) => {
                                                setSelectedYear(e.target.value);
                                                setSelectedGrade('all');
                                                setSelectedClass('');
                                                setSelectedStudents([]);
                                            }}
                                        >
                                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Khối</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedGrade}
                                            onChange={(e) => {
                                                setSelectedGrade(e.target.value);
                                                setSelectedClass('');
                                                setSelectedStudents([]);
                                            }}
                                        >
                                            <option value="all">Tất cả khối</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lớp học</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedClass}
                                            onChange={(e) => {
                                                setSelectedClass(e.target.value);
                                                setSelectedStudents([]);
                                            }}
                                        >
                                            <option value="">-- Chọn lớp --</option>
                                            {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {selectedClass && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Học viên ({selectedStudents.length}/{classStudents.length})</span>
                                                <button 
                                                    onClick={handleSelectAll}
                                                    className="text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    {selectedStudents.length === classStudents.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                                </button>
                                            </div>

                                            <div className="relative mb-3">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    placeholder="Tìm học viên..."
                                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>

                                            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                {filteredStudents.map(s => (
                                                    <label 
                                                        key={s.id} 
                                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(s.id) ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <input 
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            checked={selectedStudents.includes(s.id)}
                                                            onChange={() => handleToggleStudent(s.id)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-slate-700 truncate flex items-center gap-2">
                                                                {s.fullName}
                                                                {s.email ? (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Đã có email"></span>
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Chưa có email"></span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">{s.id} {s.email ? `• ${s.email}` : '• Chưa có email'}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                                {filteredStudents.length === 0 && (
                                                    <div className="text-center py-4 text-xs text-slate-400 italic">Không tìm thấy học viên</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Panel */}
                    <div className={`${activeTab === 'history' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                        {activeTab === 'notification' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Bell size={20} className="text-blue-600" />
                                    Nội dung thông báo
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề thông báo</label>
                                        <input 
                                            type="text"
                                            placeholder="VD: Thông báo nghỉ học Chúa Nhật tuần này"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                                            value={notifTitle}
                                            onChange={(e) => setNotifTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung chi tiết</label>
                                        <textarea 
                                            rows={8}
                                            placeholder="Nhập nội dung thông báo gửi đến phụ huynh..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm resize-none"
                                            value={notifContent}
                                            onChange={(e) => setNotifContent(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button 
                                            onClick={handleSendNotification}
                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform active:scale-95"
                                        >
                                            <Send size={18} />
                                            Gửi Thông báo ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'transcript' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600" />
                                    Cấu hình gửi bảng điểm
                                </h3>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-4">Chọn học kỳ cần gửi</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {(['HK1', 'HK2', 'YEAR'] as const).map(term => (
                                                <button 
                                                    key={term}
                                                    onClick={() => setTranscriptTerm(term)}
                                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${transcriptTerm === term ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transcriptTerm === term ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                        {term === 'YEAR' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <span className="font-bold text-sm">
                                                        {term === 'HK1' ? 'Học kỳ 1' : term === 'HK2' ? 'Học kỳ 2' : 'Cả năm'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            Lưu ý
                                        </h4>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Hệ thống sẽ tự động tổng hợp điểm số từ cơ sở dữ liệu và tạo bảng điểm PDF đính kèm trong email gửi đến phụ huynh. Vui lòng đảm bảo tất cả điểm số đã được nhập đầy đủ trước khi gửi.
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button 
                                            onClick={handleSendTranscript}
                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform active:scale-95"
                                        >
                                            <Send size={18} />
                                            Gửi Bảng điểm ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <History size={20} className="text-blue-600" />
                                        Lịch sử gửi thông báo & bảng điểm
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">Thời gian</th>
                                                <th className="px-6 py-4">Loại</th>
                                                <th className="px-6 py-4">Tiêu đề</th>
                                                <th className="px-6 py-4">Người nhận</th>
                                                <th className="px-6 py-4">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {logs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {new Date(log.sentAt).toLocaleString('vi-VN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${log.type === 'NOTIFICATION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {log.type === 'NOTIFICATION' ? 'THÔNG BÁO' : 'BẢNG ĐIỂM'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-slate-800">{log.title}</div>
                                                        {log.term && <div className="text-[10px] text-slate-400">{log.term}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                            <User size={12} className="text-slate-400" />
                                                            {log.recipients.length} học viên
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${log.status === 'SUCCESS' ? 'text-green-600' : 'text-rose-600'}`}>
                                                            {log.status === 'SUCCESS' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                            {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                        Chưa có lịch sử gửi nào
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};
