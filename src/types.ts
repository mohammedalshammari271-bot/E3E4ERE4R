export type LessonType = 'study' | 'review' | 'solve' | 'ministerial' | 'homework' | 'exam' | 'rest';
export type LessonStatus = 'upcoming' | 'completed' | 'delayed' | 'postponed';
export type EffortLevel = 'easy' | 'medium' | 'hard';

export interface ScheduleCell {
  subject: string;
  topic?: string; // عنوان الدرس أو الفصل
  type: LessonType;
  status: LessonStatus;
  teacher?: string;
  room?: string;
  color: string; // Hex code or Tailwind bg class
  effort?: EffortLevel;
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export interface StudentProfile {
  studentName: string;
  stage: 'elementary' | 'middle' | 'preparatory' | '';
  gradeClass: string;
  expectedAverage?: number; // نظام المعدل المتوقع للصفوف الإعدادية والثالث المتوسط
}

export interface Schedule {
  id: string;
  studentName: string;
  gradeClass: string;
  stage: string;
  scheduleName: string;
  scheduleType: string; // جدول يومي، جدول أسبوعي، خطة مراجعة، جدول شهري، خطة وزارية، خطة طوارئ، إلخ
  timePeriod: string;
  createdAt: string;
  lastModified: string;
  startDate?: string; // تاريخ البداية
  endDate?: string;   // تاريخ النهاية
  days: string[];     // ["الجمعة", "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  lessons: string[];  // ["الدرس الأول", "الدرس الثاني", ...]
  lessonTimes: { start: string; end: string }[];
  cells: Record<string, ScheduleCell>; // key: `${dayIndex}-${lessonIndex}` or `${dateString}-${timeString}`
  notes?: string;
  completionRate?: number; // نسبة الإنجاز
  adherenceRate?: number;  // نسبة الالتزام
  studyHours?: number;     // ساعات الدراسة
  completedCount?: number; // عدد الدروس المكتملة
}

// TYPES FOR TEACHER MODE (وضع المدرس)
export interface TeacherLesson {
  id: string;
  scheduleId: string;
  subject: string;
  gradeClass: string;
  studentGroup: string; // اسم الطالب أو المجموعة
  lessonTitle: string;  // عنوان الدرس
  date: string;         // تاريخ الدرس (YYYY-MM-DD)
  day: string;          // اليوم باللغة العربية (من الجمعة إلى الخميس)
  startTime: string;    // وقت البداية (HH:MM)
  endTime: string;      // وقت النهاية (HH:MM)
  duration: number;     // المدة بالدقائق
  locationType: 'physical' | 'online';
  meetLink?: string;    // رابط أونلاين
  notes?: string;
  recurrence: 'once' | 'weekly' | 'custom_days';
  recurrenceDays?: string[]; // أيام التكرار
}

export interface TeacherSchedule {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
}

// TYPES FOR CURRICULUM TREE EDITOR (محرر شجرة المنهج)
export interface CurriculumNode {
  id: string;
  name: string;
  type: 'subject' | 'unit' | 'chapter' | 'lesson' | 'subpart';
  children?: CurriculumNode[];
  notes?: string;
  completed?: boolean;
  reviewCount?: number;
  lastReviewDate?: string;
  questionsCount?: number;
  ministerialQuestionsCount?: number;
  masteryPercentage?: number;
}

export const THEME_COLORS = {
  primary: '#5B2596',
  darkPurple: '#3E176D',
  mediumPurple: '#7641B4',
  lightLavender: '#E9E6FA',
  secondaryBg: '#F5F3FF',
  textPrimary: '#1D2433',
  textSecondary: '#687084',
  border: '#D9D3F0',
  cardBg: '#FFFFFF',
};

export const LESSON_TYPES_ARABIC: Record<LessonType, { label: string; bg: string; text: string }> = {
  study: { label: 'دراسة', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  review: { label: 'مراجعة', bg: 'bg-purple-50', text: 'text-purple-700' },
  solve: { label: 'حل أسئلة', bg: 'bg-blue-50', text: 'text-blue-700' },
  ministerial: { label: 'وزاريات', bg: 'bg-amber-50', text: 'text-amber-800' },
  homework: { label: 'واجب', bg: 'bg-sky-50', text: 'text-sky-700' },
  exam: { label: 'امتحان', bg: 'bg-rose-50', text: 'text-rose-700' },
  rest: { label: 'راحة', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export const LESSON_STATUS_ARABIC: Record<LessonStatus, { label: string; bg: string; text: string }> = {
  upcoming: { label: 'قادم', bg: 'bg-gray-100', text: 'text-gray-700' },
  completed: { label: 'مكتمل', bg: 'bg-emerald-100/80', text: 'text-emerald-800' },
  delayed: { label: 'متأخر', bg: 'bg-amber-100/80', text: 'text-amber-800' },
  postponed: { label: 'مؤجل', bg: 'bg-rose-100/80', text: 'text-rose-800' },
};

// Beautiful soft subject cell colors matching the lavender/purple theme
export const SUBJECT_COLORS = [
  { name: 'لافندر ناعم', bg: 'bg-[#E9E6FA]', text: 'text-[#3E176D]', border: 'border-[#D9D3F0]', hexBg: '#E9E6FA', hexText: '#3E176D' },
  { name: 'بنفسجي متوسط', bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', border: 'border-[#E9D5FF]', hexBg: '#F3E8FF', hexText: '#7E22CE' },
  { name: 'أزرق سماوي', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]', hexBg: '#E0F2FE', hexText: '#0369A1' },
  { name: 'أخضر نعناعي', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]', hexBg: '#ECFDF5', hexText: '#047857' },
  { name: 'وردي هادئ', bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]', border: 'border-[#FBCFE8]', hexBg: '#FCE7F3', hexText: '#BE185D' },
  { name: 'ذهبي دافئ', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]', hexBg: '#FEF3C7', hexText: '#B45309' },
  { name: 'أزرق هادئ', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#DBEAFE]', hexBg: '#EFF6FF', hexText: '#1D4ED8' },
];

export const IRAQI_DAYS = [
  'الجمعة',
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
];

