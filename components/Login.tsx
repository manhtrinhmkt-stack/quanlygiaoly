
import React, { useState } from 'react';
import { Church, Lock, User } from 'lucide-react';
import { MOCK_TEACHERS } from '../constants';
import { Teacher } from '../types';

interface LoginProps {
  onLogin: (user: Teacher) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // MOCK LOGIN LOGIC
    // Check against username OR email OR id
    
    const user = MOCK_TEACHERS.find(t => 
      (t.username && t.username === username) || 
      t.email === username || 
      t.id === username
    );

    if (user) {
        // Check password if set in user object, otherwise fallback to default 'admin' for demo purposes
        const validPassword = user.password || 'admin';
        
        if (password === validPassword) {
            onLogin(user);
        } else {
            setError('Mật khẩu không đúng.');
        }
    } else {
      // Create a fallback demo user if list empty or not found (for easy testing/dev)
      if (username === 'admin' && password === 'admin') {
          onLogin({
              id: 'admin',
              saintName: 'Admin',
              fullName: 'System Admin',
              email: 'admin',
              role: 'ADMIN',
              dob: '', birthPlace: '', address: '', phone: '', educationLevel: '',
              username: 'admin', password: '123'
          });
      } else {
          setError('Tài khoản không tồn tại.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Church className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Giáo xứ Tân Thành</h1>
          <p className="text-blue-100 mt-2">Hệ thống Quản lý Giáo Lý</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tên đăng nhập / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="123"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Đăng Nhập
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            Mặc định: <b>admin</b> / <b>123</b> <br/> hoặc <b>glv01</b> / <b>123</b>
          </div>
        </div>
      </div>
    </div>
  );
};
