import React from 'react';
import { AttendanceConfig } from '../../types';
import { toast } from 'sonner';

interface AttendanceConfigProps {
    attendanceConfig: AttendanceConfig;
    setAttendanceConfig: (config: AttendanceConfig) => void;
}

export const AttendanceConfigComp: React.FC<AttendanceConfigProps> = ({ attendanceConfig, setAttendanceConfig }) => {
    const days = [
        { id: 0, label: 'Chủ Nhật' },
        { id: 1, label: 'Thứ Hai' },
        { id: 2, label: 'Thứ Ba' },
        { id: 3, label: 'Thứ Tư' },
        { id: 4, label: 'Thứ Năm' },
        { id: 5, label: 'Thứ Sáu' },
        { id: 6, label: 'Thứ Bảy' },
    ];

    const toggleDay = (dayId: number) => {
        const newDays = attendanceConfig.allowedDays.includes(dayId)
            ? attendanceConfig.allowedDays.filter(d => d !== dayId)
            : [...attendanceConfig.allowedDays, dayId];
        setAttendanceConfig({ ...attendanceConfig, allowedDays: newDays });
    };

    const updateField = (field: keyof AttendanceConfig, value: any) => {
        setAttendanceConfig({ ...attendanceConfig, [field]: value });
    };

    const handleSave = () => {
        toast.success("Đã lưu cấu hình điểm danh!");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Cấu hình điểm danh</h3>
            <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={attendanceConfig.isAutoCalculate} onChange={e => updateField('isAutoCalculate', e.target.checked)} />
                    <span className="font-bold text-sm text-slate-700">Tự động tính toán số buổi học/lễ</span>
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {days.map(day => (
                    <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`px-4 py-3 rounded-lg font-bold text-sm transition-all border ${
                            attendanceConfig.allowedDays.includes(day.id)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700">Thánh Lễ</h4>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Số thánh lễ bắt buộc HK1</label>
                        <input type="number" disabled={attendanceConfig.isAutoCalculate} className="w-full p-2 border rounded-lg font-bold" value={attendanceConfig.totalMassRequiredHK1} onChange={e => updateField('totalMassRequiredHK1', Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Số thánh lễ bắt buộc HK2</label>
                        <input type="number" disabled={attendanceConfig.isAutoCalculate} className="w-full p-2 border rounded-lg font-bold" value={attendanceConfig.totalMassRequiredHK2} onChange={e => updateField('totalMassRequiredHK2', Number(e.target.value))} />
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700">Giáo Lý</h4>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Số buổi giáo lý bắt buộc HK1</label>
                        <input type="number" disabled={attendanceConfig.isAutoCalculate} className="w-full p-2 border rounded-lg font-bold" value={attendanceConfig.totalClassRequiredHK1} onChange={e => updateField('totalClassRequiredHK1', Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Số buổi giáo lý bắt buộc HK2</label>
                        <input type="number" disabled={attendanceConfig.isAutoCalculate} className="w-full p-2 border rounded-lg font-bold" value={attendanceConfig.totalClassRequiredHK2} onChange={e => updateField('totalClassRequiredHK2', Number(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>
    );
};
