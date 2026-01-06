
import { 
  Teacher, Student, ClassRoom, SchoolYear, Grade, 
  AcademicRecord, TermConfig, ScoreColumn, Saint, 
  Transaction, InventoryItem, Announcement, DeviceRequest
} from './types';

// --- HELPER DATA FOR GENERATION ---
const FIRST_NAMES = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hương', 'Khanh', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Uyên', 'Vinh', 'Yến', 'Tú', 'Thành', 'Đạt', 'Hiếu', 'Ngân', 'Châu', 'Tiên', 'Trang', 'Huy', 'Hoàng', 'Kiệt', 'Lâm'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Đức', 'Ngọc', 'Hữu', 'Minh', 'Hoàng', 'Thanh', 'Kim', 'Gia', 'Xuân', 'Thu', 'Hồng', 'Quốc'];
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Hoàng', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const SAINTS_MALE = ['Giuse', 'Phêrô', 'Phaolo', 'Gioan', 'Antôn', 'Đaminh', 'Phanxico', 'Tôma', 'Vincent', 'Augustinô', 'Martinô', 'Giieronimo', 'Micae'];
const SAINTS_FEMALE = ['Maria', 'Anna', 'Teresa', 'Cecilia', 'Agatha', 'Lucia', 'Martha', 'Elizabeth', 'Catarina', 'Rosa', 'Monica'];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Generate float with 1 decimal place (x.x)
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// --- BASE STATIC DATA ---

export const MOCK_YEARS: SchoolYear[] = [
  { id: '2023-2024', name: 'Năm học 2023-2024', isActive: true },
  { id: '2022-2023', name: 'Năm học 2022-2023', isActive: false },
];

export const MOCK_GRADES: Grade[] = [
  { id: 'g1', name: 'Khối Khai Tâm' },
  { id: 'g2', name: 'Khối Rước Lễ' },
  { id: 'g3', name: 'Khối Thêm Sức' },
  { id: 'g4', name: 'Khối Bao Đồng' },
];

export const MOCK_CLASSES: ClassRoom[] = [
  { id: 'c1', name: 'Khai Tâm 1', gradeId: 'g1', yearId: '2023-2024', mainTeacher: 'Giuse Trần Văn Hùng', assistants: 'Maria Nguyễn Thị Lan', room: 'P.101' },
  { id: 'c2', name: 'Rước Lễ 1', gradeId: 'g2', yearId: '2023-2024', mainTeacher: 'Phêrô Lê Minh', room: 'P.102' },
  { id: 'c3', name: 'Thêm Sức 1', gradeId: 'g3', yearId: '2023-2024', mainTeacher: 'Anna Phạm Thị Thảo', room: 'P.201' },
  { id: 'c4', name: 'Bao Đồng 1', gradeId: 'g4', yearId: '2023-2024', mainTeacher: 'Giuse Nguyễn Văn Đức', room: 'P.202' },
  { id: 'c5', name: 'Khai Tâm 2', gradeId: 'g1', yearId: '2023-2024', mainTeacher: 'Maria Lê Thị B', room: 'P.103' },
  { id: 'c6', name: 'Rước Lễ 2', gradeId: 'g2', yearId: '2023-2024', mainTeacher: 'Giuse Phạm Văn C', room: 'P.104' },
];

export const MOCK_TERM_CONFIGS: TermConfig[] = [
  { id: 't1', yearId: '2023-2024', term: 'HK1', startDate: '2023-09-01', endDate: '2024-01-15' },
  { id: 't2', yearId: '2023-2024', term: 'HK2', startDate: '2024-01-16', endDate: '2024-05-31' },
];

export const MOCK_SCORE_COLUMNS: ScoreColumn[] = [
  { id: 'col_15m', name: '15 phút', weight: 1, term: 'HK1' },
  { id: 'col_45m', name: '45 phút', weight: 2, term: 'HK1' },
  { id: 'col_exam', name: 'Thi HK', weight: 3, term: 'HK1' },
  { id: 'col_15m_2', name: '15 phút', weight: 1, term: 'HK2' },
  { id: 'col_45m_2', name: '45 phút', weight: 2, term: 'HK2' },
  { id: 'col_exam_2', name: 'Thi HK', weight: 3, term: 'HK2' },
];

