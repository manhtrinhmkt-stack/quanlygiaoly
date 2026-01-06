
import React, { useState, useMemo, useEffect } from 'react';
import { DeviceRequest, Teacher, InventoryItem, DeviceConfig } from '../types';
import { MonitorPlay, Plus, Check, X, Clock, RotateCcw, Calendar, Search, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface DeviceRegistrationProps {
    requests: DeviceRequest[];
    setRequests: React.Dispatch<React.SetStateAction<DeviceRequest[]>>;
    currentUser: Teacher | null;
    inventory: InventoryItem[];
    config: DeviceConfig;
}

export const DeviceRegistration: React.FC<DeviceRegistrationProps> = ({ requests, setRequests, currentUser, inventory, config }) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const isAdmin = currentUser?.role === 'ADMIN';

    // Form State
    const [inputDeviceName, setInputDeviceName] = useState('');
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputSession, setInputSession] = useState<'Sáng' | 'Chiều' | 'Tối'>('Sáng');
    const [inputPurpose, setInputPurpose] = useState('');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    const handleRegister = () => {
        if (!isRegistrationOpen) {
            return alert(`Cổng đăng ký đang đóng.`);
        }
        if (!inputDeviceName || !inputPurpose) return alert("Vui lòng điền đầy đủ thông tin");
        if (!currentUser) return;

        const newRequest: DeviceRequest = {
            id: `DR${Date.now()}`,
            teacherId: currentUser.id,
            teacherName: `${currentUser.saintName} ${currentUser.fullName}`,
            deviceName: inputDeviceName,
            date: inputDate,
            session: inputSession,
            purpose: inputPurpose,
            status: 'BORROWED' // Auto borrowed, no approval needed
        };

        setRequests([newRequest, ...requests]);
        showToast("Đăng ký thành công!");
        setShowModal(false);
        // Reset form
        setInputDeviceName('');
        setInputPurpose('');
    };

    const handleReturn = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'RETURNED' } : r));
        showToast('Đã xác nhận trả thiết bị!');
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

    // Calendar Helper Functions
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    
    // Get only Sundays for the specific month
    const getSundaysInMonth = (year: number, month: number) => {
        const sundays = [];
        const date = new Date(year, month, 1);
        while (date.getMonth() === month) {
            if (date.getDay() === 0) { // 0 is Sunday
                sundays.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return sundays;
    };

    const renderCalendar = (offset: number) => {
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        const sundays = getSundaysInMonth(year, month);

        return (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-full">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-center text-slate-800 uppercase tracking-wider text-sm sticky top-0 z-10">
                    Tháng {month + 1}/{year}
                </div>
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-red-600 uppercase text-center">
                    Các ngày Chúa Nhật
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-slate-100">
                    {sundays.map((date, idx) => {
                        // Fix time zone offset issue by using manual formatting instead of toISOString()
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        
                        const dailyRequests = requests.filter(r => r.date === dateStr && r.status === 'BORROWED');
                        const isToday = date.toDateString() === today.toDateString();

                        return (
                            <div key={idx} className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors`}>
                                <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                    <span className={`text-sm font-black flex items-center justify-center gap-2 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                                        CN, {date.getDate()}/{month + 1}
                                        {isToday && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Hôm nay</span>}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">{dailyRequests.length} thiết bị</span>
                                </div>
                                <div className="space-y-1.5">
                                    {dailyRequests.length > 0 ? (
                                        dailyRequests.map(r => (
                                            <div key={r.id} className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-2 py-1.5 flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <span className="font-bold text-amber-800 block">{r.deviceName}</span>
                                                    <span className="text-[10px] text-amber-700/80">{r.teacherName}</span>
                                                </div>
                                                <span className="font-bold text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">{r.session}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-slate-300 italic py-2">Trống</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-50">
            {toast && (
                <div className="fixed top-20 right-4 z-[100] animate-slide-in max-w-[90vw]">
                    <div className={`text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500/50' : 'bg-red-600 border-red-500/50'}`}>
                        <CheckCircle2 size={20} />
                        <span className="font-bold text-sm">{toast.message}</span>
                    </div>
                </div>
            )}

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
                    <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
                        <button onClick={() => setViewMode('CALENDAR')} className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar size={16}/></button>
                        <button onClick={() => setViewMode('LIST')} className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><Clock size={16}/></button>
                    </div>
                    <button 
                        onClick={() => {
                            if (isRegistrationOpen) setShowModal(true);
                            else alert(`Cổng đăng ký đang đóng.\nThời gian mở: ${config.openTime} - ${config.closeTime}\nNgày: ${config.startDate || '...'} đến ${config.endDate || '...'}`);
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
                        {renderCalendar(0)}
                        {renderCalendar(1)}
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
                                            <Calendar size={14}/> {new Date(r.date).toLocaleDateString('vi-VN')} - {r.session}
                                        </div>
                                        <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded mt-2">"{r.purpose}"</div>
                                        
                                        {isAdmin && r.status === 'BORROWED' && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                                <button onClick={() => handleReturn(r.id)} className="flex-1 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-100">Xác nhận trả</button>
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
                                        <th className="px-4 py-3">Ngày & Buổi</th>
                                        <th className="px-4 py-3">Mục Đích</th>
                                        <th className="px-4 py-3 text-center">Trạng Thái</th>
                                        {isAdmin && <th className="px-4 py-3 text-center">Thao Tác</th>}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-800">{r.deviceName}</td>
                                                <td className="px-4 py-3 text-slate-600">{r.teacherName}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-700">{new Date(r.date).toLocaleDateString('vi-VN')}</div>
                                                    <div className="text-xs text-slate-500">{r.session}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={r.purpose}>{r.purpose}</td>
                                                <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3 text-center">
                                                        {r.status === 'BORROWED' && (
                                                            <button onClick={() => handleReturn(r.id)} className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Xác nhận trả"><RotateCcw size={16}/></button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-400 italic">Không tìm thấy yêu cầu nào</td></tr>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày mượn</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={inputDate}
                                        onChange={e => setInputDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buổi</label>
                                    <select 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={inputSession}
                                        onChange={e => setInputSession(e.target.value as any)}
                                    >
                                        <option value="Sáng">Sáng</option>
                                        <option value="Chiều">Chiều</option>
                                        <option value="Tối">Tối</option>
                                    </select>
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
