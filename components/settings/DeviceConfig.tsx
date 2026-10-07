
import React from 'react';
import { MonitorPlay, Plus, Trash2 } from 'lucide-react';
import { InventoryItem } from '../../types';

interface DeviceConfigProps {
    openTime: string;
    setOpenTime: (val: string) => void;
    closeTime: string;
    setCloseTime: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    openMonth: string;
    setOpenMonth: (val: string) => void;
    handleSaveDeviceConfig: () => void;
    deviceItems: InventoryItem[];
    newDeviceName: string;
    setNewDeviceName: (val: string) => void;
    handleAddDevice: () => void;
    handleDeleteDevice: (id: string) => void;
}

export const DeviceConfig: React.FC<DeviceConfigProps> = ({
    openTime, setOpenTime, closeTime, setCloseTime, startDate, setStartDate, endDate, setEndDate, openMonth, setOpenMonth, handleSaveDeviceConfig,
    deviceItems, newDeviceName, setNewDeviceName, handleAddDevice, handleDeleteDevice
}) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <MonitorPlay className="text-cyan-600 w-6 h-6" />
                <h3 className="font-bold text-xl text-slate-800">Cấu hình Đăng Ký Thiết Bị</h3>
            </div>
            <div className="space-y-6">
                {/* Time Config */}
                <div className="grid grid-cols-2 gap-4 bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                    <div>
                        <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Giờ mở cổng</label>
                        <input type="time" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Giờ đóng cổng</label>
                        <input type="time" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Từ ngày</label>
                        <input type="date" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Đến ngày</label>
                        <input type="date" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-cyan-800 block mb-1 uppercase">Tháng cho phép đăng ký (YYYY-MM)</label>
                        <input type="month" className="w-full p-2 border border-cyan-200 rounded-lg font-bold text-slate-700 bg-white" value={openMonth} onChange={e => setOpenMonth(e.target.value)} />
                    </div>
                </div>
                
                <button onClick={handleSaveDeviceConfig} className="w-full py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-all shadow text-sm">
                    Lưu Cấu Hình Thời Gian
                </button>

                {/* Manage Device List */}
                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-sm text-slate-600 uppercase mb-3">Danh sách thiết bị cho mượn</h4>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm" 
                            placeholder="Nhập tên thiết bị (VD: Loa kéo)..."
                            value={newDeviceName}
                            onChange={e => setNewDeviceName(e.target.value)}
                        />
                        <button onClick={handleAddDevice} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 flex items-center gap-1">
                            <Plus size={16}/> Thêm
                        </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {deviceItems.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    {deviceItems.map(d => (
                                        <tr key={d.id} className="border-b border-slate-200 last:border-0 hover:bg-white">
                                            <td className="p-3 font-medium text-slate-700">{d.name}</td>
                                            <td className="p-3 text-right w-12">
                                                <button onClick={() => handleDeleteDevice(d.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400 italic">Chưa có thiết bị nào.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