export const MOCK_SAINTS: Saint[] = [
  { id: 's1', name: 'Giuse', gender: 'Male' },
  { id: 's2', name: 'Maria', gender: 'Female' },
  { id: 's3', name: 'Phêrô', gender: 'Male' },
  { id: 's4', name: 'Phaolo', gender: 'Male' },
  { id: 's5', name: 'Anna', gender: 'Female' },
  { id: 's6', name: 'Teresa', gender: 'Female' },
  { id: 's7', name: 'Antôn', gender: 'Male' },
  { id: 's8', name: 'Cecilia', gender: 'Female' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'a1', type: 'NOTICE', date: '2023-10-20', title: 'Họp phụ huynh đầu năm', content: 'Kính mời quý phụ huynh tham dự buổi họp đầu năm vào lúc 8h00 Chúa Nhật tuần này.' },
    { id: 'a2', type: 'MINUTES', date: '2023-10-15', title: 'Biên bản họp GLV tháng 10', content: 'Thống nhất chương trình thi đua học kỳ 1.' },
    { id: 'a3', type: 'NOTICE', date: '2023-11-01', title: 'Thông báo nghỉ lễ', content: 'Các em được nghỉ học giáo lý vào Chúa Nhật tuần sau.' },
];

export const MOCK_DEVICE_REQUESTS: DeviceRequest[] = [
    { id: 'DR1', teacherId: 'glv01', teacherName: 'Giuse Trần Văn Hùng', deviceName: 'Máy chiếu Epson', date: '2023-10-22', session: 'Sáng', purpose: 'Dạy bài 5 - Khối KT1', status: 'RETURNED' },
    { id: 'DR2', teacherId: 'glv02', teacherName: 'Phêrô Lê Minh', deviceName: 'Loa kéo Sony', date: '2023-10-22', session: 'Chiều', purpose: 'Sinh hoạt vòng tròn', status: 'BORROWED' },
    { id: 'DR3', teacherId: 'glv03', teacherName: 'Anna Phạm Thị Thảo', deviceName: 'Micro không dây', date: '2023-10-29', session: 'Sáng', purpose: 'Tập hát', status: 'BORROWED' },
];

// --- GENERATED MOCK DATA (35 items each) ---

// 1. TEACHERS (35 items)
const generatedTeachers: Teacher[] = Array.from({ length: 35 }).map((_, i) => {
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const saint = gender === 'Male' ? getRandomItem(SAINTS_MALE) : getRandomItem(SAINTS_FEMALE);
  const fullName = `${getRandomItem(LAST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(FIRST_NAMES)}`;
  
  return {
    id: `glv${(i + 3).toString().padStart(2, '0')}`, // Start from glv03
    saintName: saint,
    fullName: fullName,
    dob: getRandomDate(new Date(1990, 0, 1), new Date(2003, 0, 1)),
    birthPlace: getRandomItem(['Sài Gòn', 'Đồng Nai', 'Hà Tĩnh', 'Nam Định', 'Nghệ An', 'Vũng Tàu', 'Bến Tre']),
    address: `${getRandomInt(1, 999)} Đường số ${getRandomInt(1, 20)}, Phường ${getRandomInt(1, 15)}`,
    phone: `09${getRandomInt(10000000, 99999999)}`,
    email: `glv${i + 3}@gx.com`,
    educationLevel: getRandomItem(['GLV Cấp 1', 'GLV Cấp 2', 'GLV Cấp 3', 'TNTT Cấp 1', 'TNTT Cấp 2']),
    role: 'GLV',
    status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE', // 10% chance of being inactive
    username: `glv${i + 3}`,
    password: '123',
    allowedTabs: ['dashboard', 'classes', 'students', 'attendance', 'grades', 'devices']
  };
});

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 'admin',
    saintName: 'Maria',
    fullName: 'Nguyễn Thị Lan (Trưởng Ban)',
    dob: '1995-02-10',
    birthPlace: 'Đồng Nai',
    address: '123 Đường A, P. Tân Thành',
    phone: '0909111222',
    email: 'admin@gx.com',
    educationLevel: 'GLV Cấp 2',
    role: 'ADMIN',
    status: 'ACTIVE',
    username: 'admin',
    password: '123',
  },
  {
    id: 'glv01',
    saintName: 'Giuse',
    fullName: 'Trần Văn Hùng',
    dob: '1990-08-15',
    birthPlace: 'Sài Gòn',
    address: '456 Đường B, P. Tân Thành',
    phone: '0909333444',
    email: 'hung@gx.com',
    educationLevel: 'GLV Cấp 3',
    role: 'GLV',
    status: 'ACTIVE',
    username: 'glv01',
    password: '123',
    allowedTabs: ['dashboard', 'classes', 'students', 'attendance', 'grades', 'devices']
  },
  {
    id: 'glv02',
    saintName: 'Phêrô',
    fullName: 'Lê Minh',
    dob: '1998-12-01',
    birthPlace: 'Hà Tĩnh',
    address: '789 Đường C',
    phone: '0912345678',
    email: 'minh@gx.com',
    educationLevel: 'TNTT Cấp 2',
    role: 'GLV',
    status: 'ACTIVE',
    username: 'glv02',
    password: '123',
    allowedTabs: ['dashboard', 'attendance', 'devices']
  },
  ...generatedTeachers
];

