import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, MapPin, Plus, Edit2, Trash2, Copy, 
  Printer, CheckCircle, AlertTriangle, AlertCircle, FileText, 
  Search, Settings, Shield, UserCheck, ShieldAlert, Sparkles, Download
} from 'lucide-react';
import { IRAQI_DAYS } from '../types';

// Structured types for the School Schedule
export interface SchoolLesson {
  id: string;
  day: string;          // Day of week
  periodIndex: number;  // 0 to 5 (6 periods)
  gradeClass: string;   // e.g. "السادس العلمي"
  division: string;     // e.g. "أ", "ب", "ج"
  subject: string;      // Subject name
  teacher: string;      // Teacher name
  room: string;         // Classroom name
  type: 'study' | 'review' | 'solve' | 'exam' | 'rest';
  notes?: string;
}

export interface SchoolProfile {
  schoolName: string;
  principalName: string;
  assistantName: string;
  teachers: string[];
  rooms: string[];
  grades: string[];
  divisions: string[];
}

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  schoolName: 'إعدادية المتميزين للبنين',
  principalName: 'أ. د. محمد الحسني',
  assistantName: 'أ. علاء الدين الجبوري',
  teachers: ['أ. أحمد الراوي (رياضيات)', 'أ. عمر الخفاجي (فيزياء)', 'أ. زينب الدليمي (كيمياء)', 'أ. ساجدة العبيدي (عربي)', 'أ. رائد العزاوي (إنجليزي)', 'أ. علي التميمي (أحياء)'],
  rooms: ['مختبر الفيزياء', 'قاعة المتميزين (١)', 'قاعة النوابغ (٢)', 'مختبر الكيمياء', 'القاعة الكبرى'],
  grades: ['السادس العلمي', 'السادس الأدبي', 'الثالث المتوسط', 'الرابع العلمي', 'الخامس الأحيائي'],
  divisions: ['أ', 'ب', 'ج', 'د'],
};

const DEFAULT_SCHOOL_LESSONS: SchoolLesson[] = [
  {
    id: 's-les-1',
    day: 'الأحد',
    periodIndex: 0,
    gradeClass: 'السادس العلمي',
    division: 'أ',
    subject: 'الرياضيات',
    teacher: 'أ. أحمد الراوي (رياضيات)',
    room: 'قاعة المتميزين (١)',
    type: 'study',
    notes: 'الفصل الأول - الأعداد المركبة ديموافر'
  },
  {
    id: 's-les-2',
    day: 'الأحد',
    periodIndex: 1,
    gradeClass: 'السادس العلمي',
    division: 'أ',
    subject: 'الفيزياء',
    teacher: 'أ. عمر الخفاجي (فيزياء)',
    room: 'مختبر الفيزياء',
    type: 'study',
    notes: 'قوانين ربط المتسعات على التوالي'
  },
  {
    id: 's-les-3',
    day: 'الاثنين',
    periodIndex: 1,
    gradeClass: 'الثالث المتوسط',
    division: 'ب',
    subject: 'اللغة العربية',
    teacher: 'أ. ساجدة العبيدي (عربي)',
    room: 'قاعة النوابغ (٢)',
    type: 'review',
    notes: 'قواعد اسم الفاعل وعمله'
  },
  {
    id: 's-les-4',
    day: 'الثلاثاء',
    periodIndex: 3,
    gradeClass: 'السادس العلمي',
    division: 'ب',
    subject: 'الكيمياء',
    teacher: 'أ. زينب الدليمي (كيمياء)',
    room: 'مختبر الكيمياء',
    type: 'solve',
    notes: 'حل مسائل فرداي والتحليل الكهربائي'
  },
  {
    id: 's-les-5',
    day: 'الخميس',
    periodIndex: 4,
    gradeClass: 'السادس الأدبي',
    division: 'أ',
    subject: 'التاريخ',
    teacher: 'أ. ساجدة العبيدي (عربي)',
    room: 'القاعة الكبرى',
    type: 'exam',
    notes: 'امتحان شهري في الفصل الأول والثاني'
  }
];

