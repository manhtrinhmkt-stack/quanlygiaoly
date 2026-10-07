import React from 'react';

export const SystemHistory: React.FC = () => {
  // Mock data for now
  const logs = [
    { id: 1, timestamp: '2026-04-03 10:00', user: 'Admin', action: 'Đăng nhập', target: 'Hệ thống' },
    { id: 2, timestamp: '2026-04-03 10:05', user: 'Admin', action: 'Thay đổi cấu hình', target: 'Điểm danh' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử hệ thống</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="text-left py-2">Thời gian</th>
              <th className="text-left py-2">Người dùng</th>
              <th className="text-left py-2">Hành động</th>
              <th className="text-left py-2">Đối tượng</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="py-3 text-slate-600">{log.timestamp}</td>
                <td className="py-3 font-bold text-slate-800">{log.user}</td>
                <td className="py-3 text-slate-700">{log.action}</td>
                <td className="py-3 text-slate-600">{log.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