// 2. STUDENTS (35 items)
const generatedStudents: Student[] = Array.from({ length: 35 }).map((_, i) => {
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const saint = gender === 'Male' ? getRandomItem(SAINTS_MALE) : getRandomItem(SAINTS_FEMALE);
  const fullName = `${getRandomItem(LAST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(FIRST_NAMES)}`;
  const classId = getRandomItem(MOCK_CLASSES.map(c => c.id));
  
  return {
    id: `23${(i + 4).toString().padStart(4, '0')}`,
    fullName: fullName,
    dob: getRandomDate(new Date(2010, 0, 1), new Date(2017, 0, 1)),
    saintName: saint,
    gender: gender as 'Male' | 'Female',
    status: Math.random() > 0.9 ? (Math.random() > 0.5 ? 'TRANSFERRED' : 'DROPPED') : 'ACTIVE',
    classId: classId,
    fatherName: `${getRandomItem(LAST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(FIRST_NAMES)}`,
    motherName: `${getRandomItem(LAST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(FIRST_NAMES)}`,
    fatherPhone: Math.random() > 0.2 ? `09${getRandomInt(10000000, 99999999)}` : undefined,
    motherPhone: Math.random() > 0.2 ? `09${getRandomInt(10000000, 99999999)}` : undefined,
    address: `${getRandomInt(1, 500)} Đường số ${getRandomInt(1, 10)}, P.${getRandomInt(1,15)}`,
    note: Math.random() > 0.8 ? 'Gia đình khó khăn' : '',
    parish: 'Gx. Tân Thành',
    birthPlace: 'TP.HCM'
  };
});

export const MOCK_STUDENTS: Student[] = [
  {
    id: '230001',
    fullName: 'Nguyễn Văn An',
    dob: '2016-05-15',
    saintName: 'Phêrô',
    gender: 'Male',
    status: 'ACTIVE',
    classId: 'c1',
    fatherName: 'Nguyễn Văn Ba',
    motherName: 'Lê Thị Tư',
    fatherPhone: '0901234567',
    address: '123 Đường Số 1',
  },
  {
    id: '230002',
    fullName: 'Trần Thị Bình',
    dob: '2016-08-20',
    saintName: 'Maria',
    gender: 'Female',
    status: 'ACTIVE',
    classId: 'c1',
    motherName: 'Phạm Thị Sáu',
    motherPhone: '0909876543',
    address: '456 Đường Số 2',
  },
  {
    id: '230003',
    fullName: 'Lê Văn Cường',
    dob: '2014-02-10',
    saintName: 'Giuse',
    gender: 'Male',
    status: 'ACTIVE',
    classId: 'c2',
    address: '789 Đường Số 3',
  },
  ...generatedStudents
];

// 3. ACADEMIC RECORDS (Decimal Scores x.x for 35 students)
const generatedRecords: AcademicRecord[] = [];
MOCK_STUDENTS.forEach(student => {
    // Generate for HK1
    // Using getRandomFloat to ensure x.x format
    const s1_15m = getRandomFloat(5, 10);
    const s1_45m = getRandomFloat(4, 9.5);
    const s1_exam = getRandomFloat(3, 10);
    const s1_avg = parseFloat(((s1_15m + s1_45m * 2 + s1_exam * 3) / 6).toFixed(1));

    generatedRecords.push({
        studentId: student.id,
        term: 'HK1',
        scores: { 'col_15m': s1_15m, 'col_45m': s1_45m, 'col_exam': s1_exam },
        scorePray: 0,
        scoreExam: 0,
        average: s1_avg,
        absentP: getRandomInt(0, 2),
        absentK: getRandomInt(0, 1)
    });

    // Generate for HK2 (some missing to simulate current progress)
    if (Math.random() > 0.2) {
        const s2_15m = getRandomFloat(6, 10);
        const s2_45m = getRandomFloat(5, 10);
        const s2_exam = getRandomFloat(4, 10);
        const s2_avg = parseFloat(((s2_15m + s2_45m * 2 + s2_exam * 3) / 6).toFixed(1));

        generatedRecords.push({
            studentId: student.id,
            term: 'HK2',
            scores: { 'col_15m_2': s2_15m, 'col_45m_2': s2_45m, 'col_exam_2': s2_exam },
            scorePray: 0,
            scoreExam: 0,
            average: s2_avg,
            absentP: getRandomInt(0, 3),
            absentK: getRandomInt(0, 2)
        });
    }
});

