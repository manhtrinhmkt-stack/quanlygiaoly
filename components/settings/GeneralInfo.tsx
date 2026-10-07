
import React from 'react';
import { Building, Save } from 'lucide-react';

interface GeneralInfoProps {
    parishName: string;
    setParishName: (val: string) => void;
    priestName: string;
    setPriestName: (val: string) => void;
    headOfBoardName: string;
    setHeadOfBoardName: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    handleSaveGeneral: () => void;
}

export const GeneralInfo: React.FC<GeneralInfoProps> = ({
    parishName, setParishName, priestName, setPriestName, headOfBoardName, setHeadOfBoardName, address, setAddress, phone, setPhone, handleSaveGeneral,
}) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 xl:col-span-2">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Building className="text-blue-600 w-6 h-6" />
                <h3 className="font-bold text-xl text-slate-800">Thông tin chung</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên Giáo Xứ / Đơn Vị</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={parishName} onChange={e => setParishName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Linh Mục Phụ Trách / Tuyên Úy</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={priestName} onChange={e => setPriestName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trưởng Ban</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={headOfBoardName} onChange={e => setHeadOfBoardName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Địa chỉ</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Điện thoại liên hệ</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
            </div>

            {/* Sidebar Toggle Info */}
            <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-base text-slate-800 mb-1">Thanh điều hướng bên trái</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Hệ thống sử dụng thanh điều hướng cột đứng mở rộng, giúp hiển thị trực quan và rõ ràng nhất. Bạn có thể nhấn nút thu gọn ở góc dưới thanh điều hướng bất kỳ lúc nào để tối ưu hóa không gian hiển thị màn hình. Trạng thái đóng/mở này được tự động lưu lại cho các lần truy cập tiếp theo.
                </p>
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={handleSaveGeneral} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow flex items-center gap-2">
                    <Save size={18}/> Lưu Thông Tin
                </button>
            </div>
        </div>
    );
};
