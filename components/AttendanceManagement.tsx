
import React, { useState } from 'react';
import { Attendance } from './Attendance';
import { QRAttendance } from './QRAttendance';
import { AttendanceReport } from './AttendanceReport';
import { Student, ClassRoom, SchoolYear, Grade, AcademicRecord, TermConfig, Teacher, AttendanceConfig } from '../types';
import { CalendarCheck, QrCode, ClipboardList } from 'lucide-react';

interface AttendanceManagementProps {
    students: Student[];
    classes: ClassRoom[];
    years: SchoolYear[];
    grades: Grade[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    termConfigs: TermConfig[];
    currentUser: Teacher | null;
    attendanceConfig: AttendanceConfig;
    attendanceData: Record<string, 'C' | 'P' | 'K' | ''>;
    setAttendanceData: React.Dispatch<React.SetStateAction<Record<string, 'C' | 'P' | 'K' | ''>>>;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'attendance' | 'qr' | 'report'>('attendance');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Unified Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-800">Quản lý chuyên cần</h2>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                    <button 
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CalendarCheck size={18} /> Điểm danh
                    </button>
                    <button 
                        onClick={() => setActiveTab('qr')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <QrCode size={18} /> Điểm danh QR
                    </button>
                    <button 
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardList size={18} /> Báo cáo
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {activeTab === 'attendance' ? (
                    <Attendance {...props} />
                ) : activeTab === 'qr' ? (
                    <QRAttendance {...props} />
                ) : (
                    <AttendanceReport {...props} />
                )}
            </div>
        </div>
    );
};