export const MOCK_ACADEMIC_RECORDS: AcademicRecord[] = generatedRecords;

// 4. FINANCE (35 Transactions)
const generatedFinance: Transaction[] = Array.from({ length: 35 }).map((_, i) => {
    const isIncome = Math.random() > 0.4;
    const type: 'INCOME' | 'EXPENSE' = isIncome ? 'INCOME' : 'EXPENSE';
    const amount = isIncome ? getRandomInt(50, 500) * 10000 : getRandomInt(20, 200) * 10000;
    
    return {
        id: `T${Date.now() - i * 1000000}`,
        date: getRandomDate(new Date(2023, 8, 1), new Date(2023, 11, 30)),
        type: type,
        amount: amount,
        description: isIncome 
            ? getRandomItem(['Thu tiền sách', 'Thu tiền đồng phục', 'Quyên góp', 'Thu tiền ve chai', 'Mạnh thường quân ủng hộ', 'Quỹ phụ huynh']) 
            : getRandomItem(['Mua phấn', 'Photo tài liệu', 'Mua nước uống', 'Sửa chữa quạt', 'Mua phần thưởng', 'Liên hoan GLV', 'Trang trí lễ', 'Mua dụng cụ']),
        note: Math.random() > 0.7 ? 'Ghi chú chi tiết...' : ''
    };
});

export const MOCK_FINANCE: Transaction[] = [
  { id: 'T_INIT_1', date: '2023-10-20', type: 'INCOME' as const, amount: 5000000, description: 'Thu tiền sách đầu năm', note: 'Lớp Khai Tâm 1' },
  { id: 'T_INIT_2', date: '2023-10-25', type: 'EXPENSE' as const, amount: 2000000, description: 'Mua phấn viết bảng', note: 'Kho vật tư' },
  ...generatedFinance
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 5. INVENTORY (35 Items)
const generatedInventory: InventoryItem[] = Array.from({ length: 35 }).map((_, i) => {
    const category = getRandomItem(['BOOK', 'UNIFORM', 'SCARF', 'OTHER'] as const);
    const itemNames = {
        'BOOK': ['Sách Khai Tâm', 'Sách Rước Lễ', 'Sách Thêm Sức', 'Sách Bao Đồng', 'Kinh Thánh Tân Ước', 'Kinh Thánh Trọn Bộ', 'Sách Bài Hát', 'Youcat VN', 'Docat'],
        'UNIFORM': ['Áo Thiếu Nhi size S', 'Áo Thiếu Nhi size M', 'Áo Thiếu Nhi size L', 'Áo Huynh Trưởng S', 'Áo Huynh Trưởng M', 'Quần Tây Xanh', 'Váy Xanh'],
        'SCARF': ['Khăn Ấu', 'Khăn Thiếu', 'Khăn Nghĩa', 'Khăn Hiệp', 'Khăn Huynh Trưởng', 'Khăn Trợ Tá', 'Khăn Dự Trưởng'],
        'OTHER': ['Phấn trắng', 'Phấn màu', 'Bông bảng', 'Sổ đầu bài', 'Viết bi xanh', 'Giấy A4', 'Bóng đèn', 'Micro', 'Loa cầm tay', 'Máy chiếu Epson', 'Dây HDMI', 'Ổ cắm điện']
    };

    return {
        id: `INV${i + 100}`,
        name: `${getRandomItem(itemNames[category])} - Mã ${getRandomInt(10, 99)}`,
        category: category,
        quantity: getRandomInt(0, 200),
        minQuantity: getRandomInt(5, 20),
        unit: getRandomItem(['Cái', 'Cuốn', 'Hộp', 'Ram', 'Chiếc']),
        price: getRandomInt(5, 100) * 1000
    };
});

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'INV1', name: 'Sách Khai Tâm (Mẫu Mới)', category: 'BOOK', quantity: 50, minQuantity: 10, unit: 'Cuốn', price: 15000 },
  { id: 'INV2', name: 'Khăn Quàng Ấu', category: 'SCARF', quantity: 100, minQuantity: 20, unit: 'Cái', price: 10000 },
  ...generatedInventory
];
