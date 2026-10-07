
import { Search, Plus, Save, User, ScrollText, X, Fingerprint, Calendar, School, Droplets, BookOpen, Flame, Star, Phone, AlertCircle, ChevronRight, Trash2, ArrowLeft, CheckCircle2, Printer, FileText, Users, ArrowRightLeft, FileSpreadsheet, MapPin, Mail, Home, Sparkles, Activity, Lock } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { MOCK_SAINTS } from '../constants';
import { AcademicRecord, Student, ClassRoom, SchoolYear, Grade, Teacher, hasPermission } from '../types';
import { DuplicateMergeTab } from './DuplicateMergeTab';
import { ADDRESS_DATA } from '../src/data/addressData';
import { ConfirmDialog } from './ConfirmDialog';

interface StudentsProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    classes: ClassRoom[];
    years: SchoolYear[];
    records: AcademicRecord[];
    setRecords: React.Dispatch<React.SetStateAction<AcademicRecord[]>>;
    grades: Grade[];
    currentUser: Teacher | null;
    setMainTab?: (tab: string) => void;
}

const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
};

export const Students: React.FC<StudentsProps> = ({ students, setStudents, classes, years, records, setRecords, grades, currentUser, setMainTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEditStudents = hasPermission(currentUser, 'students', 'edit');
  const canDeleteStudents = hasPermission(currentUser, 'students', 'delete');

  const [selectedYear, setSelectedYear] = useState('');
  const isYearLocked = years.find(y => y.id === selectedYear)?.isLocked && !isAdmin;
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');

  // UI State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Mode: Creating new student
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  
  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [destinationParish, setDestinationParish] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'INFO' | 'ACADEMIC'>('INFO');
  
  // Form states
  const [inputId, setInputId] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDob, setInputDob] = useState('');
  const [inputGender, setInputGender] = useState<'Male' | 'Female'>('Male');
  const [inputStatus, setInputStatus] = useState<'ACTIVE' | 'DROPPED'>('ACTIVE');
  const [saintInput, setSaintInput] = useState('');
  const [inputBirthPlace, setInputBirthPlace] = useState('');
  const [inputClassId, setInputClassId] = useState(''); 
  const [inputFatherName, setInputFatherName] = useState('');
  const [inputMotherName, setInputMotherName] = useState('');
  const [inputFatherPhone, setInputFatherPhone] = useState('');
  const [inputMotherPhone, setInputMotherPhone] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [inputWard, setInputWard] = useState('');
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
  const [inputLeaveReason, setInputLeaveReason] = useState('');
  const [inputLeaveYear, setInputLeaveYear] = useState('');
  const [saintSearch, setSaintSearch] = useState('');
  const [showSaintDropdown, setShowSaintDropdown] = useState(false);

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

  const filteredStudents = useMemo(() => {
    const list = students.filter(student => {
        const query = searchTerm.toLowerCase().trim();
        const matchSearch = !query || 
                            student.fullName.toLowerCase().includes(query) || 
                            student.saintName.toLowerCase().includes(query) || 
                            student.id.toLowerCase().includes(query) ||
                            (student.fatherName && student.fatherName.toLowerCase().includes(query)) ||
                            (student.motherName && student.motherName.toLowerCase().includes(query));

        let validClassIds: string[] = [];
        if (selectedClass !== 'all' && selectedClass !== '') {
            validClassIds = [selectedClass];
        } else {
            validClassIds = availableClasses.map(c => c.id);
        }
        return matchSearch && validClassIds.includes(student.classId);
    });
    return list.sort((a, b) => {
        const nameA = a.fullName.split(' ').pop() || '';
        const nameB = b.fullName.split(' ').pop() || '';
        return nameA.localeCompare(nameB, 'vi');
    });
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
          case 'g5': return 'bg-[#F4E4D4] text-[#8B4513] border-[#D2B48C]';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  const populateForm = (student: Student | null) => {
      if (student) {
          // EDIT MODE
          setIsCreating(false);
          setIsEditing(false);
          setSelectedStudent(student);
          setInputId(student.id); 
          setInputName(student.fullName); 
          setInputDob(student.dob); 
          setSaintInput(student.saintName); 
          setSaintSearch(student.saintName);
          setInputGender(student.gender); 
          setInputStatus(student.status); 
          setInputBirthPlace(student.birthPlace || ''); 
          setInputClassId(student.classId); 
          setInputFatherName(student.fatherName || ''); 
          setInputMotherName(student.motherName || ''); 
          setInputFatherPhone(student.fatherPhone || ''); 
          setInputMotherPhone(student.motherPhone || ''); 
          setInputEmail(student.email || '');
          setInputAddress(student.address || ''); 
          setInputCity(student.city || '');
          setInputWard(student.ward || '');
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
          setInputLeaveReason(student.leaveReason || '');
          setInputLeaveYear(student.leaveYear || '');
          setDetailTab('INFO');
      } else {
          // CREATE MODE
          setIsCreating(true);
          setSelectedStudent(null);
          setDetailTab('INFO');
          const prefix = selectedYear.slice(2, 4);
          const yearStudents = students.filter(s => s.id.startsWith(prefix));
          const nextNum = (yearStudents.length > 0 ? Math.max(...yearStudents.map(s => parseInt(s.id.slice(2)))) + 1 : 1).toString().padStart(4, '0');
          
          setInputId(`${prefix}${nextNum}`); 
          setInputName(''); 
          setInputDob(''); 
          setSaintInput(''); 
          setSaintSearch('');
          setInputGender('Male'); 
          setInputStatus('ACTIVE'); 
          setInputClassId(selectedClass || (modalAvailableClasses[0]?.id || '')); 
          setInputBirthPlace(''); 
          setInputFatherName(''); 
          setInputMotherName(''); 
          setInputFatherPhone(''); 
          setInputMotherPhone(''); 
          setInputAddress('');
          setInputCity('');
          setInputWard('');
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
          setInputLeaveReason('');
          setInputLeaveYear('');
      }
  };

  const handleDeleteStudent = () => {
    if (!canDeleteStudents) {
        toast.error("Bạn không có quyền xóa học viên!");
        return;
    }
    if (selectedStudent) {
        setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
        setSelectedStudent(null);
        setShowDeleteModal(false);
        toast.success("Đã xóa hồ sơ học viên!");
    }
  };

  const handleSaveStudent = () => {
    if (!canEditStudents) {
        toast.error("Bạn không có quyền thêm hoặc sửa học viên!");
        return;
    }
    if (!inputName || !inputDob || !saintInput) {
        toast.error("Vui lòng nhập đầy đủ: Tên thánh, họ tên, ngày sinh.");
        return;
    }

    if (inputStatus !== 'ACTIVE' && !inputLeaveReason) {
        toast.error("Vui lòng nhập lý do nghỉ.");
        return;
    }
    
    // Check for duplicates before saving (only for new entries)
    if (!selectedStudent && potentialDuplicates.length > 0) {
        setShowDuplicateModal(true);
        return;
    }
    executeSave();
  };

  const executeSave = () => {
    const studentData: Student = { 
        id: inputId, 
        fullName: inputName, 
        dob: inputDob, 
        saintName: saintInput, 
        gender: inputGender, 
        status: inputStatus, 
        classId: inputClassId, 
        parish: 'Gx. Tân Thành', 
        birthPlace: inputBirthPlace, 
        fatherName: inputFatherName, 
        motherName: inputMotherName, 
        fatherPhone: inputFatherPhone, 
        motherPhone: inputMotherPhone, 
        email: inputEmail, 
        address: inputAddress, 
        city: inputCity, 
        ward: inputWard, 
        baptismDate: inputBaptismDate, 
        baptismBy: inputBaptismBy, 
        baptismSponsor: inputBaptismSponsor, 
        baptismPlace: 'Gx. ' + inputBaptismPlace.replace(/^Gx\. /, ''), 
        eucharistDate: inputEucharistDate, 
        eucharistBy: inputEucharistBy, 
        eucharistPlace: 'Gx. ' + inputEucharistPlace.replace(/^Gx\. /, ''), 
        confirmationDate: inputConfirmationDate, 
        confirmationBy: inputConfirmationBy, 
        confirmationSponsor: inputConfirmationSponsor, 
        confirmationPlace: 'Gx. ' + inputConfirmationPlace.replace(/^Gx\. /, ''), 
        confirmationOathDate: inputOathDate, 
        note: inputNote, 
        leaveReason: inputLeaveReason, 
        leaveYear: inputLeaveYear 
    };
    
    if (selectedStudent) {
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? studentData : s));
        setSelectedStudent(studentData); // Update current view
        toast.success("Đã cập nhật hồ sơ!");
    } else {
        setStudents(prev => [...prev, studentData]);
        toast.success(`Đã thêm học viên: ${inputId}`);
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

  // --- EXPORT LOGIC ---
  const handleExportExcel = () => {
    const className = getClassName(selectedClass);
    const yearName = years.find(y => y.id === selectedYear)?.name || '';
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `DANH SÁCH LỚP: ${className.toUpperCase()}\n`;
    csvContent += `Niên khóa: ${yearName}\n`;
    csvContent += `Tổng số: ${filteredStudents.length} học viên\n\n`;
    csvContent += "STT,Mã SV,Tên Thánh,Họ và Tên,Ngày sinh,Giới tính,Lớp,Họ tên Cha,SĐT Cha,Họ tên Mẹ,SĐT Mẹ,Địa chỉ\n";

    filteredStudents.forEach((s, idx) => {
      const row = [
        idx + 1,
        s.id,
        s.saintName,
        s.fullName,
        safeFormatDate(s.dob),
        s.gender === 'Male' ? 'Nam' : 'Nữ',
        getClassName(s.classId),
        s.fatherName || '',
        s.fatherPhone || '',
        s.motherName || '',
        s.motherPhone || '',
        `"${s.address || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_sach_lop_${className.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file Excel!");
  };

  const handleExportWord = (type: 'TRANSFER' | 'PROFILE') => {
    if (!selectedStudent) return;

    const formatDate = (d: string | undefined) => d ? safeFormatDate(d) : '.../.../......';
    const yearName = years.find(y => y.id === selectedYear)?.name || '';

    let content = '';
    let filename = '';

    if (type === 'TRANSFER') {
      filename = `Giay_gioi_thieu_${selectedStudent.fullName.replace(/\s+/g, '_')}.doc`;
      content = `
        <div style="font-family: 'Times New Roman', serif; padding: 40px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">GIÁO PHẬN XUÂN LỘC</h3>
            <h3 style="margin: 0;">GIÁO XỨ TÂN THÀNH</h3>
            <p style="margin: 5px 0;"><i>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</i></p>
          </div>
          <h1 style="text-align: center; font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 30px 0;">GIẤY GIỚI THIỆU CHUYỂN XỨ</h1>
          <div style="margin-bottom: 20px;">
            <p>Kính gửi: <b>Cha Chánh Xứ Giáo xứ ${destinationParish || '....................................................'}</b></p>
            <p>Giáo hạt: ........................................... Giáo phận: ...........................................</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p>Con là: <b>${currentUser?.saintName} ${currentUser?.fullName}</b></p>
            <p>Chức vụ: Giáo Lý Viên - Giáo xứ Tân Thành</p>
            <p>Xin trân trọng giới thiệu em:</p>
          </div>
          <div style="padding-left: 20px; margin-bottom: 20px;">
            <p><b>Tên thánh & Họ tên:</b> ${selectedStudent.saintName} ${selectedStudent.fullName}</p>
            <p><b>Ngày sinh:</b> ${formatDate(selectedStudent.dob)} &nbsp;&nbsp;&nbsp; <b>Giới tính:</b> ${selectedStudent.gender === 'Male' ? 'Nam' : 'Nữ'}</p>
            <p><b>Con ông:</b> ${selectedStudent.fatherName || '................................................'}</p>
            <p><b>Và bà:</b> ${selectedStudent.motherName || '................................................'}</p>
            <p><b>Đã lãnh bí tích:</b></p>
            <p style="margin-left: 20px;">- Rửa tội: ${selectedStudent.baptismDate ? 'Ngày ' + formatDate(selectedStudent.baptismDate) : 'Chưa'} tại ${selectedStudent.baptismPlace || '....................'}</p>
            <p style="margin-left: 20px;">- Thêm sức: ${selectedStudent.confirmationDate ? 'Ngày ' + formatDate(selectedStudent.confirmationDate) : 'Chưa'} tại ${selectedStudent.confirmationPlace || '....................'}</p>
            <p><b>Trình độ Giáo lý:</b> Đang học lớp <b>${getClassName(selectedStudent.classId)}</b></p>
          </div>
          <div style="margin-bottom: 30px;">
            <p>Nay gia đình chuyển đến Giáo xứ của Cha. Kính xin Cha thương nhận và tạo điều kiện cho em được tiếp tục học Giáo lý.</p>
            <p>Con xin chân thành cám ơn Cha.</p>
          </div>
          <table style="width: 100%; border: none;">
            <tr>
              <td style="text-align: center; width: 50%;">
                <p><b>Xác nhận của Cha Xứ</b></p>
                <br/><br/><br/><br/>
              </td>
              <td style="text-align: center; width: 50%;">
                <p><b>Người giới thiệu</b></p>
                <br/><br/><br/><br/>
                <p>${currentUser?.saintName} ${currentUser?.fullName}</p>
              </td>
            </tr>
          </table>
        </div>
      `;
    } else {
      filename = `Ho_so_${selectedStudent.fullName.replace(/\s+/g, '_')}.doc`;
      content = `
        <div style="font-family: 'Times New Roman', serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">HỒ SƠ HỌC VIÊN GIÁO LÝ</h2>
            <p style="margin: 5px 0;">Niên khóa: ${yearName}</p>
          </div>
          <div style="border: 1px solid #000; padding: 20px;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="vertical-align: top;">
                  <p><b>Mã số:</b> ${selectedStudent.id}</p>
                  <p><b>Tên Thánh:</b> ${selectedStudent.saintName}</p>
                  <p><b>Họ và Tên:</b> ${selectedStudent.fullName}</p>
                  <p><b>Ngày sinh:</b> ${formatDate(selectedStudent.dob)}</p>
                  <p><b>Nơi sinh:</b> ${selectedStudent.birthPlace || '...'}</p>
                </td>
                <td style="width: 120px; text-align: center; vertical-align: top;">
                  <div style="width: 100px; height: 130px; border: 1px solid #ccc; line-height: 130px;">Ảnh 3x4</div>
                </td>
              </tr>
            </table>
            <hr/>
            <h3>THÔNG TIN GIA ĐÌNH</h3>
            <p><b>Họ tên Cha:</b> ${selectedStudent.fatherName || '...'} - SĐT: ${selectedStudent.fatherPhone || '...'}</p>
            <p><b>Họ tên Mẹ:</b> ${selectedStudent.motherName || '...'} - SĐT: ${selectedStudent.motherPhone || '...'}</p>
            <p><b>Địa chỉ:</b> ${selectedStudent.address || '...'}</p>
            <hr/>
            <h3>HỒ SƠ BÍ TÍCH</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 5px;">Bí Tích</th>
                <th style="border: 1px solid #000; padding: 5px;">Ngày lãnh nhận</th>
                <th style="border: 1px solid #000; padding: 5px;">Tại Giáo xứ</th>
                <th style="border: 1px solid #000; padding: 5px;">Người đỡ đầu</th>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 5px;">Rửa Tội</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${formatDate(selectedStudent.baptismDate)}</td>
                <td style="border: 1px solid #000; padding: 5px;">${selectedStudent.baptismPlace || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${selectedStudent.baptismSponsor || ''}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 5px;">Rước Lễ</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${formatDate(selectedStudent.eucharistDate)}</td>
                <td style="border: 1px solid #000; padding: 5px;">${selectedStudent.eucharistPlace || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">-</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 5px;">Thêm Sức</td>
                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${formatDate(selectedStudent.confirmationDate)}</td>
                <td style="border: 1px solid #000; padding: 5px;">${selectedStudent.confirmationPlace || ''}</td>
                <td style="border: 1px solid #000; padding: 5px;">${selectedStudent.confirmationSponsor || ''}</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export Word</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file Word!");
  };

  // --- PRINT LOGIC ---
  const handlePrint = (type: 'TRANSFER' | 'PROFILE' | 'CLASS') => {
      setShowPrintMenu(false);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
          toast.error("Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép để in.");
          return;
      }

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

      const formatDate = (d: string | undefined) => d ? safeFormatDate(d) : '.../.../......';

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
                            <td class="text-center">${safeFormatDate(s.dob)}</td>
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
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
          {/* DỰA TRÊN THIẾT KẾ MỚI: DANH SÁCH HỌC VIÊN FULL-WIDTH */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  {/* Header */}
                  <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white">
                      <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                              Danh sách Học viên
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                                  {filteredStudents.length} học viên
                              </span>
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">Quản lý lý lịch cá nhân, quá trình học tập giáo lý, hỗ trợ tra cứu nhanh và xuất dữ liệu.</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                          <div className="relative group">
                              <button onClick={() => handlePrint('CLASS')} className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm font-bold text-xs active:scale-95 transition-all">
                                  <Printer size={15} /> Xuất DS Lớp
                              </button>
                              <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2">
                                      <FileSpreadsheet size={14} className="text-green-600"/> Xuất Excel (.csv)
                                  </button>
                              </div>
                          </div>
                          <button 
                              onClick={() => {
                                  if (isYearLocked) {
                                      toast.error("Niên khóa này đã bị khóa. Không thể thêm học viên mới!");
                                      return;
                                  }
                                  if (!canEditStudents) {
                                      toast.error("Bạn không có quyền thêm học viên!");
                                      return;
                                  }
                                  populateForm(null);
                              }} 
                              className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-xl shadow-sm font-bold text-xs active:scale-95 transition-all ${isYearLocked || !canEditStudents ? 'bg-slate-400 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700'}`}
                              disabled={isYearLocked || !canEditStudents}
                          >
                              <Plus size={15} /> Thêm học viên mới
                          </button>
                      </div>
                  </div>

                  {isYearLocked && (
                      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-bold shrink-0">
                          <Lock size={14} className="text-amber-600 shrink-0" />
                          <span>Dữ liệu của niên khóa này đã được tổng kết và khóa lại. Toàn bộ thông tin hiển thị ở chế độ Chỉ Đọc. Người dùng có vai trò Quản trị viên hệ thống có thể mở khóa trong phần Cài đặt để chỉnh sửa nếu cần.</span>
                      </div>
                  )}

                  {/* Filters Block */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                  type="text" 
                                  placeholder="Tìm tên, tên thánh, mã, cha mẹ..." 
                                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-xs" 
                                  value={searchTerm} 
                                  onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                          <div>
                              <select 
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" 
                                  value={selectedYear} 
                                  onChange={(e) => {
                                      setSelectedYear(e.target.value);
                                      setSelectedGrade('all');
                                      setSelectedClass('all');
                                  }}
                              >
                                  {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <select 
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" 
                                  value={selectedGrade} 
                                  onChange={(e) => {
                                      setSelectedGrade(e.target.value);
                                      setSelectedClass('all');
                                  }}
                              >
                                  <option value="all">Tất cả khối</option>
                                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <select 
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" 
                                  value={selectedClass} 
                                  onChange={(e) => setSelectedClass(e.target.value)}
                              >
                                  <option value="all">Tất cả lớp học</option>
                                  {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Responsive Table */}
                  <div className="flex-1 overflow-auto custom-scrollbar">
                      {filteredStudents.length > 0 ? (
                          <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                                      <th className="p-4 w-14 text-center">STT</th>
                                      <th className="p-4 w-28">Mã HV</th>
                                      <th className="p-4">Tên Thánh & Họ Tên</th>
                                      <th className="p-4 w-36">Ngày sinh</th>
                                      <th className="p-4 w-24 text-center">Phái</th>
                                      <th className="p-4 w-32">Lớp</th>
                                      <th className="p-4">Liên hệ Phụ huynh</th>
                                      <th className="p-4 w-32 text-center">Trạng thái</th>
                                      <th className="p-4 w-32 text-right">Tác vụ</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {filteredStudents.map((s, index) => (
                                      <tr 
                                          key={s.id} 
                                          className={`hover:bg-slate-50/70 transition-colors text-xs ${s.status === 'DROPPED' ? 'bg-slate-50/50 text-slate-400' : ''}`}
                                      >
                                          <td className="p-4 text-center font-bold text-slate-400">#{index + 1}</td>
                                          <td className="p-4 font-mono font-bold text-slate-500">{s.id}</td>
                                          <td className="p-4">
                                              <div className="flex items-center gap-3">
                                                  {s.avatarUrl ? (
                                                      <img src={s.avatarUrl} alt={s.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                                  ) : (
                                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                                                          <User size={16} />
                                                      </div>
                                                  )}
                                                  <div>
                                                      <div className="font-bold text-slate-800 text-sm">
                                                          <span className="text-slate-400 font-medium mr-1">{s.saintName}</span>
                                                          {s.fullName}
                                                      </div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4 font-medium text-slate-600 font-mono">
                                              {safeFormatDate(s.dob)}
                                          </td>
                                          <td className="p-4 text-center">
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.gender === 'Male' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'}`}>
                                                  {s.gender === 'Male' ? 'Nam' : 'Nữ'}
                                              </span>
                                          </td>
                                          <td className="p-4">
                                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getClassColor(s.classId)}`}>
                                                  {getClassName(s.classId)}
                                              </span>
                                          </td>
                                          <td className="p-4">
                                              <div className="space-y-0.5">
                                                  {s.fatherName && (
                                                      <div className="flex items-center gap-1.5 text-slate-600">
                                                          <span className="font-bold text-[10px] text-slate-400">Bố:</span>
                                                          <span className="font-semibold">{s.fatherName}</span>
                                                          {s.fatherPhone && <span className="font-mono text-[10px] text-blue-500">({s.fatherPhone})</span>}
                                                      </div>
                                                  )}
                                                  {s.motherName && (
                                                      <div className="flex items-center gap-1.5 text-slate-600">
                                                          <span className="font-bold text-[10px] text-slate-400">Mẹ:</span>
                                                          <span className="font-semibold">{s.motherName}</span>
                                                          {s.motherPhone && <span className="font-mono text-[10px] text-pink-500">({s.motherPhone})</span>}
                                                      </div>
                                                  )}
                                                  {!s.fatherName && !s.motherName && <span className="text-slate-300 italic">Chưa cập nhật</span>}
                                              </div>
                                          </td>
                                          <td className="p-4 text-center">
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                  {s.status === 'ACTIVE' ? 'Đang học' : 'Nghỉ'}
                                              </span>
                                          </td>
                                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                              <button 
                                                  onClick={() => populateForm(s)} 
                                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg font-bold text-[11px] transition-all"
                                              >
                                                  Chi tiết
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                              <Fingerprint size={48} className="mb-3 opacity-20 text-slate-500"/>
                              <span className="text-sm font-bold">Không tìm thấy học viên nào khớp với bộ lọc</span>
                              <p className="text-xs text-slate-400 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc chọn lớp khác.</p>
                          </div>
                      )}
                  </div>

                  {/* Stats Footer */}
                  <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-[10px] text-center font-bold text-slate-500 uppercase tracking-wider shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div>Tổng số học viên hiển thị: {filteredStudents.length}</div>
                      <div className="flex gap-4">
                          <span className="text-blue-600">Nam: {filteredStudents.filter(s => s.gender === 'Male').length}</span>
                          <span className="text-pink-600">Nữ: {filteredStudents.filter(s => s.gender === 'Female').length}</span>
                          <span className="text-green-600">Đang học: {filteredStudents.filter(s => s.status === 'ACTIVE').length}</span>
                          <span className="text-red-500">Nghỉ: {filteredStudents.filter(s => s.status === 'DROPPED').length}</span>
                      </div>
                  </div>
              </div>

          {/* RENDER THE POPUP MODAL FOR CREATING / DETAILS */}
          {(selectedStudent || isCreating) && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-[200] p-4 md:p-6 animate-fade-in">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                      {/* Form Header */}
                      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isCreating ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {isCreating ? <Plus size={20}/> : <User size={20}/>}
                              </div>
                              <div>
                                  <h3 className="text-sm font-black text-slate-800 uppercase leading-tight">{isCreating ? 'Thêm học viên mới' : 'Hồ sơ chi tiết'}</h3>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-0.5">
                                      {isCreating ? 'Đang nhập liệu...' : (
                                          <>
                                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">#{inputId}</span>
                                              <span className={`px-1.5 py-0.5 rounded uppercase ${inputStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inputStatus === 'ACTIVE' ? 'Đang học' : 'Nghỉ học'}</span>
                                          </>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-2 items-center">
                              {/* PRINT DROPDOWN */}
                              {!isCreating && (
                                  <div className="relative">
                                      <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-1.5 active:scale-95 transition-all text-xs shadow-sm">
                                          <Printer size={15}/> <span>In & Xuất file</span>
                                      </button>
                                      {showPrintMenu && (
                                          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right">
                                              <button onClick={() => handleExportWord('PROFILE')} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-xs font-bold text-slate-700 flex items-center gap-2">
                                                  <FileText size={15} className="text-purple-600"/> Xuất Lý lịch chi tiết (Word)
                                              </button>
                                          </div>
                                      )}
                                      {/* Overlay to close menu */}
                                      {showPrintMenu && <div className="fixed inset-0 z-40" onClick={() => setShowPrintMenu(false)}></div>}
                                  </div>
                              )}

                              {isYearLocked && (
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                      <Lock size={12}/> Niên khóa đã bị khóa (Chỉ đọc)
                                  </span>
                              )}

                              {!isCreating && !isYearLocked && canDeleteStudents && <button onClick={() => setShowDeleteModal(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Xóa"><Trash2 size={18}/></button>}
                              
                              {!isCreating && !isYearLocked && (
                                  isEditing ? (
                                      <button onClick={() => { handleSaveStudent(); setIsEditing(false); }} className="px-5 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 flex items-center gap-1.5 active:scale-95 transition-all text-xs">
                                          <Save size={15}/> Lưu
                                      </button>
                                  ) : (
                                      canEditStudents && (
                                          <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 flex items-center gap-1.5 active:scale-95 transition-all text-xs">
                                              Cập nhật
                                          </button>
                                      )
                                  )
                              )}

                              {isCreating && !isYearLocked && canEditStudents && (
                                  <button onClick={handleSaveStudent} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 flex items-center gap-1.5 active:scale-95 transition-all text-xs">
                                      <Save size={15}/> Lưu hồ sơ
                                  </button>
                              )}

                              {/* Nút đóng màu đỏ, kế nút lưu */}
                              <button 
                                  onClick={handleBackToList} 
                                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-all text-xs shadow-md"
                              >
                                  <X size={15}/> Đóng
                              </button>
                          </div>
                      </div>

                  {/* Detail Tab Switcher */}
                  {!isCreating && (
                      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-6 h-12 shrink-0 z-10">
                          <button 
                              onClick={() => setDetailTab('INFO')} 
                              className={`h-full flex items-center gap-2 px-1 text-xs font-bold transition-all border-b-2 ${detailTab === 'INFO' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                          >
                              <User size={14} /> Thông tin cá nhân
                          </button>
                          <button 
                              onClick={() => setDetailTab('ACADEMIC')} 
                              className={`h-full flex items-center gap-2 px-1 text-xs font-bold transition-all border-b-2 ${detailTab === 'ACADEMIC' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                          >
                              <BookOpen size={14} /> Học lực Giáo lý
                          </button>
                      </div>
                  )}

                  {/* Form Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                      <div className="w-full space-y-6">
                        
                        {detailTab === 'INFO' ? (
                            <>
                                {/* Identity Section */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Fingerprint size={18}/></div>
                                        <h4 className="font-black text-sm text-slate-700 uppercase tracking-wider">Thông tin định danh</h4>
                                    </div>
                                    <div className="p-6 grid grid-cols-12 gap-x-6 gap-y-4">
                                        {/* Tên thánh */}
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Sparkles size={14} className="text-amber-500 shrink-0 font-bold" />
                                                <span>Tên thánh</span>
                                                <span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} 
                                                    value={saintSearch} 
                                                    disabled={!isEditing && !isCreating}
                                                    onChange={(e) => {
                                                        setSaintSearch(e.target.value);
                                                        setShowSaintDropdown(true);
                                                        if (e.target.value === '') setSaintInput('');
                                                    }}
                                                    onFocus={() => setShowSaintDropdown(true)}
                                                    placeholder="Tìm tên thánh..."
                                                />
                                                {showSaintDropdown && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                                        {MOCK_SAINTS.filter(s => s.name.toLowerCase().includes(saintSearch.toLowerCase())).length > 0 ? (
                                                            MOCK_SAINTS.filter(s => s.name.toLowerCase().includes(saintSearch.toLowerCase())).map(s => (
                                                                <button 
                                                                    key={s.id} 
                                                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-bold text-slate-700 flex justify-between items-center"
                                                                    onClick={() => {
                                                                        setSaintInput(s.name);
                                                                        setSaintSearch(s.name);
                                                                        setShowSaintDropdown(false);
                                                                    }}
                                                                >
                                                                    <span>{s.name}</span>
                                                                    <span className="text-[10px] text-slate-400 uppercase">{s.gender === 'Male' ? 'Nam' : 'Nữ'}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy tên thánh</div>
                                                        )}
                                                    </div>
                                                )}
                                                {showSaintDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSaintDropdown(false)}></div>}
                                            </div>
                                        </div>

                                        {/* Họ và tên */}
                                        <div className="col-span-12 md:col-span-4">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-blue-500 shrink-0 font-bold" />
                                                <span>Họ và tên</span>
                                                <span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Nguyễn Văn A" disabled={!isEditing && !isCreating}/>
                                        </div>

                                        {/* Lớp học hiện tại */}
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <School size={14} className="text-indigo-500 shrink-0 font-bold" />
                                                <span>Lớp học hiện tại</span>
                                                <span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            {isCreating ? (
                                                <select 
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20" 
                                                    value={inputClassId} 
                                                    onChange={(e) => setInputClassId(e.target.value)} 
                                                >
                                                    <option value="">-- Chọn lớp --</option>
                                                    {modalAvailableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            ) : (
                                                <div className="w-full px-3 py-2.5 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 bg-slate-50/50 flex items-center gap-2 h-[42px]">
                                                    <span className="text-indigo-600">{getClassName(inputClassId) || 'Chưa phân lớp'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tình trạng */}
                                        <div className="col-span-12 md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Activity size={14} className="text-emerald-500 shrink-0 font-bold" />
                                                <span>Tình trạng</span>
                                            </label>
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all select-none h-[42px] ${inputStatus === 'DROPPED' ? 'bg-red-50 border-red-300 text-red-700 font-black' : 'bg-white border-slate-200 text-slate-700 font-bold'} ${!isEditing && !isCreating ? 'opacity-70 cursor-not-allowed pointer-events-none bg-slate-50' : 'hover:bg-slate-50'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer" 
                                                    checked={inputStatus === 'DROPPED'} 
                                                    onChange={(e) => setInputStatus(e.target.checked ? 'DROPPED' : 'ACTIVE')}
                                                    disabled={!isEditing && !isCreating}
                                                />
                                                <span className="text-sm">Nghỉ</span>
                                            </label>
                                        </div>

                                        {/* Lý do nghỉ */}
                                        {inputStatus !== 'ACTIVE' && (
                                            <>
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <AlertCircle size={14} className="text-rose-500 shrink-0 font-bold" />
                                                        <span>Lý do nghỉ</span>
                                                        <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <select 
                                                            className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-red-600 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} 
                                                            value={['Chuyển xứ', 'Bảo lưu', 'Không hiện diện'].includes(inputLeaveReason) ? inputLeaveReason : 'OTHER'} 
                                                            onChange={(e) => {
                                                                if (e.target.value === 'OTHER') {
                                                                    setInputLeaveReason('');
                                                                } else {
                                                                    setInputLeaveReason(e.target.value);
                                                                }
                                                            }}
                                                            disabled={!isEditing && !isCreating}
                                                        >
                                                            <option value="">-- Chọn lý do --</option>
                                                            <option value="Chuyển xứ">Chuyển xứ</option>
                                                            <option value="Bảo lưu">Bảo lưu</option>
                                                            <option value="Không hiện diện">Không hiện diện</option>
                                                            <option value="OTHER">Lý do khác...</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-span-12 md:col-span-5">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <AlertCircle size={14} className="text-rose-400 shrink-0 font-bold" />
                                                        <span>Nhập lý do khác (nếu có)</span>
                                                    </label>
                                                    <input 
                                                        className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} 
                                                        value={inputLeaveReason} 
                                                        onChange={(e) => setInputLeaveReason(e.target.value)} 
                                                        placeholder="Lý do cụ thể..."
                                                        disabled={(!isEditing && !isCreating) || (['Chuyển xứ', 'Bảo lưu', 'Không hiện diện'].includes(inputLeaveReason) && inputLeaveReason !== '')}
                                                    />
                                                </div>
                                                <div className="col-span-12 md:col-span-3">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                        <Calendar size={14} className="text-violet-500 shrink-0 font-bold" />
                                                        <span>Năm học nghỉ</span>
                                                    </label>
                                                    <select className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputLeaveYear} onChange={(e) => setInputLeaveYear(e.target.value)} disabled={!isEditing && !isCreating}>
                                                        <option value="">-- Chọn năm --</option>
                                                        {years.map(y => <option key={y.id} value={y.name}>{y.name.replace('Năm học ', '')}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {/* Ngày sinh */}
                                        <div className="col-span-12 md:col-span-4">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Calendar size={14} className="text-cyan-500 shrink-0 font-bold" />
                                                <span>Ngày sinh</span>
                                                <span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <input type="date" className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputDob} onChange={(e) => setInputDob(e.target.value)} disabled={!isEditing && !isCreating}/>
                                        </div>

                                        {/* Giới tính */}
                                        <div className="col-span-12 md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Users size={14} className="text-pink-500 shrink-0 font-bold" />
                                                <span>Giới tính</span>
                                            </label>
                                            <select className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputGender} onChange={(e) => setInputGender(e.target.value as any)} disabled={!isEditing && !isCreating}>
                                                <option value="Male">Nam</option>
                                                <option value="Female">Nữ</option>
                                            </select>
                                        </div>

                                        {/* Nơi sinh */}
                                        <div className="col-span-12 md:col-span-6">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <MapPin size={14} className="text-teal-500 shrink-0 font-bold" />
                                                <span>Nơi sinh</span>
                                            </label>
                                            <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputBirthPlace} onChange={(e) => setInputBirthPlace(e.target.value)} placeholder="TP. Hồ Chí Minh..." disabled={!isEditing && !isCreating}/>
                                        </div>
                                    </div>
                        </div>

                        {/* Family Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Phone size={18}/></div>
                                <h4 className="font-black text-sm text-slate-700 uppercase tracking-wider">Liên hệ gia đình</h4>
                            </div>
                            <div className="p-6 grid grid-cols-12 gap-x-6 gap-y-4">
                                <div className="col-span-12 md:col-span-7">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <User size={14} className="text-blue-500 shrink-0 font-bold" />
                                        <span>Họ tên bố</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputFatherName} onChange={(e) => setInputFatherName(e.target.value)} disabled={!isEditing && !isCreating} />
                                </div>
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Phone size={14} className="text-emerald-500 shrink-0 font-bold" />
                                        <span>SĐT bố</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-blue-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputFatherPhone} onChange={(e) => setInputFatherPhone(e.target.value)} disabled={!isEditing && !isCreating} />
                                </div>
                                <div className="col-span-12 md:col-span-7">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <User size={14} className="text-blue-500 shrink-0 font-bold" />
                                        <span>Họ tên mẹ</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputMotherName} onChange={(e) => setInputMotherName(e.target.value)} disabled={!isEditing && !isCreating} />
                                </div>
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Phone size={14} className="text-emerald-500 shrink-0 font-bold" />
                                        <span>SĐT mẹ</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-blue-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputMotherPhone} onChange={(e) => setInputMotherPhone(e.target.value)} disabled={!isEditing && !isCreating} />
                                </div>
                                <div className="col-span-12">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Home size={14} className="text-teal-500 shrink-0 font-bold" />
                                        <span>Số nhà / Địa chỉ thường trú</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputAddress} onChange={(e) => setInputAddress(e.target.value)} disabled={!isEditing && !isCreating} />
                                </div>
                                <div className="col-span-12">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Mail size={14} className="text-sky-500 shrink-0 font-bold" />
                                        <span>Email liên lạc</span>
                                    </label>
                                    <input className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} placeholder="email@example.com" disabled={!isEditing && !isCreating} />
                                </div>
                            </div>
                        </div>

                        {/* Sacraments Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ScrollText size={18}/></div>
                                <h4 className="font-black text-sm text-slate-700 uppercase tracking-wider">Hồ sơ bí tích</h4>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Baptism */}
                                <div className="bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden">
                                    <div className="bg-blue-100/50 px-4 py-2 border-b border-blue-200 flex items-center gap-2"><Droplets size={16} className="text-blue-600 font-bold" /><span className="font-bold text-sm text-blue-800">Rửa tội</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Calendar size={14} className="text-blue-500 shrink-0 font-bold" />
                                                <span>Ngày</span>
                                            </label>
                                            <input type="date" className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputBaptismDate} onChange={e => setInputBaptismDate(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <School size={14} className="text-indigo-500 shrink-0 font-bold" />
                                                <span>Tại (Giáo xứ)</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">Gx. </span>
                                                <input className={`w-full pl-10 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputBaptismPlace.replace(/^Gx\. /, '')} onChange={e => setInputBaptismPlace(e.target.value)} disabled={!isEditing && !isCreating} />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-blue-500 shrink-0 font-bold" />
                                                <span>Linh mục rửa tội</span>
                                            </label>
                                            <input className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputBaptismBy} onChange={e => setInputBaptismBy(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-blue-500 shrink-0 font-bold" />
                                                <span>Người đỡ đầu</span>
                                            </label>
                                            <input className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputBaptismSponsor} onChange={e => setInputBaptismSponsor(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Eucharist */}
                                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden">
                                    <div className="bg-emerald-100/50 px-4 py-2 border-b border-emerald-200 flex items-center gap-2"><BookOpen size={16} className="text-emerald-600 font-bold" /><span className="font-bold text-sm text-emerald-800">Rước lễ lần đầu</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Calendar size={14} className="text-emerald-500 shrink-0 font-bold" />
                                                <span>Ngày</span>
                                            </label>
                                            <input type="date" className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputEucharistDate} onChange={e => setInputEucharistDate(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <School size={14} className="text-indigo-500 shrink-0 font-bold" />
                                                <span>Tại (Giáo xứ)</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">Gx. </span>
                                                <input className={`w-full pl-10 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputEucharistPlace.replace(/^Gx\. /, '')} onChange={e => setInputEucharistPlace(e.target.value)} disabled={!isEditing && !isCreating} />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-emerald-500 shrink-0 font-bold" />
                                                <span>Linh mục chủ tế</span>
                                            </label>
                                            <input className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputEucharistBy} onChange={e => setInputEucharistBy(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation */}
                                <div className="bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden">
                                    <div className="bg-rose-100/50 px-4 py-2 border-b border-rose-200 flex items-center gap-2"><Flame size={16} className="text-rose-600 font-bold" /><span className="font-bold text-sm text-rose-800">Thêm sức</span></div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Calendar size={14} className="text-rose-500 shrink-0 font-bold" />
                                                <span>Ngày lãnh nhận</span>
                                            </label>
                                            <input type="date" className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputConfirmationDate} onChange={e => setInputConfirmationDate(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <School size={14} className="text-indigo-500 shrink-0 font-bold" />
                                                <span>Tại (Giáo xứ)</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">Gx. </span>
                                                <input className={`w-full pl-10 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputConfirmationPlace.replace(/^Gx\. /, '')} onChange={e => setInputConfirmationPlace(e.target.value)} disabled={!isEditing && !isCreating} />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-rose-500 shrink-0 font-bold" />
                                                <span>Đức Cha / Linh mục ban bí tích</span>
                                            </label>
                                            <input className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputConfirmationBy} onChange={e => setInputConfirmationBy(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <User size={14} className="text-rose-500 shrink-0 font-bold" />
                                                <span>Người đỡ đầu</span>
                                            </label>
                                            <input className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputConfirmationSponsor} onChange={e => setInputConfirmationSponsor(e.target.value)} disabled={!isEditing && !isCreating} />
                                        </div>
                                    </div>
                                </div>

                                {/* Oath */}
                                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 overflow-hidden">
                                    <div className="bg-indigo-100/50 px-4 py-2 border-b border-indigo-200 flex items-center gap-2"><Star size={16} className="text-indigo-600 font-bold" /><span className="font-bold text-sm text-indigo-800">Bao đồng</span></div>
                                    <div className="p-4">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <Calendar size={14} className="text-violet-500 shrink-0 font-bold" />
                                            <span>Ngày tuyên hứa trọng thể</span>
                                        </label>
                                        <input type="date" className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} value={inputOathDate} onChange={e => setInputOathDate(e.target.value)} disabled={!isEditing && !isCreating} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><AlertCircle size={18}/></div>
                                <h4 className="font-black text-sm text-slate-700 uppercase tracking-wider">Ghi chú thêm</h4>
                            </div>
                            <div className="p-6">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <FileText size={14} className="text-slate-500 shrink-0 font-bold" />
                                    <span>Ghi chú thêm hoặc ý kiến từ Huynh trưởng / Giáo lý viên phụ trách</span>
                                </label>
                                <textarea className={`w-full px-4 py-3 rounded-xl border border-slate-200 resize-none min-h-[100px] leading-relaxed text-sm font-medium text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 ${!isEditing && !isCreating ? 'form-input-disabled' : ''}`} placeholder="Nhập các lưu ý quan trọng khác..." value={inputNote} onChange={e => setInputNote(e.target.value)} disabled={!isEditing && !isCreating}></textarea>
                            </div>
                        </div>
                            </>
                        ) : (
                            /* Academic History Section */
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="font-black text-sm text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-wider border-b border-slate-100 pb-2"><BookOpen size={16}/> Học lực Giáo lý</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-slate-500 font-bold uppercase text-[10px]">
                                            <tr>
                                                <th className="text-left py-2">Niên khóa</th>
                                                <th className="text-left py-2">Lớp</th>
                                                <th className="text-center py-2">TBHKI</th>
                                                <th className="text-center py-2">TBHKII</th>
                                                <th className="text-center py-2">TB Cả năm</th>
                                                <th className="text-left py-2">Kết quả</th>
                                                <th className="text-left py-2">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {records.filter(r => r.studentId === selectedStudent?.id).map((r, index) => {
                                                const year = years.find(y => y.id === r.yearId);
                                                const cls = classes.find(c => c.id === r.classId);
                                                return (
                                                    <tr key={`${r.studentId}-${r.yearId}-${r.classId}-${index}`} className="hover:bg-slate-50">
                                                        <td className="py-3 font-bold text-slate-700">{year?.name || '...'}</td>
                                                        <td className="py-3 font-bold text-slate-700">{cls?.name || '...'}</td>
                                                        <td className="py-3 text-center font-mono">{r.scoreHK1 || '-'}</td>
                                                        <td className="py-3 text-center font-mono">{r.scoreHK2 || '-'}</td>
                                                        <td className="py-3 text-center font-bold text-blue-600 font-mono">{r.average || '-'}</td>
                                                        <td className="py-3 font-bold text-slate-700">{r.result || '...'}</td>
                                                        <td className="py-3 text-slate-500 text-xs">{r.note || ''}</td>
                                                    </tr>
                                                );
                                            })}
                                            {records.filter(r => r.studentId === selectedStudent?.id).length === 0 && (
                                                <tr key="no-records">
                                                    <td colSpan={7} className="py-4 text-center text-slate-400 italic">Chưa có dữ liệu học tập</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        <div className="h-10"></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa hồ sơ của ${selectedStudent?.saintName} ${selectedStudent?.fullName}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteStudent}
        onCancel={() => setShowDeleteModal(false)}
        type="danger"
      />


      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .form-input-disabled { background-color: #f8fafc; border-color: #f1f5f9; cursor: not-allowed; opacity: 0.8;}
        .form-input { width: 100%; padding: 0.6rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 1rem; color: #1e293b; background-color: #fff; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08); }
        .label-tiny { display: block; font-size: 0.8rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.025em; }
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};
