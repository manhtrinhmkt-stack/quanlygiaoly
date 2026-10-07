
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, AlertCircle, Save, FileText, Plus, GripVertical, Trash2, GraduationCap, Globe, Layers, School } from 'lucide-react';
import { SchoolYear, TermConfig, ScoreColumn, Grade, ClassRoom, AcademicConfig } from '../../types';

interface GradingConfigProps {
    years: SchoolYear[];
    activeYearForTerms: string;
    setActiveYearForTerms: (val: string) => void;
    hk1Config: TermConfig | undefined;
    hk2Config: TermConfig | undefined;
    updateTermDate: (term: 'HK1' | 'HK2', field: 'startDate' | 'endDate', value: string) => void;
    updateTermWeight: (term: 'HK1' | 'HK2', weight: number) => void;
    handleSaveTerms: () => void;
    
    hk1Columns: ScoreColumn[];
    hk2Columns: ScoreColumn[];
    addScoreColumn: (term: 'HK1' | 'HK2') => void;
    removeScoreColumn: (id: string) => void;
    updateScoreColumn: (id: string, field: keyof ScoreColumn, value: any) => void;
    handleColDragStart: (e: React.DragEvent, id: string) => void;
    handleColDragOver: (e: React.DragEvent) => void;
    handleColDragEnter: (id: string) => void;
    handleColDragEnd: () => void;
    handleColDrop: (e: React.DragEvent, targetId: string) => void;
    draggedColId: string | null;
    dragOverColId: string | null;
    handleSaveScoreColumns: () => void;

    passScore: number;
    setPassScore: (val: number) => void;
    gradingScale: { label: string; min: number; color: string }[];
    setGradingScale: (scale: { label: string; min: number; color: string }[]) => void;
    academicConfig: AcademicConfig;
    setAcademicConfig: (cfg: AcademicConfig) => void;

    grades: Grade[];
    classes: ClassRoom[];
    scopeType: 'GLOBAL' | 'GRADE';
    setScopeType: (val: 'GLOBAL' | 'GRADE') => void;
    scopeId: string;
    setScopeId: (val: string) => void;
    handleApplyToAllGrades: () => void;
    handleSaveGrading: () => void;
}

