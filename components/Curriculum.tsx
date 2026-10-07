import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Plus, Edit, Trash2, Search, Filter, Calendar, Info, 
  Check, X, FileText, LayoutList, CheckSquare, Sparkles, Clock, AlertCircle
} from 'lucide-react';
import { Teacher, ClassRoom, CurriculumItem } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';

interface CurriculumProps {
  curriculum: CurriculumItem[];
  setCurriculum: React.Dispatch<React.SetStateAction<CurriculumItem[]>>;
  classes: ClassRoom[];
  currentUser: Teacher | null;
}

export const Curriculum: React.FC<CurriculumProps> = ({ 
  curriculum, setCurriculum, classes, currentUser 
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- UI Filter States ---
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  // --- Edit Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);

  // --- Form States ---
  const [formWeek, setFormWeek] = useState('');
  const [formLiturgicalFeast, setFormLiturgicalFeast] = useState('');
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formLessonContent, setFormLessonContent] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // --- Liturgical Season Colors helper ---
  const getSeasonInfo = (feastName: string) => {
    const name = feastName.toLowerCase();
    if (name.includes('thường niên')) {
      return { label: 'Mùa Thường Niên', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeBg: 'bg-emerald-600' };
    }
    if (name.includes('mùa vọng') || name.includes('mùa chay') || name.includes('tĩnh tâm')) {
      return { label: 'Mùa Vọng / Mùa Chay', bg: 'bg-violet-50 border-violet-200 text-violet-700', badgeBg: 'bg-violet-600' };
    }
    if (name.includes('phục sinh') || name.includes('giáng sinh') || name.includes('thăng thiên') || name.includes('đại lễ') || name.includes('thánh tâm')) {
      return { label: 'Đại Lễ / Mùa PS / GS', bg: 'bg-amber-50 border-amber-200 text-amber-700', badgeBg: 'bg-amber-600' };
    }
    if (name.includes('khai giảng') || name.includes('trung thu') || name.includes('hội chợ')) {
      return { label: 'Sự Kiện Đặc Biệt', bg: 'bg-blue-50 border-blue-200 text-blue-700', badgeBg: 'bg-blue-600' };
    }
    return { label: 'Phụng Vụ Khác', bg: 'bg-slate-100 border-slate-300 text-slate-700', badgeBg: 'bg-slate-600' };
  };

  // --- Class options auto-lookup ---
  const getClassNames = (classIds: string[]) => {
    if (!classIds || classIds.length === 0) return 'Tất cả các lớp';
    if (classIds.length === classes.length) return 'Tất cả các lớp';
    return classIds.map(id => {
      const cls = classes.find(c => c.id === id);
      return cls ? cls.name : id;
    }).join(', ');
  };

  // --- Filtered Curriculum list ---
  const filteredCurriculum = useMemo(() => {
    return curriculum.filter(item => {
      // 1. Filter by Class
      const matchesClass = selectedClassId === 'all' || 
                           item.classIds.length === 0 || 
                           item.classIds.includes(selectedClassId);

      // 2. Filter by Search term (week, feast, lesson content, or activities)
      const query = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                            item.week.toLowerCase().includes(query) ||
                            item.liturgicalFeast.toLowerCase().includes(query) ||
                            (item.lessonContent || '').toLowerCase().includes(query);

      // 3. Filter by Liturgical Season
      const seasonInfo = getSeasonInfo(item.liturgicalFeast);
      const matchesSeason = selectedSeason === 'all' || seasonInfo.label === selectedSeason;

      return matchesClass && matchesSearch && matchesSeason;
    }).sort((a, b) => {
      // Basic sorting: try to sort by Week number if possible
      const getWeekNum = (w: string) => {
        const num = w.replace(/\D/g, '');
        return num ? parseInt(num, 10) : 999;
      };
      return getWeekNum(a.week) - getWeekNum(b.week);
    });
  }, [curriculum, selectedClassId, searchTerm, selectedSeason, classes]);

  // --- Handlers ---
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormWeek(`Tuần ${curriculum.length + 1}`);
    setFormLiturgicalFeast('');
    setFormClassIds(classes.map(c => c.id)); // select all by default
    setFormLessonContent('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CurriculumItem) => {
    setEditingItem(item);
    setFormWeek(item.week);
    setFormLiturgicalFeast(item.liturgicalFeast);
    setFormClassIds(item.classIds || []);
    setFormLessonContent(item.lessonContent || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên mới được xóa chương trình!');
      return;
    }
    setDeleteConfirmId(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formWeek.trim()) {
      toast.error('Vui lòng nhập tên tuần!');
      return;
    }

    if (isAdmin && !formLiturgicalFeast.trim()) {
      toast.error('Vui lòng nhập Tên ngày lễ phụng vụ!');
      return;
    }

    if (formClassIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lớp áp dụng!');
      return;
    }

    const userName = currentUser?.fullName || 'Hệ thống';
    const currentTime = new Date().toISOString().split('T')[0];

    if (editingItem) {
      // Editing
      setCurriculum(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            // Admins can change everything, GLVs can only edit contents, activities, notes, and classes
            week: isAdmin ? formWeek : item.week,
            liturgicalFeast: isAdmin ? formLiturgicalFeast : item.liturgicalFeast,
            classIds: formClassIds,
            lessonContent: formLessonContent,
            notes: formNotes,
            updatedBy: userName,
            updatedAt: currentTime
          };
        }
        return item;
      }));
      toast.success('Cập nhật chương trình giảng dạy thành công!');
    } else {
      // Adding (Admin only can add)
      if (!isAdmin) {
        toast.error('Chỉ Quản trị viên mới có quyền tạo mới tuần học!');
        return;
      }

      const newItem: CurriculumItem = {
        id: `curr-${Date.now()}`,
        week: formWeek,
        liturgicalFeast: formLiturgicalFeast,
        classIds: formClassIds,
        lessonContent: formLessonContent,
        notes: formNotes,
        updatedBy: userName,
        updatedAt: currentTime,
        yearId: '2023-2024'
      };

      setCurriculum(prev => [...prev, newItem]);
      toast.success('Thêm tuần chương trình mới thành công!');
    }

    setIsModalOpen(false);
  };

  const handleToggleSelectAllClasses = () => {
    if (formClassIds.length === classes.length) {
      setFormClassIds([]);
    } else {
      setFormClassIds(classes.map(c => c.id));
    }
  };

  const handleClassCheckboxChange = (classId: string) => {
    setFormClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) 
        : [...prev, classId]
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                Chương Trình Giảng Dạy & Phụng Vụ
              </h2>
              <p className="text-xs text-slate-500 font-medium">Quản lý nội dung bài học, lễ phụng vụ và lịch hoạt động theo từng tuần</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={16} strokeWidth={3} />
                Thêm Tuần Mới
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6">
          {/* Search box */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tuần, lễ phụng vụ, bài học..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Class Filter */}
          <div className="relative md:col-span-4 flex items-center gap-2">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              className="w-full px-3 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500/20 outline-none"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.room || 'Không phòng'})</option>
              ))}
            </select>
          </div>

          {/* Liturgical Season Filter */}
          <div className="relative md:col-span-3">
            <select
              className="w-full px-3 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500/20 outline-none"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              <option value="all">Tất cả Mùa Phụng Vụ</option>
              <option value="Mùa Thường Niên">Mùa Thường Niên (Xanh)</option>
              <option value="Mùa Vọng / Mùa Chay">Mùa Vọng / Mùa Chay (Tím)</option>
              <option value="Đại Lễ / Mùa PS / GS">Đại Lễ Phục Sinh / Giáng Sinh (Vàng)</option>
              <option value="Sự Kiện Đặc Biệt">Sự Kiện Đặc Biệt (Xanh dương)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {filteredCurriculum.length > 0 ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto md:table-fixed">
              {/* Table Header - Desktop Only */}
              <thead className="hidden md:table-header-group">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 w-20">Tuần</th>
                  <th className="px-4 py-2.5 w-28">Ngày</th>
                  <th className="px-4 py-2.5 w-1/4">Lễ Phụng Vụ</th>
                  <th className="px-4 py-2.5 w-auto">Nội dung bài học</th>
                  <th className="px-4 py-2.5 w-40">Ghi chú</th>
                  <th className="px-4 py-2.5 w-24 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCurriculum.map((item) => {
                  const season = getSeasonInfo(item.liturgicalFeast);
                  
                  return (
                    <tr 
                      key={item.id}
                      className="group hover:bg-slate-50/80 transition-colors flex flex-col md:table-row"
                    >
                      {/* Column 1: Tuần */}
                      <td className="px-4 py-3 md:py-3 flex items-center md:table-cell">
                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-20 shrink-0">Tuần:</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 font-extrabold text-xs rounded border border-slate-200 whitespace-nowrap">
                          {item.week}
                        </span>
                      </td>

                      {/* Column 2: Ngày */}
                      <td className="px-4 py-1.5 md:py-3 flex items-center md:table-cell">
                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-20 shrink-0">Ngày:</span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {item.updatedAt?.split('-').reverse().join('/') || '--/--'}
                        </span>
                      </td>

                      {/* Column 3: Lễ Phụng Vụ */}
                      <td className="px-4 py-2 md:py-3 flex flex-col md:table-cell align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${season.badgeBg}`}></span>
                          <span className="text-sm font-black text-slate-800 leading-tight">
                            {item.liturgicalFeast}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 md:ml-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${season.bg}`}>
                            {season.label}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Nội dung */}
                      <td className="px-4 py-2 md:py-3 flex flex-col md:table-cell align-middle">
                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-20 shrink-0 mb-1">Nội dung:</span>
                        {item.lessonContent ? (
                          <div className="flex items-start gap-1.5">
                            <CheckSquare size={12} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm font-bold text-slate-700 leading-tight">
                              {item.lessonContent}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa cập nhật nội dung</span>
                        )}
                      </td>

                      {/* Column 5: Ghi chú */}
                      <td className="px-4 py-1.5 md:py-3 flex items-center md:table-cell">
                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase w-20 shrink-0">Ghi chú:</span>
                        {item.notes ? (
                          <div className="text-xs text-rose-600 font-bold bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 w-fit">
                            <AlertCircle size={10} className="shrink-0" />
                            <span className="truncate max-w-[120px]" title={item.notes}>{item.notes}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>

                      {/* Column 6: Tác vụ */}
                      <td className="px-4 py-3 md:py-2 flex justify-end items-center gap-0.5 md:table-cell text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit size={13} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm my-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Không tìm thấy chương trình nào</h3>
            <p className="text-xs text-slate-400 mb-6">Hãy thử thay đổi điều kiện lọc lớp học hoặc từ khóa tìm kiếm của bạn.</p>
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
              >
                Tạo tuần chương trình đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="text-amber-500" size={20} />
                <h3 className="text-sm font-black uppercase text-slate-800">
                  {editingItem ? 'Cập Nhật Chương Trình Tuần' : 'Thêm Tuần Chương Trình Mới'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-xs">
              {/* Alert block for GLVs */}
              {!isAdmin && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2 text-amber-700 font-bold mb-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Tài khoản Giáo Lý Viên (GLV)</span>
                    <span className="font-medium text-[11px] text-amber-600 leading-relaxed">Bạn chỉ có quyền bổ sung bài giảng giáo lý, hoạt động cụ thể và nhắc nhở cho các lớp. Tuần phụng vụ và Lễ phụng vụ do Ban Quản Trị thiết lập sẵn.</span>
                  </div>
                </div>
              )}

              {/* Week & Feast Row (Only editable by Admin) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số tuần / Nhãn tuần *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    placeholder="Ví dụ: Tuần 1, Tuần 2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all disabled:opacity-75 disabled:bg-slate-100"
                    value={formWeek}
                    onChange={(e) => setFormWeek(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên ngày lễ phụng vụ *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    placeholder="Ví dụ: Chúa nhật 22 Thường Niên, Chúa nhật I Mùa Vọng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all disabled:opacity-75 disabled:bg-slate-100"
                    value={formLiturgicalFeast}
                    onChange={(e) => setFormLiturgicalFeast(e.target.value)}
                  />
                </div>
              </div>

              {/* Class Selection - Choose which classes can share this schedule */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Lớp áp dụng (Chọn được nhiều lớp để dùng chung lịch) *
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllClasses}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold uppercase hover:underline"
                  >
                    {formClassIds.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả các lớp'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto custom-scrollbar">
                  {classes.map(c => {
                    const isChecked = formClassIds.includes(c.id);
                    return (
                      <label 
                        key={c.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all
                          ${isChecked ? 'bg-amber-500/10 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleClassCheckboxChange(c.id)}
                          className="rounded text-amber-500 focus:ring-amber-500/20"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Related Catechism Lesson Content */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nội dung bài học giáo lý liên quan (GLV nhập)</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Bài 1 - Thiên Chúa là Cha, Người hằng chăm sóc chúng ta..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                  value={formLessonContent}
                  onChange={(e) => setFormLessonContent(e.target.value)}
                />
              </div>

              {/* Notes / Reminders */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ghi chú nhắc nhở chi tiết cho từng tuần (Ví dụ: mang tập vẽ, ôn bài)</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Khuyến khích học viên đi đúng giờ; Dặn dò đem theo bút màu và nộp lại vở học bài cũ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider rounded-xl shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  {editingItem ? 'Lưu' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tuần chương trình này không? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (deleteConfirmId) {
            setCurriculum(prev => prev.filter(item => item.id !== deleteConfirmId));
            toast.success('Xóa tuần chương trình thành công!');
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
        type="danger"
      />
    </div>
  );
};
