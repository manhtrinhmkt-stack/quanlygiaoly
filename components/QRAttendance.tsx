
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, ClassRoom, SchoolYear, Grade, Teacher, AcademicRecord, TermConfig, AttendanceConfig } from '../types';
import { QrCode, Camera, Printer, Save, Search, X, CheckCircle2, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';

const normalizeName = (str: string) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
};

interface QRAttendanceProps {
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

export const QRAttendance: React.FC<QRAttendanceProps> = ({ 
    students, classes, years, grades, setRecords, termConfigs, currentUser, attendanceConfig, attendanceData, setAttendanceData
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'scan' | 'manage'>('scan');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceType, setAttendanceType] = useState<'mass' | 'class'>('class');
    
    /* (Inside JSX render, scan mode) */
    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner mb-4">
        <button 
            onClick={() => setAttendanceType('mass')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${attendanceType === 'mass' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
            LỄ (MASS)
        </button>
        <button 
            onClick={() => setAttendanceType('class')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${attendanceType === 'class' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
            HỌC (CLASS)
        </button>
    </div>
    
    // Scanning state
    const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const isAdmin = currentUser?.role === 'ADMIN';

    // Initial Logic for year selection
    useEffect(() => {
        const active = years.find(y => y.isActive);
        const activeYearId = active ? active.id : (years[0]?.id || '');
        setSelectedYear(activeYearId);
    }, [years]);

    const classesInYear = useMemo(() => {
        if (!currentUser) return [];
        const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
        return classes.filter(c => {
            const isYearMatch = c.yearId === selectedYear;
            if (!isYearMatch) return false;
            if (isAdmin) return true;
            return (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
                   (c.assistants && c.assistants.includes(teacherName));
        });
    }, [classes, selectedYear, currentUser, isAdmin]);

    const availableClasses = useMemo(() => {
        if (selectedGrade === 'all') return classesInYear;
        return classesInYear.filter(c => c.gradeId === selectedGrade);
    }, [classesInYear, selectedGrade]);

    useEffect(() => {
        if (availableClasses.length > 0 && !availableClasses.find(c => c.id === selectedClass)) {
            setSelectedClass(availableClasses[0].id);
        } else if (availableClasses.length === 0) {
            setSelectedClass('');
        }
    }, [availableClasses, selectedClass]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.classId === selectedClass && s.status === 'ACTIVE');
    }, [students, selectedClass]);

    // Scanner Logic
    useEffect(() => {
        if (activeSubTab === 'scan' && isScanning) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;

            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                }
            };
        }
    }, [activeSubTab, isScanning]);

    function onScanSuccess(decodedText: string) {
        // Format: ID_Name
        const parts = decodedText.split('_');
        const studentId = parts[0];

        const student = students.find(s => s.id === studentId);
        if (student) {
            if (student.classId !== selectedClass && selectedClass !== '') {
                toast.warning(`Học viên ${student.saintName} ${student.fullName} không thuộc lớp này!`);
            }
            
            if (!scannedIds.has(studentId)) {
                setScannedIds(prev => new Set(prev).add(studentId));
                toast.success(`Đã quét: ${student.saintName} ${student.fullName}`);
                
                // Play sound if possible
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
                audio.play().catch(() => {});
            }
        } else {
            toast.error("Mã QR không hợp lệ hoặc không tìm thấy học viên!");
        }
    }

    function onScanFailure(error: any) {
        // Silently ignore scan failures
    }

    const handleBulkSubmit = () => {
        if (scannedIds.size === 0) {
            toast.error("Chưa có học viên nào được quét!");
            return;
        }

        const dateStr = selectedDate;
        const type = attendanceType;

        // Update shared attendance data
        setAttendanceData(prev => {
            const newData = { ...prev };
            scannedIds.forEach(id => {
                const key = `${id}-${dateStr}-${type}`;
                newData[key] = 'C'; // Mark as Present (Có)
            });
            return newData;
        });

        toast.success(`Đã đồng bộ điểm danh cho ${scannedIds.size} học viên lớp ${classes.find(c => c.id === selectedClass)?.name}`);
        setScannedIds(new Set());
        setIsScanning(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-6 h-screen flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
                        <QrCode size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Điểm danh QR</h2>
                </div>
                
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button 
                        onClick={() => setActiveSubTab('scan')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'scan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Camera size={18} /> Quét mã
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('manage')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'manage' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <QrCode size={18} /> Quản lý QR
                    </button>
                </div>
            </div>

            {activeSubTab === 'scan' ? (
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden no-print">
                    {/* Left: Scanner */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center relative">
                        {!isScanning ? (
                            <div className="text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Camera size={48} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Sẵn sàng quét mã</h3>
                                <p className="text-slate-500 text-sm mb-6">Chọn lớp và nhấn nút bên dưới để bắt đầu</p>
                                
                                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                                    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                                        <button 
                                            onClick={() => setAttendanceType('mass')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${attendanceType === 'mass' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Lễ
                                        </button>
                                        <button 
                                            onClick={() => setAttendanceType('class')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${attendanceType === 'class' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Học
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-left">

                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Niên khóa</label>

                                        <select 

                                            className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs"

                                            value={selectedYear}

                                            onChange={(e) => {

                                                setSelectedYear(e.target.value);

                                                setSelectedGrade('all');

                                                setSelectedClass('');

                                            }}

                                        >

                                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}

                                        </select>

                                        

                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Khối</label>

                                        <select 

                                            className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs"

                                            value={selectedGrade}

                                            onChange={(e) => {

                                                setSelectedGrade(e.target.value);

                                                setSelectedClass('');

                                            }}

                                        >

                                            <option value="all">Tất cả khối</option>

                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}

                                        </select>

                                        

                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lớp</label>


                                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">


                                            <div className="flex flex-col gap-1.5">


                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Niên khóa</label>


                                                <select 


                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs"


                                                    value={selectedYear}


                                                    onChange={(e) => {


                                                        setSelectedYear(e.target.value);


                                                        setSelectedGrade('all');


                                                        setSelectedClass('');


                                                    }}


                                                >


                                                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}


                                                </select>


                                            </div>


                                            


                                            <div className="flex flex-col gap-1.5">


                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Khối</label>


                                                <select 


                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs"


                                                    value={selectedGrade}


                                                    onChange={(e) => {


                                                        setSelectedGrade(e.target.value);


                                                        setSelectedClass('');


                                                    }}


                                                >


                                                    <option value="all">Tất cả khối</option>


                                                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}


                                                </select>


                                            </div>


                                            


                                            <div className="flex flex-col gap-1.5">


                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lớp</label>


                                                <select 


                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-xs min-w-[120px]"


                                                    value={selectedClass}


                                                    onChange={(e) => setSelectedClass(e.target.value)}


                                                >


                                                    <option value="">-- Chọn lớp --</option>


                                                    {availableClasses.map(c => (


                                                        <option key={c.id} value={c.id}>{c.name}</option>


                                                    ))}


                                                </select>


                                            </div>


                                        </div>

                                    </div>
                                    
                                    <button 
                                        onClick={() => setIsScanning(true)}
                                        disabled={!selectedClass}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Bắt đầu quét
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center">
                                <div id="reader" className="w-full max-w-md border-4 border-blue-600 rounded-2xl overflow-hidden shadow-2xl"></div>
                                <button 
                                    onClick={() => setIsScanning(false)}
                                    className="mt-6 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold shadow-md hover:bg-rose-600 transition-all"
                                >
                                    Dừng quét
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Scanned List */}
                    <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-green-600" />
                                Đã quét ({scannedIds.size})
                            </h3>
                            <button 
                                onClick={() => setScannedIds(new Set())}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Xóa danh sách"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {Array.from(scannedIds).map(id => {
                                const student = students.find(s => s.id === id);
                                return (
                                    <div key={id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-slide-in">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-600 shadow-sm border border-slate-200">
                                            {student?.saintName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-800 text-sm truncate">{student?.saintName} {student?.fullName}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{id}</div>
                                        </div>
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    </div>
                                );
                            })}
                            {scannedIds.size === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                    <RefreshCw size={32} className="mb-2 opacity-20 animate-spin-slow" />
                                    <p className="text-xs font-bold">Đang chờ quét...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleBulkSubmit}
                                disabled={scannedIds.size === 0}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                            >
                                <Save size={18} /> Gửi dữ liệu ({scannedIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <select 
                                className="p-2.5 bg-white border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">-- Chọn lớp --</option>
                                {classesInYear.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={handlePrint}
                                disabled={!selectedClass}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold shadow-md hover:bg-slate-900 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                            >
                                <Printer size={18} /> In tất cả mã QR
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {selectedClass ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 print:grid-cols-4 print:gap-4">
                                {filteredStudents.map(s => {
                                    const qrValue = `${s.id}_${normalizeName(s.fullName)}`;
                                    return (
                                        <div key={s.id} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-md transition-all group relative print:bg-white print:border-slate-300 print:p-2">
                                            <div className="bg-white p-3 rounded-xl shadow-sm mb-3 group-hover:scale-105 transition-transform print:shadow-none print:p-1">
                                                <QRCodeSVG value={qrValue} size={100} level="H" />
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-slate-800 text-xs mb-0.5 truncate max-w-[120px]">{s.saintName} {s.fullName}</div>
                                                <div className="text-[10px] font-bold text-slate-400">{s.id}</div>
                                            </div>
                                            
                                            {/* Print Label Overlay (Hidden on screen, visible on print) */}
                                            <div className="hidden print:block text-[8px] mt-1 font-bold text-center">
                                                {classes.find(c => c.id === s.classId)?.name}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <QrCode size={64} className="mb-4 opacity-10" />
                                <p className="font-bold">Vui lòng chọn lớp để xem mã QR</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .h-screen { height: auto !important; }
                    .p-4, .p-6 { padding: 0 !important; }
                    .overflow-hidden { overflow: visible !important; }
                    .bg-slate-50 { background: white !important; }
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl { shadow: none !important; }
                    .border { border: 1px solid #e2e8f0 !important; }
                }
                @keyframes slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
                .animate-spin-slow { animation: spin 3s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
