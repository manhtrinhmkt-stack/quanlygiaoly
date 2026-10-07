
import React from 'react';
import { Calendar, Layers, Plus, Trash2, GripVertical, Edit, Check, X, Lock, Unlock } from 'lucide-react';
import { SchoolYear, ClassRoom, Grade } from '../../types';

interface AcademicManagementProps {
    years: SchoolYear[];
    handleSetActiveYear: (id: string) => void;
    handleAddYear: () => void;
    handleDeleteYear: (id: string) => void;
    newYearName: string;
    setNewYearName: (val: string) => void;
    isAdmin?: boolean;
    handleToggleLockYear?: (id: string) => void;
    
    grades: Grade[];
    handleAddGrade: () => void;
    newGradeName: string;
    setNewGradeName: (val: string) => void;
    editingGradeId: string | null;
    setEditingGradeId: (id: string | null) => void;
    editGradeName: string;
    setEditGradeName: (val: string) => void;
    handleStartEditGrade: (grade: Grade) => void;
    handleSaveGrade: () => void;
    handleDeleteGrade: (id: string) => void;
    handleGradeDragStart: (e: React.DragEvent, id: string) => void;
    handleGradeDragOver: (e: React.DragEvent) => void;
    handleGradeDragEnter: (id: string) => void;
    handleGradeDragEnd: () => void;
    handleGradeDrop: (e: React.DragEvent, targetId: string) => void;
    draggedGradeId: string | null;
    dragOverGradeId: string | null;

    classesInActiveYear: ClassRoom[];
    activeYear: SchoolYear | undefined;
    newClassName: string;
    setNewClassName: (val: string) => void;
    newClassGrade: string;
    setNewClassGrade: (val: string) => void;
    newClassYear: string;
    setNewClassYear: (val: string) => void;
    handleAddClass: () => void;
    editingClassId: string | null;
    setEditingClassId: (id: string | null) => void;
    editClassName: string;
    setEditClassName: (val: string) => void;
    handleStartEditClass: (cls: ClassRoom) => void;
    handleSaveClass: () => void;
    handleDeleteClass: (id: string) => void;
    handleClassDragStart: (e: React.DragEvent, id: string) => void;
    handleClassDragOver: (e: React.DragEvent) => void;
    handleClassDragEnter: (id: string) => void;
    handleClassDragEnd: () => void;
    handleClassDrop: (e: React.DragEvent, targetId: string) => void;
    draggedClassId: string | null;
    dragOverClassId: string | null;
}

