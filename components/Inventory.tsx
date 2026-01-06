
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Package, Search, Plus, Minus, AlertTriangle, Edit, Trash2, CheckCircle2, History, TrendingUp, AlertCircle, Shirt, Book, Hexagon } from 'lucide-react';

interface InventoryProps {
    items: InventoryItem[];
    setItems: (items: InventoryItem[]) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, setItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form States
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'BOOK' | 'UNIFORM' | 'SCARF' | 'OTHER'>('BOOK');
  const [newItemQty, setNewItemQty] = useState(0);
  const [newItemMin, setNewItemMin] = useState(10);
  const [newItemUnit, setNewItemUnit] = useState('Cái');
  const [newItemPriceStr, setNewItemPriceStr] = useState('0'); // Format as string for dots

  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [adjustReason, setAdjustReason] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to format string with dots: 1000000 -> 1.000.000
  const formatNumberWithDots = (val: string) => {
    const rawValue = val.replace(/\D/g, ''); // Remove non-digits
    return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'all' || item.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [items, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    const lowStock = items.filter(i => i.quantity <= i.minQuantity).length;
    const totalValue = items.reduce((acc, i) => acc + (i.quantity * i.price), 0);
    return { totalItems, totalQty, lowStock, totalValue };
  }, [items]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemQty(item.quantity);
    setNewItemMin(item.minQuantity);
    setNewItemUnit(item.unit);
    setNewItemPriceStr(formatNumberWithDots(item.price.toString()));
    setShowItemModal(true);
  };

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setNewItemName('');
    setNewItemCategory('BOOK');
    setNewItemQty(0);
    setNewItemMin(10);
    setNewItemUnit('Cái');
    setNewItemPriceStr('0');
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!newItemName) return alert('Vui lòng nhập tên vật tư');
    
    const rawPrice = parseInt(newItemPriceStr.replace(/\./g, ''), 10) || 0;

    if (selectedItem) {
        const updated = items.map(i => i.id === selectedItem.id ? {
            ...i,
            name: newItemName,
            category: newItemCategory,
            quantity: newItemQty,
            minQuantity: newItemMin,
            unit: newItemUnit,
            price: rawPrice
        } : i);
        setItems(updated);
        showToast('Đã cập nhật thông tin vật tư!');
    } else {
        const newItem: InventoryItem = {
            id: `INV${Date.now()}`,
            name: newItemName,
            category: newItemCategory,
            quantity: newItemQty,
            minQuantity: newItemMin,
            unit: newItemUnit,
            price: rawPrice
        };
        setItems([...items, newItem]);
        showToast('Đã thêm vật tư mới thành công!');
    }
    setShowItemModal(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Bạn có chắc muốn xóa vật tư này không?")) {
          setItems(items.filter(i => i.id !== id));
          showToast('Đã xóa vật tư!');
      }
  };

  const handleOpenAdjust = (item: InventoryItem) => {
      setSelectedItem(item);
      setAdjustQty(1);
      setAdjustType('IMPORT');
      setAdjustReason('');
      setShowAdjustModal(true);
  };

  const handleExecuteAdjust = () => {
      if (!selectedItem) return;
      if (adjustQty <= 0) return alert("Số lượng phải lớn hơn 0");

      const delta = adjustType === 'IMPORT' ? adjustQty : -adjustQty;
      const newQty = selectedItem.quantity + delta;

      if (newQty < 0) return alert("Không thể xuất quá số lượng tồn kho!");

      const updated = items.map(i => i.id === selectedItem.id ? { ...i, quantity: newQty } : i);
      setItems(updated);
      showToast(`Đã ${adjustType === 'IMPORT' ? 'nhập' : 'xuất'} kho thành công!`);
      setShowAdjustModal(false);
  };

  const getCategoryLabel = (cat: string) => {
      switch(cat) {
          case 'BOOK': return { label: 'Sách', icon: <Book size={14}/>, color: 'text-blue-600 bg-blue-50 border-blue-200' };
          case 'UNIFORM': return { label: 'Đồng phục', icon: <Shirt size={14}/>, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
          case 'SCARF': return { label: 'Khăn quàng', icon: <Hexagon size={14}/>, color: 'text-orange-600 bg-orange-50 border-orange-200' };
          default: return { label: 'Khác', icon: <Package size={14}/>, color: 'text-slate-600 bg-slate-50 border-slate-200' };
      }
  };

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col relative bg-slate-100/50">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
              <CheckCircle2 size={24} />
              <span className="font-bold">{toast}</span>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Kho & Vật Tư</h2>
            <p className="text-slate-500 text-sm">Quản lý sách, đồng phục và tài sản chung</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-bold transition-all text-sm">
            <Plus size={18} /> <span className="hidden sm:inline">Thêm Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 text-blue-600 rounded-full"><Package size={20}/></div>
              <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Tổng Danh Mục</div>
                  <div className="text-lg md:text-xl font-bold text-slate-800">{stats.totalItems}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
              <div className="p-2 md:p-3 bg-emerald-100 text-emerald-600 rounded-full"><TrendingUp size={20}/></div>
              <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Tổng Giá Trị</div>
                  <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(stats.totalValue)}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
              <div className="p-2 md:p-3 bg-amber-100 text-amber-600 rounded-full"><AlertTriangle size={20}/></div>
              <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Sắp Hết Hàng</div>
                  <div className={`text-lg md:text-xl font-bold ${stats.lowStock > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{stats.lowStock}</div>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
               <div className="p-2 md:p-3 bg-purple-100 text-purple-600 rounded-full"><History size={20}/></div>
               <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Tổng Số Lượng</div>
                  <div className="text-lg md:text-xl font-bold text-slate-800">{stats.totalQty}</div>
               </div>
          </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Tìm tên vật tư, mã..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
             {['all', 'BOOK', 'UNIFORM', 'SCARF', 'OTHER'].map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                     {cat === 'all' ? 'Tất cả' : cat === 'BOOK' ? 'Sách' : cat === 'UNIFORM' ? 'Đồng phục' : cat === 'SCARF' ? 'Khăn' : 'Khác'}
                 </button>
             ))}
         </div>
      </div>

      <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-300 flex-1 overflow-hidden flex flex-col bg-transparent">
          
          {/* MOBILE: CARD VIEW */}
          <div className="md:hidden overflow-y-auto h-full space-y-3 pb-20">
              {filteredItems.map(item => {
                  const catInfo = getCategoryLabel(item.category);
                  const isLowStock = item.quantity <= item.minQuantity;
                  return (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg border ${catInfo.color}`}>
                                      {catInfo.icon}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                                      <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                                  </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {isLowStock ? 'Sắp hết' : 'Sẵn sàng'}
                              </span>
                          </div>
                          
                          <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                               <div>
                                   <div className="text-[10px] text-slate-500 font-bold uppercase">Tồn kho</div>
                                   <div className={`text-xl font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                                       {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                                   </div>
                               </div>
                               <div className="text-right">
                                   <div className="text-[10px] text-slate-500 font-bold uppercase">Đơn giá</div>
                                   <div className="text-sm font-mono font-bold text-blue-600">{formatCurrency(item.price)}</div>
                               </div>
                          </div>

                          <div className="flex gap-2 mt-1">
                              <button onClick={() => handleOpenAdjust(item)} className="flex-1 py-2 text-xs font-bold bg-slate-50 text-blue-600 rounded-lg border border-slate-200 hover:bg-blue-50">Nhập/Xuất</button>
                              <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg"><Edit size={16}/></button>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* DESKTOP: TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase sticky top-0 z-10">
                      <tr>
                          <th className="px-3 py-2 w-16 text-center border-b border-slate-300">#</th>
                          <th className="px-3 py-2 border-b border-slate-300">Tên Vật Tư</th>
                          <th className="px-3 py-2 border-b border-slate-300">Phân Loại</th>
                          <th className="px-3 py-2 text-right border-b border-slate-300">Đơn Giá</th>
                          <th className="px-3 py-2 text-center border-b border-slate-300">Tồn Kho</th>
                          <th className="px-3 py-2 text-center border-b border-slate-300">Trạng Thái</th>
                          <th className="px-3 py-2 text-center border-b border-slate-300 w-32">Thao Tác</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm">
                      {filteredItems.map((item, idx) => {
                          const catInfo = getCategoryLabel(item.category);
                          const isLowStock = item.quantity <= item.minQuantity;
                          return (
                              <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-200 last:border-0 transition-colors">
                                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                  <td className="px-3 py-2">
                                      <div className="font-bold text-slate-800">{item.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                                  </td>
                                  <td className="px-3 py-2">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${catInfo.color}`}>
                                          {catInfo.icon} {catInfo.label}
                                      </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-slate-600">{formatCurrency(item.price)}</td>
                                  <td className="px-3 py-2 text-center">
                                      <span className={`text-base font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>{item.quantity}</span>
                                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                      {item.quantity === 0 ? (
                                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Hết hàng</span>
                                      ) : isLowStock ? (
                                        <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-xs">
                                            <AlertCircle size={14}/> Sắp hết
                                        </div>
                                      ) : (
                                          <span className="text-green-600 font-bold text-xs">Sẵn sàng</span>
                                      )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                      <div className="flex justify-center gap-1">
                                          <button onClick={() => handleOpenAdjust(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Nhập/Xuất kho">
                                              <History size={16}/>
                                          </button>
                                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Chỉnh sửa">
                                              <Edit size={16}/>
                                          </button>
                                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Xóa">
                                              <Trash2 size={16}/>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {showItemModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-scale-in overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800">{selectedItem ? 'Cập Nhật Vật Tư' : 'Thêm Vật Tư Mới'}</h3>
                      <button onClick={() => setShowItemModal(false)}><div className="p-1 hover:bg-slate-200 rounded-full"><Minus size={20} className="rotate-45"/></div></button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                      <div>
                          <label className="label-text">Tên vật tư <span className="text-red-500">*</span></label>
                          <input type="text" className="input-field font-bold" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="VD: Sách Khai Tâm..." autoFocus />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="label-text">Phân loại</label>
                              <select className="input-field" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as any)}>
                                  <option value="BOOK">Sách Giáo Lý</option>
                                  <option value="SCARF">Khăn Quàng</option>
                                  <option value="UNIFORM">Đồng Phục</option>
                                  <option value="OTHER">Khác</option>
                              </select>
                          </div>
                          <div>
                              <label className="label-text">Đơn vị tính</label>
                              <input type="text" className="input-field" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="Cái, Cuốn..." />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="label-text">Số lượng ban đầu</label>
                              <input type="number" className="input-field" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} />
                          </div>
                          <div>
                              <label className="label-text">Đơn giá (VNĐ)</label>
                              <input 
                                type="text" 
                                className="input-field font-mono font-bold text-blue-700" 
                                value={newItemPriceStr} 
                                onChange={e => setNewItemPriceStr(formatNumberWithDots(e.target.value))} 
                              />
                          </div>
                      </div>
                      <div>
                          <label className="label-text text-amber-600">Mức báo sắp hết hàng (Min)</label>
                          <input type="number" className="input-field border-amber-200 focus:border-amber-500" value={newItemMin} onChange={e => setNewItemMin(Number(e.target.value))} />
                          <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẽ cảnh báo khi số lượng thấp hơn mức này.</p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setShowItemModal(false)} className="btn-secondary">Hủy</button>
                      <button onClick={handleSaveItem} className="btn-primary">Lưu Thông Tin</button>
                  </div>
              </div>
          </div>
      )}

      {showAdjustModal && selectedItem && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden">
                   <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">Điều Chỉnh Kho</h3>
                      <p className="text-xs text-slate-500">{selectedItem.name} (Hiện có: {selectedItem.quantity})</p>
                   </div>
                   <div className="p-6 space-y-6">
                       <div className="flex p-1 bg-slate-100 rounded-lg">
                           <button onClick={() => setAdjustType('IMPORT')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${adjustType === 'IMPORT' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>NHẬP KHO (+)</button>
                           <button onClick={() => setAdjustType('EXPORT')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${adjustType === 'EXPORT' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>XUẤT KHO (-)</button>
                       </div>

                       <div className="text-center">
                           <label className="label-text mb-2">Số lượng {adjustType === 'IMPORT' ? 'nhập thêm' : 'xuất đi'}</label>
                           <div className="flex items-center justify-center gap-4">
                               <button onClick={() => setAdjustQty(Math.max(1, adjustQty - 1))} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"><Minus size={20}/></button>
                               <input type="number" className="w-24 text-center text-3xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none pb-1" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} />
                               <button onClick={() => setAdjustQty(adjustQty + 1)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"><Plus size={20}/></button>
                           </div>
                       </div>
                       
                       <div>
                           <label className="label-text">Lý do / Ghi chú</label>
                           <input type="text" className="input-field" placeholder="VD: Bán cho học viên, Mua thêm..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
                       </div>

                       <div className="bg-slate-50 p-3 rounded-lg text-center">
                           <span className="text-xs text-slate-500">Tồn kho sau điều chỉnh</span>
                           <div className="text-xl font-bold text-blue-600">
                               {selectedItem.quantity} {adjustType === 'IMPORT' ? '+' : '-'} {adjustQty} = {adjustType === 'IMPORT' ? selectedItem.quantity + adjustQty : selectedItem.quantity - adjustQty}
                           </div>
                       </div>
                   </div>
                   <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setShowAdjustModal(false)} className="btn-secondary">Hủy</button>
                      <button onClick={handleExecuteAdjust} className={`btn-primary ${adjustType === 'EXPORT' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>Xác Nhận</button>
                  </div>
              </div>
           </div>
      )}

      <style>{`
        .label-text { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }
        .input-field { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; transition: all 0.2s; font-size: 0.9rem; }
        .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .btn-primary { padding: 0.5rem 1rem; background-color: #2563eb; color: white; border-radius: 0.5rem; font-weight: 700; font-size: 0.875rem; transition: background-color 0.2s; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .btn-primary:hover { background-color: #1d4ed8; }
        .btn-secondary { padding: 0.5rem 1rem; background-color: white; color: #374151; border: 1px solid #d1d5db; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s; }
        .btn-secondary:hover { background-color: #f3f4f6; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