// Defined 6 Iraqi school periods with realistic times
export const SCHOOL_PERIODS = [
  { name: 'الحصة الأولى', start: '08:00', end: '08:45' },
  { name: 'الحصة الثانية', start: '08:50', end: '09:35' },
  { name: 'الحصة الثالثة', start: '09:40', end: '10:25' },
  { name: 'الحصة الرابعة', start: '10:45', end: '11:30' },
  { name: 'الحصة الخامسة', start: '11:35', end: '12:20' },
  { name: 'الحصة السادسة', start: '12:25', end: '13:10' }
];

export const TeacherMode: React.FC = () => {
  // Roles inside Teaching Staff
  const [activeRole, setActiveRole] = useState<'principal' | 'assistant' | 'teacher'>('principal');
  
  // School Data & Profile
  const [profile, setProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [lessons, setLessons] = useState<SchoolLesson[]>([]);
  
  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  
  // Form Values
  const [formDay, setFormDay] = useState<string>('الأحد');
  const [formPeriod, setFormPeriod] = useState<number>(0);
  const [formGrade, setFormGrade] = useState<string>('السادس العلمي');
  const [formDivision, setFormDivision] = useState<string>('أ');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formTeacher, setFormTeacher] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>('');
  const [formType, setFormType] = useState<SchoolLesson['type']>('study');
  const [formNotes, setFormNotes] = useState<string>('');

  // Conflict alert dialog / toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Drag and drop states
  const [draggingLesson, setDraggingLesson] = useState<SchoolLesson | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('school_profile');
    const savedLessons = localStorage.getItem('school_lessons');
    const savedRole = localStorage.getItem('school_active_role');

    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedLessons) {
      setLessons(JSON.parse(savedLessons));
    } else {
      setLessons(DEFAULT_SCHOOL_LESSONS);
      localStorage.setItem('school_lessons', JSON.stringify(DEFAULT_SCHOOL_LESSONS));
    }
    if (savedRole) setActiveRole(savedRole as any);
  }, []);

  // Save to LocalStorage helpers
  const saveLessons = (updated: SchoolLesson[]) => {
    setLessons(updated);
    localStorage.setItem('school_lessons', JSON.stringify(updated));
  };

  const saveProfile = (updated: SchoolProfile) => {
    setProfile(updated);
    localStorage.setItem('school_profile', JSON.stringify(updated));
  };

  const handleRoleChange = (role: 'principal' | 'assistant' | 'teacher') => {
    setActiveRole(role);
    localStorage.setItem('school_active_role', role);
    showToast(`تم التغيير إلى وضع ${role === 'principal' ? 'المدير' : role === 'assistant' ? 'المعاون' : 'المدرس'} ورصد صلاحياته المعتمدة.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Conflict Detection Engine
  const detectConflict = (
    day: string,
    periodIndex: number,
    grade: string,
    division: string,
    teacher: string,
    room: string,
    excludeId?: string
  ): { type: string; details: string } | null => {
    for (const les of lessons) {
      if (les.id === excludeId) continue;
      if (les.day === day && les.periodIndex === periodIndex) {
        // 1. Class double-booking
        if (les.gradeClass === grade && les.division === division) {
          return {
            type: 'class',
            details: `الصف والصف الثاني تعارض: (${les.gradeClass} - شعبة ${les.division}) لديه بالفعل درس "${les.subject}" مع ${les.teacher} في هذا الوقت!`
          };
        }
        // 2. Teacher double-booking
        if (teacher && les.teacher === teacher) {
          return {
            type: 'teacher',
            details: `المدرس مشغول: ${les.teacher} لديه درس آخر مع (${les.gradeClass} - شعبة ${les.division}) في هذا الوقت!`
          };
        }
        // 3. Room double-booking
        if (room && les.room === room) {
          return {
            type: 'room',
            details: `القاعة مشغولة: (${les.room}) محجوزة حالياً لدرس "${les.subject}" للصف ${les.gradeClass}!`
          };
        }
      }
    }
    return null;
  };

  // Form Submit Handler
  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      alert('يرجى كتابة اسم المادة الدراسية');
      return;
    }

    // Run Conflict Detection
    const conflict = detectConflict(
      formDay,
      formPeriod,
      formGrade,
      formDivision,
      formTeacher,
      formRoom,
      editingLessonId || undefined
    );

    if (conflict) {
      setConflictWarning(conflict.details);
      // For principal, warn but allow proceeding optionally, or lock based on user guidelines. 
      // Let's enforce strict conflict prevention as requested by the user, and show an warning modal!
      return;
    }

    let updatedList = [...lessons];
    if (editingLessonId) {
      // Edit
      updatedList = lessons.map(l => {
        if (l.id === editingLessonId) {
          return {
            ...l,
            day: formDay,
            periodIndex: formPeriod,
            gradeClass: formGrade,
            division: formDivision,
            subject: formSubject.trim(),
            teacher: formTeacher,
            room: formRoom,
            type: formType,
            notes: formNotes.trim()
          };
        }
        return l;
      });
      showToast('تم تحديث الحصة بنجاح دون أي تعارضات!');
    } else {
      // New
      const newLes: SchoolLesson = {
        id: `s-les-${Date.now()}`,
        day: formDay,
        periodIndex: formPeriod,
        gradeClass: formGrade,
        division: formDivision,
        subject: formSubject.trim(),
        teacher: formTeacher,
        room: formRoom,
        type: formType,
        notes: formNotes.trim()
      };
      updatedList.push(newLes);
      showToast('تمت جدولة وحجز الحصة المدرسية بنجاح!');
    }

    saveLessons(updatedList);
    closeForm();
  };

  const openAddForm = (day: string, periodIndex: number) => {
    if (activeRole === 'assistant') {
      alert('⚠️ عذراً: لا يمتلك المعاون صلاحيات إضافة أو تعديل الحصص الدراسية (للمشاهدة والمراقبة فقط).');
      return;
    }
    setEditingLessonId(null);
    setFormDay(day);
    setFormPeriod(periodIndex);
    setFormGrade(profile.grades[0] || 'السادس العلمي');
    setFormDivision(profile.divisions[0] || 'أ');
    setFormSubject('');
    setFormTeacher(profile.teachers[0] || '');
    setFormRoom(profile.rooms[0] || '');
    setFormType('study');
    setFormNotes('');
    setConflictWarning(null);
    setIsFormOpen(true);
  };

  const openEditForm = (les: SchoolLesson) => {
    if (activeRole === 'assistant') {
      alert('⚠️ عذراً: لا يمتلك المعاون صلاحيات إضافة أو تعديل الحصص الدراسية.');
      return;
    }
    if (activeRole === 'teacher' && les.teacher !== formTeacher && les.teacher !== '') {
      // Check if trying to edit other teacher's lesson
      alert('⚠️ عذراً: كمدرس، تستطيع فقط تعديل أو إلغاء حصصك الخاصة بك وتفادي تعديل جدول زملائك.');
      return;
    }
    setEditingLessonId(les.id);
    setFormDay(les.day);
    setFormPeriod(les.periodIndex);
    setFormGrade(les.gradeClass);
    setFormDivision(les.division);
    setFormSubject(les.subject);
    setFormTeacher(les.teacher);
    setFormRoom(les.room);
    setFormType(les.type);
    setFormNotes(les.notes || '');
    setConflictWarning(null);
    setIsFormOpen(true);
  };

  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeRole === 'assistant') {
      alert('⚠️ عذراً: لا يمتلك المعاون صلاحيات الحذف.');
      return;
    }
    const targetLes = lessons.find(l => l.id === id);
    if (activeRole === 'teacher' && targetLes && targetLes.teacher !== formTeacher && targetLes.teacher !== '') {
      alert('⚠️ عذراً: كمدرس، يمكنك فقط إلغاء وحذف حصصك الدراسية الخاصة.');
      return;
    }
    if (!window.confirm('هل أنت متأكد من إلغاء وحذف هذه الحصة المدرسية من الجدول نهائياً؟')) return;
    const filtered = lessons.filter(l => l.id !== id);
    saveLessons(filtered);
    showToast('تم حذف الحصة الدراسية بنجاح.');
  };

  const handleDuplicateLesson = (les: SchoolLesson, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeRole === 'assistant') {
      alert('⚠️ عذراً: لا يمتلك المعاون صلاحيات التكرار.');
      return;
    }
    const nextDayIdx = (IRAQI_DAYS.indexOf(les.day) + 1) % IRAQI_DAYS.length;
    const nextDay = IRAQI_DAYS[nextDayIdx];

    // check conflict
    const conflict = detectConflict(
      nextDay,
      les.periodIndex,
      les.gradeClass,
      les.division,
      les.teacher,
      les.room
    );

    if (conflict) {
      alert(`⚠️ تعارض: لا يمكن نسخ الحصة ليوم ${nextDay} بسبب: ${conflict.details}`);
      return;
    }

    const duplicated: SchoolLesson = {
      ...les,
      id: `s-les-dup-${Date.now()}`,
      day: nextDay,
    };
    const updated = [...lessons, duplicated];
    saveLessons(updated);
    showToast(`تم نسخ الحصة بنجاح ومضاعفتها إلى يوم ${nextDay}!`);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLessonId(null);
    setConflictWarning(null);
  };

  // Drag and Drop Implementation
  const handleDragStart = (e: React.DragEvent, les: SchoolLesson) => {
    if (activeRole === 'assistant') {
      e.preventDefault();
      return;
    }
    if (activeRole === 'teacher' && les.teacher !== formTeacher && les.teacher !== '') {
      e.preventDefault();
      alert('⚠️ عذراً: تستطيع فقط سحب وإعادة جدولة حصصك الخاصة.');
      return;
    }
    setDraggingLesson(les);
    e.dataTransfer.setData('text/plain', les.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetPeriod: number) => {
    e.preventDefault();
    if (!draggingLesson) return;

    if (draggingLesson.day === targetDay && draggingLesson.periodIndex === targetPeriod) {
      setDraggingLesson(null);
      return;
    }

    // Detect Conflict for the destination
    const conflict = detectConflict(
      targetDay,
      targetPeriod,
      draggingLesson.gradeClass,
      draggingLesson.division,
      draggingLesson.teacher,
      draggingLesson.room,
      draggingLesson.id
    );

    if (conflict) {
      alert(`⚠️ لا يمكن نقل الحصة بسبب تعارض بالجدول:\n\n${conflict.details}`);
      setDraggingLesson(null);
      return;
    }

    // Move lesson
    const updated = lessons.map(l => {
      if (l.id === draggingLesson.id) {
        return {
          ...l,
          day: targetDay,
          periodIndex: targetPeriod
        };
      }
      return l;
    });

    saveLessons(updated);
    showToast(`تم سحب ونقل الحصة بنجاح إلى يوم ${targetDay} - الحصة ${targetPeriod + 1}.`);
    setDraggingLesson(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Settings / Metadata Editing for Principal
  const handleUpdateProfileField = (field: keyof SchoolProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    saveProfile(updated);
    showToast('تم تحديث إعدادات الكادر التدريسي والمدرسة بنجاح!');
  };

  const handleAddSettingItem = (field: 'teachers' | 'rooms' | 'grades', placeholder: string) => {
    const item = window.prompt(`أدخل ${placeholder} الجديد لإضافته للمدرسة:`);
    if (!item || !item.trim()) return;
    const current = [...profile[field]];
    if (current.includes(item.trim())) {
      alert('هذا العنصر مضاف بالفعل!');
      return;
    }
    handleUpdateProfileField(field, [...current, item.trim()]);
  };

  const handleDeleteSettingItem = (field: 'teachers' | 'rooms' | 'grades', item: string) => {
    if (!window.confirm(`هل أنت متأكد من إزالة "${item}" نهائياً من قائمة المدرسة؟`)) return;
    const updated = profile[field].filter(x => x !== item);
    handleUpdateProfileField(field, updated);
  };

  // Filter lessons based on selection
  const filteredLessons = lessons.filter(les => {
    if (filterGrade !== 'all' && les.gradeClass !== filterGrade) return false;
    if (filterTeacher !== 'all' && les.teacher !== filterTeacher) return false;
    if (filterRoom !== 'all' && les.room !== filterRoom) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* ROLE SWITCHER TOP BAR */}
      <div className="no-print bg-white rounded-3xl border border-[#D9D3F0] p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#F5F3FF] rounded-2xl border border-[#D9D3F0]">
            <Shield className="w-6 h-6 text-[#5B2596]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#3E176D]">بوابة الكادر التدريسي والإداري</h2>
            <p className="text-xs text-[#687084]">إدارة ومتابعة جدول الحصص الرسمي وتنسيق القاعات ومنع التداخلات</p>
          </div>
        </div>

        <div className="flex bg-[#F5F3FF] p-1 rounded-2xl border border-[#D9D3F0] gap-1 w-full md:w-auto">
          <button
            onClick={() => handleRoleChange('principal')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeRole === 'principal' 
                ? 'bg-[#5B2596] text-white shadow-sm' 
                : 'text-[#687084] hover:bg-[#E9E6FA]/40 hover:text-[#3E176D]'
            }`}
          >
            <span>المدير 👑</span>
          </button>
          <button
            onClick={() => handleRoleChange('assistant')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeRole === 'assistant' 
                ? 'bg-[#5B2596] text-white shadow-sm' 
                : 'text-[#687084] hover:bg-[#E9E6FA]/40 hover:text-[#3E176D]'
            }`}
          >
            <span>المعاون 📋</span>
          </button>
          <button
            onClick={() => handleRoleChange('teacher')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeRole === 'teacher' 
                ? 'bg-[#5B2596] text-white shadow-sm' 
                : 'text-[#687084] hover:bg-[#E9E6FA]/40 hover:text-[#3E176D]'
            }`}
          >
            <span>المدرس 👨‍🏫</span>
          </button>
        </div>
      </div>

      {/* SYSTEM ROLE DESCRIPTION STATUS */}
      <div className="no-print bg-gradient-to-r from-[#F5F3FF] to-white rounded-2xl border border-[#D9D3F0] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          {activeRole === 'principal' ? (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-[#3E176D] text-xs font-black px-3 py-1.5 rounded-xl border border-indigo-200">
              <UserCheck className="w-4 h-4 text-[#5B2596]" />
              صلاحية كاملة (مدير النظام)
            </span>
          ) : activeRole === 'assistant' ? (
            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              متابعة ومراقبة الشعب (معاون الإدارة)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200">
              <Users className="w-4 h-4 text-emerald-600" />
              تعديل الجدول الشخصي وحجز الحصص (المدرس)
            </span>
          )}
          <span className="text-xs text-[#687084] font-semibold">
            {activeRole === 'principal' 
              ? 'تتمتع بحرية كاملة في تعيين الحصص وتعديل إعدادات المدرسة والغرف والصفوف والمدرسين.' 
              : activeRole === 'assistant' 
              ? 'تستطيع متابعة وتصفية كافة الحصص والصفوف والشعب دون تعديل الجدول تفادياً للتداخلات.' 
              : 'يرجى اختيار اسمك لتصفية وعرض حصصك الخاصة وجدولتها دون تداخل مع غرف أو زملاء آخرين.'}
          </span>
        </div>

        {activeRole === 'principal' && (
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F5F3FF] border border-[#D9D3F0] rounded-xl text-xs font-bold text-[#3E176D] transition-all"
          >
            <Settings className="w-4 h-4" />
            تعديل بيانات الكادر والمدرسة
          </button>
        )}
      </div>

      {/* METADATA CONFIGURATION PANEL FOR PRINCIPAL */}
      {activeRole === 'principal' && isConfigOpen && (
        <div className="no-print bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#5B2596]" />
              لوحة التحكم بمدخلات الكادر وبيانات المدرسة
            </h3>
            <button 
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              إغلاق اللوحة ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* School Info */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-[#3E176D] border-b border-gray-200/60 pb-1.5">معلومات المدرسة الأساسية</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-[#687084] mb-1 font-semibold">اسم المدرسة الرسمي</label>
                  <input
                    type="text"
                    value={profile.schoolName}
                    onChange={(e) => handleUpdateProfileField('schoolName', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl font-bold bg-white text-[#1D2433]"
                  />
                </div>
                <div>
                  <label className="block text-[#687084] mb-1 font-semibold">اسم المدير الثلاثي</label>
                  <input
                    type="text"
                    value={profile.principalName}
                    onChange={(e) => handleUpdateProfileField('principalName', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
                  />
                </div>
                <div>
                  <label className="block text-[#687084] mb-1 font-semibold">اسم المعاون المسؤول</label>
                  <input
                    type="text"
                    value={profile.assistantName}
                    onChange={(e) => handleUpdateProfileField('assistantName', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
                  />
                </div>
              </div>
            </div>

            {/* Teachers List */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                <h4 className="font-bold text-[#3E176D]">قائمة الهيئة التدريسية المعتمدة</h4>
                <button
                  type="button"
                  onClick={() => handleAddSettingItem('teachers', 'المدرس')}
                  className="text-[#5B2596] hover:underline font-bold text-[10px]"
                >
                  + إضافة مدرس
                </button>
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                {profile.teachers.map(teacher => (
                  <div key={teacher} className="flex justify-between items-center p-1.5 bg-white rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-700">{teacher}</span>
                    <button
                      onClick={() => handleDeleteSettingItem('teachers', teacher)}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms / Classrooms List */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                <h4 className="font-bold text-[#3E176D]">القاعات الدراسية والمختبرات</h4>
                <button
                  type="button"
                  onClick={() => handleAddSettingItem('rooms', 'الموقع أو القاعة')}
                  className="text-[#5B2596] hover:underline font-bold text-[10px]"
                >
                  + إضافة قاعة
                </button>
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                {profile.rooms.map(room => (
                  <div key={room} className="flex justify-between items-center p-1.5 bg-white rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-700">{room}</span>
                    <button
                      onClick={() => handleDeleteSettingItem('rooms', room)}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & ACTIONS BAR */}
      <div className="no-print bg-white rounded-3xl border border-[#D9D3F0] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 bg-[#F5F3FF] px-2.5 py-1.5 rounded-xl border border-[#D9D3F0]">
              <Search className="w-3.5 h-3.5 text-[#5B2596]" />
              <span className="text-[10px] font-bold text-[#3E176D]">تصفية الجدول:</span>
            </div>

            {/* Grade Class Filter */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="p-1.5 text-xs border border-gray-200 rounded-xl bg-white text-[#1D2433] font-semibold"
            >
              <option value="all">كل المراحل والصفوف</option>
              {profile.grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Teacher Filter */}
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="p-1.5 text-xs border border-gray-200 rounded-xl bg-white text-[#1D2433] font-semibold"
            >
              <option value="all">كل المدرسين</option>
              {profile.teachers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Room Filter */}
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="p-1.5 text-xs border border-gray-200 rounded-xl bg-white text-[#1D2433] font-semibold"
            >
              <option value="all">كل القاعات والمختبرات</option>
              {profile.rooms.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto lg:justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F3FF] hover:bg-[#E9E6FA] border border-[#D9D3F0] rounded-xl text-xs font-bold text-[#3E176D] transition-all"
            >
              <Printer className="w-4 h-4" />
              طباعة الجدول والمعاينة
            </button>
            <button
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تفريغ كافة حصص جدول المدرسة وإعادة البدء بجدول فارغ؟')) {
                  saveLessons([]);
                  showToast('تم تفريغ وإلغاء كافة حصص جدول المدرسة بنجاح.');
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition-all"
            >
              مسح وتفريغ الجدول ×
            </button>
          </div>
        </div>
      </div>

      {/* 📅 INTERACTIVE SCHOOL SCHEDULE GRID */}
      <div className="bg-white rounded-3xl border border-[#D9D3F0] overflow-hidden shadow-sm">
        
        {/* PRINT-FRIENDLY METADATA HEADER */}
        <div className="p-6 border-b border-[#D9D3F0] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-[#E9E6FA] text-[#3E176D] text-xs font-bold px-2.5 py-1 rounded-lg">
                  جدول المدرسة الرسمي
                </span>
                <span className="text-xs text-[#687084] font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5B2596]" />
                  دورة عام ٢٠٢٦-٢٠٢٧
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#3E176D]">
                # جدول المدرسة — {profile.schoolName}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-[#D9D3F0] text-xs">
              <div>
                <span className="text-[#687084] block mb-0.5 font-bold">المدير العام</span>
                <span className="font-extrabold text-[#1D2433]">{profile.principalName}</span>
              </div>
              <div>
                <span className="text-[#687084] block mb-0.5 font-bold">معاون الإدارة</span>
                <span className="font-extrabold text-[#1D2433]">{profile.assistantName}</span>
              </div>
              <div>
                <span className="text-[#687084] block mb-0.5 font-bold">الحصص النشطة</span>
                <span className="font-extrabold text-[#1D2433]">{lessons.length} حصة دراسية</span>
              </div>
            </div>
          </div>
        </div>

        {/* DRAG-AND-DROP INSTRUCTION */}
        <div className="no-print bg-[#F5F3FF]/40 px-6 py-2 border-b border-[#D9D3F0] flex items-center gap-2 text-[11px] text-[#5B2596] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>تفاعل ذكي: يمكنك سحب وإفلات أي حصة (Drag & Drop) لنقلها وتغيير يومها أو توقيتها بسهولة تامة مع منع التعارضات تلقائياً.</span>
        </div>

        {/* MAIN TABLE container */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px] text-right" style={{ direction: 'rtl' }}>
            <thead>
              <tr className="bg-[#F5F3FF] border-b border-[#D9D3F0]">
                {/* Top-Right header cell */}
                <th className="p-4 text-xs sm:text-sm font-black text-[#3E176D] w-[140px] text-center border-l border-[#D9D3F0]">
                  أوقات الحصص / الأيام
                </th>
                {/* Days array starts Friday, ends Thursday */}
                {IRAQI_DAYS.map((dayName) => (
                  <th 
                    key={dayName} 
                    className="p-4 text-xs sm:text-sm font-black text-[#3E176D] text-center border-l border-[#D9D3F0] last:border-l-0"
                  >
                    {dayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCHOOL_PERIODS.map((period, periodIdx) => {
                return (
                  <tr 
                    key={periodIdx} 
                    className="border-b border-[#D9D3F0] last:border-b-0 hover:bg-[#F5F3FF]/10 transition-colors"
                  >
                    {/* Period Row Header with Time */}
                    <td className="p-3 text-center bg-[#F5F3FF]/30 border-l border-[#D9D3F0] font-medium text-xs text-[#1D2433] w-[140px]">
                      <div className="font-bold text-[#3E176D] mb-1">{period.name}</div>
                      <div className="flex items-center justify-center gap-1 text-[#687084] font-mono font-bold text-[10px]">
                        <Clock className="w-3.5 h-3.5 text-[#5B2596]" />
                        <span>{period.start} - {period.end}</span>
                      </div>
                    </td>

                    {/* Columns representing days */}
                    {IRAQI_DAYS.map((dayName) => {
                      // Find the lesson in this specific slot
                      const cellLesson = filteredLessons.find(
                        les => les.day === dayName && les.periodIndex === periodIdx
                      );

                      const hasLesson = !!cellLesson;

                      return (
                        <td 
                          key={dayName} 
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dayName, periodIdx)}
                          onClick={() => !hasLesson && openAddForm(dayName, periodIdx)}
                          className={`p-2 border-l border-[#D9D3F0] last:border-l-0 align-top h-[140px] w-[12.2%] transition-all ${
                            !hasLesson ? 'cursor-pointer hover:bg-[#F5F3FF]/30' : ''
                          }`}
                        >
                          {hasLesson ? (
                            <div
                              draggable={activeRole !== 'assistant'}
                              onDragStart={(e) => handleDragStart(e, cellLesson)}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(cellLesson);
                              }}
                              className={`group relative h-full flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                                cellLesson.type === 'exam' 
                                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                                  : cellLesson.type === 'review' 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                                  : cellLesson.type === 'solve'
                                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                                  : 'bg-[#F9F8FF] border-[#E9E6FA] text-[#1D2433]'
                              }`}
                            >
                              {/* Lesson Content details inside card */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-black bg-white/70 px-1.5 py-0.5 rounded border border-gray-100">
                                    {cellLesson.gradeClass} - شعبة {cellLesson.division}
                                  </span>
                                  {cellLesson.type === 'exam' && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 bg-rose-500 text-white rounded">امتحان 🔥</span>
                                  )}
                                </div>
                                
                                <div className="font-extrabold text-xs sm:text-sm leading-snug truncate pt-1">
                                  {cellLesson.subject}
                                </div>
                                
                                <div className="text-[9px] text-[#687084] font-medium truncate">
                                  👨‍🏫 {cellLesson.teacher || 'بدون مدرس'}
                                </div>
                              </div>

                              <div className="mt-1 space-y-1 pt-1 border-t border-dashed border-gray-200/50">
                                {cellLesson.room && (
                                  <div className="text-[9px] text-gray-500 flex items-center gap-0.5 truncate">
                                    <MapPin className="w-2.5 h-2.5 text-[#5B2596]" />
                                    <span>{cellLesson.room}</span>
                                  </div>
                                )}
                                {cellLesson.notes && (
                                  <div className="text-[8px] text-gray-400 truncate leading-tight" title={cellLesson.notes}>
                                    {cellLesson.notes}
                                  </div>
                                )}
                              </div>

                              {/* Hover actions buttons inside occupied card */}
                              {activeRole !== 'assistant' && (
                                <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white border border-gray-100 p-1 rounded-xl shadow-lg no-print">
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteLesson(cellLesson.id, e)}
                                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="حذف الحصة"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDuplicateLesson(cellLesson, e)}
                                    className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="نسخ الحصة لليوم التالي"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditForm(cellLesson);
                                    }}
                                    className="p-1 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="group h-full flex flex-col items-center justify-center p-2 rounded-2xl border border-dashed border-gray-200 hover:border-[#5B2596] hover:bg-[#F5F3FF]/40 transition-all text-gray-300 hover:text-[#5B2596]">
                              <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-[9px] mt-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">إضافة حصة</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 POPUP FORM MODAL (ADD / EDIT LESSON) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl border border-[#D9D3F0] max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-right">
            <div className="bg-gradient-to-r from-[#5B2596] to-[#3E176D] p-5 text-white flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E9E6FA]" />
                {editingLessonId ? 'تعديل الحصة المدرسية المجدولة' : 'جدولة حجز حصة مدرسية جديدة'}
              </h3>
              <button 
                onClick={closeForm}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4">
              
              {/* Day & Period Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اليوم الدراسي</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  >
                    {IRAQI_DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">توقيت الحصة</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  >
                    {SCHOOL_PERIODS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name} ({p.start} - {p.end})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class, Division & Subject */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">المادة الدراسية</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="مثال: الرياضيات، الفيزياء"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الشعبة</label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  >
                    {profile.divisions.map(div => (
                      <option key={div} value={div}>شعبة {div}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade Class Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الصف والمرحلة الدراسية</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                >
                  {profile.grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {/* Teacher and Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الأستاذ المدرس</label>
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  >
                    <option value="">بدون مدرس</option>
                    {profile.teachers.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">القاعة أو الغرفة</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 font-bold"
                  >
                    <option value="">بدون قاعة</option>
                    {profile.rooms.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lesson Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نوع الدرس</label>
                <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center">
                  {[
                    { label: 'شرح عادي', value: 'study' },
                    { label: 'مراجعة', value: 'review' },
                    { label: 'حل أسئلة', value: 'solve' },
                    { label: 'امتحان', value: 'exam' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormType(opt.value as any)}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all ${
                        formType === opt.value 
                          ? 'bg-[#5B2596] border-[#5B2596] text-white shadow' 
                          : 'bg-slate-50 border-gray-200 text-gray-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات إدارية أو دراسية</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="الفصل المستهدف، مفردات الحصة، إلخ."
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-[#1D2433] leading-relaxed"
                />
              </div>

              {/* Conflict Warnings inside Form */}
              {conflictWarning && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">🚨 تعارض في الجدولة:</span>
                    <span>{conflictWarning}</span>
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5B2596]/20"
                >
                  {editingLessonId ? 'حفظ التحديثات' : 'جدولة الحصة الآن'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  إلغاء الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST ALERT BANNER */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 bg-[#3E176D] text-white px-5 py-3 rounded-2xl shadow-2xl z-50 animate-bounce text-xs font-bold flex items-center gap-2 no-print">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
