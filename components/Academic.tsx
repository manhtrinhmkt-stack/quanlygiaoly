import React, { useState } from 'react';
import { MOCK_STUDENTS, MOCK_CLASSES, MOCK_ACADEMIC_RECORDS } from '../constants';
import { Check, X } from 'lucide-react';
import { AcademicRecord } from '../types';

export const Academic: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades'>('attendance');
  const [selectedClass, setSelectedClass] = useState('c1');
  const [term, setTerm] = useState('HK1');
  const [date, setDate] = useState('2023-10-22');

  const filteredStudents = MOCK_STUDENTS.filter(s => s.classId === selectedClass);

  // Updated fallback object to include missing absentP and absentK properties
  const getRecord = (studentId: string): AcademicRecord => {
    return MOCK_ACADEMIC_RECORDS.find(r => r.studentId === studentId && r.term === term) || {
      studentId,
      term: term as 'HK1' | 'HK2',
      scores: {}, 
      scorePray: 0, 
      scoreExam: 0, 
      average: 0,
      absentP: 0,
      absentK: 0
    };
  };

  const calculateAvg = (s15: number, s45: number, pray: number, exam: number) => {
    // Formula: (15' + 45'*2 + Pray + Exam*3) / 7 (Example logic)
    // Simplified for demo:
    const avg = (s15 + s45 * 2 + pray + exam * 2) / 6;
    return avg.toFixed(1);
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Điểm Số & Chuyên Cần</h2>
        <div className="bg-slate-200 p-1 rounded-lg flex">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'attendance' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
          >
            Chuyên Cần
          </button>
          <button 
            onClick={() => setActiveTab('grades')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'grades' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
          >
            Bảng Điểm
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
        <select 
          className="px-3 py-2 border rounded-lg"
          value={selectedClass}
          // Fixed: Changed target.value to e.target.value to resolve "Cannot find name 'target'" error.
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        {activeTab === 'grades' && (
          <select 
            className="px-3 py-2 border rounded-lg"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            <option value="HK1">Học Kỳ 1</option>
            <option value="HK2">Học Kỳ 2</option>
          </select>
        )}

        {activeTab === 'attendance' && (
          <input 
            type="date" 
            className="px-3 py-2 border rounded-lg"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'attendance' ? (
             <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                 <th className="p-4 w-16 text-center">STT</th>
                 <th className="p-4">Học Viên</th>
                 <th className="p-4 text-center border-l">Đi Lễ (Có/Ko Phép)</th>
                 <th className="p-4 text-center border-l">Học GL (Có/Ko Phép)</th>
                 <th className="p-4 text-center">Ghi chú</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredStudents.map((s, idx) => (
                 <tr key={s.id} className="hover:bg-slate-50">
                   <td className="p-4 text-center">{idx + 1}</td>
                   <td className="p-4 font-medium">{s.saintName} {s.fullName}</td>
                   <td className="p-4 border-l">
                     <div className="flex justify-center gap-4">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                         <span className="text-sm">Có mặt</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                         <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                         <span className="text-sm">Phép</span>
                       </label>
                     </div>
                   </td>
                   <td className="p-4 border-l">
                     <div className="flex justify-center gap-4">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                         <span className="text-sm">Có mặt</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                         <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                         <span className="text-sm">Phép</span>
                       </label>
                     </div>
                   </td>
                   <td className="p-4">
                     <input type="text" className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none text-sm" placeholder="..." />
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 w-16 text-center">STT</th>
                  <th className="p-4 min-w-[200px]">Học Viên</th>
                  <th className="p-4 w-24 text-center border-l bg-slate-50">15' (x1)</th>
                  <th className="p-4 w-24 text-center border-l bg-slate-50">45' (x2)</th>
                  <th className="p-4 w-24 text-center border-l bg-slate-50">Kinh (x1)</th>
                  <th className="p-4 w-24 text-center border-l bg-slate-50">Thi (x2)</th>
                  <th className="p-4 w-24 text-center border-l bg-blue-50 font-bold text-blue-700">TB</th>
                  <th className="p-4 w-32 text-center border-l">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const r = getRecord(s.id);
                  const avg = parseFloat(r.average.toString());
                  let rank = 'Giỏi';
                  let rankColor = 'text-green-600 bg-green-50';
                  if (avg < 5) { rank = 'Yếu'; rankColor = 'text-red-600 bg-red-50'; }
                  else if (avg < 6.5) { rank = 'TB'; rankColor = 'text-orange-600 bg-orange-50'; }
                  else if (avg < 8) { rank = 'Khá'; rankColor = 'text-blue-600 bg-blue-50'; }

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 group">
                      <td className="p-4 text-center">{idx + 1}</td>
                      <td className="p-4 font-medium">{s.saintName} {s.fullName}</td>
                      <td className="p-2 border-l text-center">
                        <input type="number" defaultValue={r.scores?.['col_15m'] || 0} className="w-12 text-center p-1 rounded border border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none" />
                      </td>
                      <td className="p-2 border-l text-center">
                        <input type="number" defaultValue={r.scores?.['col_45m'] || 0} className="w-12 text-center p-1 rounded border border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none" />
                      </td>
                      <td className="p-2 border-l text-center">
                        <input type="number" defaultValue={r.scorePray} className="w-12 text-center p-1 rounded border border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none" />
                      </td>
                       <td className="p-2 border-l text-center">
                        <input type="number" defaultValue={r.scoreExam} className="w-12 text-center p-1 rounded border border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none" />
                      </td>
                      <td className="p-4 border-l text-center font-bold text-slate-800">
                        {r.average || '-'}
                      </td>
                      <td className="p-4 border-l text-center">
                         {r.average > 0 && <span className={`px-2 py-1 rounded text-xs font-bold ${rankColor}`}>{rank}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {activeTab === 'grades' && (
           <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
             <button className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Lưu Bảng Điểm</button>
           </div>
        )}
      </div>
    </div>
  );
};