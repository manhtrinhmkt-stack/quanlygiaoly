
import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, FileSpreadsheet, Calendar, Banknote, Search } from 'lucide-react';
import { Transaction, SchoolYear, Teacher, hasPermission } from '../types';
import { toast } from 'sonner';

interface FinanceProps {
    transactions: Transaction[];
    setTransactions: (t: Transaction[]) => void;
    years: SchoolYear[];
    currentUser: Teacher | null;
}

export const Finance: React.FC<FinanceProps> = ({ transactions, setTransactions, years, currentUser }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const activeYearObj = years.find(y => y.isActive);
  const isYearLocked = activeYearObj?.isLocked && !isAdmin;
  const canEditFinance = hasPermission(currentUser, 'finance', 'edit');

  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'INCOME'|'EXPENSE'>('INCOME');
  // Advanced Filtering State
  const [filterMode, setFilterMode] = useState<'ALL' | 'YEAR' | 'MONTH' | 'RANGE'>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeYear = years.find(y => y.isActive)?.id || '';

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      let matchesFilter = true;
      
      if (filterMode === 'YEAR') {
        // If years.name is "2023-2024", we check if t.date starts with "2023" or similar
        // But for simplicity, we assume school years start in second half of year
        const yearObj = years.find(y => y.name === selectedYear);
        if (selectedYear !== 'all' && yearObj) {
           const yearsMatch = yearObj.name.match(/\d{4}/g);
           if (yearsMatch) {
             const startY = yearsMatch[0];
             const endY = yearsMatch[1] || (parseInt(startY) + 1).toString();
             // School year usually Aug to July
             matchesFilter = (t.date >= `${startY}-08-01` && t.date <= `${endY}-07-31`);
           }
        }
      } else if (filterMode === 'MONTH') {
        matchesFilter = t.date.startsWith(selectedMonth);
      } else if (filterMode === 'RANGE') {
        if (startDate) matchesFilter = matchesFilter && t.date >= startDate;
        if (endDate) matchesFilter = matchesFilter && t.date <= endDate;
      }

      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (t.performer && t.performer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            t.amount.toString().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filterMode, selectedYear, selectedMonth, startDate, endDate, searchTerm, years]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumberWithDots = (val: string) => {
    const rawValue = val.replace(/\D/g, '');
    return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmountStr(formatNumberWithDots(e.target.value));
  };

  const handleAddTransaction = () => {
      if (isYearLocked) {
          toast.error("Niên khóa hiện tại đã bị khóa. Không thể tạo giao dịch mới!");
          return;
      }
      if (!canEditFinance) {
          toast.error("Bạn không có quyền tạo giao dịch tài chính!");
          return;
      }
      const rawAmount = parseInt(amountStr.replace(/\./g, ''), 10);
      if (!rawAmount || !description) return toast.error("Vui lòng nhập số tiền và nội dung");
      
      const performerName = currentUser ? `${currentUser.saintName} ${currentUser.fullName}` : 'Hệ thống';

      const newTx: Transaction = {
          id: `T${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: type,
          amount: rawAmount,
          description: description,
          note: note,
          performer: performerName
      };
      setTransactions([newTx, ...transactions]);
      setAmountStr(''); setDescription(''); setNote('');
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Ngày", "Loại", "Số tiền", "Nội dung", "Ghi chú", "Người thực hiện"];
    const rows = filteredTransactions.map(t => [t.id, t.date, t.type === 'INCOME' ? 'THU' : 'CHI', t.amount, `"${t.description}"`, `"${t.note || ''}"`, `"${t.performer || ''}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "so_quy_giao_ly.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 h-screen overflow-y-auto bg-slate-50">
      {isYearLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <span className="text-amber-600 shrink-0">🔒</span>
              <span>Niên khóa hoạt động hiện tại đã bị khóa. Toàn bộ thông tin tài chính hiển thị ở chế độ Chỉ Đọc. Người dùng có vai trò Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để cập nhật tài chính.</span>
          </div>
      )}
      {!canEditFinance && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold mb-4 shadow-sm shrink-0">
              <span className="text-amber-600 shrink-0">⚠️</span>
              <span>Bạn không có quyền chỉnh sửa sổ quỹ tài chính. Toàn bộ thông tin hiển thị dưới dạng Chỉ Đọc.</span>
          </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Thủ quỹ & Tài chính</h2>
        <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-sm font-bold"><FileSpreadsheet size={18} /> Xuất Excel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <Wallet className="absolute right-4 top-4 opacity-20 w-24 h-24" />
          <p className="text-blue-100 mb-1 text-sm font-bold tracking-wider">Tổng quỹ hiện tại</p>
          <h3 className="text-3xl font-black tracking-tight">{formatCurrency(balance)}</h3>
          <p className="text-[10px] text-blue-200 mt-4 opacity-80 font-bold tracking-widest">Cập nhật: Hôm nay</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20} /></div>
            <p className="text-slate-500 font-bold text-xs tracking-wider">Tổng thu (Đã lọc)</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20} /></div>
            <p className="text-slate-500 font-bold text-xs tracking-wider">Tổng chi (Đã lọc)</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalExpense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-lg mb-6 text-slate-800 tracking-tight border-b pb-2">Tạo giao dịch mới</h3>
            <div className="space-y-5">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                  disabled={isYearLocked || !canEditFinance}
                  onClick={() => setType('INCOME')} 
                  className={`flex-1 py-2.5 rounded-lg shadow-sm text-xs font-black flex justify-center gap-2 items-center transition-all ${isYearLocked || !canEditFinance ? 'opacity-50 cursor-not-allowed' : ''} ${type === 'INCOME' ? 'bg-white text-green-600' : 'text-slate-500'}`}
                >
                  <Plus size={16}/> Thu vào
                </button>
                <button 
                  disabled={isYearLocked || !canEditFinance}
                  onClick={() => setType('EXPENSE')} 
                  className={`flex-1 py-2.5 rounded-lg shadow-sm text-xs font-black flex justify-center gap-2 items-center transition-all ${isYearLocked || !canEditFinance ? 'opacity-50 cursor-not-allowed' : ''} ${type === 'EXPENSE' ? 'bg-white text-red-600' : 'text-slate-500'}`}
                >
                  <Minus size={16}/> Chi ra
                </button>
                </div>
                <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 tracking-widest">Số tiền (VNĐ)</label>
                <input 
                  type="text" 
                  disabled={isYearLocked || !canEditFinance}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-black text-xl text-blue-700 text-center ${isYearLocked || !canEditFinance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`} 
                  placeholder="0" 
                  value={amountStr} 
                  onChange={handleAmountChange}
                />
                </div>
                <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 tracking-widest">Nội dung <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  disabled={isYearLocked || !canEditFinance}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isYearLocked || !canEditFinance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`} 
                  placeholder="VD: Thu tiền sách..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
                </div>
                <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 tracking-widest">Ghi chú</label>
                <textarea 
                  disabled={isYearLocked || !canEditFinance}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm font-medium ${isYearLocked || !canEditFinance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`} 
                  placeholder="..." 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
                </div>
                <button 
                  disabled={isYearLocked || !canEditFinance}
                  onClick={handleAddTransaction} 
                  className={`w-full py-4 text-white rounded-xl font-black shadow-lg text-sm tracking-widest transition-all ${isYearLocked || !canEditFinance ? 'bg-slate-400 cursor-not-allowed shadow-none opacity-75' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 active:scale-95'}`}
                >
                  Lưu giao dịch
                </button>
            </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit flex flex-col">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
                <h3 className="font-black text-lg text-slate-800 tracking-tight mb-2">Lịch sử giao dịch</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" placeholder="Tìm kiếm nhanh..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lọc theo</label>
                <select 
                    className="p-2 border rounded-lg text-sm font-bold bg-white" 
                    value={filterMode} 
                    onChange={e => setFilterMode(e.target.value as any)}
                >
                    <option value="ALL">Tất cả</option>
                    <option value="YEAR">Năm học</option>
                    <option value="MONTH">Tháng</option>
                    <option value="RANGE">Khoảng ngày</option>
                </select>
            </div>

            {filterMode === 'YEAR' && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn năm</label>
                    <select className="p-2 border rounded-lg text-sm font-bold bg-white" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        <option value="all">Tất cả năm</option>
                        {years.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                    </select>
                </div>
            )}

            {filterMode === 'MONTH' && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn tháng</label>
                    <input 
                        type="month" 
                        className="p-1.5 border rounded-lg text-sm font-bold" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)} 
                    />
                </div>
            )}

            {filterMode === 'RANGE' && (
                <>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ ngày</label>
                        <input 
                            type="date" 
                            className="p-1.5 border rounded-lg text-sm font-bold" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến ngày</label>
                        <input 
                            type="date" 
                            className="p-1.5 border rounded-lg text-sm font-bold" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                        />
                    </div>
                </>
            )}
          </div>
          <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 shadow-sm border-b border-slate-200 z-10">
                <tr className="text-[10px] text-slate-500 tracking-widest font-black">
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4">Người thực hiện</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                  <th className="px-6 py-4 text-center">Loại</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 border-b border-slate-100 text-sm last:border-0 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-sm font-bold whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{t.description}</div>
                      {t.note && <div className="text-[11px] text-slate-400 mt-1 font-medium italic">{t.note}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{t.performer || '-'}</td>
                    <td className="px-6 py-4 text-right font-mono font-black text-slate-700 text-base">{formatCurrency(t.amount)}</td>
                    <td className="px-6 py-4 text-center">
                       {t.type === 'INCOME' ? (
                         <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black border border-green-200">Thu</span>
                       ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black border border-red-200">Chi</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
