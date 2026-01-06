
import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, FileSpreadsheet, Calendar, Banknote } from 'lucide-react';
import { Transaction } from '../types';

interface FinanceProps {
    transactions: Transaction[];
    setTransactions: (t: Transaction[]) => void;
}

export const Finance: React.FC<FinanceProps> = ({ transactions, setTransactions }) => {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'INCOME'|'EXPENSE'>('INCOME');
  
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

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
      const rawAmount = parseInt(amountStr.replace(/\./g, ''), 10);
      if (!rawAmount || !description) return alert("Vui lòng nhập số tiền và nội dung");
      const newTx: Transaction = {
          id: `T${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: type,
          amount: rawAmount,
          description: description,
          note: note
      };
      setTransactions([newTx, ...transactions]);
      setAmountStr(''); setDescription(''); setNote('');
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Ngày", "Loại", "Số tiền", "Nội dung", "Ghi chú"];
    const rows = transactions.map(t => [t.id, t.date, t.type === 'INCOME' ? 'THU' : 'CHI', t.amount, `"${t.description}"`, `"${t.note || ''}"`]);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Thủ Quỹ & Tài Chính</h2>
        <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-sm font-bold uppercase"><FileSpreadsheet size={18} /> Xuất Excel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <Wallet className="absolute right-4 top-4 opacity-20 w-24 h-24" />
          <p className="text-blue-100 mb-1 text-sm font-bold uppercase tracking-wider">Tổng quỹ hiện tại</p>
          <h3 className="text-3xl font-black tracking-tight">{formatCurrency(balance)}</h3>
          <p className="text-[10px] text-blue-200 mt-4 opacity-80 uppercase font-bold tracking-widest">Cập nhật: Hôm nay</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20} /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Tổng Thu (Năm nay)</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20} /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Tổng Chi (Năm nay)</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalExpense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-lg mb-6 text-slate-800 uppercase tracking-tight border-b pb-2">Tạo Giao Dịch Mới</h3>
            <div className="space-y-5">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button onClick={() => setType('INCOME')} className={`flex-1 py-2.5 rounded-lg shadow-sm text-xs font-black flex justify-center gap-2 items-center transition-all uppercase ${type === 'INCOME' ? 'bg-white text-green-600' : 'text-slate-500'}`}><Plus size={16}/> Thu vào</button>
                <button onClick={() => setType('EXPENSE')} className={`flex-1 py-2.5 rounded-lg shadow-sm text-xs font-black flex justify-center gap-2 items-center transition-all uppercase ${type === 'EXPENSE' ? 'bg-white text-red-600' : 'text-slate-500'}`}><Minus size={16}/> Chi ra</button>
                </div>
                <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Số tiền (VNĐ)</label>
                <input type="text" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-black text-xl text-blue-700 text-center" placeholder="0" value={amountStr} onChange={handleAmountChange}/>
                </div>
                <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Nội dung <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder="VD: Thu tiền sách..." value={description} onChange={(e) => setDescription(e.target.value)}/>
                </div>
                <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Ghi chú</label>
                <textarea className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm font-medium" placeholder="..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                </div>
                <button onClick={handleAddTransaction} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase text-sm tracking-widest active:scale-95 transition-all">Lưu Giao Dịch</button>
            </div>
            </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Lịch Sử Giao Dịch</h3>
          </div>
          <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 shadow-sm border-b border-slate-200 z-10">
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                  <th className="px-6 py-4 text-center">Loại</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 border-b border-slate-100 text-sm last:border-0 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-sm font-bold whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm uppercase">{t.description}</div>
                      {t.note && <div className="text-[11px] text-slate-400 mt-1 font-medium italic">{t.note}</div>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-slate-700 text-base">{formatCurrency(t.amount)}</td>
                    <td className="px-6 py-4 text-center">
                       {t.type === 'INCOME' ? (
                         <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase border border-green-200">Thu</span>
                       ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase border border-red-200">Chi</span>
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
