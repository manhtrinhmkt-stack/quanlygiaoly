
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
  note?: string; // Ghi chú
  allowedTabs?: string[]; // Danh sách các tab được phép truy cập (nếu là GLV)
  permissions?: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  fullName: string;
  dob: string;
  saintName: string;
  gender: 'Male' | 'Female';
  status: 'ACTIVE' | 'DROPPED';
  classId: string;
  parish?: string;
  birthPlace?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  ward?: string;
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
  leaveReason?: string;
  leaveYear?: string;
  
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
  avatarUrl?: string;
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
  isLocked?: boolean;
}

export interface Grade {
  id: string;
  name: string;
}

export interface AcademicRecord {
  id?: string;
  studentId: string;
  yearId?: string;
  classId?: string;
  term: 'HK1' | 'HK2';
  scores: Record<string, number>;
  scorePray: number;
  scoreExam: number;
  average: number;
  absentP: number;
  absentK: number;
  scoreHK1?: number;
  scoreHK2?: number;
  result?: string;
  note?: string;
}

export interface TermConfig {
  id: string;
  yearId: string;
  term: 'HK1' | 'HK2';
  startDate: string;
  endDate: string;
  weight?: number; // Optional: weight of the term for yearly average calculation
}

export interface AcademicConfig {
    academicWeight: number;    // % Học lực (e.g., 80)
    attendanceWeight: number;  // % Chuyên cần (e.g., 20)
    attendanceLimit: number;   // Điểm khống chế chuyên cần (e.g., 5.0)
}

export interface ScoreColumn {
  id: string;
  name: string;
  weight: number;
  term: 'HK1' | 'HK2';
  gradeId?: string; // Optional: Apply to a specific grade level
  isTick?: boolean; // Tick/Checkbox only (Passed/Failed)
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
  performer?: string;
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
  session?: 'Sáng' | 'Chiều' | 'Tối';
  purpose: string;
  status: 'BORROWED' | 'RETURNED' | 'REVOKED'; // Added REVOKED
  adminNote?: string;
}

export interface DeviceConfig {
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  openMonth?: string; // YYYY-MM
}

export interface AttendanceConfig {
  allowedDays: number[]; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  totalMassRequiredHK1: number;
  totalMassRequiredHK2: number;
  totalClassRequiredHK1: number;
  totalClassRequiredHK2: number;
  isAutoCalculate: boolean;
}

export interface CommunicationLog {
  id: string;
  type: 'NOTIFICATION' | 'TRANSCRIPT';
  title: string;
  content: string;
  recipients: string[]; // List of student IDs or "ALL"
  sentAt: string;
  senderId: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  term?: 'HK1' | 'HK2' | 'YEAR'; // For transcripts
}

export interface CurriculumItem {
  id: string;
  week: string;               // Ví dụ: "Tuần 1", "Tuần 2", "Khai giảng", v.v.
  liturgicalFeast: string;    // Tên ngày lễ phụng vụ (ví dụ: Chúa nhật 22 Thường Niên)
  classIds: string[];         // Các lớp áp dụng lịch này (có thể dùng chung)
  lessonContent?: string;     // Nội dung bài học giáo lý liên quan (GLV nhập)
  notes?: string;             // Ghi chú nhắc nhở chi tiết cho từng tuần
  updatedBy?: string;         // Tên người cập nhật cuối
  updatedAt?: string;         // Thời gian cập nhật
  yearId?: string;            // Năm học tương ứng
}

export function hasPermission(
  user: Teacher | null | undefined,
  tabId: string,
  action: 'view' | 'edit' | 'delete'
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  
  // Default override: only ADMIN can access settings
  if (tabId === 'settings') return false;
  
  // Custom permissions check
  if (user.permissions && user.permissions[tabId]) {
    return !!user.permissions[tabId][action];
  }
  
  // Fallback to allowedTabs (legacy)
  if (user.allowedTabs && user.allowedTabs.includes(tabId)) {
    return true;
  }
  
  return false;
}