export const GradingConfig: React.FC<GradingConfigProps> = ({
    years, activeYearForTerms, setActiveYearForTerms, hk1Config, hk2Config, updateTermDate, updateTermWeight, handleSaveTerms,
    hk1Columns, hk2Columns, addScoreColumn, removeScoreColumn, updateScoreColumn, handleColDragStart, handleColDragOver, handleColDragEnter, handleColDragEnd, handleColDrop, draggedColId, dragOverColId, handleSaveScoreColumns,
    passScore, setPassScore, academicConfig, setAcademicConfig, gradingScale, setGradingScale,
    grades, classes, scopeType, setScopeType, scopeId, setScopeId, handleApplyToAllGrades, handleSaveGrading
}) => {
    // Sync scopeId when scopeType changes
    useEffect(() => {
        if (scopeType === 'GLOBAL') {
            setScopeId('');
        } else if (scopeType === 'GRADE' && grades.length > 0) {
            setScopeId(grades[0].id);
        }
    }, [scopeType, grades, setScopeId]);

    return (
        <>
            {/* Cấu hình Thời gian Học Kỳ */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <Clock className="text-rose-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Cấu Hình Thời Gian Học Kỳ</h3>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chọn năm học cấu hình</label>
                        <select 
                            className="w-full p-3 border rounded-xl text-sm font-bold text-slate-700 bg-slate-50"
                            value={activeYearForTerms}
                            onChange={(e) => setActiveYearForTerms(e.target.value)}
                        >
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs mb-3 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Học Kỳ 1</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-blue-600 font-bold uppercase">Bắt đầu</label>
                                    <input type="date" className="w-full p-2 text-xs border border-blue-200 rounded-lg outline-none" value={hk1Config?.startDate || ''} onChange={(e) => updateTermDate('HK1', 'startDate', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-blue-600 font-bold uppercase">Kết thúc</label>
                                    <input type="date" className="w-full p-2 text-xs border border-blue-200 rounded-lg outline-none" value={hk1Config?.endDate || ''} onChange={(e) => updateTermDate('HK1', 'endDate', e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-bold text-purple-800 text-xs mb-3 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Học Kỳ 2</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-purple-600 font-bold uppercase">Bắt đầu</label>
                                    <input type="date" className="w-full p-2 text-xs border border-purple-200 rounded-lg outline-none" value={hk2Config?.startDate || ''} onChange={(e) => updateTermDate('HK2', 'startDate', e.target.value)}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-purple-600 font-bold uppercase">Kết thúc</label>
                                    <input type="date" className="w-full p-2 text-xs border border-purple-200 rounded-lg outline-none" value={hk2Config?.endDate || ''} onChange={(e) => updateTermDate('HK2', 'endDate', e.target.value)}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>Mốc thời gian này sẽ được dùng để tự động phân loại số buổi vắng vào bảng điểm HK1 hoặc HK2.</span>
                    </div>

                </div>
            </div>

            {/* Cấu hình Cột điểm */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <FileText className="text-violet-600 w-6 h-6" />
                        <h3 className="font-bold text-xl text-slate-800">Cấu Hình Cột Điểm & Hệ Số</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setScopeType('GLOBAL')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${scopeType === 'GLOBAL' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Globe size={14} /> Chung
                        </button>
                        <button 
                            onClick={() => setScopeType('GRADE')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${scopeType === 'GRADE' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers size={14} /> Theo Khối
                        </button>
                    </div>
                </div>

                {/* Weights Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="text-[10px] text-blue-600 font-bold uppercase block mb-1">Hệ số HK1</label>
                        <input type="number" step="0.1" className="w-full p-2 text-xs border border-blue-200 rounded-lg outline-none font-bold" value={hk1Config?.weight || 1} onChange={(e) => updateTermWeight('HK1', Number(e.target.value))}/>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <label className="text-[10px] text-purple-600 font-bold uppercase block mb-1">Hệ số HK2</label>
                        <input type="number" step="0.1" className="w-full p-2 text-xs border border-purple-200 rounded-lg outline-none font-bold" value={hk2Config?.weight || 1} onChange={(e) => updateTermWeight('HK2', Number(e.target.value))}/>
                    </div>
                </div>

                {scopeType !== 'GLOBAL' && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1 max-w-xs">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                Chọn Khối Lớp
                            </label>
                            <select 
                                className="w-full p-2.5 border border-blue-200 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-500"
                                value={scopeId}
                                onChange={(e) => setScopeId(e.target.value)}
                            >
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        
                        <button 
                            onClick={handleApplyToAllGrades}
                            className="px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all flex items-center gap-2"
                        >
                            <Layers size={14} /> Áp dụng cấu hình cho tất cả khối khác
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* HK1 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 border-blue-200">
                            <h4 className="font-bold text-blue-700 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Học Kỳ 1</h4>
                            <button onClick={() => addScoreColumn('HK1')} className="text-[10px] flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"><Plus size={12}/> Thêm cột</button>
                        </div>
                        <div className="space-y-2">
                            {hk1Columns.length > 0 ? hk1Columns.map(col => {
                                const isDragging = draggedColId === col.id;
                                const isOver = dragOverColId === col.id;
                                return (
                                <div key={col.id} draggable onDragStart={(e) => handleColDragStart(e, col.id)} onDragOver={handleColDragOver} onDragEnter={() => handleColDragEnter(col.id)} onDragEnd={handleColDragEnd} onDrop={(e) => handleColDrop(e, col.id)} className={`flex gap-2 items-center bg-blue-50/50 p-2 rounded-lg border transition-all ${isDragging ? 'opacity-30 border-blue-500 border-dashed' : 'border-blue-100'} ${isOver ? 'ring-2 ring-blue-300 translate-x-1' : ''}`}>
                                    <div className="cursor-grab text-slate-300 hover:text-blue-500"><GripVertical size={16}/></div>
                                    <input className="flex-1 text-sm p-1.5 border rounded outline-none font-bold" value={col.name} onChange={e => updateScoreColumn(col.id, 'name', e.target.value)} />
                                    
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-blue-400 uppercase">Hệ số</span>
                                        <select 
                                            className="text-xs p-1 border rounded font-bold bg-white" 
                                            value={col.weight} 
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                updateScoreColumn(col.id, 'weight', val);
                                                // Sync isTick for compatibility if needed, though we will primarily use weight === 0
                                                updateScoreColumn(col.id, 'isTick', val === 0);
                                            }}
                                        >
                                            <option value={0}>x0 (Đạt/Chưa đạt)</option>
                                            <option value={1}>x1</option>
                                            <option value={2}>x2</option>
                                            <option value={3}>x3</option>
                                        </select>
                                    </div>
                                    <button onClick={() => removeScoreColumn(col.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            )}) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    Chưa có cấu hình cho mục này
                                </div>
                            )}
                        </div>
                    </div>
                    {/* HK2 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2 border-purple-200">
                            <h4 className="font-bold text-purple-700 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Học Kỳ 2</h4>
                            <button onClick={() => addScoreColumn('HK2')} className="text-[10px] flex items-center gap-1 font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"><Plus size={12}/> Thêm cột</button>
                        </div>
                        <div className="space-y-2">
                            {hk2Columns.length > 0 ? hk2Columns.map(col => {
                                const isDragging = draggedColId === col.id;
                                const isOver = dragOverColId === col.id;
                                return (
                                <div key={col.id} draggable onDragStart={(e) => handleColDragStart(e, col.id)} onDragOver={handleColDragOver} onDragEnter={() => handleColDragEnter(col.id)} onDragEnd={handleColDragEnd} onDrop={(e) => handleColDrop(e, col.id)} className={`flex gap-2 items-center bg-purple-50/50 p-2 rounded-lg border transition-all ${isDragging ? 'opacity-30 border-purple-500 border-dashed' : 'border-purple-100'} ${isOver ? 'ring-2 ring-purple-300 translate-x-1' : ''}`}>
                                    <div className="cursor-grab text-slate-300 hover:text-purple-500"><GripVertical size={16}/></div>
                                    <input className="flex-1 text-sm p-1.5 border rounded outline-none font-bold" value={col.name} onChange={e => updateScoreColumn(col.id, 'name', e.target.value)} />
                                    
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-purple-400 uppercase">Hệ số</span>
                                        <select 
                                            className="text-xs p-1 border rounded font-bold bg-white" 
                                            value={col.weight} 
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                updateScoreColumn(col.id, 'weight', val);
                                                // Sync isTick for compatibility if needed
                                                updateScoreColumn(col.id, 'isTick', val === 0);
                                            }}
                                        >
                                            <option value={0}>x0 (Đạt/Chưa đạt)</option>
                                            <option value={1}>x1</option>
                                            <option value={2}>x2</option>
                                            <option value={3}>x3</option>
                                        </select>
                                    </div>
                                    <button onClick={() => removeScoreColumn(col.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            )}) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    Chưa có cấu hình cho mục này
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] text-slate-500 italic">
                            Lưu ý: Cột điểm theo Khối sẽ được ưu tiên hơn cấu hình Chung.
                        </p>
                    </div>
            </div>

            {/* Cấu hình Thang điểm & Xếp loại */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <GraduationCap className="text-emerald-600 w-6 h-6" />
                    <h3 className="font-bold text-xl text-slate-800">Cấu Hình Học Vụ & Xếp Loại</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-4">% Trọng số</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">% Học lực</label>
                                <input type="number" step="1" className="w-full p-2 border rounded-lg font-black text-emerald-600" value={academicConfig.academicWeight} onChange={e => {
                                    const val = Number(e.target.value);
                                    let newAcademicWeight = val;
                                    let newAttendanceWeight = 100 - val;
                                    if (newAttendanceWeight < 0) {newAcademicWeight = 100; newAttendanceWeight = 0; }
                                    setAcademicConfig({...academicConfig, academicWeight: newAcademicWeight, attendanceWeight: newAttendanceWeight});
                                }} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">% Chuyên cần</label>
                                <input type="number" step="1" className="w-full p-2 border rounded-lg font-black text-rose-600" value={academicConfig.attendanceWeight} onChange={e => {
                                    const val = Number(e.target.value);
                                    let newAttendanceWeight = val;
                                    let newAcademicWeight = 100 - val;
                                    if (newAcademicWeight < 0) {newAttendanceWeight = 100; newAcademicWeight = 0; }
                                    setAcademicConfig({...academicConfig, attendanceWeight: newAttendanceWeight, academicWeight: newAcademicWeight});
                                }} />
                                <p className="text-[10px] text-slate-500 italic mt-1">Tổng trọng số phải là 100%.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Điểm khống chế chuyên cần</label>
                                <input type="number" step="0.1" className="w-full p-2 border rounded-lg font-black text-amber-600" value={academicConfig.attendanceLimit} onChange={e => setAcademicConfig({...academicConfig, attendanceLimit: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-4">Điểm Đạt</h4>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Điểm TB tối thiểu</label>
                                <input type="number" step="0.1" className="w-full p-2 border rounded-lg font-black text-emerald-600" value={passScore} onChange={e => setPassScore(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-600 uppercase mb-4">Thang xếp loại</h4>
                        <div className="space-y-2 mb-6">
                            {gradingScale.map((g, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input type="text" className={`w-24 p-2 border rounded-lg font-bold text-sm ${g.color}`} value={g.label} onChange={(e) => {
                                        const newScale = [...gradingScale];
                                        newScale[idx].label = e.target.value;
                                        setGradingScale(newScale);
                                    }}/>
                                    <span className="text-slate-400 font-bold">≥</span>
                                    <input type="number" step="0.1" className="w-20 p-2 border rounded-lg font-mono text-sm" value={g.min} onChange={(e) => {
                                        const newScale = [...gradingScale];
                                        newScale[idx].min = Number(e.target.value);
                                        setGradingScale(newScale);
                                    }}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
