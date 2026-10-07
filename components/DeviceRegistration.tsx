
import React, { useState, useMemo, useEffect } from 'react';
import { DeviceRequest, Teacher, InventoryItem, DeviceConfig } from '../types';
import { MonitorPlay, Plus, X, Clock, RotateCcw, Calendar, Search, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Lock, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceRegistrationProps {
    requests: DeviceRequest[];
    setRequests: React.Dispatch<React.SetStateAction<DeviceRequest[]>>;
    currentUser: Teacher | null;
    inventory: InventoryItem[];
    config: DeviceConfig;
}

const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
};

export const DeviceRegistration: React.FC<DeviceRegistrationProps> = ({ requests, setRequests, currentUser, inventory, config }) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR');
    const [monthOffset, setMonthOffset] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';

    // Form State
    const [inputDeviceName, setInputDeviceName] = useState('');
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputPurpose, setInputPurpose] = useState('');

    // Check time logic
    const isRegistrationOpen = useMemo(() => {
        if (isAdmin) return true; // Admin always allowed
        if (!config.openTime || !config.closeTime) return true;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Check date range if configured
        if (config.startDate && todayStr < config.startDate) return false;
        if (config.endDate && todayStr > config.endDate) return false;

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [openH, openM] = config.openTime.split(':').map(Number);
        const [closeH, closeM] = config.closeTime.split(':').map(Number);
        
        const startMinutes = openH * 60 + openM;
        const endMinutes = closeH * 60 + closeM;

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }, [config, isAdmin]);

    // Filter requests
    const filteredRequests = useMemo(() => {
        let list = requests;
        
        // List view for GLV: show own. Calendar shows all (anonymized/public view)
        if (!isAdmin && currentUser && viewMode === 'LIST') {
            list = list.filter(r => r.teacherId === currentUser.id);
        }

        if (filterStatus !== 'all' && viewMode === 'LIST') {
            list = list.filter(r => r.status === filterStatus);
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(r => 
                r.deviceName.toLowerCase().includes(lowerSearch) || 
                r.teacherName.toLowerCase().includes(lowerSearch) ||
                r.purpose.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort by date desc
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [requests, isAdmin, currentUser, filterStatus, searchTerm, viewMode]);

    const normalizeName = (name: string) => {
        return name.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    const currentConflict = useMemo(() => {
        if (!inputDeviceName || !inputDate) return null;
        const normalizedInput = normalizeName(inputDeviceName);
        const conflicts = requests.filter(r => 
            normalizeName(r.deviceName) === normalizedInput && 
            r.date === inputDate && 
            r.status === 'BORROWED'
        );
        
        // Enforce all devices to have a limit of exactly 1
        const totalQty = 1;
        
        if (conflicts.length >= totalQty) {
            return {
                bookedBy: conflicts.map(r => r.teacherName).join(', '),
                maxQty: totalQty,
                isConflict: true
            };
        }
        
        return null;
    }, [inputDeviceName, inputDate, requests, inventory]);

    const handleRegister = () => {
        if (!isRegistrationOpen) {
            return toast.error(`Cổng đăng ký đang đóng.`);
        }
        if (!inputDeviceName || !inputPurpose) return toast.error("Vui lòng điền đầy đủ thông tin");
        if (!currentUser) return;

        const normalizedInput = normalizeName(inputDeviceName);
        
        // Final check before state update
        const conflictingRequests = requests.filter(r => 
            normalizeName(r.deviceName) === normalizedInput && 
            r.date === inputDate && 
            r.status === 'BORROWED'
        );

        // Enforce limit of exactly 1 for all devices
        const totalQty = 1;

        if (conflictingRequests.length >= totalQty) {
            const bookedBy = conflictingRequests.map(r => r.teacherName).join(', ');
            return toast.error(`TRÙNG LỊCH: "${inputDeviceName}" đã được đăng ký trong ngày ${safeFormatDate(inputDate)}.\nNgười đang giữ: ${bookedBy}`, { 
                duration: 6000,
                style: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
            });
        }

        const newRequest: DeviceRequest = {
            id: `DR${Date.now()}`,
            teacherId: currentUser.id,
            teacherName: `${currentUser.saintName} ${currentUser.fullName}`,
            deviceName: inputDeviceName,
            date: inputDate,
            purpose: inputPurpose,
            status: 'BORROWED' // Auto borrowed, no approval needed
        };

        setRequests([newRequest, ...requests]);
        toast.success("Đăng ký thành công!");
        setShowModal(false);
        // Reset form
        setInputDeviceName('');
        setInputPurpose('');
    };

    const handleReturn = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'RETURNED' } : r));
        toast.success('Đã xác nhận trả thiết bị!');
    };

    const handleCancel = (id: string) => {
        setRequests(prev => prev.filter(r => r.id !== id));
        toast.success(' Đã hủy đăng ký mượn thiết bị!');
    };

    const getStatusBadge = (status: DeviceRequest['status']) => {
        switch (status) {
            case 'BORROWED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1"><Clock size={12}/> Đang mượn</span>;
            case 'RETURNED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1"><CheckCircle2 size={12}/> Đã trả</span>;
        }
    };

    // Filter "Device" type items from inventory for the dropdown
    const availableDevices = useMemo(() => {
        // Assume 'OTHER' category contains devices or suggest commonly used ones
        const inventoryDevices = inventory.filter(i => i.category === 'OTHER' || i.name.toLowerCase().includes('máy') || i.name.toLowerCase().includes('loa') || i.name.toLowerCase().includes('mic'));
        // Add some defaults if inventory is empty of devices
        const defaults = ['Máy chiếu', 'Loa kéo', 'Micro', 'Laptop', 'Dây HDMI', 'Ổ cắm điện'];
        // Merge unique names
        const names = new Set([...inventoryDevices.map(i => i.name), ...defaults]);
        return Array.from(names);
    }, [inventory]);

    // Get only Sundays for the specific month
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        
        // Add padding for start of month (assuming Monday is start of week)
        // However, standard Vietnamese calendar often shows Sunday (CN) first.
        // Let's use Sunday as first day for simplicity with JS getDay()
        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const renderCalendar = (offset: number) => {
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        const days = getDaysInMonth(year, month);
        const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        return (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-full">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-center text-slate-800 uppercase tracking-wider text-sm sticky top-0 z-10">
                    Tháng {month + 1}/{year}
                </div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {weekdayLabels.map(label => (
                        <div key={label} className={`py-2 text-center text-[10px] font-black tracking-tighter ${label === 'CN' ? 'text-rose-500' : 'text-slate-400'}`}>
                            {label}
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 grid grid-cols-7">
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/50 border-[0.5px] border-slate-100 h-24 md:h-32"></div>;
                        
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const dailyRequests = requests.filter(r => r.date === dateStr && r.status === 'BORROWED');
                        const isToday = date.toDateString() === today.toDateString();
                        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                        return (
                            <div 
                                key={dateStr} 
                                onClick={() => {
                                    if (isRegistrationOpen) {
                                        setInputDate(dateStr);
                                        setShowModal(true);
                                    } else {
                                        toast.warning(`Cổng đăng ký đang đóng.`);
                                    }
                                }}
                                className={`border-[0.5px] border-slate-100 h-24 md:h-32 p-1.5 relative group cursor-pointer transition-all hover:bg-white hover:z-10 hover:shadow-md ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}
                            >
                                <span className={`text-[11px] font-black flex items-center justify-center w-5 h-5 rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : date.getDay() === 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                                    {date.getDate()}
                                </span>
                                
                                <div className="space-y-0.5 overflow-hidden">
                                    {dailyRequests.slice(0, 3).map(r => (
                                        <div key={r.id} className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 rounded px-1 py-0.5 truncate leading-tight" title={`${r.deviceName} - ${r.teacherName}`}>
                                            <span className="font-bold">{r.deviceName}</span>
                                        </div>
                                    ))}
                                    {dailyRequests.length > 3 && (
                                        <div className="text-[9px] text-slate-400 font-bold pl-1">+{dailyRequests.length - 3} thiết bị</div>
                                    )}
                                </div>

                                {isRegistrationOpen && !isPast && (
                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                            <Plus size={10} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleExportExcel = () => {
        const headers = ["ID", "Người mượn", "Thiết bị", "Ngày", "Mục đích", "Trạng thái"];
        const rows = filteredRequests.map(r => [r.id, r.teacherName, r.deviceName, r.date, `"${r.purpose}"`, r.status === 'BORROWED' ? 'Đang mượn' : 'Đã trả']);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "danh_sach_dang_ky_thiet_bi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-50">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><MonitorPlay className="text-blue-600"/> Đăng Ký Thiết Bị</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isRegistrationOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {isRegistrationOpen ? (
                                <span className="text-green-700">Cổng đang mở</span> 
                            ) : (
                                <span className="text-red-700">Cổng đang đóng</span>
                            )}
                            <span className="opacity-70 ml-1">({config.openTime} - {config.closeTime})</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-sm font-bold"><FileSpreadsheet size={18} /> Xuất Excel</button>
                    <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
                        <button onClick={() => setViewMode('CALENDAR')} className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar size={16}/></button>
                        <button onClick={() => setViewMode('LIST')} className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><Clock size={16}/></button>
                    </div>
                    <button 
                        onClick={() => {
                            if (isRegistrationOpen) setShowModal(true);
                            else toast.warning(`Cổng đăng ký đang đóng.\nThời gian mở: ${config.openTime} - ${config.closeTime}\nNgày: ${config.startDate || '...'} đến ${config.endDate || '...'}`);
                        }} 
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md font-bold text-sm transition-all active:scale-95 ${isRegistrationOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}
                    >
                        {isRegistrationOpen ? <Plus size={18} /> : <Lock size={18}/>} Đăng Ký
                    </button>
                </div>
            </div>

            {viewMode === 'LIST' && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm theo thiết bị, người mượn..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {['all', 'BORROWED', 'RETURNED'].map(st => (
                            <button 
                                key={st}
                                onClick={() => setFilterStatus(st)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${filterStatus === st ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {st === 'all' ? 'Tất cả' : st === 'BORROWED' ? 'Đang mượn' : 'Đã trả'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
                
                {viewMode === 'CALENDAR' ? (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                            <button onClick={() => setMonthOffset(prev => prev - 1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"><ChevronLeft size={20}/></button>
                            <button onClick={() => setMonthOffset(0)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-100">Tháng hiện tại</button>
                            <button onClick={() => setMonthOffset(prev => prev + 1)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"><ChevronRight size={20}/></button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
                            {renderCalendar(monthOffset)}
                            {renderCalendar(monthOffset + 1)}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                        {/* Mobile View */}
                        <div className="md:hidden overflow-y-auto h-full p-4 space-y-3">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map(r => (
                                    <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 text-lg">{r.deviceName}</h4>
                                            {getStatusBadge(r.status)}
                                        </div>
                                        <div className="text-sm text-slate-600 mb-1 font-medium"><span className="text-slate-400">Người mượn:</span> {r.teacherName}</div>
                                        <div className="text-sm text-slate-600 mb-1 flex items-center gap-2">
                                            <Calendar size={14}/> {safeFormatDate(r.date)}
                                        </div>
                                        <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded mt-2">"{r.purpose}"</div>
                                        
                                        {isAdmin && r.status === 'BORROWED' && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                                <button onClick={() => handleReturn(r.id)} className="flex-1 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-100">Xác nhận trả</button>
                                                <button onClick={() => handleCancel(r.id)} className="flex-1 py-2 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs hover:bg-rose-100">Hủy mượn</button>
                                            </div>
                                        )}
                                        {!isAdmin && r.teacherId === currentUser?.id && r.status === 'BORROWED' && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                                <button onClick={() => handleCancel(r.id)} className="flex-1 py-2 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs hover:bg-rose-100">Hủy mượn</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 py-10 italic">Không có dữ liệu</div>
                            )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3">Thiết Bị</th>
                                        <th className="px-4 py-3">Người Mượn</th>
                                        <th className="px-4 py-3">Ngày Mượn</th>
                                        <th className="px-4 py-3">Mục Đích</th>
                                        <th className="px-4 py-3 text-center">Trạng Thái</th>
                                        <th className="px-4 py-3 text-center">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-800">{r.deviceName}</td>
                                                <td className="px-4 py-3 text-slate-600">{r.teacherName}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-700">{safeFormatDate(r.date)}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={r.purpose}>{r.purpose}</td>
                                                <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {r.status === 'BORROWED' && (isAdmin || r.teacherId === currentUser?.id) ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isAdmin && (
                                                                <button onClick={() => handleReturn(r.id)} className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Xác nhận trả"><RotateCcw size={16}/></button>
                                                            )}
                                                            <button onClick={() => handleCancel(r.id)} className="p-1.5 bg-rose-100 text-rose-700 rounded hover:bg-rose-200" title="Hủy mượn"><X size={16}/></button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Không tìm thấy yêu cầu nào</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Register */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Đăng Ký Mượn Thiết Bị</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chọn Thiết Bị <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        list="devices" 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="Nhập hoặc chọn..."
                                        value={inputDeviceName}
                                        onChange={e => setInputDeviceName(e.target.value)}
                                        autoFocus
                                    />
                                    <datalist id="devices">
                                        {availableDevices.map((d, i) => <option key={i} value={d} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày mượn</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={inputDate}
                                        onChange={e => setInputDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mục đích sử dụng <span className="text-red-500">*</span></label>
                                <textarea 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="VD: Dạy bài 5 lớp KT1..."
                                    value={inputPurpose}
                                    onChange={e => setInputPurpose(e.target.value)}
                                ></textarea>
                            </div>

                            {currentConflict && (
                                <div className="bg-rose-100 border-2 border-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm text-rose-800 shadow-lg animate-pulse">
                                    <AlertCircle size={24} className="shrink-0 mt-0.5 text-rose-600"/>
                                    <div>
                                        <div className="font-black mb-1 uppercase tracking-tighter text-base">HẾT THIẾT BỊ KHẢ DỤNG!</div>
                                        <div className="font-medium">Người đang mượn: <span className="underline decoration-rose-400 decoration-2 underline-offset-2">{currentConflict.bookedBy}</span></div>
                                        <div className="mt-2 text-xs font-bold bg-rose-200/50 px-2 py-1 rounded inline-block">Trạng thái: Đã có người đăng ký hôm nay</div>
                                    </div>
                                </div>
                            )}
                            
                            {!currentConflict && inputDeviceName && (
                                <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-start gap-2 text-xs text-green-700">
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5"/>
                                    <div>
                                        <div className="font-bold uppercase tracking-tight">Thiết bị khả dụng</div>
                                        <div>Chưa có ai đăng ký thiết bị này trong ngày đã chọn. Bạn có thể đăng ký!</div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-700">
                                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                                <span>Vui lòng bảo quản thiết bị cẩn thận và trả lại đúng vị trí sau khi sử dụng.</span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100">Hủy</button>
                            <button onClick={handleRegister} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm">Đăng Ký</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scale-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};
