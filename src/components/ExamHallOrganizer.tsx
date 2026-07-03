import React, { useState, useEffect } from 'react';
import {
  SchoolLesson
} from './TeacherMode';
import {
  FileText, Users, MapPin, Sparkles, Send, CheckCircle, AlertTriangle, AlertCircle,
  Plus, Trash2, Edit2, Copy, Printer, Search, Settings, Shield, UserCheck, ShieldAlert,
  Download, Upload, ChevronRight, ChevronLeft, Layers, Grid, RefreshCw, ZoomIn, ZoomOut, Save, Check, X, HelpCircle
} from 'lucide-react';
import {
  ExamSession, ExamStudent, ExamHall, ExamSeat, HallSector, ExamProctor, ExamSessionStatus
} from '../types/exam';
import {
  normalizeArabicString, parsePastedStudents, simulateOCR, autoDistribute, runQualityChecks, QualityError
} from '../utils/examGenerators';

// Helper to format date
const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const DEFAULT_SESSION: ExamSession = {
  id: 'session-1',
  schoolName: 'إعدادية المتميزين للبنين',
  examTitle: 'امتحانات البكالوريا الوزارية التجريبية',
  subject: 'الرياضيات',
  gradeClass: 'السادس العلمي',
  attempt: 'الدور الأول',
  date: getTodayDateStr(),
  day: 'الأحد',
  time: '08:30 ص',
  committeeChair: 'أ. د. محمد الحسني',
  notes: 'يرجى الالتزام بالتباعد والهدوء ومنع إدخال الأجهزة الذكية للقاعة.',
  isMultiGrade: false,
  status: 'draft',
  createdAt: getTodayDateStr()
};

const DEFAULT_STUDENTS_MOCK: ExamStudent[] = [
  { id: 'st-1', name: 'أحمد علي جاسم', rollNumber: '100401', gradeClass: 'السادس العلمي', division: 'أ' },
  { id: 'st-2', name: 'محمد حسن الشمري', rollNumber: '100402', gradeClass: 'السادس العلمي', division: 'أ' },
  { id: 'st-3', name: 'حيدر عبد الحسين البهادلي', rollNumber: '100403', gradeClass: 'السادس العلمي', division: 'أ' },
  { id: 'st-4', name: 'زينب عادل كمال الغريري', rollNumber: '100404', gradeClass: 'السادس العلمي', division: 'ب' },
  { id: 'st-5', name: 'علي رضا الطائي', rollNumber: '100405', gradeClass: 'السادس العلمي', division: 'ب' },
  { id: 'st-6', name: 'مصطفى جواد كاظم العبيدي', rollNumber: '100406', gradeClass: 'السادس العلمي', division: 'أ' },
  { id: 'st-7', name: 'سجاد كريم علوان الخفاجي', rollNumber: '100407', gradeClass: 'السادس العلمي', division: 'ب' },
  { id: 'st-8', name: 'مريم عباس قاسم الأسدي', rollNumber: '100408', gradeClass: 'السادس العلمي', division: 'أ' },
];

const DEFAULT_HALL_MOCK: ExamHall = {
  id: 'hall-1',
  name: 'القاعة الكبرى (١)',
  building: 'البناية الرئيسية',
  floor: 'الطابق الثاني',
  gatewaysCount: 1,
  gatewayPositions: ['يمين الغرفة'],
  rowsCount: 5,
  colsCount: 6,
  studentsPerSeat: 1,
  damagedSeatsCount: 2,
  notes: 'قاعة واسعة مكيفة بالكامل وتحتوي على نظام مراقبة بكاميرات معتمدة.',
  proctorId: 'proc-1',
  sectors: [
    {
      id: 'sec-1',
      name: 'القطاع الأول (اليمين)',
      position: 'right',
      associatedGate: 'المدخل الرئيسي',
      direction: 'right_to_left',
      maxCapacity: 20,
      assignedGrade: 'السادس العلمي',
      assignedDivision: 'أ',
      notes: 'يبدأ من جهة يمين المدخل.'
    },
    {
      id: 'sec-2',
      name: 'القطاع الثاني (اليسار)',
      position: 'left',
      associatedGate: 'المدخل الرئيسي',
      direction: 'left_to_right',
      maxCapacity: 20,
      assignedGrade: 'السادس العلمي',
      assignedDivision: 'ب',
      notes: 'يبدأ من يسار المدخل.'
    }
  ],
  seats: Array.from({ length: 30 }, (_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    const isDamaged = index === 11 || index === 20; // Some default damaged seats
    return {
      id: `seat-1-${index}`,
      row,
      col,
      status: isDamaged ? 'damaged' : 'regular',
      assignedSectorId: col < 3 ? 'sec-1' : 'sec-2'
    };
  })
};

const DEFAULT_PROCTORS: ExamProctor[] = [
  { id: 'proc-1', name: 'أ. عمر الخفاجي', role: 'hall', assignedHallId: 'hall-1' },
  { id: 'proc-2', name: 'أ. ساجدة العبيدي', role: 'sector', assignedHallId: 'hall-1', assignedSectorId: 'sec-1' },
  { id: 'proc-3', name: 'أ. رائد العزاوي', role: 'sector', assignedHallId: 'hall-1', assignedSectorId: 'sec-2' },
  { id: 'proc-4', name: 'أ. علي التميمي', role: 'reserve' }
];

