
import React from 'react';
import { Cross, Trash2 } from 'lucide-react';
import { Saint } from '../../types';

interface SaintsManagementProps {
    saints: Saint[];
    newSaintName: string;
    setNewSaintName: (val: string) => void;
    newSaintGender: 'Male' | 'Female';
    setNewSaintGender: (val: 'Male' | 'Female') => void;
    handleAddSaint: () => void;
    handleRemoveSaint: (id: string) => void;
    handleSaveSaints: () => void;
}

export const SaintsManagement: React.FC<SaintsManagementProps> = ({
    saints, newSaintName, setNewSaintName, newSaintGender, setNewSaintGender, handleAddSaint, handleRemoveSaint, handleSaveSaints
}) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Cross className="text-amber-600 w-6 h-6" />
                <h3 className="font-bold text-xl text-slate-800">Quản Lý Tên Thánh</h3>
            </div>
            <div className="space-y-6">
                <div className="flex gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <input type="text" placeholder="Nhập tên thánh..." className="flex-1 p-3 border border-amber-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" value={newSaintName} onChange={(e) => setNewSaintName(e.target.value)}/>
                    <select className="p-3 border border-amber-200 rounded-xl text-sm bg-white" value={newSaintGender} onChange={(e) => setNewSaintGender(e.target.value as 'Male'|'Female')}>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                    </select>
                    <button onClick={handleAddSaint} className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-extrabold shadow-md transition-all">+</button>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar bg-slate-50">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-300 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-bold text-slate-600">Tên Thánh</th>
                                <th className="p-4 font-bold text-slate-600 w-24">Giới tính</th>
                                <th className="p-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {saints.map(s => (
                                <tr key={s.id} className="hover:bg-amber-50/50 transition-colors border-b border-slate-200">
                                    <td className="p-4 font-bold text-slate-700">{s.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${s.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {s.gender === 'Male' ? 'Nam' : 'Nữ'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRemoveSaint(s.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
