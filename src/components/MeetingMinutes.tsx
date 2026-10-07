import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { Lock, Unlock, Save, FileText, Bold, Italic, List } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface MeetingMinutesProps {
  mode: 'SECRETARY' | 'PARENT';
}

interface MeetingData {
  id: string;
  subject: string;
  date: string;
  content: string;
  password: string; // Storing password hash or just using the password to encrypt
}

// Helper to get meetings from localStorage
const getMeetings = (): MeetingData[] => {
  const data = localStorage.getItem('meeting_minutes_list');
  return data ? JSON.parse(data) : [];
};

export const MeetingMinutes: React.FC<MeetingMinutesProps> = ({ mode }) => {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [decryptedData, setDecryptedData] = useState<MeetingData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getMeetings();
    if (existing.length === 0) {
        const mock1 = { id: '1', subject: 'Họp Phụ huynh đầu năm', date: '2026-09-05', content: CryptoJS.AES.encrypt('# Nội dung họp đầu năm\n- Chào đón phụ huynh\n- Thông báo kế hoạch học tập', '123').toString(), password: '123' };
        const mock2 = { id: '2', subject: 'Họp Ban đại diện', date: '2026-10-10', content: CryptoJS.AES.encrypt('# Nội dung họp ban đại diện\n- Báo cáo tài chính\n- Kế hoạch hoạt động tháng 11', '456').toString(), password: '456' };
        const mockData = [mock1, mock2];
        localStorage.setItem('meeting_minutes_list', JSON.stringify(mockData));
        setMeetings(mockData);
    } else {
        setMeetings(existing);
    }
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const insertMarkdown = (syntax: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    let newText = '';
    if (syntax === 'list') {
        newText = before + '\n- ' + selection + after;
    } else {
        newText = before + syntax + selection + syntax + after;
    }
    setContent(newText);
    textareaRef.current.focus();
  };

  const handleSave = () => {
    if (!subject || !date || !content || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin và mật khẩu.');
      return;
    }
    
    let updatedMeetings: MeetingData[];
    
    if (selectedMeetingId) {
      // Update existing meeting
      updatedMeetings = meetings.map(m => 
        m.id === selectedMeetingId 
          ? { ...m, subject, date, content: CryptoJS.AES.encrypt(content, password).toString(), password }
          : m
      );
      toast.success('Đã cập nhật biên bản thành công!');
    } else {
      // Create new meeting
      const newMeeting: MeetingData = { 
          id: Date.now().toString(),
          subject, 
          date, 
          content: CryptoJS.AES.encrypt(content, password).toString(),
          password
      };
      updatedMeetings = [...meetings, newMeeting];
      toast.success('Đã lưu biên bản thành công!');
    }
    
    localStorage.setItem('meeting_minutes_list', JSON.stringify(updatedMeetings));
    setMeetings(updatedMeetings);
    
    // Reset form
    setSubject('');
    setDate('');
    setContent('');
    setPassword('');
    setSelectedMeetingId('');
  };

  const handleDelete = (id: string) => {
    const updated = meetings.filter(item => item.id !== id);
    localStorage.setItem('meeting_minutes_list', JSON.stringify(updated));
    setMeetings(updated);
    setMeetingToDelete(null);
    toast.success('Đã xóa biên bản!');
  };

  const handleUnlock = () => {
    const meeting = meetings.find(m => m.id === selectedMeetingId);
    if (!meeting) {
      toast.error('Vui lòng chọn cuộc họp.');
      return;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(meeting.content, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        setDecryptedData({ ...meeting, content: decrypted });
        setIsUnlocked(true);
        toast.success('Giải mã thành công!');
      } else {
        toast.error('Mật khẩu không đúng.');
      }
    } catch (e) {
      toast.error('Mật khẩu không đúng.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="text-blue-600" />
        {mode === 'SECRETARY' ? 'Quản lý Biên bản Họp' : 'Tra cứu Biên bản Họp'}
      </h2>

      {mode === 'SECRETARY' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700">Danh sách biên bản</h3>
              <button 
                onClick={() => { setSelectedMeetingId(''); setSubject(''); setDate(''); setContent(''); setPassword(''); }}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                + Thêm mới
              </button>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {meetings.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <p className="text-sm">Chưa có dữ liệu.</p>
                </div>
              ) : (
                meetings.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg border transition-all ${selectedMeetingId === m.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm ${selectedMeetingId === m.id ? 'text-blue-700' : 'text-slate-800'}`}>{m.subject}</span>
                      <div className="flex gap-2">
                        <button onClick={() => {
                            const decrypted = CryptoJS.AES.decrypt(m.content, m.password).toString(CryptoJS.enc.Utf8);
                            setSubject(m.subject); setDate(m.date); setContent(decrypted); setPassword(m.password); setSelectedMeetingId(m.id);
                            scrollToForm();
                        }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Sửa</button>
                        <button onClick={() => setMeetingToDelete(m.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Xóa</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">Ngày: {m.date}</p>
                    {meetingToDelete === m.id && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded flex items-center justify-between">
                        <span className="text-[10px] text-red-600 font-bold uppercase">Xác nhận xóa?</span>
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(m.id)} className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded">Xóa</button>
                          <button onClick={() => setMeetingToDelete(null)} className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">Hủy</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200" ref={formRef}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              {selectedMeetingId ? (
                <><Unlock size={18} className="text-orange-500" /> Chỉnh sửa biên bản</>
              ) : (
                <><Save size={18} className="text-green-500" /> Thêm biên bản mới</>
              )}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Chủ đề cuộc họp</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder="Ví dụ: Họp phụ huynh đầu năm..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Ngày họp</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nội dung biên bản</label>
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                <div className="flex gap-2 p-2 bg-slate-100 border-b border-slate-300">
                    <button type="button" onClick={() => insertMarkdown('**')} className="p-1.5 hover:bg-white rounded transition-colors" title="In đậm"><Bold size={14}/></button>
                    <button type="button" onClick={() => insertMarkdown('*')} className="p-1.5 hover:bg-white rounded transition-colors" title="In nghiêng"><Italic size={14}/></button>
                    <button type="button" onClick={() => insertMarkdown('list')} className="p-1.5 hover:bg-white rounded transition-colors" title="Danh sách"><List size={14}/></button>
                </div>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-64 p-4 outline-none resize-none text-sm leading-relaxed"
                    placeholder="Nhập nội dung chi tiết cuộc họp tại đây..."
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mật khẩu bảo vệ</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                placeholder="Nhập mật khẩu để phụ huynh có thể xem..."
              />
              <p className="text-[10px] text-slate-400 mt-1 italic">* Mật khẩu này dùng để mã hóa nội dung, hãy cung cấp cho phụ huynh khi cần tra cứu.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg active:scale-95 ${selectedMeetingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Save size={18} /> {selectedMeetingId ? 'Cập nhật thay đổi' : 'Lưu biên bản ngay'}
              </button>
              
              {selectedMeetingId && (
                  <button 
                    onClick={() => { setSelectedMeetingId(''); setSubject(''); setDate(''); setContent(''); setPassword(''); }} 
                    className="px-6 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                  >
                    Hủy bỏ
                  </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-slate-700">Danh sách cuộc họp</h3>
            {meetings.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <FileText size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Chưa có biên bản nào.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {meetings.map(m => (
                      <button
                          key={m.id}
                          onClick={() => { 
                              setSelectedMeetingId(m.id); 
                              setIsUnlocked(false); 
                              setPassword(''); 
                              setDecryptedData(null);
                          }}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${selectedMeetingId === m.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                      >
                          <h4 className={`font-bold ${selectedMeetingId === m.id ? 'text-blue-700' : 'text-slate-800'}`}>{m.subject}</h4>
                          <p className="text-xs text-slate-500 mt-1">Ngày: {m.date}</p>
                      </button>
                  ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            {!selectedMeetingId ? (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                <Unlock size={48} className="mb-4 opacity-20" />
                <p>Chọn một cuộc họp từ danh sách để xem chi tiết</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {!isUnlocked ? (
                  <div className="p-8 space-y-6">
                    <div className="text-center">
                      <Lock size={48} className="mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-bold text-slate-800">Biên bản đang bị khóa</h3>
                      <p className="text-sm text-slate-500 mt-1">Vui lòng nhập mật khẩu để giải mã nội dung</p>
                    </div>
                    <div className="max-w-sm mx-auto space-y-4">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Nhập mật khẩu..."
                        autoFocus
                      />
                      <button
                        onClick={handleUnlock}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        <Unlock size={18} /> Giải mã biên bản
                      </button>
                    </div>
                  </div>
                ) : decryptedData && (
                  <div className="p-0">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{decryptedData.subject}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <FileText size={14} />
                            Ngày họp: {decryptedData.date}
                          </p>
                      </div>
                      <button 
                          onClick={() => { setIsUnlocked(false); setSelectedMeetingId(''); setDecryptedData(null); }}
                          className="px-3 py-1 text-sm bg-white border border-slate-300 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                      >
                          Đóng
                      </button>
                    </div>
                    <div className="p-8 prose prose-slate max-w-none">
                      <ReactMarkdown>{decryptedData.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
