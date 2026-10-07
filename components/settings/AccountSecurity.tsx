
import React from 'react';
import { UserCog, Lock } from 'lucide-react';

interface AccountSecurityProps {
    currentPass: string;
    setCurrentPass: (val: string) => void;
    newPass: string;
    setNewPass: (val: string) => void;
    confirmPass: string;
    setConfirmPass: (val: string) => void;
    handleChangePassword: () => void;
}

export const AccountSecurity: React.FC<AccountSecurityProps> = ({
    currentPass, setCurrentPass, newPass, setNewPass, confirmPass, setConfirmPass, handleChangePassword
}) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <UserCog className="text-slate-600 w-6 h-6" />
                <h3 className="font-bold text-xl text-slate-800">Tài Khoản & Bảo Mật</h3>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={currentPass} onChange={e => setCurrentPass(e.target.value)}/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={newPass} onChange={e => setNewPass(e.target.value)}/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nhập lại mật khẩu mới</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="password" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}/>
                    </div>
                </div>
                <button onClick={handleChangePassword} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 shadow mt-2">
                    Đổi Mật Khẩu
                </button>
            </div>
        </div>
    );
};