export const AcademicManagement: React.FC<AcademicManagementProps> = ({
    years, handleSetActiveYear, handleAddYear, handleDeleteYear, newYearName, setNewYearName, isAdmin, handleToggleLockYear,
    grades, handleAddGrade, newGradeName, setNewGradeName, editingGradeId, setEditingGradeId, editGradeName, setEditGradeName, handleStartEditGrade, handleSaveGrade, handleDeleteGrade, handleGradeDragStart, handleGradeDragOver, handleGradeDragEnter, handleGradeDragEnd, handleGradeDrop, draggedGradeId, dragOverGradeId,
    classesInActiveYear, activeYear, newClassName, setNewClassName, newClassGrade, setNewClassGrade, newClassYear, setNewClassYear, handleAddClass, editingClassId, setEditingClassId, editClassName, setEditClassName, handleStartEditClass, handleSaveClass, handleDeleteClass, handleClassDragStart, handleClassDragOver, handleClassDragEnter, handleClassDragEnd, handleClassDrop, draggedClassId, dragOverClassId
}) => {
    const getGradeBadgeClass = (gradeName: string | undefined) => {
        if (!gradeName) return "bg-slate-100 text-slate-600 border-slate-200";
        
        const name = gradeName.toLowerCase();
        if (name.includes('kinh thánh')) return "bg-[#F4E4D4] text-slate-800 border-[#D2B48C]";
        if (name.includes('khai tâm')) return "bg-pink-100 text-slate-800 border-pink-200";
        if (name.includes('rước lễ')) return "bg-green-100 text-slate-800 border-green-200";
        if (name.includes('thêm sức')) return "bg-blue-100 text-slate-800 border-blue-200";
        if (name.includes('bao đồng')) return "bg-yellow-100 text-slate-800 border-yellow-200";
        
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    };

    return (
        <div className="space-y-8">
            {/* Section 1: Niên Khóa (Foundational) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="text-blue-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">1. Quản Lý Niên Khóa</h3>
                            <p className="text-xs text-slate-500 font-medium">Thiết lập thời gian học tập</p>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Niên khóa mới (VD: 2024-2025)" 
                            className="flex-1 md:w-64 p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                            value={newYearName} 
                            onChange={(e) => setNewYearName(e.target.value)}
                        />
                        <button onClick={handleAddYear} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm shrink-0">
                            <Plus size={16}/> Thêm
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {years.map(y => (
                        <div key={y.id} className={`relative group p-3 rounded-xl border-2 transition-all ${y.isActive ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                            {isAdmin && (
                                <button 
                                    onClick={() => handleToggleLockYear?.(y.id)}
                                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${y.isLocked ? 'text-amber-600 hover:text-slate-600 hover:bg-slate-150 bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-transparent'}`}
                                    title={y.isLocked ? "Mở khóa niên khóa (Chỉ Quản trị viên)" : "Khóa niên khóa (Dữ liệu thành Chỉ đọc)"}
                                >
                                    {y.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                </button>
                            )}
                            <div className="flex flex-col gap-1 pr-6">
                                <span className={`text-sm font-bold truncate ${y.isActive ? 'text-blue-700' : 'text-slate-700'}`}>{y.name}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {y.isActive && (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit">Hiện tại</span>
                                    )}
                                    {y.isLocked && (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full w-fit flex items-center gap-0.5"><Lock size={8}/> Đã khóa</span>
                                    )}
                                </div>
                                {!y.isActive && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        <button onClick={() => handleSetActiveYear(y.id)} className="text-[10px] font-bold text-blue-600 hover:underline">Chọn</button>
                                        <button onClick={() => handleDeleteYear(y.id)} className="text-[10px] font-bold text-red-600 hover:underline">Xóa</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                </div>
            </div>

            {/* Section 2: Cấu trúc Khối & Lớp (Linked) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Khối Lớp */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[550px]">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Layers className="text-purple-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">2. Khối Lớp</h3>
                            <p className="text-xs text-slate-500 font-medium">Phân cấp trình độ</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
                        <input 
                            type="text" 
                            placeholder="Tên khối..." 
                            className="flex-1 p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white" 
                            value={newGradeName} 
                            onChange={(e) => setNewGradeName(e.target.value)} 
                        />
                        <button onClick={handleAddGrade} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <table className="w-full text-left text-sm border-separate border-spacing-y-1 px-2">
                            <tbody>
                                {grades.map(g => {
                                    const isEditing = editingGradeId === g.id;
                                    const isDragged = draggedGradeId === g.id;
                                    const isOver = dragOverGradeId === g.id;
                                    const isKinhThanh = g.name === 'Khối Kinh Thánh';
                                    
                                    return (
                                    <tr 
                                        key={g.id} 
                                        draggable={!isEditing}
                                        onDragStart={(e) => handleGradeDragStart(e, g.id)}
                                        onDragOver={handleGradeDragOver}
                                        onDragEnter={() => handleGradeDragEnter(g.id)}
                                        onDragEnd={handleGradeDragEnd}
                                        onDrop={(e) => handleGradeDrop(e, g.id)}
                                        className={`group transition-all bg-white shadow-sm rounded-lg overflow-hidden border border-slate-100 ${isDragged ? 'opacity-40' : ''} ${isOver ? 'ring-2 ring-purple-400' : ''}`}
                                    >
                                        <td className="p-2 text-slate-300 group-hover:text-purple-500 cursor-grab"><GripVertical size={16} /></td>
                                        <td className="p-2 font-bold text-slate-700">
                                            {isEditing ? (
                                                <input 
                                                    autoFocus
                                                    className="w-full p-1 border border-purple-300 rounded outline-none bg-purple-50 text-purple-700"
                                                    value={editGradeName}
                                                    onChange={(e) => setEditGradeName(e.target.value)}
                                                />
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getGradeBadgeClass(g.name)}`}>
                                                    {g.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={handleSaveGrade} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check size={16}/></button>
                                                        <button onClick={() => setEditingGradeId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={16}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleStartEditGrade(g)} className="p-1 text-slate-400 hover:text-blue-500"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteGrade(g.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                    </div>
                </div>

                {/* Lớp Học */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[550px]">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 border-b pb-4">
                        <div className="flex items-center gap-3 min-w-fit">
                            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                                <Layers className="text-emerald-600 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 whitespace-nowrap">3. Lớp Học</h3>
                                <p className="text-xs text-slate-500 font-medium">Chi tiết các lớp trong niên khóa {activeYear?.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 w-full xl:w-auto">
                            <input 
                                type="text" 
                                placeholder="Tên lớp..." 
                                className="flex-1 min-w-[100px] p-2 border border-emerald-200 rounded-lg outline-none text-sm bg-white" 
                                value={newClassName} 
                                onChange={(e) => setNewClassName(e.target.value)} 
                            />
                            <select 
                                className="flex-1 min-w-[120px] p-2 border border-emerald-200 rounded-lg bg-white text-sm font-bold text-emerald-800 outline-none" 
                                value={newClassYear} 
                                onChange={(e) => setNewClassYear(e.target.value)}
                            >
                                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                            <select 
                                className="flex-1 min-w-[120px] p-2 border border-emerald-200 rounded-lg bg-white text-sm font-bold text-emerald-800 outline-none" 
                                value={newClassGrade} 
                                onChange={(e) => setNewClassGrade(e.target.value)}
                            >
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button onClick={handleAddClass} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-all shrink-0">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <table className="w-full text-left text-sm border-separate border-spacing-y-1 px-2">
                            <thead className="sticky top-0 bg-slate-50 z-10">
                                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                    <th className="p-2 w-10"></th>
                                    <th className="p-2">Tên Lớp</th>
                                    <th className="p-2">Khối</th>
                                    <th className="p-2 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classesInActiveYear.map(c => {
                                    const isEditing = editingClassId === c.id;
                                    const isDragged = draggedClassId === c.id;
                                    const isOver = dragOverClassId === c.id;

                                    return (
                                    <tr 
                                        key={c.id} 
                                        draggable={!isEditing}
                                        onDragStart={(e) => handleClassDragStart(e, c.id)}
                                        onDragOver={handleClassDragOver}
                                        onDragEnter={() => handleClassDragEnter(c.id)}
                                        onDragEnd={handleClassDragEnd}
                                        onDrop={(e) => handleClassDrop(e, c.id)}
                                        className={`group transition-all bg-white shadow-sm rounded-lg overflow-hidden border border-slate-100 ${isDragged ? 'opacity-40' : ''} ${isOver ? 'ring-2 ring-emerald-400' : ''}`}
                                    >
                                        <td className="p-3 text-slate-300 group-hover:text-emerald-500 cursor-grab"><GripVertical size={16} /></td>
                                        <td className="p-3 font-bold text-slate-700">
                                            {isEditing ? (
                                                <input 
                                                    autoFocus
                                                    className="w-full p-1 border border-emerald-300 rounded outline-none text-emerald-700 bg-emerald-50"
                                                    value={editClassName}
                                                    onChange={(e) => setEditClassName(e.target.value)}
                                                />
                                            ) : (
                                                c.name
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {(() => {
                                                const gradeName = grades.find(g => g.id === c.gradeId)?.name;
                                                return (
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getGradeBadgeClass(gradeName)}`}>
                                                        {gradeName}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={handleSaveClass} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check size={16}/></button>
                                                        <button onClick={() => setEditingClassId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={16}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleStartEditClass(c)} className="p-1 text-slate-400 hover:text-blue-500"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteClass(c.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                    </div>
                </div>
            </div>
        </div>
    );
};