export const ExamHallOrganizer: React.FC = () => {
  // Navigation State (1 to 8)
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // Storage & Core States
  const [session, setSession] = useState<ExamSession>(DEFAULT_SESSION);
  const [students, setStudents] = useState<ExamStudent[]>(DEFAULT_STUDENTS_MOCK);
  const [halls, setHalls] = useState<ExamHall[]>([DEFAULT_HALL_MOCK]);
  const [proctors, setProctors] = useState<ExamProctor[]>(DEFAULT_PROCTORS);
  const [qualityErrors, setQualityErrors] = useState<QualityError[]>([]);

  // Substate for loading sessions
  const [sessionsList, setSessionsList] = useState<ExamSession[]>([DEFAULT_SESSION]);

  // Step 2: Student Input sub-tab / state
  const [studentInputMode, setStudentInputMode] = useState<'manual' | 'bulk' | 'file' | 'ocr'>('manual');
  const [manualStudent, setManualStudent] = useState<Partial<ExamStudent>>({
    name: '',
    rollNumber: '',
    gradeClass: 'السادس العلمي',
    division: 'أ',
    gender: 'male',
    specialNotes: ''
  });
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkParsedResult, setBulkParsedResult] = useState<ExamStudent[]>([]);
  const [ocrLog, setOcrLog] = useState<string>('');
  const [ocrResults, setOcrResults] = useState<ExamStudent[]>([]);

  // Step 3: Hall Sub-state
  const [hallInputMode, setHallInputMode] = useState<'quick' | 'visual'>('quick');
  const [selectedHallId, setSelectedHallId] = useState<string>('hall-1');
  const [editingHall, setEditingHall] = useState<Partial<ExamHall>>({
    name: '',
    building: '',
    floor: '',
    studentsPerSeat: 1,
    rowsCount: 5,
    colsCount: 6
  });

  // Step 4: AI Assistant Dialog Sub-state
  const [assistantMessages, setAssistantMessages] = useState<{ sender: 'ai' | 'user'; text: string; options?: string[] }[]>([
    {
      sender: 'ai',
      text: 'أهلاً بك في المساعد الذكي لتوزيع القاعات الامتحانية! لقد قمت بتحليل المدخلات الحالية للمستند وجدول الطلاب المكتمل. هل تود مناقشة قواعد تباعد المقاعد وتخصيص القطاعات قبل توليد التوزيع؟',
      options: ['نعم، دعنا نناقش', 'استخدم الإعدادات الافتراضية مباشرة']
    }
  ]);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [spacingConfig, setSpacingConfig] = useState<'none' | 'one' | 'two'>('none');
  const [sortConfig, setSortConfig] = useState<'rollNumber' | 'alphabetical' | 'random' | 'manual'>('rollNumber');
  const [allowMultiGradeInSector, setAllowMultiGradeInSector] = useState<boolean>(false);
  const [allowMultiGradeInHall, setAllowMultiGradeInHall] = useState<boolean>(true);

  // Search filter for Student Seat Finder
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Local storage auto-load / auto-save
  useEffect(() => {
    const savedSession = localStorage.getItem('exam_session');
    const savedStudents = localStorage.getItem('exam_students');
    const savedHalls = localStorage.getItem('exam_halls');
    const savedProctors = localStorage.getItem('exam_proctors');
    
    if (savedSession) setSession(JSON.parse(savedSession));
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedHalls) setHalls(JSON.parse(savedHalls));
    if (savedProctors) setProctors(JSON.parse(savedProctors));
  }, []);

  const saveToLocal = (sessionObj: ExamSession, studentsArr: ExamStudent[], hallsArr: ExamHall[], proctorsArr: ExamProctor[]) => {
    localStorage.setItem('exam_session', JSON.stringify(sessionObj));
    localStorage.setItem('exam_students', JSON.stringify(studentsArr));
    localStorage.setItem('exam_halls', JSON.stringify(hallsArr));
    localStorage.setItem('exam_proctors', JSON.stringify(proctorsArr));
  };

  const handleUpdateSession = (fields: Partial<ExamSession>) => {
    const updated = { ...session, ...fields };
    setSession(updated);
    saveToLocal(updated, students, halls, proctors);
  };

  const handleUpdateStudents = (updated: ExamStudent[]) => {
    setStudents(updated);
    saveToLocal(session, updated, halls, proctors);
  };

  const handleUpdateHalls = (updated: ExamHall[]) => {
    setHalls(updated);
    saveToLocal(session, students, updated, proctors);
  };

  const handleUpdateProctors = (updated: ExamProctor[]) => {
    setProctors(updated);
    saveToLocal(session, students, halls, updated);
  };

  // Step Indicators
  const stepsList = [
    'بيانات الامتحان',
    'قائمة الطلاب',
    'القاعات والقطاعات',
    'المساعد الحواري',
    'معاينة التوزيع',
    'تعديل يدوي',
    'اعتماد الخطة',
    'النتائج والطباعة'
  ];

  // Render Step Navigation Header
  const renderStepHeader = () => (
    <div className="bg-white rounded-2xl border border-[#D9D3F0] p-4 shadow-sm overflow-x-auto no-print">
      <div className="flex items-center justify-between min-w-[760px] relative">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#E9E6FA] -translate-y-1/2 z-0" />
        {stepsList.map((st, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < activeStep;
          const isActive = stepNum === activeStep;
          return (
            <button
              key={idx}
              onClick={() => setActiveStep(stepNum)}
              className="flex flex-col items-center gap-1.5 relative z-10 cursor-pointer focus:outline-none"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#5B2596] text-white ring-4 ring-[#E9E6FA]'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border-2 border-[#D9D3F0] text-gray-500 hover:border-[#5B2596]'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={`text-[11px] font-bold ${
                  isActive ? 'text-[#3E176D] font-black' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                {st}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Quality check executor
  const triggerQualityChecks = () => {
    const errors = runQualityChecks(students, halls, spacingConfig);
    setQualityErrors(errors);
  };

  // Auto distribute handler
  const handleTriggerAutoDistribution = () => {
    const result = autoDistribute(
      students,
      halls,
      sortConfig,
      spacingConfig,
      allowMultiGradeInSector,
      allowMultiGradeInHall
    );
    handleUpdateHalls(result.updatedHalls);
    handleUpdateSession({ status: 'needs_review' });
    triggerQualityChecks();
    alert('🎉 تم توليد التوزيع الذكي بنجاح! تم نقلكم لمعاينة المخطط البصري وتفاصيل التوزيع.');
    setActiveStep(5); // Jump to Preview
  };

  // OCR simulation triggers
  const handleOcrSimulation = () => {
    const result = simulateOCR('قائمة_السادس_العلمي.png', session.gradeClass);
    setOcrLog(result.log);
    setOcrResults(result.students);
  };

  const handleApplyOcrResults = () => {
    if (ocrResults.length === 0) return;
    const combined = [...students, ...ocrResults];
    handleUpdateStudents(combined);
    setOcrResults([]);
    setOcrLog('');
    alert('تم إضافة الطلاب المستخرجين لقائمة المراجعة الحية للمستند بنجاح!');
  };

  // Add individual student manually
  const handleAddManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudent.name || !manualStudent.name.trim()) return;
    const newStudent: ExamStudent = {
      id: `st-m-${Date.now()}`,
      name: manualStudent.name.trim(),
      rollNumber: manualStudent.rollNumber || `EX-${1000 + students.length}`,
      gradeClass: manualStudent.gradeClass || session.gradeClass,
      division: manualStudent.division || 'أ',
      gender: manualStudent.gender as 'male' | 'female',
      specialNotes: manualStudent.specialNotes
    };
    handleUpdateStudents([...students, newStudent]);
    setManualStudent({
      name: '',
      rollNumber: '',
      gradeClass: session.gradeClass,
      division: 'أ',
      gender: 'male',
      specialNotes: ''
    });
  };

  // Bulk past confirm
  const handleConfirmBulkParsed = () => {
    if (bulkParsedResult.length === 0) return;
    handleUpdateStudents([...students, ...bulkParsedResult]);
    setBulkParsedResult([]);
    setBulkText('');
    alert('تم إضافة الطلاب دفعة واحدة بنجاح!');
  };

  // AI Dialog Answers handler
  const handleAiResponse = (ans: string) => {
    const nextMsg: typeof assistantMessages[0] = { sender: 'user', text: ans };
    let aiReplyText = '';
    let options: string[] = [];

    if (ans.includes('نعم، دعنا نناقش')) {
      aiReplyText = 'ممتاز! أولاً، بالنسبة للتباعد بين الطلبة داخل المقاعد والصفوف، ما هو نمط التباعد المفضل لديكم لضمان النزاهة؟';
      options = ['ترك مقعد فارغ بين الطلاب', 'ترك مقعدين فارغين', 'استخدام جميع المقاعد بالتتابع'];
    } else if (ans.includes('ترك مقعد فارغ')) {
      setSpacingConfig('one');
      aiReplyText = 'تم تحديد تباعد بمقدار مقعد واحد فارغ. ثانياً، كيف تفضل فرز وترتيب الطلبة على المقاعد؟';
      options = ['حسب الرقم الامتحاني تسلسلياً', 'حسب الاسم أبجدياً (أ-ي)', 'توزيع عشوائي بالكامل'];
    } else if (ans.includes('استخدام جميع المقاعد بالتتابع') || ans.includes('ترك مقعدين فارغين')) {
      if (ans.includes('ترك مقعدين')) setSpacingConfig('two');
      else setSpacingConfig('none');
      aiReplyText = 'تم اعتماد ذلك. كيف تفضل فرز وترتيب الطلبة على المقاعد؟';
      options = ['حسب الرقم الامتحاني تسلسلياً', 'حسب الاسم أبجدياً (أ-ي)', 'توزيع عشوائي بالكامل'];
    } else if (ans.includes('حسب الرقم الامتحاني') || ans.includes('حسب الاسم أبجدياً') || ans.includes('توزيع عشوائي بالكامل')) {
      if (ans.includes('الرقم الامتحاني')) setSortConfig('rollNumber');
      else if (ans.includes('الاسم أبجدياً')) setSortConfig('alphabetical');
      else setSortConfig('random');

      aiReplyText = 'تم ضبط قواعد الفرز والترتيب. هل تسمح بدمج وخلط أكثر من مرحلة أو صف في القاعة نفسها أو القطاع نفسه؟';
      options = ['نعم، اسمح في القاعة والقطاع', 'امنع الخلط تماماً داخل القطاع', 'امنع الخلط تماماً في القاعة'];
    } else if (ans.includes('الإعدادات الافتراضية')) {
      setSpacingConfig('none');
      setSortConfig('rollNumber');
      aiReplyText = 'حسناً، تم ضبط التوزيع الافتراضي بالتتابع وحسب الأرقام الامتحانية المتسلسلة. هل تود توليد التوزيع الآن؟';
      options = ['توليد وحساب التوزيع الآن ⚡', 'أريد مراجعة التفاصيل يدوياً أولاً'];
    } else {
      aiReplyText = 'رائع! لقد قمت بتسجيل وتعديل كافة خيارات الجلسة وتجهيز سيناريو التوزيع. يرجى مراجعة ملخص الإعدادات أدناه والضغط على زر توليد التوزيع التلقائي!';
      options = ['توليد وحساب التوزيع الآن ⚡'];
    }

    setAssistantMessages(prev => [...prev, nextMsg, { sender: 'ai', text: aiReplyText, options }]);
  };

  // Group Students by Grade/Division helper
  const getStudentGroups = () => {
    const groups: Record<string, ExamStudent[]> = {};
    students.forEach(s => {
      const key = `${s.gradeClass} - شعبة ${s.division}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  };

  // Delete student
  const handleDeleteStudent = (id: string) => {
    handleUpdateStudents(students.filter(s => s.id !== id));
  };

  // JSON backup utilities
  const handleExportBackup = () => {
    const backup = { session, students, halls, proctors, spacingConfig, sortConfig };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_session_${session.subject}_${session.date}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.session) setSession(data.session);
        if (data.students) setStudents(data.students);
        if (data.halls) setHalls(data.halls);
        if (data.proctors) setProctors(data.proctors);
        if (data.spacingConfig) setSpacingConfig(data.spacingConfig);
        if (data.sortConfig) setSortConfig(data.sortConfig);
        alert('تم استيراد النسخة الاحتياطية بنجاح!');
      } catch (err) {
        alert('حدث خطأ في قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  // Seating drag and drop handlers
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  const handleSeatDragStart = (e: React.DragEvent, studentId: string) => {
    setDraggedStudentId(studentId);
    e.dataTransfer.setData('text/plain', studentId);
  };

  const handleSeatDrop = (e: React.DragEvent, targetHallId: string, targetSeatId: string, position: 1 | 2) => {
    e.preventDefault();
    if (!draggedStudentId) return;

    // Find current place of dragged student and swap or clear
    const updatedHalls = halls.map(hall => {
      const seats = hall.seats.map(seat => {
        let seatId1 = seat.studentId1;
        let seatId2 = seat.studentId2;

        // Clear original seat
        if (seatId1 === draggedStudentId) seatId1 = undefined;
        if (seatId2 === draggedStudentId) seatId2 = undefined;

        // Set to new seat if this is target
        if (hall.id === targetHallId && seat.id === targetSeatId) {
          if (position === 1) {
            // Swap if target seat occupied
            if (seat.studentId1 && seat.studentId1 !== draggedStudentId) {
              // we can put swapped student where dragged student came from (or simply overwrite)
            }
            seatId1 = draggedStudentId;
          } else {
            seatId2 = draggedStudentId;
          }
        }

        return { ...seat, studentId1: seatId1, studentId2: seatId2 };
      });
      return { ...hall, seats };
    });

    handleUpdateHalls(updatedHalls);
    setDraggedStudentId(null);
    triggerQualityChecks();
  };

  const currentHall = halls.find(h => h.id === selectedHallId) || halls[0];

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* 👑 CORE MODULE BRANDING & HERO HEADER */}
      <div className="bg-gradient-to-r from-[#5B2596] via-[#3E176D] to-[#2E1151] rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-purple-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">وحدة متقدمة</span>
            <span className="text-purple-200 text-xs font-bold">إدارة اللجان وتوزيع المقاعد بشكل آلي وبصري</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-yellow-300" />
            <span>منظّم القاعات الامتحانية الذكي</span>
          </h1>
          <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
            قم بإعداد وتوزيع الطلبة على القاعات والمقاعد تلقائياً، توليد مخططات الجلوس البصرية والتأكد الذكي من مطابقة شروط التباعد وعدم وجود تعارضات بالكامل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all"
            title="تصدير نسخة احتياطية"
          >
            <Download className="w-4 h-4 text-yellow-300" />
            <span>نسخة احتياطية</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-300" />
            <span>استيراد</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* WORKFLOW STEP INDICATOR BAR */}
      {renderStepHeader()}

      {/* STEP 1: EXAM SESSION DETAILS */}
      {activeStep === 1 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5B2596]" />
              الخطوة ١: ضبط معلومات وبيانات الجلسة الامتحانية
            </h3>
            <p className="text-xs text-gray-500">أدخل ترويسة الامتحان الرسمية لحفظها وطباعتها على كافة الكشوفات والمخططات لاحقاً.</p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">اسم المدرسة</label>
              <input
                type="text"
                value={session.schoolName}
                onChange={(e) => handleUpdateSession({ schoolName: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">عنوان الامتحان</label>
              <input
                type="text"
                value={session.examTitle}
                onChange={(e) => handleUpdateSession({ examTitle: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">المادة الدراسية</label>
              <input
                type="text"
                value={session.subject}
                onChange={(e) => handleUpdateSession({ subject: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5">الصف أو المرحلة</label>
              <input
                type="text"
                value={session.gradeClass}
                onChange={(e) => handleUpdateSession({ gradeClass: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">الدور الامتحاني</label>
              <select
                value={session.attempt}
                onChange={(e) => handleUpdateSession({ attempt: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433] font-bold"
              >
                <option value="الدور الأول">الدور الأول</option>
                <option value="الدور الثاني">الدور الثاني</option>
                <option value="الدور الثالث">الدور الثالث</option>
                <option value="امتحان شهري">امتحان شهري</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">التاريخ</label>
              <input
                type="date"
                value={session.date}
                onChange={(e) => handleUpdateSession({ date: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5">اليوم</label>
              <input
                type="text"
                value={session.day}
                onChange={(e) => handleUpdateSession({ day: e.target.value })}
                placeholder="الأحد، الاثنين..."
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">وقت الامتحان</label>
              <input
                type="text"
                value={session.time}
                onChange={(e) => handleUpdateSession({ time: e.target.value })}
                placeholder="08:30 ص"
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">مسؤول اللجنة الامتحانية</label>
              <input
                type="text"
                value={session.committeeChair}
                onChange={(e) => handleUpdateSession({ committeeChair: e.target.value })}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-700 font-bold mb-1.5">ملاحظات وتعليمات عامة</label>
              <textarea
                value={session.notes}
                onChange={(e) => handleUpdateSession({ notes: e.target.value })}
                rows={2}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2433]"
              />
            </div>

            <div className="md:col-span-3 p-4 bg-[#F5F3FF] rounded-2xl border border-[#D9D3F0]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={session.isMultiGrade}
                  onChange={(e) => handleUpdateSession({ isMultiGrade: e.target.checked })}
                  className="w-4 h-4 accent-[#5B2596]"
                />
                <div>
                  <span className="font-extrabold text-[#3E176D] block">دمج وتوزيع لعدة صفوف ومراحل معاً في الجلسة؟</span>
                  <span className="text-[10px] text-gray-500 block">عند التفعيل، يسمح النظام بدمج مراحل دراسية مختلفة في نفس القاعة وتوليد قطاعات معزولة لكل صف.</span>
                </div>
              </label>
            </div>
          </form>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: إدخال الطلاب</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: STUDENT INPUT & GROUPS */}
      {activeStep === 2 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5B2596]" />
                الخطوة ٢: إدخال واستيراد قوائم الطلبة
              </h3>
              <p className="text-xs text-gray-500">يمكنك الإضافة الفردية، لصق نص جماعي، أو استيراد النص من الصور والملفات.</p>
            </div>
            <div className="bg-[#E9E6FA] text-[#3E176D] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#D9D3F0]">
              إجمالي الطلاب الحالي: {students.length} طالب
            </div>
          </div>

          {/* INPUT MODES TABS */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 gap-1 text-xs font-bold">
            <button
              onClick={() => setStudentInputMode('manual')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                studentInputMode === 'manual' ? 'bg-[#5B2596] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              إضافة طالب يدوي
            </button>
            <button
              onClick={() => setStudentInputMode('bulk')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                studentInputMode === 'bulk' ? 'bg-[#5B2596] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              لصق مجموعة أسماء
            </button>
            <button
              onClick={() => setStudentInputMode('file')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                studentInputMode === 'file' ? 'bg-[#5B2596] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              استيراد ملف (Excel/CSV/TXT)
            </button>
            <button
              onClick={() => setStudentInputMode('ocr')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                studentInputMode === 'ocr' ? 'bg-[#5B2596] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              رفع صورة قائمة (OCR ذكي)
            </button>
          </div>

          {/* MANUAL INPUT FORM */}
          {studentInputMode === 'manual' && (
            <form onSubmit={handleAddManualStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-gray-700 font-bold mb-1">الاسم الكامل للطالب</label>
                <input
                  type="text"
                  required
                  value={manualStudent.name}
                  onChange={(e) => setManualStudent({ ...manualStudent, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الله حسين"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">الرقم الامتحاني</label>
                <input
                  type="text"
                  value={manualStudent.rollNumber}
                  onChange={(e) => setManualStudent({ ...manualStudent, rollNumber: e.target.value })}
                  placeholder="اختياري - يولد آلياً"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">الصف</label>
                <input
                  type="text"
                  value={manualStudent.gradeClass}
                  onChange={(e) => setManualStudent({ ...manualStudent, gradeClass: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">الشعبة</label>
                <select
                  value={manualStudent.division}
                  onChange={(e) => setManualStudent({ ...manualStudent, division: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white font-bold text-gray-800"
                >
                  <option value="أ">شعبة أ</option>
                  <option value="ب">شعبة ب</option>
                  <option value="ج">شعبة ج</option>
                  <option value="د">شعبة د</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب للقائمة</span>
                </button>
              </div>
            </form>
          )}

          {/* BULK TEXTAREA INPUT */}
          {studentInputMode === 'bulk' && (
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-gray-100 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">الصق قائمة الأسماء بالأسفل (كل اسم في سطر جديد)</label>
                <p className="text-[10px] text-gray-500 mb-2">يدعم التعرف التلقائي على التنسيقات المتنوعة مثل: الاسم فقط، أو (الرقم الامتحاني الاسم)، أو (الاسم - الشعبة).</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    const parsed = parsePastedStudents(e.target.value, session.gradeClass);
                    setBulkParsedResult(parsed);
                  }}
                  rows={5}
                  placeholder="102201 أحمد علي جاسم&#10;102202 سجاد كريم علوان - ب&#10;مصطفى جواد كاظم"
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white font-mono"
                />
              </div>

              {bulkParsedResult.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#3E176D]">مراجعة البيانات المستخرجة من النص المنسوخ:</h4>
                  <div className="max-h-[200px] overflow-y-auto border border-[#D9D3F0] rounded-xl overflow-hidden">
                    <table className="w-full text-right text-[11px] bg-white">
                      <thead className="bg-[#F5F3FF]">
                        <tr>
                          <th className="p-2 border-b font-black text-gray-700">ت</th>
                          <th className="p-2 border-b font-black text-gray-700">الاسم الكامل</th>
                          <th className="p-2 border-b font-black text-gray-700">الرقم الامتحاني</th>
                          <th className="p-2 border-b font-black text-gray-700">الصف</th>
                          <th className="p-2 border-b font-black text-gray-700">الشعبة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkParsedResult.map((st, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 border-b text-gray-400">{i + 1}</td>
                            <td className="p-2 border-b font-bold text-gray-800">{st.name}</td>
                            <td className="p-2 border-b font-mono text-gray-600">{st.rollNumber}</td>
                            <td className="p-2 border-b text-gray-600">{st.gradeClass}</td>
                            <td className="p-2 border-b font-bold text-emerald-700">{st.division}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleConfirmBulkParsed}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      اعتماد واستيراد الأسماء المقترحة
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIMULATED FILE IMPORT */}
          {studentInputMode === 'file' && (
            <div className="p-6 bg-slate-50/50 border border-dashed border-[#D9D3F0] rounded-2xl text-center space-y-3">
              <Upload className="w-10 h-10 text-[#5B2596] mx-auto opacity-70" />
              <div className="text-xs">
                <span className="font-extrabold text-[#3E176D] block">اختر ملف الطلاب المعتمد لمدرستك</span>
                <span className="text-gray-500 block text-[10px] mt-1">يدعم الاستيراد المباشر من ملفات Excel، ملفات CSV النصية، أو جداول PDF الإلكترونية.</span>
              </div>
              <div className="inline-block">
                <button
                  type="button"
                  onClick={() => {
                    const mockFileStudents: ExamStudent[] = [
                      { id: 'f-1', name: 'أحمد ياسين خضير', rollNumber: '100501', gradeClass: session.gradeClass, division: 'أ' },
                      { id: 'f-2', name: 'سيف علي حسين التميمي', rollNumber: '100502', gradeClass: session.gradeClass, division: 'أ' },
                      { id: 'f-3', name: 'ضياء عادل الطائي', rollNumber: '100503', gradeClass: session.gradeClass, division: 'ب' }
                    ];
                    handleUpdateStudents([...students, ...mockFileStudents]);
                    alert('تم استيراد ٣ طلاب من ملف الماكرو بنجاح كعينة برمجية مفعّلة!');
                  }}
                  className="px-5 py-2 bg-white hover:bg-[#F5F3FF] border border-[#D9D3F0] text-[#3E176D] text-xs font-bold rounded-xl transition-all"
                >
                  محاكاة اختيار وقراءة ملف طلاب Excel
                </button>
              </div>
            </div>
          )}

          {/* OCR PHOTO EXTRACTOR WITH UNRELIABLE DATA ALERT WARNING */}
          {studentInputMode === 'ocr' && (
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-gray-100 text-xs">
              <div className="text-center p-6 border border-dashed border-gray-200 bg-white rounded-xl space-y-3">
                <Grid className="w-10 h-10 text-yellow-500 mx-auto" />
                <div>
                  <span className="font-extrabold text-[#3E176D] block">محاكاة مسح صورة قائمة الطلاب بالهاتف أو الكاميرا</span>
                  <p className="text-[10px] text-gray-500 mt-1">اضغط على الزر أدناه لتجربة استخراج الأسماء تلقائياً من صورة القائمة الورقية المطبوعة بذكاء.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOcrSimulation}
                  className="px-5 py-2 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl font-bold flex items-center gap-1 mx-auto"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>بدء تحليل واستخراج النص من الصورة 📷</span>
                </button>
              </div>

              {ocrLog && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-xl font-mono text-[10px] leading-relaxed">
                  {ocrLog}
                </div>
              )}

              {ocrResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[#3E176D] text-xs">
                    مراجعة البيانات المستخرجة من الصورة (نظام التدقيق البصري):
                  </h4>
                  
                  <div className="overflow-x-auto border border-[#D9D3F0] rounded-xl overflow-hidden">
                    <table className="w-full text-right text-[11px] bg-white">
                      <thead className="bg-[#F5F3FF]">
                        <tr>
                          <th className="p-2 border-b font-black text-gray-700">الاسم الكامل</th>
                          <th className="p-2 border-b font-black text-gray-700">الرقم الامتحاني</th>
                          <th className="p-2 border-b font-black text-gray-700">الصف</th>
                          <th className="p-2 border-b font-black text-gray-700">الشعبة</th>
                          <th className="p-2 border-b font-black text-gray-700">حالة القراءة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrResults.map((st, i) => {
                          const isUnclear = st.name.includes('غير واضح');
                          const isMissingRoll = !st.rollNumber;
                          const isDuplicate = i === 8; // Simulating row 9 duplicate
                          
                          return (
                            <tr key={i} className={`hover:bg-slate-50 ${isUnclear || isMissingRoll ? 'bg-rose-50/50' : ''}`}>
                              <td className="p-2 border-b font-bold">
                                {isUnclear ? (
                                  <span className="text-rose-600 font-extrabold flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {st.name}
                                  </span>
                                ) : (
                                  st.name
                                )}
                              </td>
                              <td className="p-2 border-b font-mono">
                                {isMissingRoll ? (
                                  <span className="text-amber-600 font-bold">مفقود</span>
                                ) : (
                                  st.rollNumber
                                )}
                              </td>
                              <td className="p-2 border-b">{st.gradeClass}</td>
                              <td className="p-2 border-b font-bold">{st.division}</td>
                              <td className="p-2 border-b">
                                {isUnclear || isMissingRoll ? (
                                  <span className="text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded text-[9px]">
                                    غير واضح — يحتاج مراجعة
                                  </span>
                                ) : isDuplicate ? (
                                  <span className="text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded text-[9px]">
                                    اسم مكرر بالجدول
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[9px]">
                                    قراءة ممتازة ✓
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setOcrResults([]);
                        setOcrLog('');
                      }}
                      className="px-4 py-2 border border-[#D9D3F0] rounded-lg text-gray-500 font-bold"
                    >
                      إلغاء النتائج وإعادة الرفع
                    </button>
                    <button
                      onClick={handleApplyOcrResults}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      اعتماد واستيراد القائمة للجدول الحي
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC STUDENTS GROUPS SUMMARY */}
          <div className="space-y-3 pt-3">
            <h4 className="font-black text-[#3E176D] text-xs">تمثيل وتنظيم الطلبة داخل مجموعات الصفوف والشعب:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(getStudentGroups()).map(([groupName, groupList]) => {
                const firstRoll = groupList[0]?.rollNumber || 'لا يوجد';
                const lastRoll = groupList[groupList.length - 1]?.rollNumber || 'لا يوجد';
                const missingRolls = groupList.filter(s => !s.rollNumber).length;
                
                return (
                  <div key={groupName} className="p-4 bg-white rounded-2xl border border-[#D9D3F0] space-y-2.5 text-xs">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                      <span className="font-extrabold text-[#3E176D]">{groupName}</span>
                      <span className="bg-[#E9E6FA] text-[#3E176D] text-[10px] font-black px-2 py-0.5 rounded">
                        {groupList.length} طالب
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] text-gray-600">
                      <div>أول رقم امتحاني: <span className="font-bold text-gray-800 font-mono">{firstRoll}</span></div>
                      <div>آخر رقم امتحاني: <span className="font-bold text-gray-800 font-mono">{lastRoll}</span></div>
                      <div>بلا رقم امتحاني: <span className="font-bold text-rose-600">{missingRolls} طالب</span></div>
                      <div className="pt-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-700 text-[9px]">حالة القائمة: معتمدة ومراجعة ✓</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STUDENTS LIVE TABLE & ACTIONS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-[#3E176D] text-xs">قائمة مراجعة وتعديل بيانات الطلاب المستوردين:</h4>
              <button
                onClick={() => {
                  if (window.confirm('هل تود تفريغ قائمة الطلاب الحالية للبدء من جديد؟')) {
                    handleUpdateStudents([]);
                  }
                }}
                className="text-rose-600 hover:underline text-[11px] font-bold"
              >
                مسح وتفريغ قائمة الطلبة ×
              </button>
            </div>

            <div className="border border-[#D9D3F0] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-xs bg-white min-w-[600px]">
                <thead className="bg-[#F5F3FF]">
                  <tr>
                    <th className="p-3 border-b font-black text-[#3E176D]">ت</th>
                    <th className="p-3 border-b font-black text-[#3E176D]">الاسم الكامل للطالب</th>
                    <th className="p-3 border-b font-black text-[#3E176D]">الرقم الامتحاني</th>
                    <th className="p-3 border-b font-black text-[#3E176D]">الصف والمرحلة</th>
                    <th className="p-3 border-b font-black text-[#3E176D]">الشعبة</th>
                    <th className="p-3 border-b font-black text-[#3E176D] w-[100px] text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, i) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 border-b text-gray-400 font-bold">{i + 1}</td>
                      <td className="p-3 border-b">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => {
                            const updated = students.map(s => s.id === st.id ? { ...s, name: e.target.value } : s);
                            handleUpdateStudents(updated);
                          }}
                          className="w-full bg-transparent border-b border-transparent focus:border-[#5B2596] py-0.5 outline-none font-bold text-gray-800"
                        />
                      </td>
                      <td className="p-3 border-b font-mono">
                        <input
                          type="text"
                          value={st.rollNumber}
                          onChange={(e) => {
                            const updated = students.map(s => s.id === st.id ? { ...s, rollNumber: e.target.value } : s);
                            handleUpdateStudents(updated);
                          }}
                          className="w-full bg-transparent border-b border-transparent focus:border-[#5B2596] py-0.5 outline-none text-gray-600"
                        />
                      </td>
                      <td className="p-3 border-b text-gray-600">{st.gradeClass}</td>
                      <td className="p-3 border-b font-extrabold text-emerald-800">{st.division}</td>
                      <td className="p-3 border-b text-center">
                        <button
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 font-bold">لا يوجد طلاب مستوردين حتى الآن. يرجى استخدام طرق الإدخال بالأعلى.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: بيانات الامتحان</span>
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: تعريف القاعات والمقاعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: HALLS & SECTORS CONFIGURATION */}
      {activeStep === 3 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#5B2596]" />
                الخطوة ٣: تعريف القاعات الامتحانية والقطاعات
              </h3>
              <p className="text-xs text-gray-500">قم بتعيين القاعات، الغرف المتوفرة، تحديد مواضع التالف من المقاعد وأماكن الممرات.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newHall: ExamHall = {
                    id: `hall-${Date.now()}`,
                    name: `قاعة امتحانية جديدة (${halls.length + 1})`,
                    building: 'البناية الثانية',
                    floor: 'الطابق الأول',
                    gatewaysCount: 1,
                    gatewayPositions: ['يمين الباب'],
                    rowsCount: 4,
                    colsCount: 5,
                    studentsPerSeat: 1,
                    damagedSeatsCount: 0,
                    sectors: [],
                    seats: Array.from({ length: 20 }, (_, index) => ({
                      id: `seat-${Date.now()}-${index}`,
                      row: Math.floor(index / 5),
                      col: index % 5,
                      status: 'regular'
                    }))
                  };
                  handleUpdateHalls([...halls, newHall]);
                  setSelectedHallId(newHall.id);
                  alert('تم إضافة قاعة جديدة! يمكنك تخصيص أبعادها وتفاصيلها بالأسفل.');
                }}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قاعة جديدة +</span>
              </button>
            </div>
          </div>

          {/* HALL TABS SELECTOR */}
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-[#D9D3F0] gap-1 overflow-x-auto text-xs font-bold">
            {halls.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHallId(h.id)}
                className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                  selectedHallId === h.id ? 'bg-[#5B2596] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                📍 {h.name} ({h.building})
              </button>
            ))}
          </div>

          {/* EDIT SELECTED HALL INFORMATION */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-gray-700 font-bold mb-1">اسم / رقم القاعة</label>
              <input
                type="text"
                value={currentHall.name}
                onChange={(e) => {
                  const updated = halls.map(h => h.id === currentHall.id ? { ...h, name: e.target.value } : h);
                  handleUpdateHalls(updated);
                }}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">البناية</label>
              <input
                type="text"
                value={currentHall.building}
                onChange={(e) => {
                  const updated = halls.map(h => h.id === currentHall.id ? { ...h, building: e.target.value } : h);
                  handleUpdateHalls(updated);
                }}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">الطابق</label>
              <input
                type="text"
                value={currentHall.floor}
                onChange={(e) => {
                  const updated = halls.map(h => h.id === currentHall.id ? { ...h, floor: e.target.value } : h);
                  handleUpdateHalls(updated);
                }}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">الطلاب في المقعد الواحد</label>
              <select
                value={currentHall.studentsPerSeat}
                onChange={(e) => {
                  const val = Number(e.target.value) as 1 | 2;
                  const updated = halls.map(h => h.id === currentHall.id ? { ...h, studentsPerSeat: val } : h);
                  handleUpdateHalls(updated);
                }}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white font-bold text-gray-800"
              >
                <option value={1}>طالب واحد (١)</option>
                <option value={2}>طالبان (٢) - دمج</option>
              </select>
            </div>
          </div>

          {/* TWO MODES CONFIG: QUICK vs VISUAL SEATING GRAPH */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-[#3E176D] text-xs">تخصيص ورسم ترتيب المقاعد داخل القاعة:</h4>
              <div className="flex gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setHallInputMode('quick')}
                  className={`px-3 py-1 rounded-lg ${hallInputMode === 'quick' ? 'bg-[#5B2596] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  الوضع السريع
                </button>
                <button
                  onClick={() => setHallInputMode('visual')}
                  className={`px-3 py-1 rounded-lg ${hallInputMode === 'visual' ? 'bg-[#5B2596] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  الرسم البصري المتقدم 🎨
                </button>
              </div>
            </div>

            {hallInputMode === 'quick' ? (
              <div className="p-5 bg-[#F5F3FF]/40 border border-[#D9D3F0] rounded-2xl text-xs space-y-4">
                <span className="font-extrabold text-[#3E176D] block">⚙️ إعدادات الأبعاد الافتراضية السريعة للشبكة:</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-600 mb-1 font-bold">عدد صفوف المقاعد (الخطوط الأفقية)</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={currentHall.rowsCount}
                      onChange={(e) => {
                        const r = Number(e.target.value);
                        const size = r * currentHall.colsCount;
                        const newSeats = Array.from({ length: size }, (_, index) => ({
                          id: `seat-${currentHall.id}-${index}`,
                          row: Math.floor(index / currentHall.colsCount),
                          col: index % currentHall.colsCount,
                          status: 'regular' as const
                        }));
                        const updated = halls.map(h => h.id === currentHall.id ? { ...h, rowsCount: r, seats: newSeats } : h);
                        handleUpdateHalls(updated);
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-bold">عدد المقاعد في كل صف (الأعمدة)</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={currentHall.colsCount}
                      onChange={(e) => {
                        const c = Number(e.target.value);
                        const size = currentHall.rowsCount * c;
                        const newSeats = Array.from({ length: size }, (_, index) => ({
                          id: `seat-${currentHall.id}-${index}`,
                          row: Math.floor(index / c),
                          col: index % c,
                          status: 'regular' as const
                        }));
                        const updated = halls.map(h => h.id === currentHall.id ? { ...h, colsCount: c, seats: newSeats } : h);
                        handleUpdateHalls(updated);
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="col-span-2 bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block">إجمالي المقاعد المتاحة بالشبكة</span>
                      <span className="text-sm font-black text-[#3E176D] block">{currentHall.rowsCount * currentHall.colsCount} مقعداً</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-indigo-700 rounded-lg font-black">
                      محسوب تلقائياً
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl space-y-3">
                <div className="text-[10px] text-gray-600 bg-white p-2.5 border border-gray-150 rounded-xl leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                  <span>تلميح الرسم البصري: يمكنك النقر مباشرة على أي مقعد في التوزيع التخطيطي بالأسفل لتغيير حالته فورياً (عادي، معطل/تالف ❌، ممر/فارغ 🚶).</span>
                </div>

                {/* VISUAL SEAT BUILDER INTERACTIVE GRID */}
                <div className="flex flex-col items-center p-6 bg-white border border-[#D9D3F0] rounded-xl overflow-x-auto min-h-[220px]">
                  <span className="text-[9px] font-black tracking-widest text-[#5B2596] block mb-3 uppercase">← اتجاه منصة اللقاء والمراقب (الأمام) ←</span>
                  
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${currentHall.colsCount}, minmax(0, 1fr))` }}>
                    {Array.from({ length: currentHall.rowsCount * currentHall.colsCount }).map((_, index) => {
                      const row = Math.floor(index / currentHall.colsCount);
                      const col = index % currentHall.colsCount;
                      const seat = currentHall.seats.find(s => s.row === row && s.col === col) || { id: '', status: 'regular' };
                      
                      const isDamaged = seat.status === 'damaged';
                      const isCorridor = seat.status === 'corridor';

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const nextStatus = seat.status === 'regular' ? 'damaged' : seat.status === 'damaged' ? 'corridor' : 'regular';
                            const updatedSeats = currentHall.seats.map(s => s.row === row && s.col === col ? { ...s, status: nextStatus } : s);
                            const updated = halls.map(h => h.id === currentHall.id ? { ...h, seats: updatedSeats } : h);
                            handleUpdateHalls(updated);
                          }}
                          className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center text-[10px] font-black transition-all ${
                            isDamaged
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : isCorridor
                              ? 'bg-amber-50/50 border-dashed border-amber-300 text-amber-600'
                              : 'bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-[#5B2596] hover:text-white'
                          }`}
                        >
                          <span className="font-bold text-[8px] opacity-60">ص{row+1} م{col+1}</span>
                          <span className="text-[10px]">
                            {isDamaged ? '❌' : isCorridor ? '🚶' : '🪑'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTORS DESIGN PANEL & ASSIGNMENTS */}
          <div className="space-y-3 pt-3">
            <h4 className="font-black text-[#3E176D] text-xs">تخصيص القطاعات وتقسيم القاعة (سعة القطاع الافتراضية ٢٠ طالب):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentHall.sectors.map((sector) => (
                <div key={sector.id} className="p-4 bg-white rounded-2xl border border-[#D9D3F0] space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-extrabold text-[#3E176D] flex items-center gap-1">
                      <Layers className="w-4 h-4 text-[#5B2596]" />
                      {sector.name}
                    </span>
                    <span className="bg-[#F5F3FF] text-[#3E176D] text-[10px] font-black px-2 py-0.5 rounded border border-[#D9D3F0]">
                      الحد الأقصى: {sector.maxCapacity} طالب
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <label className="block text-gray-500 mb-0.5 font-bold">جهة القطاع</label>
                      <select
                        value={sector.position}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const updatedSectors = currentHall.sectors.map(s => s.id === sector.id ? { ...s, position: val } : s);
                          const updated = halls.map(h => h.id === currentHall.id ? { ...h, sectors: updatedSectors } : h);
                          handleUpdateHalls(updated);
                        }}
                        className="w-full p-1.5 border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="right">جهة اليمين</option>
                        <option value="left">جهة اليسار</option>
                        <option value="middle">جهة الوسط</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5 font-bold">بداية الجلوس والتسلسل</label>
                      <select
                        value={sector.direction}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const updatedSectors = currentHall.sectors.map(s => s.id === sector.id ? { ...s, direction: val } : s);
                          const updated = halls.map(h => h.id === currentHall.id ? { ...h, sectors: updatedSectors } : h);
                          handleUpdateHalls(updated);
                        }}
                        className="w-full p-1.5 border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="right_to_left">من اليمين لليسار</option>
                        <option value="left_to_right">من اليسار لليمين</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <label className="block text-gray-500 mb-0.5 font-bold">الصف المخصص</label>
                      <input
                        type="text"
                        value={sector.assignedGrade || ''}
                        onChange={(e) => {
                          const updatedSectors = currentHall.sectors.map(s => s.id === sector.id ? { ...s, assignedGrade: e.target.value } : s);
                          const updated = halls.map(h => h.id === currentHall.id ? { ...h, sectors: updatedSectors } : h);
                          handleUpdateHalls(updated);
                        }}
                        placeholder="السادس العلمي"
                        className="w-full p-1.5 border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5 font-bold">شعبة مخصصة</label>
                      <input
                        type="text"
                        value={sector.assignedDivision || ''}
                        onChange={(e) => {
                          const updatedSectors = currentHall.sectors.map(s => s.id === sector.id ? { ...s, assignedDivision: e.target.value } : s);
                          const updated = halls.map(h => h.id === currentHall.id ? { ...h, sectors: updatedSectors } : h);
                          handleUpdateHalls(updated);
                        }}
                        placeholder="أ"
                        className="w-full p-1.5 border border-gray-200 rounded-lg bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: قائمة الطلاب</span>
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: المساعد الذكي الحواري</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SMART ASSISTANT CONVERSATION DIALOG */}
      {activeStep === 4 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              الخطوة ٤: المساعد الحواري الذكي لتوزيع المقاعد وقواعد التباعد
            </h3>
            <p className="text-xs text-gray-500">يناقش المساعد الذكي المعطيات الناقصة وأفضل التنسيقات للقاعات الامتحانية والقطاعات قبل توليد المخططات.</p>
          </div>

          {/* CHAT MESSAGES PANEL */}
          <div className="p-4 bg-[#F5F3FF]/40 border border-[#D9D3F0] rounded-2xl space-y-4 max-h-[340px] overflow-y-auto">
            {assistantMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'ai' ? 'mr-0 ml-auto items-start' : 'ml-0 mr-auto items-end'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'ai'
                      ? 'bg-[#E9E6FA] text-[#3E176D] rounded-tr-none border border-[#D9D3F0]'
                      : 'bg-[#5B2596] text-white rounded-tl-none shadow-sm'
                  }`}
                >
                  <span className="font-extrabold block text-[10px] mb-1 opacity-70">
                    {msg.sender === 'ai' ? '🤖 المساعد الذكي لتوزيع الطلبة' : '🧑‍💼 المشرف الامتحاني'}
                  </span>
                  <div>{msg.text}</div>
                </div>

                {/* Reply options if any */}
                {msg.sender === 'ai' && msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleAiResponse(opt)}
                        className="px-3 py-1.5 bg-white hover:bg-[#F5F3FF] border border-[#D9D3F0] text-[#3E176D] text-[10px] font-black rounded-lg transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* TEXT MESSAGE SENDER */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="اكتب استفساراً خاصاً أو قاعدة إضافية للمساعد..."
              className="flex-1 p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
            />
            <button
              onClick={() => {
                if (!customMsg.trim()) return;
                handleAiResponse(customMsg);
                setCustomMsg('');
              }}
              className="px-5 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold"
            >
              إرسال ⚡
            </button>
          </div>

          {/* SUMMARY RULES PRE-GEN CONFIRM */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 text-xs">
            <h4 className="font-extrabold text-[#3E176D] flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              ملخص قواعد التوزيع المعتمدة الحالية:
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-700">
              <div>• نمط تباعد المقاعد: <span className="font-bold text-gray-900">{spacingConfig === 'none' ? 'بالتتابع' : spacingConfig === 'one' ? 'مقعد واحد فارغ' : 'مقعدين فارغين'}</span></div>
              <div>• ترتيب وفرز الطلبة: <span className="font-bold text-gray-900">{sortConfig === 'rollNumber' ? 'حسب الأرقام الامتحانية' : sortConfig === 'alphabetical' ? 'أبجدياً' : 'عشوائي'}</span></div>
              <div>• خلط المراحل في القطاع: <span className="font-bold text-gray-900">{allowMultiGradeInSector ? 'مسموح' : 'غير مسموح (موصى به)'}</span></div>
              <div>• دمج الطلاب في المقعد: <span className="font-bold text-gray-900">{currentHall.studentsPerSeat === 2 ? 'مسموح (دمج)' : 'طالب واحد فقط'}</span></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">تنبيه هام: يتطلب التوزيع موافقة صريحة من المشرف لاعتماد الخطة وتجنب الكتابة على الخطط السابقة.</p>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: القاعات والقطاعات</span>
            </button>
            <button
              onClick={handleTriggerAutoDistribution}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>إنشاء وتحليل التوزيع الامتحاني الآن ⚡</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: PROPOSED SEATING PREVIEW */}
      {activeStep === 5 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                الخطوة ٥: معاينة التوزيع المقترح للمقاعد
              </h3>
              <p className="text-xs text-gray-500">استعرض المخطط العام البصري والتفصيلي لكافة القاعات والقطاعات والطلاب الموزعين.</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <select
                value={selectedHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                className="p-2 border border-gray-200 rounded-xl bg-white text-gray-800"
              >
                {halls.map(h => (
                  <option key={h.id} value={h.id}>📍 {h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC METRIC STATUS CHIPS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
            <div className="bg-[#F5F3FF] p-3 rounded-xl border border-[#D9D3F0]">
              <span className="text-gray-500 block mb-0.5">الطلاب الكلي</span>
              <span className="text-sm font-black text-[#3E176D] block">{students.length} طالب</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block mb-0.5">السعة الفعلية للقاعات</span>
              <span className="text-sm font-black text-emerald-800 block">
                {halls.reduce((acc, h) => acc + (h.seats.filter(s => s.status === 'regular').length * h.studentsPerSeat), 0)} مقعداً
              </span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-150">
              <span className="text-indigo-700 block mb-0.5">المقاعد المستخدمة</span>
              <span className="text-sm font-black text-indigo-800 block">
                {currentHall.seats.filter(s => s.studentId1 || s.studentId2).length} مقعداً
              </span>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
              <span className="text-rose-700 block mb-0.5">مقاعد معطلة</span>
              <span className="text-sm font-black text-rose-800 block">
                {currentHall.seats.filter(s => s.status === 'damaged').length} مقعداً
              </span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 col-span-2 md:col-span-1">
              <span className="text-amber-700 block mb-0.5">طلاب غير موزعين</span>
              <span className="text-sm font-black text-amber-800 block">
                {students.filter(st => {
                  let assigned = false;
                  halls.forEach(h => {
                    h.seats.forEach(se => {
                      if (se.studentId1 === st.id || se.studentId2 === st.id) assigned = true;
                    });
                  });
                  return !assigned;
                }).length} طالب
              </span>
            </div>
          </div>

          {/* 📅 INTERACTIVE VISUAL SEATING LAYOUT GRAPH */}
          <div className="p-6 bg-slate-50 border border-gray-200 rounded-3xl space-y-4 overflow-x-auto">
            <div className="flex justify-between items-center text-xs font-black text-[#3E176D]">
              <span>مخطط الجلوس البصري الرسمي للقاعة: {currentHall.name}</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-150">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                <span className="text-[10px] text-gray-500">معطل</span>
                <span className="w-2.5 h-2.5 rounded bg-amber-400 ml-2" />
                <span className="text-[10px] text-gray-500">ممر/تباعد</span>
              </div>
            </div>

            <div className="flex flex-col items-center py-6 bg-white border border-[#D9D3F0] rounded-2xl min-w-[640px]">
              {/* Gate Entry Flow Arrows & Director location */}
              <div className="w-full flex justify-between px-10 mb-4 text-[10px] font-bold text-gray-400">
                <div className="flex items-center gap-1">
                  <span>🚪 المدخل الرئيسي للقاعة</span>
                  <span className="text-emerald-500">← تدفق الدخول</span>
                </div>
                <div>منصة الإدارة والمشرف الامتحاني</div>
              </div>

              {/* 2D Seating visual cells */}
              <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${currentHall.colsCount}, minmax(0, 1fr))` }}>
                {Array.from({ length: currentHall.rowsCount * currentHall.colsCount }).map((_, index) => {
                  const row = Math.floor(index / currentHall.colsCount);
                  const col = index % currentHall.colsCount;
                  const seat = currentHall.seats.find(s => s.row === row && s.col === col) || { id: '', status: 'regular' };
                  
                  const isDamaged = seat.status === 'damaged';
                  const isCorridor = seat.status === 'corridor';
                  const isSpacing = seat.status === 'spacing';

                  // Fetch student names if assigned
                  const st1 = students.find(s => s.id === seat.studentId1);
                  const st2 = students.find(s => s.id === seat.studentId2);

                  return (
                    <div
                      key={index}
                      className={`w-32 h-20 rounded-2xl border p-2 flex flex-col justify-between text-[10px] font-black transition-all ${
                        isDamaged
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : isCorridor
                          ? 'bg-amber-50/50 border-dashed border-amber-200 text-amber-700'
                          : isSpacing
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : seat.studentId1
                          ? 'bg-[#F9F8FF] border-[#E9E6FA] text-gray-800 shadow-sm'
                          : 'bg-slate-50/50 border-dashed border-gray-200 text-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-gray-100/60 pb-1 text-[8px] opacity-75">
                        <span>الصف {row+1} - رقم {col+1}</span>
                        {isDamaged ? 'تالف ❌' : isCorridor ? 'ممر 🚶' : isSpacing ? 'تباعد ⚠️' : 'مقعد'}
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-0.5">
                        {st1 ? (
                          <div className="truncate text-[10px] font-extrabold text-[#3E176D]">{st1.name}</div>
                        ) : null}
                        {st2 ? (
                          <div className="truncate text-[9px] font-extrabold text-indigo-700 border-t border-dashed border-gray-100 pt-0.5">{st2.name}</div>
                        ) : null}
                        {!st1 && !st2 && !isDamaged && !isCorridor && !isSpacing && (
                          <span className="text-gray-300 italic text-center">مقعد فارغ</span>
                        )}
                      </div>

                      {(st1 || st2) && (
                        <div className="text-[8px] font-mono text-gray-500 flex justify-between items-center">
                          <span>رقم: {st1?.rollNumber || ''}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-1 rounded">شعبة {st1?.division || ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: المساعد الحواري</span>
            </button>
            <button
              onClick={() => setActiveStep(6)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: التعديل اليدوي للمقاعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: MANUAL ADJUSTMENTS WITH DRAG AND DROP */}
      {activeStep === 6 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#5B2596]" />
                الخطوة ٦: تعديل ونقل الطلاب يدوياً بالسحب والإفلات
              </h3>
              <p className="text-xs text-gray-500">يمكنك سحب أي اسم طالب وإلقاؤه على مقعد آخر فارغ أو نقل طالب لقطاع مختلف.</p>
            </div>
            <select
              value={selectedHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="p-2 border border-gray-200 rounded-xl bg-white text-gray-800 text-xs font-bold"
            >
              {halls.map(h => (
                <option key={h.id} value={h.id}>📍 {h.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
            
            {/* List of unassigned or pinned students */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-150 lg:col-span-1">
              <h4 className="font-extrabold text-[#3E176D] border-b border-gray-150 pb-2">سجل الطلبة والمثبتين:</h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {students.map(st => (
                  <div
                    key={st.id}
                    draggable
                    onDragStart={(e) => handleSeatDragStart(e, st.id)}
                    className="p-2.5 bg-slate-50 border border-gray-150 hover:bg-[#F5F3FF] hover:border-[#5B2596] rounded-xl cursor-grab font-bold text-[#3E176D] transition-colors"
                  >
                    <div>{st.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono flex justify-between items-center mt-1">
                      <span>رقم: {st.rollNumber}</span>
                      <span>شعبة {st.division}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEATING BOARD TO RECEIVE DROPPED STUDENTS */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-extrabold text-[#3E176D]">مخطط مقاعد القاعة التفاعلي (إفلات الطالب هنا):</h4>
              
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${currentHall.colsCount}, minmax(0, 1fr))` }}>
                {currentHall.seats.map((seat, idx) => {
                  const isDamaged = seat.status === 'damaged';
                  const isCorridor = seat.status === 'corridor';
                  const isSpacing = seat.status === 'spacing';
                  const st1 = students.find(s => s.id === seat.studentId1);

                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleSeatDrop(e, currentHall.id, seat.id, 1)}
                      className={`p-3 h-20 rounded-xl border flex flex-col justify-between text-[10px] font-black transition-all ${
                        isDamaged
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : isCorridor
                          ? 'bg-amber-50/40 border-dashed border-amber-200 text-amber-700'
                          : st1
                          ? 'bg-[#F5F3FF] border-[#5B2596] text-[#3E176D] shadow-sm'
                          : 'bg-white border-dashed border-gray-200 text-gray-400 hover:border-[#5B2596] hover:bg-[#F5F3FF]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-gray-100/60 pb-1 text-[8px] opacity-70">
                        <span>ص{seat.row+1} م{seat.col+1}</span>
                        {st1 && (
                          <button
                            onClick={() => {
                              const updatedSeats = currentHall.seats.map(s => s.id === seat.id ? { ...s, studentId1: undefined } : s);
                              const updated = halls.map(h => h.id === currentHall.id ? { ...h, seats: updatedSeats } : h);
                              handleUpdateHalls(updated);
                            }}
                            className="text-rose-500 hover:text-rose-700"
                            title="إفراغ المقعد"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="truncate font-extrabold">
                        {st1 ? st1.name : <span className="text-gray-300 italic">متاح للإفلات</span>}
                      </div>

                      {st1 && (
                        <div className="text-[8px] font-mono text-gray-500 flex justify-between items-center">
                          <span>رقم: {st1.rollNumber}</span>
                          <span>شعبة {st1.division}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(5)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: معاينة التوزيع</span>
            </button>
            <button
              onClick={() => {
                triggerQualityChecks();
                setActiveStep(7);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: اعتماد التوزيع والتحقق</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: SELF-CHECKING & COMMIT PLAN */}
      {activeStep === 7 && (
        <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-[#3E176D] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#5B2596]" />
              الخطوة ٧: الفحص التلقائي واعتماد التوزيع النهائي
            </h3>
            <p className="text-xs text-gray-500">يقوم النظام بمراجعة وفحص الخطة للتأكد من خلوها من تكرار الأسماء، وتجاوز السعات المعتمدة.</p>
          </div>

          {/* QUALITY ALERTS PANEL */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-[#3E176D] text-xs">نتائج التدقيق والتحقق التلقائي للجنة:</h4>
            
            {qualityErrors.length > 0 ? (
              <div className="space-y-2">
                {qualityErrors.map((err) => (
                  <div
                    key={err.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                      err.type === 'danger'
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${err.type === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div>
                      <span className="font-extrabold block mb-0.5">{err.title}</span>
                      <p className="text-[11px] opacity-90">{err.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950 text-xs">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold block mb-0.5">تهانينا! خلو التوزيع من أي تداخلات أو أخطاء ✓</span>
                  <p className="text-[11px] opacity-90">تم فحص كافة الأسماء، الأرقام الامتحانية، سعات الغرف والقطاعات وتطابق شروط تباعد المقاعد بالكامل بنجاح تام!</p>
                </div>
              </div>
            )}
          </div>

          {/* APPROVAL ACTIONS & SESSION STATE UPDATER */}
          <div className="p-5 bg-[#F5F3FF]/40 border border-[#D9D3F0] rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-bold">
            <div>
              <span className="text-gray-500 block mb-1">حالة الجلسة الامتحانية الحالية:</span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-black inline-block ${
                session.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {session.status === 'approved' ? 'معتمدة ورسمية 👑' : 'مسودة قيد المراجعة 📋'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleUpdateSession({ status: 'draft' });
                  alert('تم حفظ الجلسة كمسودة مراجعة.');
                }}
                className="px-4 py-2.5 bg-white border border-[#D9D3F0] text-[#3E176D] rounded-xl"
              >
                حفظ كمسودة 💾
              </button>
              <button
                onClick={() => {
                  handleUpdateSession({ status: 'approved' });
                  alert('🎉 تم اعتماد المخطط والتوزيع بنجاح! تم قفل التعديلات وتفعيل طباعة الكشوفات الرسمية.');
                  setActiveStep(8); // Proceed to results
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow"
              >
                موافقة واعتماد التوزيع النهائي ✓
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setActiveStep(6)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: التعديل اليدوي</span>
            </button>
            <button
              onClick={() => setActiveStep(8)}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>التالي: كشوفات الطباعة والتصدير</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: FINAL SHEETS & PRINT STYLES */}
      {activeStep === 8 && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* SEARCH FINDER ROW */}
          <div className="bg-white rounded-3xl border border-[#D9D3F0] p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs no-print">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="w-5 h-5 text-[#5B2596] shrink-0" />
              <span className="font-extrabold text-[#3E176D] shrink-0">البحث السريع عن مقعد الطالب:</span>
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم الامتحاني..."
                className="w-full md:w-[280px] p-2 border border-gray-200 rounded-xl bg-white"
              />
            </div>

            {studentSearchQuery && (
              <div className="bg-[#F5F3FF] p-2.5 rounded-xl border border-[#D9D3F0] font-bold text-[#3E176D] w-full md:w-auto">
                {(() => {
                  let found = false;
                  let detailsStr = '';
                  students.forEach(st => {
                    const normQ = normalizeArabicString(studentSearchQuery);
                    const normN = normalizeArabicString(st.name);
                    if (normN.includes(normQ) || st.rollNumber.includes(studentSearchQuery)) {
                      halls.forEach(h => {
                        h.seats.forEach(se => {
                          if (se.studentId1 === st.id || se.studentId2 === st.id) {
                            found = true;
                            detailsStr = `الطالب: ${st.name} • القاعة: ${h.name} • الصف: ${se.row+1} • المقعد: ${se.col+1}`;
                          }
                        });
                      });
                    }
                  });
                  return found ? detailsStr : 'عذراً، لم يتم العثور على الطالب في التوزيع الحالي.';
                })()}
              </div>
            )}
          </div>

          {/* OFFICIAL RE-PRINT PANEL WITH WATERMARK CONDITIONAL */}
          <div className="bg-white rounded-3xl border border-[#D9D3F0] shadow-sm overflow-hidden">
            
            {/* OFFICIAL EMBELLISHED A4 HEADER FOR PHYSICAL PRINTING */}
            <div className="p-8 border-b border-gray-200 bg-slate-50 relative">
              {session.status !== 'approved' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-10">
                  <span className="text-rose-600 font-black text-6xl tracking-widest uppercase rotate-12">مسودة غير معتمدة - للتدقيق فقط</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-500 font-extrabold block w-fit">
                    وزارة التربية العراقية • مديرية الامتحانات العامة
                  </span>
                  <h2 className="text-xl font-black text-gray-800">{session.schoolName}</h2>
                  <p className="text-xs text-gray-500 font-bold">{session.examTitle} — {session.subject}</p>
                </div>

                <div className="text-left text-xs font-mono space-y-1 text-gray-600 font-bold">
                  <div>التاريخ: {session.date} ({session.day})</div>
                  <div>التوقيت: {session.time}</div>
                  <div>الدور: {session.attempt}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-dashed border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">مسؤول اللجنة الامتحانية</span>
                  <span className="font-extrabold text-gray-800">{session.committeeChair}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">إجمالي الطلاب الموزعين</span>
                  <span className="font-extrabold text-gray-800">{students.length} طالب وطالبة</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">عدد القاعات النشطة</span>
                  <span className="font-extrabold text-gray-800">{halls.length} قاعات</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">الترميز والمراجعة</span>
                  <span className="font-extrabold text-emerald-700">مكتمل ومعتمد رسمياً ✓</span>
                </div>
              </div>
            </div>

            {/* PRINT SHEETS OPTIONS ACTION TRIGGERS */}
            <div className="no-print p-4 bg-[#F5F3FF]/40 border-b border-[#D9D3F0] flex flex-wrap gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الكشف العام الفوري</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('سيتم تصدير نسخة كشف إكسل CSV المنظم لقائمة الطلاب مع أرقام المقاعد المحددة.');
                  const csvRows = ['الاسم,الرقم الامتحاني,الصف,الشعبة,القاعة,الصف,المقعد'];
                  students.forEach(st => {
                    let hName = 'غير موزع';
                    let rNum = '';
                    let cNum = '';
                    halls.forEach(h => {
                      h.seats.forEach(se => {
                        if (se.studentId1 === st.id || se.studentId2 === st.id) {
                          hName = h.name;
                          rNum = (se.row + 1).toString();
                          cNum = (se.col + 1).toString();
                        }
                      });
                    });
                    csvRows.push(`"${st.name}","${st.rollNumber}","${st.gradeClass}","${st.division}","${hName}","${rNum}","${cNum}"`);
                  });
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `excel_students_seating_${session.subject}.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F5F3FF] border border-[#D9D3F0] text-[#3E176D] text-xs font-bold rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تصدير إلى Excel (CSV)</span>
              </button>
            </div>

            {/* DETAILED STUDENT SEATING RECORD LIST */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-black text-gray-800">الكشف التفصيلي الرسمي لجلوس الطلبة على المقاعد:</h3>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-right text-xs bg-white min-w-[700px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 border-b font-extrabold text-gray-700">ت</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">الاسم الكامل للطالب</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">الرقم الامتحاني</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">الصف والفرع</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">القاعة الامتحانية</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">الصف</th>
                      <th className="p-3 border-b font-extrabold text-gray-700">المقعد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st, i) => {
                      let assignedHall = 'غير موزع ⚠️';
                      let rNum = '-';
                      let cNum = '-';

                      halls.forEach(hall => {
                        hall.seats.forEach(se => {
                          if (se.studentId1 === st.id || se.studentId2 === st.id) {
                            assignedHall = hall.name;
                            rNum = `الصف ${se.row + 1}`;
                            cNum = `المقعد ${se.col + 1}`;
                          }
                        });
                      });

                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 border-b text-gray-400 font-bold">{i + 1}</td>
                          <td className="p-3 border-b font-black text-gray-800">{st.name}</td>
                          <td className="p-3 border-b font-mono text-gray-600">{st.rollNumber}</td>
                          <td className="p-3 border-b text-gray-600">{st.gradeClass} - شعبة {st.division}</td>
                          <td className="p-3 border-b font-bold text-[#5B2596]">{assignedHall}</td>
                          <td className="p-3 border-b text-gray-600">{rNum}</td>
                          <td className="p-3 border-b font-bold text-emerald-800">{cNum}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SIGNATURE AREA FOR LAJNA */}
              <div className="pt-10 flex justify-between items-center text-xs font-bold text-gray-600 px-6">
                <div className="text-center">
                  <span>عضو اللجنة المدقق</span>
                  <div className="h-12 w-32 border-b border-dashed border-gray-300 mx-auto" />
                </div>
                <div className="text-center">
                  <span>مسؤول ومراقب القاعة الكلي</span>
                  <div className="h-12 w-32 border-b border-dashed border-gray-300 mx-auto" />
                </div>
                <div className="text-center">
                  <span>رئيس اللجنة الامتحانية والمدرسة</span>
                  <div className="h-12 w-32 border-b border-dashed border-gray-300 mx-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 no-print">
            <button
              onClick={() => setActiveStep(7)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D9D3F0] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق: اعتماد التوزيع والتحقق</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('هل أنت متأكد من مسح وحذف كافة الإعدادات والجلسة للبدء من جديد؟')) {
                  localStorage.removeItem('exam_session');
                  localStorage.removeItem('exam_students');
                  localStorage.removeItem('exam_halls');
                  localStorage.removeItem('exam_proctors');
                  setSession(DEFAULT_SESSION);
                  setStudents(DEFAULT_STUDENTS_MOCK);
                  setHalls([DEFAULT_HALL_MOCK]);
                  setProctors(DEFAULT_PROCTORS);
                  setActiveStep(1);
                }
              }}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700"
            >
              إعادة ضبط الجلسة بالكامل ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
