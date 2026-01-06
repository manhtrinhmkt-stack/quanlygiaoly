
import { Student, ClassRoom, SchoolYear, AcademicRecord, Grade, Teacher } from '../types';
import { Search, Plus, Save, User, ScrollText, X, Fingerprint, Calendar, School, Droplets, BookOpen, Flame, Star, Phone, AlertCircle, ChevronRight, Trash2, ArrowLeft, CheckCircle2, Printer, FileText, Users, ArrowRightLeft } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SAINTS } from '../constants';

interface StudentsProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    classes: ClassRoom[];
    years: SchoolYear[];
    records: AcademicRecord[];
    grades: Grade[];
    currentUser: Teacher | null;
}

export const Students: React.FC<StudentsProps> = ({ students, setStudents, classes, years, records, grades, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');

  // UI State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCreating, setIsCreating] = useState(false); // Mode: Creating new student
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  
  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [destinationParish, setDestinationParish] = useState('');

  // Form states
  const [inputId, setInputId] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDob, setInputDob] = useState('');
  const [inputGender, setInputGender] = useState<'Male' | 'Female'>('Male');
  const [inputStatus, setInputStatus] = useState<'ACTIVE' | 'TRANSFERRED' | 'DROPPED'>('ACTIVE');
  const [saintInput, setSaintInput] = useState('');
  const [inputBirthPlace, setInputBirthPlace] = useState('');
  const [inputClassId, setInputClassId] = useState(''); 
  const [inputFatherName, setInputFatherName] = useState('');
  const [inputMotherName, setInputMotherName] = useState('');
  const [inputFatherPhone, setInputFatherPhone] = useState('');
  const [inputMotherPhone, setInputMotherPhone] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [inputBaptismDate, setInputBaptismDate] = useState('');
  const [inputBaptismBy, setInputBaptismBy] = useState('');
  const [inputBaptismSponsor, setInputBaptismSponsor] = useState('');
  const [inputBaptismPlace, setInputBaptismPlace] = useState('');
  const [inputEucharistDate, setInputEucharistDate] = useState('');
  const [inputEucharistBy, setInputEucharistBy] = useState('');
  const [inputEucharistPlace, setInputEucharistPlace] = useState('');
  const [inputConfirmationDate, setInputConfirmationDate] = useState('');
  const [inputConfirmationBy, setInputConfirmationBy] = useState('');
  const [inputConfirmationSponsor, setInputConfirmationSponsor] = useState('');
  const [inputConfirmationPlace, setInputConfirmationPlace] = useState('');
  const [inputOathDate, setInputOathDate] = useState('');
  const [inputNote, setInputNote] = useState('');

  const [showSaintSuggestions, setShowSaintSuggestions] = useState(false);

  const allowedClasses = useMemo(() => {
      if (!currentUser) return [];
      if (isAdmin) return classes;
      const teacherName = `${currentUser.saintName} ${currentUser.fullName}`;
      return classes.filter(c => 
          (c.mainTeacher && c.mainTeacher.includes(teacherName)) || 
          (c.assistants && c.assistants.includes(teacherName))
      );
  }, [classes, currentUser, isAdmin]);

  useEffect(() => {
     const active = years.find(y => y.isActive);
     const activeYearId = active ? active.id : (years[0]?.id || '');
     setSelectedYear(activeYearId);

     if (!isAdmin && activeYearId) {
         const myClassesInYear = allowedClasses.filter(c => c.yearId === activeYearId);
         if (myClassesInYear.length > 0) {
             setSelectedClass(myClassesInYear[0].id);
         } else {
             setSelectedClass('');
         }
     }
  }, [years, isAdmin, allowedClasses]);

  const classesInYear = useMemo(() => allowedClasses.filter(c => c.yearId === selectedYear), [allowedClasses, selectedYear]);
  const availableClasses = useMemo(() => selectedGrade === 'all' ? classesInYear : classesInYear.filter(c => c.gradeId === selectedGrade), [classesInYear, selectedGrade]);
  const modalAvailableClasses = useMemo(() => classesInYear, [classesInYear]);

  // Duplicate detection logic
  const potentialDuplicates = useMemo(() => {
    if (!inputName || !inputDob || selectedStudent) return [];
    const cleanName = inputName.trim().toLowerCase();
    return students.filter(s => 
        s.fullName.trim().toLowerCase() === cleanName && 
        s.dob === inputDob
    );
  }, [inputName, inputDob, students, selectedStudent]);

  const filteredSaints = useMemo(() => MOCK_SAINTS.filter(s => s.name.toLowerCase().includes(saintInput.toLowerCase())), [saintInput]);

  const filteredStudents = useMemo(() => {
    const list = students.filter(student => {
        const matchSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || student.saintName.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.includes(searchTerm);
        let validClassIds: string[] = [];
        if (selectedClass !== 'all' && selectedClass !== '') {
            validClassIds = [selectedClass];
        } else {
            validClassIds = availableClasses.map(c => c.id);
        }
        return matchSearch && validClassIds.includes(student.classId);
    });
    return list.sort((a, b) => (a.fullName.split(' ').pop() || '').localeCompare(b.fullName.split(' ').pop() || '', 'vi'));
  }, [students, searchTerm, selectedClass, availableClasses]);

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'N/A';

  const getClassColor = (classId: string) => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return 'bg-slate-100 text-slate-700 border-slate-200';
      switch (cls.gradeId) {
          case 'g1': return 'bg-pink-100 text-pink-700 border-pink-200';
          case 'g2': return 'bg-green-100 text-green-700 border-green-200';
          case 'g3': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'g4': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  const populateForm = (student: Student | null) => {
      if (student) {
          // EDIT MODE
          setIsCreating(false);
          setSelectedStudent(student);
          setInputId(student.id); 
          setInputName(student.fullName); 
          setInputDob(student.dob); 
          setSaintInput(student.saintName); 
          setInputGender(student.gender); 
          setInputStatus(student.status); 
          setInputBirthPlace(student.birthPlace || ''); 
          setInputClassId(student.classId); 
          setInputFatherName(student.fatherName || ''); 
          setInputMotherName(student.motherName || ''); 
          setInputFatherPhone(student.fatherPhone || ''); 
          setInputMotherPhone(student.motherPhone || ''); 
          setInputAddress(student.address || ''); 
          setInputBaptismDate(student.baptismDate || ''); 
          setInputBaptismBy(student.baptismBy || ''); 
          setInputBaptismSponsor(student.baptismSponsor || ''); 
          setInputBaptismPlace(student.baptismPlace || ''); 
          setInputEucharistDate(student.eucharistDate || ''); 
          setInputEucharistBy(student.eucharistBy || ''); 
          setInputEucharistPlace(student.eucharistPlace || ''); 
          setInputConfirmationDate(student.confirmationDate || ''); 
          setInputConfirmationBy(student.confirmationBy || ''); 
          setInputConfirmationSponsor(student.confirmationSponsor || ''); 
          setInputConfirmationPlace(student.confirmationPlace || ''); 
          setInputOathDate(student.confirmationOathDate || ''); 
          setInputNote(student.note || '');
      } else {
          // CREATE MODE
          setIsCreating(true);
          setSelectedStudent(null);
          const prefix = selectedYear.slice(2, 4);
          const yearStudents = students.filter(s => s.id.startsWith(prefix));
          const nextNum = (yearStudents.length > 0 ? Math.max(...yearStudents.map(s => parseInt(s.id.slice(2)))) + 1 : 1).toString().padStart(4, '0');
          
          setInputId(`${prefix}${nextNum}`); 
          setInputName(''); 
          setInputDob(''); 
          setSaintInput(''); 
          setInputGender('Male'); 
          setInputStatus('ACTIVE'); 
          setInputClassId(selectedClass || (modalAvailableClasses[0]?.id || '')); 
          setInputBirthPlace(''); 
          setInputFatherName(''); 
          setInputMotherName(''); 
          setInputFatherPhone(''); 
          setInputMotherPhone(''); 
          setInputAddress(''); 
          setInputBaptismDate(''); 
          setInputBaptismBy(''); 
          setInputBaptismSponsor(''); 
          setInputBaptismPlace(''); 
          setInputEucharistDate(''); 
          setInputEucharistBy(''); 
          setInputEucharistPlace(''); 
          setInputConfirmationDate(''); 
          setInputConfirmationBy(''); 
          setInputConfirmationSponsor(''); 
          setInputConfirmationPlace(''); 
          setInputOathDate(''); 
          setInputNote('');
      }
  };

  const handleSaveStudent = () => {
    if (!inputName || !inputDob || !saintInput) return alert("Vui lòng nhập đầy đủ: Tên thánh, họ tên, ngày sinh.");
    
    // Check for duplicates before saving (only for new entries)
    if (!selectedStudent && potentialDuplicates.length > 0) {
        setShowDuplicateModal(true);
        return;
    }
    executeSave();
  };

  const executeSave = () => {
    const studentData: Student = { id: inputId, fullName: inputName, dob: inputDob, saintName: saintInput, gender: inputGender, status: inputStatus, classId: inputClassId, parish: 'Gx. Tân Thành', birthPlace: inputBirthPlace, fatherName: inputFatherName, motherName: inputMotherName, fatherPhone: inputFatherPhone, motherPhone: inputMotherPhone, address: inputAddress, baptismDate: inputBaptismDate, baptismBy: inputBaptismBy, baptismSponsor: inputBaptismSponsor, baptismPlace: inputBaptismPlace, eucharistDate: inputEucharistDate, eucharistBy: inputEucharistBy, eucharistPlace: inputEucharistPlace, confirmationDate: inputConfirmationDate, confirmationBy: inputConfirmationBy, confirmationSponsor: inputConfirmationSponsor, confirmationPlace: inputConfirmationPlace, confirmationOathDate: inputOathDate, note: inputNote };
    
    if (selectedStudent) {
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? studentData : s));
        setSelectedStudent(studentData); // Update current view
        showToast("Đã cập nhật hồ sơ!");
    } else {
        setStudents(prev => [...prev, studentData]);
        showToast(`Đã thêm học viên: ${inputId}`);
        // Keep in create mode or switch to edit mode? Let's stay in edit mode of the new student
        setIsCreating(false);
        setSelectedStudent(studentData);
    }
    setShowDuplicateModal(false);
  };

  // Back to list on mobile
  const handleBackToList = () => {
      setSelectedStudent(null);
      setIsCreating(false);
  };

  // --- PRINT LOGIC ---
  const handlePrint = (type: 'TRANSFER' | 'PROFILE' | 'CLASS') => {
      setShowPrintMenu(false);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép để in.");

      let content = '';
      const styles = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; line-height: 1.5; }
            h1, h2, h3 { text-align: center; margin: 5px 0; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .header-sm { font-size: 14px; font-weight: bold; text-transform: uppercase; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 20px 0; text-align: center; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; min-width: 150px; display: inline-block; }
            .row { margin-bottom: 8px; display: flex; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
            .signature-block { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; }
            th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
            .text-center { text-align: center; }
            @media print {
                @page { margin: 1cm; size: A4; }
                body { padding: 0; }
                .no-print { display: none; }
            }
        </style>
      `;

      const formatDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('vi-VN') : '.../.../......';

      if (type === 'TRANSFER' && selectedStudent) {
          content = `
            <div class="header">
                <h3>GIÁO PHẬN XUÂN LỘC</h3>
                <h3>GIÁO XỨ TÂN THÀNH</h3>
                <p><i>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</i></p>
            </div>
            <h1 class="title">GIẤY GIỚI THIỆU CHUYỂN XỨ</h1>
            <div class="section">
                <p>Kính gửi: <b>Cha Chánh Xứ Giáo xứ ${destinationParish || '....................................................'}</b></p>
                <p>Giáo hạt: ........................................... Giáo phận: ...........................................</p>
            </div>
            <div class="section">
                <p>Con là: <b>${currentUser?.saintName} ${currentUser?.fullName}</b></p>
                <p>Chức vụ: Giáo Lý Viên - Giáo xứ Tân Thành</p>
                <p>Xin trân trọng giới thiệu em:</p>
            </div>
            <div class="section" style="padding-left: 20px;">
                <p><span class="label">Tên thánh & Họ tên:</span> <b>${selectedStudent.saintName} ${selectedStudent.fullName}</b></p>
                <p><span class="label">Ngày sinh:</span> ${formatDate(selectedStudent.dob)} &nbsp;&nbsp;&nbsp; <span class="label">Giới tính:</span> ${selectedStudent.gender === 'Male' ? 'Nam' : 'Nữ'}</p>
                <p><span class="label">Con ông:</span> ${selectedStudent.fatherName || '................................................'}</p>
                <p><span class="label">Và bà:</span> ${selectedStudent.motherName || '................................................'}</p>
                <p><span class="label">Đã lãnh bí tích:</span></p>
                <ul style="list-style: none; padding-left: 20px;">
                    <li>- Rửa tội: ${selectedStudent.baptismDate ? 'Ngày ' + formatDate(selectedStudent.baptismDate) : 'Chưa'} tại ${selectedStudent.baptismPlace || '....................'}</li>
                    <li>- Thêm sức: ${selectedStudent.confirmationDate ? 'Ngày ' + formatDate(selectedStudent.confirmationDate) : 'Chưa'} tại ${selectedStudent.confirmationPlace || '....................'}</li>
                </ul>
                <p><span class="label">Trình độ Giáo lý:</span> Đang học lớp <b>${getClassName(selectedStudent.classId)}</b></p>
            </div>
            <div class="section">
                <p>Nay gia đình chuyển đến Giáo xứ của Cha. Kính xin Cha thương nhận và tạo điều kiện cho em được tiếp tục học Giáo lý.</p>
                <p>Con xin chân thành cám ơn Cha.</p>
            </div>
            <div class="signature">
                <div class="signature-block">
                    <p><b>Xác nhận của Cha Xứ</b></p>
                    <br/><br/><br/>
                </div>
                <div class="signature-block">
                    <p><b>Người giới thiệu</b></p>
                    <br/><br/><br/>
                    <p>${currentUser?.saintName} ${currentUser?.fullName}</p>
                </div>
            </div>
          `;
      } else if (type === 'PROFILE' && selectedStudent) {
          content = `
            <div class="header">
                <h3>HỒ SƠ HỌC VIÊN GIÁO LÝ</h3>
                <p>Niên khóa: ${years.find(y => y.id === selectedYear)?.name}</p>
            </div>
            <div class="section" style="border: 1px solid #000; padding: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><span class="label">Mã số:</span> ${selectedStudent.id}</p>
                        <p><span class="label">Tên Thánh:</span> <b>${selectedStudent.saintName}</b></p>
                        <p><span class="label">Họ và Tên:</span> <b>${selectedStudent.fullName}</b></p>
                        <p><span class="label">Ngày sinh:</span> ${formatDate(selectedStudent.dob)}</p>
                        <p><span class="label">Nơi sinh:</span> ${selectedStudent.birthPlace || '...'}</p>
                    </div>
                    <div style="width: 120px; height: 160px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center;">
                        Ảnh 3x4
                    </div>
                </div>
                <hr style="margin: 15px 0;"/>
                <h4>THÔNG TIN GIA ĐÌNH</h4>
                <p><span class="label">Họ tên Cha:</span> ${selectedStudent.fatherName || '...'} - SĐT: ${selectedStudent.fatherPhone || '...'}</p>
                <p><span class="label">Họ tên Mẹ:</span> ${selectedStudent.motherName || '...'} - SĐT: ${selectedStudent.motherPhone || '...'}</p>
                <p><span class="label">Địa chỉ:</span> ${selectedStudent.address || '...'}</p>
                <hr style="margin: 15px 0;"/>
                <h4>HỒ SƠ BÍ TÍCH</h4>
                <table style="width: 100%">
                    <tr>
                        <th>Bí Tích</th>
                        <th>Ngày lãnh nhận</th>
                        <th>Tại Giáo xứ</th>
                        <th>Người đỡ đầu</th>
                    </tr>
                    <tr>
                        <td>Rửa Tội</td>
                        <td>${formatDate(selectedStudent.baptismDate)}</td>
                        <td>${selectedStudent.baptismPlace || ''}</td>
                        <td>${selectedStudent.baptismSponsor || ''}</td>
                    </tr>
                    <tr>
                        <td>Rước Lễ</td>
                        <td>${formatDate(selectedStudent.eucharistDate)}</td>
                        <td>${selectedStudent.eucharistPlace || ''}</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td>Thêm Sức</td>
                        <td>${formatDate(selectedStudent.confirmationDate)}</td>
                        <td>${selectedStudent.confirmationPlace || ''}</td>
                        <td>${selectedStudent.confirmationSponsor || ''}</td>
                    </tr>
                </table>
            </div>
          `;
      } else if (type === 'CLASS') {
          const className = getClassName(selectedClass);
          content = `
            <div class="header">
                <h3>DANH SÁCH LỚP GIÁO LÝ: ${className.toUpperCase()}</h3>
                <p>Niên khóa: ${years.find(y => y.id === selectedYear)?.name}</p>
                <p>Tổng số: ${filteredStudents.length} học viên</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">STT</th>
                        <th style="width: 60px;">Mã SV</th>
                        <th style="width: 150px;">Tên Thánh & Họ Tên</th>
                        <th style="width: 80px;">Ngày sinh</th>
                        <th style="width: 40px;">Nam/Nữ</th>
                        <th>Họ tên Cha</th>
                        <th>Họ tên Mẹ</th>
                        <th>SĐT Liên hệ</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.map((s, idx) => `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td class="text-center">${s.id}</td>
                            <td><b>${s.saintName}</b> ${s.fullName}</td>
                            <td class="text-center">${new Date(s.dob).toLocaleDateString('vi-VN')}</td>
                            <td class="text-center">${s.gender === 'Male' ? 'Nam' : 'Nữ'}</td>
                            <td>${s.fatherName || ''}</td>
                            <td>${s.motherName || ''}</td>
                            <td>${s.fatherPhone || s.motherPhone || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="signature">
                <div class="signature-block"></div>
                <div class="signature-block">
                    <p><i>Ngày ..... tháng ..... năm .......</i></p>
                    <p><b>Giáo Lý Viên Phụ Trách</b></p>
                </div>
            </div>
          `;
      }

      printWindow.document.write(`<html><head><title>In Ấn</title>${styles}</head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 500);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50 md:p-0">
      {toast && (
        <div className="fixed top-6 right-6 z-[300] animate-slide-in">
           <div className={`text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500/50' : 'bg-red-600 border-red-500/50'}`}>
              <CheckCircle2 size={24} /> <span className="font-bold text-lg">{toast.message}</span>
           </div>
        </div>
      )}

      {/* LEFT SIDEBAR: LIST (Increased width to 480px) */}
      <div className={`flex flex-col bg-white border-r border-slate-200 h-full w-full md:w-[480px] lg:w-[500px] shrink-0 transition-all z-10 ${selectedStudent || isCreating ? 'hidden md:flex' : 'flex'}`}>
          {/* Header & Filters */}
          <div className="p-4 border-b border-slate-200 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] z-20">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Học viên</h2>
                  <button onClick={() => populateForm(null)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-bold text-xs active:scale-95 transition-all">
                      <Plus size={16} /> Thêm mới
                  </button>
              </div>
              
              <div className="space-y-3">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" placeholder="Tìm tên, tên thánh, mã..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                  </div>
                  
                  {isAdmin ? (
                      <div className="flex gap-2">
                          <select className="flex-1 px-2 py-2 rounded-lg border border-slate-300 font-bold bg-white text-xs outline-none" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                              {years.map(y => <option key={y.id} value={y.id}>{y.name.replace('Năm học ', '')}</option>)}
                          </select>
                          <select className="flex-1 px-2 py-2 rounded-lg border border-slate-300 font-bold bg-white text-xs outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                              <option value="all">Tất cả lớp</option>
                              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                  ) : (
                      <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                              <School size={14}/> {getClassName(selectedClass)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">{selectedYear}</div>
                      </div>
                  )}
              </div>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/50">
              {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, index) => (
                      <div 
                          key={s.id} 
                          onClick={() => populateForm(s)}
                          className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedStudent?.id === s.id ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-white shadow-sm'}`}
                      >
                          {/* Serial Number Column */}
                          <div className="flex flex-col items-center justify-start pt-1.5 w-6">
                              <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                  <div className={`font-bold text-base truncate ${selectedStudent?.id === s.id ? 'text-blue-800' : 'text-slate-800'}`}>
                                      <span className="text-slate-500 font-medium mr-1">{s.saintName}</span>
                                      {s.fullName}
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap shrink-0 ${s.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                      {s.status === 'ACTIVE' ? 'Đang học' : 'Nghỉ'}
                                  </span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 rounded border border-slate-200">{s.id}</span>
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${getClassColor(s.classId)}`}>{getClassName(s.classId)}</span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap">
                                      <Calendar size={12} /> {new Date(s.dob).toLocaleDateString('vi-VN')}
                                  </span>
                              </div>

                              {(s.fatherPhone || s.motherPhone) && (
                                  <div className="mt-1.5 text-xs font-medium text-slate-500 flex items-center gap-3 flex-wrap">
                                      {s.fatherPhone && <span className="flex items-center gap-1"><Phone size={12} className="text-blue-400"/> B: {s.fatherPhone}</span>}
                                      {s.motherPhone && <span className="flex items-center gap-1"><Phone size={12} className="text-pink-400"/> M: {s.motherPhone}</span>}
                                  </div>
                              )}
                          </div>
                          
                          <ChevronRight size={20} className={`text-slate-300 transition-transform mt-3 shrink-0 ${selectedStudent?.id === s.id ? 'text-blue-500 translate-x-1' : 'group-hover:text-slate-400'}`}/>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                      <Fingerprint size={32} className="mb-2 opacity-20"/>
                      <span className="text-xs font-medium">Không tìm thấy học viên</span>
                  </div>
              )}
          </div>
          <div className="p-2 border-t border-slate-200 bg-white text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
              Tổng số: {filteredStudents.length} hồ sơ
          </div>
      </div>

      {/* RIGHT MAIN: FORM (Hidden on mobile if no selection) */}
      <div className={`flex-1 flex-col h-full bg-slate-50 relative overflow-hidden ${selectedStudent || isCreating ? 'flex' : 'hidden md:flex'}`}>
          
          {(selectedStudent || isCreating) ? (
            <>
                {/* Form Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Back button for Mobile */}
                        <button onClick={handleBackToList} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={20}/>
                        </button>
                        
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isCreating ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                            {isCreating ? <Plus size={24}/> : <User size={24}/>}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 leading-tight">{isCreating ? 'Thêm học viên mới' : 'Hồ sơ chi tiết'}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                {isCreating ? 'Đang nhập liệu...' : (
                                    <>
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">#{inputId}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${inputStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inputStatus === 'ACTIVE' ? 'Đang học' : 'Nghỉ học'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* PRINT DROPDOWN */}
                        {!isCreating && (
                            <div className="relative">
                                <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 active:scale-95 transition-all text-sm shadow-sm">
                                    <Printer size={18}/> <span className="hidden lg:inline">In hồ sơ</span>
                                </button>
                                {showPrintMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right">
                                        <button onClick={() => { setShowPrintMenu(false); setShowTransferModal(true); setDestinationParish(''); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <ArrowRightLeft size={16} className="text-blue-500"/> Giấy chuyển xứ
                                        </button>
                                        <button onClick={() => handlePrint('PROFILE')} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-bold text-slate-700 flex items-center gap-2 border-t border-slate-100">
                                            <FileText size={16} className="text-purple-500"/> Lý lịch chi tiết
                                        </button>
                                        <button onClick={() => handlePrint('CLASS')} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-bold text-slate-700 flex items-center gap-2 border-t border-slate-100">
                                            <Users size={16} className="text-green-500"/> In danh sách lớp
                                        </button>
                                    </div>
                                )}
                                {/* Overlay to close menu */}
                                {showPrintMenu && <div className="fixed inset-0 z-40" onClick={() => setShowPrintMenu(false)}></div>}
                            </div>
                        )}

                        {!isCreating && <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 size={20}/></button>}
                        <button onClick={handleSaveStudent} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 active:scale-95 transition-all text-sm">
                            <Save size={18}/> <span className="hidden lg:inline">Lưu hồ sơ</span><span className="lg:hidden">Lưu</span>
                        </button>
                    </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-5xl mx-auto space-y-6">
                        
                        {/* Identity Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-sm text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-slate-100 pb-2"><Fingerprint size={16}/> Thông tin định danh</h4>
                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12 md:col-span-4">
                                    <label className="label-tiny">Lớp học hiện tại</label>
                                    <select className="form-input font-bold text-blue-700" value={inputClassId} onChange={(e) => setInputClassId(e.target.value)}>
                                        <option value="">-- Chọn lớp --</option>
                                        {modalAvailableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-2">
                                    <label className="label-tiny">Tình trạng</label>
                                    <select className="form-input font-bold" value={inputStatus} onChange={(e) => setInputStatus(e.target.value as any)}>
                                        <option value="ACTIVE">Học</option>
                                        <option value="DROPPED">Nghỉ</option>
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-6 md:col-start-1">
                                    <label className="label-tiny">Tên thánh <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input className="form-input font-bold" value={saintInput} onChange={(e) => {setSaintInput(e.target.value); setShowSaintSuggestions(true);}} onFocus={() => setShowSaintSuggestions(true)} onBlur={() => setTimeout(() => setShowSaintSuggestions(false), 200)} placeholder="Giuse..." />
                                        {showSaintSuggestions && filteredSaints.length > 0 && (
                                            <div className="absolute z-[400] w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1 custom-scrollbar">
                                                {filteredSaints.map(s => (<div key={s.id} className="p-2.5 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b last:border-0" onClick={() => {setSaintInput(s.name); setShowSaintSuggestions(false);}}>{s.name}</div>))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="label-tiny">Họ và tên <span className="text-red-500">*</span></label>
                                    <input className="form-input font-bold text-slate-800" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Nguyễn Văn A" />
                                </div>
                                <div className="col-span-6 md:col-span-4">
                                    <label className="label-tiny">Ngày sinh <span className="text-red-500">*</span></label>
                                    <input type="date" className="form-input font-bold text-blue-700" value={inputDob} onChange={(e) => setInputDob(e.target.value)}/>
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="label-tiny">Giới tính</label>
                                    <select className="form-input font-bold" value={inputGender} onChange={(e) => setInputGender(e.target.value as any)}>
                                        <option value="Male">Nam</option>
                                        <option value="Female">Nữ</option>
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="label-tiny">Nơi sinh</label>
                                    <input className="form-input font-medium" value={inputBirthPlace} onChange={(e) => setInputBirthPlace(e.target.value)} placeholder="TP. Hồ Chí Minh..." />
                                </div>
                            </div>
                        </div>

                        {/* Family Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-sm text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-slate-100 pb-2"><Phone size={16}/> Liên hệ gia đình</h4>
                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12 md:col-span-7"><label className="label-tiny">Họ tên bố</label><input className="form-input font-medium" value={inputFatherName} onChange={(e) => setInputFatherName(e.target.value)} /></div>
                                <div className="col-span-12 md:col-span-5"><label className="label-tiny">SĐT bố</label><input className="form-input font-mono font-bold text-blue-700" value={inputFatherPhone} onChange={(e) => setInputFatherPhone(e.target.value)} /></div>
                                <div className="col-span-12 md:col-span-7"><label className="label-tiny">Họ tên mẹ</label><input className="form-input font-medium" value={inputMotherName} onChange={(e) => setInputMotherName(e.target.value)} /></div>
                                <div className="col-span-12 md:col-span-5"><label className="label-tiny">SĐT mẹ</label><input className="form-input font-mono font-bold text-blue-700" value={inputMotherPhone} onChange={(e) => setInputMotherPhone(e.target.value)} /></div>
                                <div className="col-span-12"><label className="label-tiny">Địa chỉ cư trú</label><input className="form-input font-medium" value={inputAddress} onChange={(e) => setInputAddress(e.target.value)} /></div>
                            </div>
                        </div>

                        {/* Sacraments Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-sm text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-slate-100 pb-2"><ScrollText size={16}/> Hồ sơ bí tích</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Baptism */}
                                <div className="bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden">
                                    <div className="bg-blue-100/50 px-4 py-2 border-b border-blue-200 flex items-center gap-2"><Droplets size={16} className="text-blue-600" /><span className="font-bold text-sm text-blue-800">Rửa tội</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div className="col-span-1"><label className="label-tiny">Ngày</label><input type="date" className="form-input text-sm" value={inputBaptismDate} onChange={e => setInputBaptismDate(e.target.value)} /></div>
                                        <div className="col-span-1"><label className="label-tiny">Tại (Giáo xứ)</label><input className="form-input text-sm" value={inputBaptismPlace} onChange={e => setInputBaptismPlace(e.target.value)} /></div>
                                        <div className="col-span-2"><label className="label-tiny">Linh mục</label><input className="form-input text-sm" value={inputBaptismBy} onChange={e => setInputBaptismBy(e.target.value)} /></div>
                                        <div className="col-span-2"><label className="label-tiny">Người đỡ đầu</label><input className="form-input text-sm" value={inputBaptismSponsor} onChange={e => setInputBaptismSponsor(e.target.value)} /></div>
                                    </div>
                                </div>
                                
                                {/* Eucharist */}
                                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden">
                                    <div className="bg-emerald-100/50 px-4 py-2 border-b border-emerald-200 flex items-center gap-2"><BookOpen size={16} className="text-emerald-600" /><span className="font-bold text-sm text-emerald-800">Rước lễ lần đầu</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div><label className="label-tiny">Ngày</label><input type="date" className="form-input text-sm" value={inputEucharistDate} onChange={e => setInputEucharistDate(e.target.value)} /></div>
                                        <div><label className="label-tiny">Tại (Giáo xứ)</label><input className="form-input text-sm" value={inputEucharistPlace} onChange={e => setInputEucharistPlace(e.target.value)} /></div>
                                        <div className="col-span-2"><label className="label-tiny">Linh mục chủ tế</label><input className="form-input text-sm" value={inputEucharistBy} onChange={e => setInputEucharistBy(e.target.value)} /></div>
                                    </div>
                                </div>

                                {/* Confirmation */}
                                <div className="bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden">
                                    <div className="bg-rose-100/50 px-4 py-2 border-b border-rose-200 flex items-center gap-2"><Flame size={16} className="text-rose-600" /><span className="font-bold text-sm text-rose-800">Thêm sức</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div><label className="label-tiny">Ngày lãnh nhận</label><input type="date" className="form-input text-sm" value={inputConfirmationDate} onChange={e => setInputConfirmationDate(e.target.value)} /></div>
                                        <div><label className="label-tiny">Tại (Giáo xứ)</label><input className="form-input text-sm" value={inputConfirmationPlace} onChange={e => setInputConfirmationPlace(e.target.value)} /></div>
                                        <div className="col-span-2"><label className="label-tiny">Đức Cha / Linh mục</label><input className="form-input text-sm" value={inputConfirmationBy} onChange={e => setInputConfirmationBy(e.target.value)} /></div>
                                        <div className="col-span-2"><label className="label-tiny">Người đỡ đầu</label><input className="form-input text-sm" value={inputConfirmationSponsor} onChange={e => setInputConfirmationSponsor(e.target.value)} /></div>
                                    </div>
                                </div>

                                {/* Oath */}
                                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 overflow-hidden">
                                    <div className="bg-indigo-100/50 px-4 py-2 border-b border-indigo-200 flex items-center gap-2"><Star size={16} className="text-indigo-600" /><span className="font-bold text-sm text-indigo-800">Bao đồng</span></div>
                                    <div className="p-4">
                                        <label className="label-tiny">Ngày tuyên hứa</label>
                                        <input type="date" className="form-input font-bold w-full" value={inputOathDate} onChange={e => setInputOathDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                            <h4 className="font-black text-sm text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider">Ghi chú thêm</h4>
                            <textarea className="form-input resize-none flex-1 min-h-[100px] leading-relaxed font-medium" placeholder="Nhập các lưu ý quan trọng khác..." value={inputNote} onChange={e => setInputNote(e.target.value)}></textarea>
                        </div>
                        
                        <div className="h-10"></div>
                    </div>
                </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 h-full">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <User size={40} className="text-slate-200"/>
                </div>
                <p className="text-lg font-bold text-slate-400">Chưa chọn học viên</p>
                <p className="text-sm font-medium">Chọn một học viên từ danh sách bên trái để xem chi tiết</p>
            </div>
          )}
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-amber-200">
               <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
                   <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 animate-bounce">
                       <AlertCircle size={36} strokeWidth={2.5}/>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Phát hiện trùng hồ sơ!</h3>
                   <p className="text-sm text-slate-500 font-medium">Hệ thống tìm thấy học viên có cùng họ tên và ngày sinh đang sinh hoạt tại lớp khác.</p>
               </div>
               <div className="p-6">
                   <div className="space-y-3 mb-6">
                       {potentialDuplicates.map(s => (
                           <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                               <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">#{s.id.slice(-4)}</div>
                               <div className="flex-1">
                                   <div className="text-sm font-bold text-slate-800">{s.saintName} {s.fullName}</div>
                                   <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Hiện thuộc: {getClassName(s.classId)}</div>
                               </div>
                           </div>
                       ))}
                   </div>
                   <div className="flex flex-col gap-3">
                        <button onClick={executeSave} className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all text-sm uppercase tracking-widest">Tôi vẫn muốn thêm mới</button>
                        <button onClick={() => setShowDuplicateModal(false)} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm uppercase tracking-widest">Hủy & Kiểm tra lại</button>
                   </div>
               </div>
           </div>
        </div>
      )}

      {/* Transfer Parish Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-lg text-slate-800">Thông tin chuyển xứ</h3>
                   <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
               </div>
               <div className="p-5 space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên Giáo xứ chuyển đến</label>
                       <input 
                          type="text" 
                          autoFocus
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                          placeholder="VD: Gx. Bùi Chu"
                          value={destinationParish}
                          onChange={e => setDestinationParish(e.target.value)}
                       />
                   </div>
                   <button 
                      onClick={() => {
                          setShowTransferModal(false);
                          handlePrint('TRANSFER');
                      }}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                   >
                       <Printer size={18}/> In Giấy Giới Thiệu
                   </button>
               </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .form-input { width: 100%; padding: 0.6rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 1rem; color: #1e293b; background-color: #fff; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08); }
        .label-tiny { display: block; font-size: 0.8rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.025em; }
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};
