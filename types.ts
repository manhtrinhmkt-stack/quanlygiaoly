
export interface Teacher {
  id: string; // Mã GLV (Tự động)
  saintName: string;
  fullName: string;
  dob: string;
  birthPlace: string;
  address: string;
  phone: string;
  email: string;
  educationLevel: string; // Học vấn Giáo Lý (VD: Cấp 1, 2, 3...)
  role: 'ADMIN' | 'GLV'; // Phân quyền
  status?: 'ACTIVE' | 'INACTIVE'; // Tình trạng hoạt động
  username?: string; // Tên đăng nhập
  password?: string; // Mật khẩu
  allowedTabs?: string[]; // Danh sách các tab được phép truy cập (nếu là GLV)
}

export interface Student {
  id: string;
  fullName: string;
  dob: string;
  saintName: string;
  gender: 'Male' | 'Female';
  status: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED';
  classId: string;
  parish?: string;
  birthPlace?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  baptismDate?: string;
  baptismBy?: string;
  baptismSponsor?: string;
  baptismPlace?: string;
  eucharistDate?: string;
  eucharistBy?: string;
  eucharistPlace?: string;
  confirmationDate?: string;
  confirmationBy?: string;
  confirmationSponsor?: string;
  confirmationPlace?: string;
  confirmationOathDate?: string;
  note?: string;
  
  // Computed properties for Grades component
  avg1?: number;
  avg2?: number;
  avgYear?: number;
  rank?: { label: string, color: string };
  ranking?: number;
  isPassed?: boolean;
  absentP1?: number;
  absentK1?: number;
  absentP2?: number;
  absentK2?: number;
  nameForSort?: string;

  // New field for manual promotion review
  promotionResult?: 'PASS' | 'RETAIN'; 
}

export interface ClassRoom {
  id: string;
  name: string;
  gradeId: string;
  yearId: string;
  mainTeacher?: string;
  assistants?: string;
  room?: string;
}

export interface SchoolYear {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Grade {
  id: string;
  name: string;
}

export interface AcademicRecord {
  studentId: string;
  term: 'HK1' | 'HK2';
  scores: Record<string, number>;
  scorePray: number;
  scoreExam: number;
  average: number;
  absentP: number;
  absentK: number;
}

export interface TermConfig {
  id: string;
  yearId: string;
  term: 'HK1' | 'HK2';
  startDate: string;
  endDate: string;
}

export interface ScoreColumn {
  id: string;
  name: string;
  weight: number;
  term: 'HK1' | 'HK2';
}

export interface Saint {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  note?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'BOOK' | 'UNIFORM' | 'SCARF' | 'OTHER';
  quantity: number;
  minQuantity: number;
  unit: string;
  price: number;
}

export interface Announcement {
  id: string;
  type: 'NOTICE' | 'MINUTES';
  date: string;
  title: string;
  content: string;
}

export interface DeviceRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  deviceName: string;
  date: string;
  session: 'Sáng' | 'Chiều' | 'Tối';
  purpose: string;
  status: 'BORROWED' | 'RETURNED'; // Simplified status
  adminNote?: string;
}

export interface DeviceConfig {
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
