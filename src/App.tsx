import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScheduleGrid } from './components/ScheduleGrid';
import { StudentInfoEditor } from './components/StudentInfoEditor';
import { ExportButton } from './components/ExportButton';
import { CellEditorModal } from './components/CellEditorModal';
import { PeriodTimesModal } from './components/PeriodTimesModal';
import { ScheduleList } from './components/ScheduleList';
import { Schedule, StudentProfile, ScheduleCell, SUBJECT_COLORS, IRAQI_DAYS } from './types';
import { DEFAULT_SCHEDULES } from './presets';
import { 
  getStudentProfile, 
  saveStudentProfile, 
  getSavedSchedules, 
  saveSchedules, 
  getActiveScheduleId, 
  saveActiveScheduleId,
  getUserRole,
  saveUserRole
} from './utils/db';
import { generateDailySchedule, generateWeeklySchedule, generateRevisionPlan } from './utils/generators';
import { SUBJECTS_BY_GRADE, MINISTERIAL_SUBJECTS_ORDER, CURRICULUM_TREES } from './constants/subjects';
import { Sparkles, Calendar, BookOpen, Clock, AlertCircle, Plus, GraduationCap, CheckCircle, Flame, Undo, Trash2, ArrowRight, BookMarked, Award, CheckSquare, RefreshCw, X, MessageSquare, Users, Layers } from 'lucide-react';

// New Feature Imports
import { TeacherMode } from './components/TeacherMode';
import { CurriculumTreeEditor } from './components/CurriculumTreeEditor';
import { SmartAssistant } from './components/SmartAssistant';
import { ExamHallOrganizer } from './components/ExamHallOrganizer';

export default function App() {
  // Profiles and Onboarding State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);

  // New User Role State ('student' | 'teacher' | 'exam_organizer')
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'exam_organizer'>('student');

  // Schedules state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'dashboard' | 'curriculum'>('schedule');

  // Mobile/Tablet Two-Tab layout state for interactive live preview
  const [mobileSubTab, setMobileSubTab] = useState<'settings' | 'preview'>('preview');

  // Local Smart Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantInitialCommand, setAssistantInitialCommand] = useState<string>('');

  // Draft State (Cannot save preview as final without clicking [حفظ الجدول])
  const [isDraftDirty, setIsDraftDirty] = useState<boolean>(false);

  // Interactive Modals and Sidebars
  const [isListOpen, setIsListOpen] = useState(false);
  const [isTimesModalOpen, setIsTimesModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dayIndex: number; lessonIndex: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Undo Delete Cell Backup
  const [deletedCellBackup, setDeletedCellBackup] = useState<{
    key: string;
    cell: ScheduleCell;
    scheduleId: string;
  } | null>(null);

  // Dynamic Creator Wizard State
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardData, setWizardData] = useState({
    type: 'weekly', // 'daily' | 'weekly' | 'revision' | 'ministerial' | 'emergency' | 'custom'
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    lessonsPerDay: 5,
    lessonDuration: 45, // mins
    breakDuration: 15, // mins
    studyPreference: 'both' as 'day' | 'night' | 'both',
    wakeTime: '07:00',
    lunchTime: '13:00',
    dinnerTime: '20:00',
    sleepTime: '23:00',
    strategy: 'balanced' as 'balanced' | 'weak' | 'difficulty',
    selectedSubjects: [] as string[],
    restDays: [] as string[],
    customSubject: '',
    expectedAverage: 90
  });

  // Expected average interactive state (Subject-specific grades)
  const [subjectExpectedGrades, setSubjectExpectedGrades] = useState<Record<string, number>>({});

  // Curriculum tracking checked state
  const [curriculumChecked, setCurriculumChecked] = useState<Record<string, boolean>>({});

  // Load Initial Configuration
  useEffect(() => {
    const savedProfile = getStudentProfile();
    const savedSchedules = getSavedSchedules();
    const savedActiveId = getActiveScheduleId();
    const savedRole = getUserRole();

    setUserRole(savedRole);

    if (savedProfile) {
      setProfile(savedProfile);
      setIsOnboarding(false);

      if (savedSchedules.length > 0) {
        setSchedules(savedSchedules);
        const validId = savedSchedules.some(s => s.id === savedActiveId) ? savedActiveId : savedSchedules[0].id;
        setCurrentScheduleId(validId);
      } else {
        // Prepopulate with a default matching their grade
        const initialSchedules = [...DEFAULT_SCHEDULES];
        initialSchedules[0].studentName = savedProfile.studentName;
        initialSchedules[0].gradeClass = savedProfile.gradeClass;
        initialSchedules[0].stage = savedProfile.stage;
        setSchedules(initialSchedules);
        setCurrentScheduleId(initialSchedules[0].id);
        saveSchedules(initialSchedules);
        saveActiveScheduleId(initialSchedules[0].id);
      }
    } else {
      setIsOnboarding(true);
    }

    // Load curriculum checkboxes from localStorage
    const savedCurriculum = localStorage.getItem('madrasati_curriculum_checked_v2');
    if (savedCurriculum) {
      try {
        setCurriculumChecked(JSON.parse(savedCurriculum));
      } catch {}
    }
  }, []);

  // Save schedules callback
  const triggerSaveSchedules = (updated: Schedule[]) => {
    setIsSaving(true);
    setSchedules(updated);
    saveSchedules(updated);
    setTimeout(() => {
      setIsSaving(false);
    }, 450);
  };

  // Active Schedule
  const activeSchedule = schedules.find(s => s.id === currentScheduleId) || schedules[0] || null;

  // Expected Average Interactive Grades syncing
  useEffect(() => {
    if (activeSchedule) {
      const currentSubjects = SUBJECTS_BY_GRADE[activeSchedule.gradeClass] || [];
      const initialGrades: Record<string, number> = {};
      currentSubjects.forEach(sub => {
        initialGrades[sub] = subjectExpectedGrades[sub] || 90;
      });
      // only replace if mismatch in count
      if (Object.keys(subjectExpectedGrades).length === 0) {
        setSubjectExpectedGrades(initialGrades);
      }
    }
  }, [activeSchedule]);

  // Fallback to schedule tab if active grade is not terminal
  useEffect(() => {
    if (activeSchedule && !isTerminalGrade(activeSchedule.gradeClass) && activeTab === 'curriculum') {
      setActiveTab('schedule');
    }
  }, [activeSchedule, activeTab]);

  // Handle active schedule changes
  const handleUpdateActiveSchedule = (fields: Partial<Schedule>) => {
    if (!activeSchedule) return;
    const updated = schedules.map(s => {
      if (s.id === activeSchedule.id) {
        const nextSch = { ...s, ...fields, lastModified: new Date().toISOString().split('T')[0] };
        // Recalculate study hours & statistics
        let totalStudyMinutes = 0;
        let completed = 0;
        let totalCount = 0;

        const cellsObj = nextSch.cells || {};
        Object.values(cellsObj).forEach((cell: ScheduleCell) => {
          totalCount++;
          if (cell.status === 'completed') {
            completed++;
          }
          if (cell.type !== 'rest') {
            // Count actual study lessons duration
            const duration = nextSch.lessonTimes[0] 
              ? parseTimeToMinutes(nextSch.lessonTimes[0].end) - parseTimeToMinutes(nextSch.lessonTimes[0].start)
              : 45;
            totalStudyMinutes += duration;
          }
        });

        nextSch.completedCount = completed;
        nextSch.completionRate = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;
        nextSch.studyHours = Math.round(totalStudyMinutes / 60) || nextSch.studyHours;

        return nextSch;
      }
      return s;
    });
    setSchedules(updated);
    setIsDraftDirty(true);
  };

  const handleCommitDraft = () => {
    setIsSaving(true);
    saveSchedules(schedules);
    setIsDraftDirty(false);
    setTimeout(() => {
      setIsSaving(false);
    }, 450);
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const handleSelectSchedule = (id: string) => {
    setCurrentScheduleId(id);
    saveActiveScheduleId(id);
    setIsListOpen(false);
    setActiveTab('schedule');
  };

  const handleDeleteSchedule = (id: string) => {
    if (schedules.length <= 1) return;
    const filtered = schedules.filter(s => s.id !== id);
    setSchedules(filtered);
    saveSchedules(filtered);
    if (currentScheduleId === id) {
      setCurrentScheduleId(filtered[0].id);
      saveActiveScheduleId(filtered[0].id);
    }
  };

  const handleDuplicateSchedule = (target: Schedule) => {
    const newId = `schedule-${Date.now()}`;
    const duplicated: Schedule = {
      ...target,
      id: newId,
      scheduleName: `${target.scheduleName} - نسخة مكررة`
    };
    const updated = [...schedules, duplicated];
    triggerSaveSchedules(updated);
    setCurrentScheduleId(newId);
    saveActiveScheduleId(newId);
  };

  const handleAddSchedule = (sch: Schedule) => {
    const updated = [...schedules, sch];
    setSchedules(updated);
    saveSchedules(updated);
    setCurrentScheduleId(sch.id);
    saveActiveScheduleId(sch.id);
  };

  // Onboarding completion
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { studentName, stage, gradeClass, expectedAverage } = onboardingData;
    if (!studentName.trim() || !stage || !gradeClass) return;

    const newProfile: StudentProfile = {
      studentName: studentName.trim(),
      stage: stage as any,
      gradeClass,
      expectedAverage
    };

    saveStudentProfile(newProfile);
    setProfile(newProfile);
    setIsOnboarding(false);

    // Bootstrap first schedule tailored to their class
    const defaultSubjects = SUBJECTS_BY_GRADE[gradeClass] || ['الرياضيات', 'اللغة العربية', 'اللغة الإنكليزية'];
    const generated = generateWeeklySchedule({
      scheduleName: `جدول المذاكرة النموذجي - ${gradeClass}`,
      startDate: '2026-07-03', // الجمعه
      selectedSubjects: defaultSubjects,
      lessonsPerDay: 5,
      lessonDuration: 45,
      breakDuration: 15,
      strategy: 'balanced',
      restDays: ['الجمعة']
    }, studentName, gradeClass, stage);

    const initialSchedules = [generated];
    setSchedules(initialSchedules);
    setCurrentScheduleId(generated.id);
    saveSchedules(initialSchedules);
    saveActiveScheduleId(generated.id);
  };

  const [onboardingData, setOnboardingData] = useState({
    studentName: '',
    stage: 'preparatory',
    gradeClass: 'السادس العلمي',
    expectedAverage: 95
  });

  // Manage onboarding inputs
  const handleOnboardingStageChange = (stage: string) => {
    let defaultGrade = 'السادس العلمي';
    if (stage === 'elementary') defaultGrade = 'السادس الابتدائي';
    else if (stage === 'middle') defaultGrade = 'الثالث المتوسط';

    setOnboardingData({
      ...onboardingData,
      stage,
      gradeClass: defaultGrade
    });
  };

  // Adding lesson index dynamically
  const handleAddLesson = () => {
    if (!activeSchedule) return;
    const currentCount = activeSchedule.lessons.length;
    const ordinals = [
      'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 
      'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'
    ];
    
    const newName = currentCount < ordinals.length 
      ? `الدرس ${ordinals[currentCount]}`
      : `الدرس رقم ${currentCount + 1}`;

    const updatedLessons = [...activeSchedule.lessons, newName];
    
    let lastEnd = '13:00';
    if (activeSchedule.lessonTimes.length > 0) {
      lastEnd = activeSchedule.lessonTimes[activeSchedule.lessonTimes.length - 1].end;
    }
    const [h, m] = lastEnd.split(':').map(Number);
    const endMinutes = (h * 60 + m) + 15; // 15 mins break
    const startHour = Math.floor(endMinutes / 60);
    const startMin = endMinutes % 60;
    const finalEndMin = endMinutes + 45; // 45 mins lesson duration
    const endHour = Math.floor(finalEndMin / 60);
    const endMin = finalEndMin % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    const newTime = {
      start: `${pad(startHour)}:${pad(startMin)}`,
      end: `${pad(endHour)}:${pad(endMin)}`
    };

    handleUpdateActiveSchedule({
      lessons: updatedLessons,
      lessonTimes: [...activeSchedule.lessonTimes, newTime]
    });
  };

  // Remove last lesson index with safety warning
  const handleRemoveLesson = () => {
    if (!activeSchedule || activeSchedule.lessons.length <= 1) return;
    const targetIdx = activeSchedule.lessons.length - 1;
    
    // Check if there are active cells on this row
    const daysRange = Array.from({ length: activeSchedule.days.length });
    const hasActiveCells = daysRange.some((_, dayIdx) => {
      const cellKey = `${dayIdx}-${targetIdx}`;
      return activeSchedule.cells[cellKey] && activeSchedule.cells[cellKey].subject;
    });

    if (hasActiveCells) {
      const confirmRemove = window.confirm(
        'تنبيه: يحتوي هذا الدرس الدراسي على مواد مسجلة في جدولك. هل أنت متأكد من حذف الصف الدراسي وكافة الدروس المسجلة فيه؟'
      );
      if (!confirmRemove) return;
    }

    const updatedCells = { ...activeSchedule.cells };
    daysRange.forEach((_, dayIdx) => {
      delete updatedCells[`${dayIdx}-${targetIdx}`];
    });

    handleUpdateActiveSchedule({
      lessons: activeSchedule.lessons.slice(0, -1),
      lessonTimes: activeSchedule.lessonTimes.slice(0, -1),
      cells: updatedCells
    });
  };

  // Clear cell details with Undo Delete
  const handleClearCell = (dayIndex: number, lessonIndex: number) => {
    if (!activeSchedule) return;
    const cellKey = `${dayIndex}-${lessonIndex}`;
    const cellToClear = activeSchedule.cells[cellKey];
    
    if (cellToClear && cellToClear.subject) {
      // Backup cell for undo
      setDeletedCellBackup({
        key: cellKey,
        cell: cellToClear,
        scheduleId: activeSchedule.id
      });
    }

    const updatedCells = { ...activeSchedule.cells };
    delete updatedCells[cellKey];
    handleUpdateActiveSchedule({ cells: updatedCells });
  };

  // Undo delete cell action
  const handleUndoClear = () => {
    if (!deletedCellBackup || !activeSchedule) return;
    if (deletedCellBackup.scheduleId !== activeSchedule.id) return;

    const updatedCells = {
      ...activeSchedule.cells,
      [deletedCellBackup.key]: deletedCellBackup.cell
    };
    handleUpdateActiveSchedule({ cells: updatedCells });
    setDeletedCellBackup(null);
  };

  // Bulk Actions
  const handleClearAllCells = () => {
    if (!activeSchedule) return;
    const confirmClear = window.confirm('هل أنت متأكد من مسح جميع الدروس والمواد المضافة وتفريغ هذا الجدول بالكامل؟');
    if (confirmClear) {
      handleUpdateActiveSchedule({ cells: {}, completionRate: 0, completedCount: 0 });
    }
  };

  const handleMarkAllCompleted = () => {
    if (!activeSchedule) return;
    const updatedCells = { ...activeSchedule.cells };
    Object.keys(updatedCells).forEach(key => {
      if (updatedCells[key] && updatedCells[key].subject) {
        updatedCells[key] = {
          ...updatedCells[key],
          status: 'completed'
        };
      }
    });
    handleUpdateActiveSchedule({ cells: updatedCells, completionRate: 100 });
  };

  // Save cell detail from modal
  const handleSaveCell = (updatedCell: ScheduleCell) => {
    if (!activeSchedule || !editingCell) return;
    const { dayIndex, lessonIndex } = editingCell;
    const cellKey = `${dayIndex}-${lessonIndex}`;
    const updatedCells = {
      ...activeSchedule.cells,
      [cellKey]: updatedCell
    };
    handleUpdateActiveSchedule({ cells: updatedCells });
    setEditingCell(null);
  };

  // Save custom lesson times
  const handleSaveTimes = (updatedTimes: { start: string; end: string }[]) => {
    handleUpdateActiveSchedule({ lessonTimes: updatedTimes });
    setIsTimesModalOpen(false);
  };

  // Open generator wizard
  const handleOpenWizard = () => {
    const activeSubjects = SUBJECTS_BY_GRADE[profile?.gradeClass || 'السادس العلمي'] || [];
    setWizardData({
      ...wizardData,
      name: `جدول منظم جديد - ${profile?.gradeClass || 'عام'}`,
      selectedSubjects: [...activeSubjects],
      endDate: ''
    });
    setWizardStep(1);
    setShowWizard(true);
  };

  // Wizard custom subject addition
  const handleAddCustomSubjectToWizard = () => {
    if (!wizardData.customSubject.trim()) return;
    if (wizardData.selectedSubjects.includes(wizardData.customSubject.trim())) return;
    setWizardData({
      ...wizardData,
      selectedSubjects: [...wizardData.selectedSubjects, wizardData.customSubject.trim()],
      customSubject: ''
    });
  };

  const handleRemoveSubjectFromWizard = (sub: string) => {
    setWizardData({
      ...wizardData,
      selectedSubjects: wizardData.selectedSubjects.filter(s => s !== sub)
    });
  };

  const handleToggleRestDayInWizard = (day: string) => {
    const current = wizardData.restDays;
    if (current.includes(day)) {
      setWizardData({ ...wizardData, restDays: current.filter(d => d !== day) });
    } else {
      setWizardData({ ...wizardData, restDays: [...current, day] });
    }
  };

  // Dynamic Generator Dispatcher
  const handleGenerateSchedule = () => {
    if (!profile) return;
    const {
      type,
      name,
      startDate,
      endDate,
      lessonsPerDay,
      lessonDuration,
      breakDuration,
      studyPreference,
      wakeTime,
      lunchTime,
      dinnerTime,
      sleepTime,
      strategy,
      selectedSubjects,
      restDays
    } = wizardData;

    let generated: Schedule;

    if (type === 'daily') {
      generated = generateDailySchedule({
        scheduleName: name || 'الجدول اليومي المرن',
        date: startDate,
        studyPreference,
        wakeTime,
        lunchTime,
        dinnerTime,
        sleepTime,
        lessonCount: lessonsPerDay,
        lessonDuration,
        breakDuration,
        selectedSubjects
      }, profile.studentName, profile.gradeClass, profile.stage);
    } else if (type === 'weekly') {
      generated = generateWeeklySchedule({
        scheduleName: name || 'الجدول الأسبوعي الموزع بالتساوي',
        startDate,
        selectedSubjects,
        lessonsPerDay,
        lessonDuration,
        breakDuration,
        strategy,
        restDays
      }, profile.studentName, profile.gradeClass, profile.stage);
    } else {
      // Revision / Ministerial / Emergency Plan
      let planTitle = name || 'خطة المراجعة المتكاملة';
      let planType = 'خطة مراجعة مخصصة';
      if (type === 'ministerial') {
        planTitle = name || 'خطة المراجعة الوزارية الشاملة للامتحانات';
        planType = 'خطة امتحانات وزارية';
      } else if (type === 'emergency') {
        planTitle = name || 'خطة المراجعة الطارئة للأيام المتبقية';
        planType = 'خطة طوارئ مكثفة';
      }

      const calculatedEndDate = endDate || new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 30)).toISOString().split('T')[0];

      generated = generateRevisionPlan(
        planTitle,
        startDate,
        calculatedEndDate,
        selectedSubjects,
        lessonsPerDay,
        lessonDuration,
        planType,
        profile.studentName,
        profile.gradeClass,
        profile.stage
      );
    }

    const updated = [...schedules, generated];
    triggerSaveSchedules(updated);
    setCurrentScheduleId(generated.id);
    saveActiveScheduleId(generated.id);
    setShowWizard(false);
    setActiveTab('schedule');
  };

  // Expected Average Calculation for final classes
  const calculateAverage = () => {
    const grades = Object.values(subjectExpectedGrades) as number[];
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc: number, g: number) => acc + g, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  };

  // Curriculum checkbox handle
  const handleToggleCurriculumLesson = (key: string) => {
    const nextChecked = {
      ...curriculumChecked,
      [key]: !curriculumChecked[key]
    };
    setCurriculumChecked(nextChecked);
    localStorage.setItem('madrasati_curriculum_checked_v2', JSON.stringify(nextChecked));
  };

  // Ministerial Readiness calculation
  const getReadinessIndicator = () => {
    const grade = activeSchedule?.gradeClass || 'السادس العلمي';
    const curriculum = CURRICULUM_TREES[grade] || [];
    if (curriculum.length === 0) return 0;

    let totalLessons = 0;
    let checkedLessons = 0;

    curriculum.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.lessons.forEach((lesson, lIdx) => {
          totalLessons++;
          const key = `${grade}-${subject.subjectName}-${chapter.id}-${lIdx}`;
          if (curriculumChecked[key]) {
            checkedLessons++;
          }
        });
      });
    });

    return totalLessons > 0 ? Math.round((checkedLessons / totalLessons) * 100) : 0;
  };

  const isTerminalGrade = (grade: string) => {
    return ['السادس العلمي', 'السادس الأدبي', 'الثالث المتوسط', 'السادس الابتدائي'].includes(grade);
  };

  if (isOnboarding || !activeSchedule) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#F9FAFB] text-[#1D2433]">
        {/* ONBOARDING FLOW */}
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#3E176D] via-[#5B2596] to-[#7641B4] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex bg-[#E9E6FA] text-[#3E176D] p-3 rounded-full mb-2">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3E176D]">تطبيق مدرسي</h2>
              <p className="text-xs sm:text-sm text-[#687084]">مرحباً بك في منظّم الجداول والمذاكرة الذكي والوزاري الأول للطلاب العراقيين.</p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D2433] mb-1.5">اسمك الثلاثي أو اللقب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كرار علي الحلي"
                  value={onboardingData.studentName}
                  onChange={(e) => setOnboardingData({ ...onboardingData, studentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9D3F0] focus:ring-1 focus:ring-[#7641B4] focus:border-[#7641B4] outline-none text-sm bg-gray-50 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['elementary', 'middle', 'preparatory'].map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => handleOnboardingStageChange(stg)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      onboardingData.stage === stg
                        ? 'border-[#5B2596] bg-[#E9E6FA] text-[#3E176D]'
                        : 'border-[#D9D3F0] bg-white hover:bg-[#F5F3FF]/50 text-[#687084]'
                    }`}
                  >
                    {stg === 'elementary' ? 'الابتدائية' : stg === 'middle' ? 'المتوسطة' : 'الإعدادية'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D2433] mb-1.5">اختر صفك الدراسي الحالي</label>
                <select
                  value={onboardingData.gradeClass}
                  onChange={(e) => setOnboardingData({ ...onboardingData, gradeClass: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9D3F0] focus:ring-1 focus:ring-[#7641B4] focus:border-[#7641B4] outline-none text-sm bg-white font-semibold"
                >
                  {onboardingData.stage === 'elementary' && (
                    <>
                      <option value="الخامس الابتدائي">الخامس الابتدائي</option>
                      <option value="السادس الابتدائي">السادس الابتدائي (منتهي 🎓)</option>
                    </>
                  )}
                  {onboardingData.stage === 'middle' && (
                    <>
                      <option value="الأول المتوسط">الأول المتوسط</option>
                      <option value="الثاني المتوسط">الثاني المتوسط</option>
                      <option value="الثالث المتوسط">الثالث المتوسط (منتهي 🎓)</option>
                    </>
                  )}
                  {onboardingData.stage === 'preparatory' && (
                    <>
                      <option value="الرابع العلمي">الرابع العلمي</option>
                      <option value="الرابع الأدبي">الرابع الأدبي</option>
                      <option value="الخامس العلمي">الخامس العلمي</option>
                      <option value="الخامس الأدبي">الخامس الأدبي</option>
                      <option value="السادس العلمي">السادس العلمي (منتهي 🎓)</option>
                      <option value="السادس الأدبي">السادس الأدبي (منتهي 🎓)</option>
                    </>
                  )}
                </select>
              </div>

              {isTerminalGrade(onboardingData.gradeClass) && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-900">معدل البكالوريا المتوقع والمستهدف</span>
                  </div>
                  <p className="text-[10px] text-indigo-700">بصفتك طالباً في صف منتهٍ، نتيح لك تتبع وتحليل معدلك المستهدف ومقارنته بإنجازك اليومي.</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={onboardingData.expectedAverage}
                      onChange={(e) => setOnboardingData({ ...onboardingData, expectedAverage: Number(e.target.value) })}
                      className="flex-1 accent-[#5B2596]"
                    />
                    <span className="text-xs font-black text-[#3E176D]">{onboardingData.expectedAverage}%</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] hover:opacity-95 transition-all shadow-md cursor-pointer"
              >
                توليد جدولي الأول والبدء
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F9FAFB] text-[#1D2433]">
      
      {/* DYNAMIC GENERATOR CREATOR WIZARD MODAL */}
      {showWizard && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-[#3E176D]/45 backdrop-blur-sm" onClick={() => setShowWizard(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-[#D9D3F0] w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-[#D9D3F0] bg-[#F5F3FF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5B2596]" />
                <h3 className="font-extrabold text-lg text-[#3E176D]">المساعد الذكي لتنظيم الدراسة</h3>
              </div>
              <button onClick={() => setShowWizard(false)} className="p-1 rounded-lg text-[#687084] hover:text-[#3E176D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps timeline */}
            <div className="p-4 bg-gray-50 border-b border-[#D9D3F0] flex items-center justify-center gap-3 text-xs font-bold text-[#687084]">
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 1 ? 'bg-[#5B2596] text-white' : 'bg-gray-200'}`}>1. نوع الخطة والجدول</span>
              <span className="h-[2px] w-8 bg-gray-200" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 2 ? 'bg-[#5B2596] text-white' : 'bg-gray-200'}`}>2. تفضيلات وتوقيت الدراسة</span>
              <span className="h-[2px] w-8 bg-gray-200" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 3 ? 'bg-[#5B2596] text-white' : 'bg-gray-200'}`}>3. اختيار المواد والإنشاء</span>
            </div>

            {/* Step Content */}
            <div className="p-6">
              
              {/* STEP 1: Select Type */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <h4 className="font-bold text-sm text-[#3E176D]">ما هو نوع الجدول الدراسي الذي ترغب في توليده آلياً؟</h4>
                    <p className="text-xs text-[#687084] mt-0.5">يقوم المساعد الذكي بتوزيع المناهج والأوقات بناءً على أحدث إستراتيجيات التعلم المنظم.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'weekly', label: 'جدول أسبوعي ذكي', desc: 'يوزع دروس المذاكرة والمراجعة طوال أيام الأسبوع بالتساوي.' },
                      { id: 'daily', label: 'جدول يومي دقيق', desc: 'ينظم الساعات والدروس ليوم مفرد من لحظة الاستيقاظ وحتى النوم.' },
                      { id: 'revision', label: 'خطة مراجعة مخصصة', desc: 'مثالية للتحضير للامتحانات الشهرية بمدى زمني ممتد.' },
                      { id: 'ministerial', label: 'خطة امتحانات وزارية', desc: 'مخصصة للصفوف المنتهية وترتب المواد حسب التسلسل الوزاري الرسمي.' },
                      { id: 'emergency', label: 'خطة طوارئ مكثفة', desc: 'جدول مضغوط وعالي التركيز لإنقاذ ما يمكن إنقاذه قبل الامتحان بأيام.' },
                      { id: 'custom', label: 'جدول يدوي فارغ', desc: 'ينشئ جدولاً فارغاً بالكامل لتقوم بإضافة وتعديل دروسك بنفسك.' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWizardData({ ...wizardData, type: opt.id })}
                        className={`p-4 rounded-2xl border text-right transition-all hover:shadow-sm space-y-1 ${
                          wizardData.type === opt.id
                            ? 'border-[#5B2596] bg-[#E9E6FA]/40 shadow-sm'
                            : 'border-[#D9D3F0] bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="block font-bold text-sm text-[#3E176D]">{opt.label}</span>
                        <span className="block text-[11px] text-[#687084] leading-relaxed">{opt.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#D9D3F0]">
                    <label className="block text-xs font-bold text-[#1D2433] mb-1.5">اسم هذا الجدول الدراسي</label>
                    <input
                      type="text"
                      value={wizardData.name}
                      onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                      placeholder="مثال: جدولي الأسبوعي لتحضيرات نصف السنة"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D9D3F0] outline-none text-xs bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Preferences */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D2433] mb-1.5">تاريخ بدء الخطة</label>
                      <input
                        type="date"
                        value={wizardData.startDate}
                        onChange={(e) => setWizardData({ ...wizardData, startDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none"
                      />
                    </div>
                    {wizardData.type !== 'daily' && wizardData.type !== 'weekly' && (
                      <div>
                        <label className="block text-xs font-bold text-[#1D2433] mb-1.5">تاريخ نهاية الخطة (الموعد المستهدف)</label>
                        <input
                          type="date"
                          value={wizardData.endDate}
                          onChange={(e) => setWizardData({ ...wizardData, endDate: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1D2433] mb-1.5">عدد الدروس اليومية المطلوب</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={wizardData.lessonsPerDay}
                        onChange={(e) => setWizardData({ ...wizardData, lessonsPerDay: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1D2433] mb-1.5">مدة الدرس الدراسي الواحد (دقيقة)</label>
                      <input
                        type="number"
                        min="15"
                        max="180"
                        value={wizardData.lessonDuration}
                        onChange={(e) => setWizardData({ ...wizardData, lessonDuration: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1D2433] mb-1.5">مدة الاستراحة بين الدروس (دقيقة)</label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={wizardData.breakDuration}
                        onChange={(e) => setWizardData({ ...wizardData, breakDuration: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none font-mono"
                      />
                    </div>
                  </div>

                  {wizardData.type === 'daily' && (
                    <div className="p-4 bg-[#F5F3FF] rounded-2xl border border-[#D9D3F0] space-y-3 text-xs">
                      <span className="font-bold text-[#3E176D] block mb-1">أوقات دورة حياتك اليومية لتفادي التداخل:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#687084] mb-0.5">وقت الاستيقاظ</label>
                          <input type="time" value={wizardData.wakeTime} onChange={(e) => setWizardData({ ...wizardData, wakeTime: e.target.value })} className="w-full p-1 rounded border border-[#D9D3F0] font-mono text-[10px]" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#687084] mb-0.5">وقت الغداء</label>
                          <input type="time" value={wizardData.lunchTime} onChange={(e) => setWizardData({ ...wizardData, lunchTime: e.target.value })} className="w-full p-1 rounded border border-[#D9D3F0] font-mono text-[10px]" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#687084] mb-0.5">وقت العشاء</label>
                          <input type="time" value={wizardData.dinnerTime} onChange={(e) => setWizardData({ ...wizardData, dinnerTime: e.target.value })} className="w-full p-1 rounded border border-[#D9D3F0] font-mono text-[10px]" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#687084] mb-0.5">وقت النوم</label>
                          <input type="time" value={wizardData.sleepTime} onChange={(e) => setWizardData({ ...wizardData, sleepTime: e.target.value })} className="w-full p-1 rounded border border-[#D9D3F0] font-mono text-[10px]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardData.type === 'weekly' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#1D2433]">اختر أيام الراحة المدرسية (أيام العطلة)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {IRAQI_DAYS.map((day) => {
                          const isRest = wizardData.restDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleToggleRestDayInWizard(day)}
                              className={`px-3 py-1 text-xs rounded-xl border font-semibold transition-all ${
                                isRest 
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                                  : 'border-gray-200 bg-white text-gray-700'
                              }`}
                            >
                              {day} {isRest && '☕'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Choose Subjects & Create */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <h4 className="font-bold text-sm text-[#3E176D]">حدد المواد الدراسية المطلوب جدولتها</h4>
                    <p className="text-xs text-[#687084] mt-0.5">بإمكانك إضافة مواد خارجية مخصصة أو استخدام المواد الرسمية المعتمدة لصفك الدراسي.</p>
                  </div>

                  {/* Add custom subject */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="إضافة مادة مخصصة أخرى..."
                      value={wizardData.customSubject}
                      onChange={(e) => setWizardData({ ...wizardData, customSubject: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#D9D3F0] text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSubjectToWizard}
                      className="px-4 py-1.5 bg-[#5B2596] text-white rounded-xl text-xs font-bold"
                    >
                      إضافة المادة
                    </button>
                  </div>

                  {/* Chosen list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#687084] block">المواد التي سيتم جدولتها تلقائياً:</span>
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-gray-50 rounded-xl border border-[#D9D3F0]/60">
                      {wizardData.selectedSubjects.map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-[#E9E6FA] text-[#3E176D] border border-[#D9D3F0]"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromWizard(sub)}
                            className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 font-black text-[9px]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {wizardData.type === 'weekly' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1D2433]">إستراتيجية توزيع المواد</label>
                      <select
                        value={wizardData.strategy}
                        onChange={(e) => setWizardData({ ...wizardData, strategy: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9D3F0] outline-none bg-white font-semibold"
                      >
                        <option value="balanced">توزيع متوازن ومريح بالتناوب</option>
                        <option value="weak">التركيز المكثف على المواد الأولى (مثالي للمواد الصعبة)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-[#D9D3F0] bg-[#F5F3FF]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                إلغاء الخروج
              </button>

              <div className="flex gap-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D9D3F0] text-[#3E176D] bg-white cursor-pointer"
                  >
                    السابق
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#5B2596] cursor-pointer"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#3E176D] to-[#7641B4] shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>توليد وحفظ الجدول الآن</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* NORMAL APP HEADER */}
      <Header
        currentSchedule={activeSchedule}
        onNewSchedule={handleOpenWizard}
        onOpenList={() => setIsListOpen(true)}
        savedSchedulesCount={schedules.length}
      />

      {/* DRAFT NOTIFICATION WARNING BANNER */}
      {isDraftDirty && (
        <div className="no-print bg-amber-50 border-b border-amber-200 text-amber-950 p-3.5 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>لديك تغييرات وتعديلات جديدة في مسودة المعاينة الحية! يرجى النقر على زر <strong>"حفظ الجدول"</strong> بالأسفل لتثبيت وحفظ جدولك بشكل نهائي.</span>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ROLE SWITCHER BAR */}
        <div className="bg-white border border-[#D9D3F0] p-1.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 pr-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-[#3E176D]">تطبيق مدرسي • اختر وضع الاستخدام:</span>
          </div>
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl gap-1 justify-center">
            <button
              onClick={() => {
                setUserRole('student');
                saveUserRole('student');
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRole === 'student'
                  ? 'bg-white text-[#3E176D] shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>وضع الطالب (الجدول الذكي)</span>
            </button>
            <button
              onClick={() => {
                setUserRole('teacher');
                saveUserRole('teacher');
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRole === 'teacher'
                  ? 'bg-white text-[#3E176D] shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>وضع الكادر التدريسي</span>
            </button>
            <button
              onClick={() => {
                setUserRole('exam_organizer');
                saveUserRole('exam_organizer');
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRole === 'exam_organizer'
                  ? 'bg-white text-[#3E176D] shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>منظّم القاعات الامتحانية الذكي 🏫</span>
            </button>
          </div>
        </div>

        {userRole === 'exam_organizer' ? (
          /* EXAM HALL ORGANIZER VIEW */
          <ExamHallOrganizer />
        ) : userRole === 'teacher' ? (
          /* TEACHER MODE VIEW */
          <TeacherMode />
        ) : (
          /* STUDENT MODE VIEW */
          <div className="space-y-6">
            {/* Intro Welcome banner */}
            <div className="bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">تطبيق مدرسي</span>
                  <span className="text-purple-200 text-xs font-bold">بوابتك للتفوق والتعلم المنظم</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black font-sans leading-tight">
                  جدول الدروس الدراسي الذكي والمثالي
                </h1>
                <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
                  يسهّل عليك تنظيم يومك الدراسي، تتبع مستوى إنجازك لدروسك بانتظام، تتبع مناهج البكالوريا وتوقع معدلك النهائي للامتحانات الوزارية بكل دقة.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/15 px-4 py-3.5 rounded-2xl shrink-0 text-center space-y-1">
                <span className="block text-[10px] text-purple-200 font-bold">الجدول النشط حالياً</span>
                <span className="font-black text-sm block truncate max-w-[180px] text-yellow-300">
                  {activeSchedule.scheduleName}
                </span>
                <span className="block text-[10px] text-purple-100 font-semibold">{activeSchedule.gradeClass}</span>
              </div>
            </div>

            {/* UNDO BANNER NOTIFICATION */}
            {deletedCellBackup && (
              <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>تم مسح درس "{deletedCellBackup.cell.subject}" بنجاح. هل ترغب في التراجع عن هذا الإجراء؟</span>
                </div>
                <button
                  onClick={handleUndoClear}
                  className="px-4 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1 transition-all"
                >
                  <Undo className="w-3.5 h-3.5" />
                  <span>تراجع الآن</span>
                </button>
              </div>
            )}

            {/* TAB NAVIGATION PANEL */}
            <div className="border-b border-[#D9D3F0] flex items-center justify-start gap-1 pb-px">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'border-[#5B2596] text-[#3E176D]'
                    : 'border-transparent text-[#687084] hover:text-[#3E176D]'
                }`}
              >
                الجدول الدراسي التفاعلي
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'border-[#5B2596] text-[#3E176D]'
                    : 'border-transparent text-[#687084] hover:text-[#3E176D]'
                }`}
              >
                <Award className="w-4 h-4 text-[#5B2596]" />
                <span>لوحة الإنجاز والمعدل المتوقع</span>
              </button>
              {activeSchedule && isTerminalGrade(activeSchedule.gradeClass) && (
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'curriculum'
                      ? 'border-[#5B2596] text-[#3E176D]'
                      : 'border-transparent text-[#687084] hover:text-[#3E176D]'
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-[#5B2596]" />
                  <span>شجرة المنهج الوزاري</span>
                </button>
              )}
            </div>

            {/* TAB 1: SCHEDULE VIEW (WITH MOBILE TWO-TAB SWITCHING) */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                {/* Mobile/Tablet Subtabs Switcher */}
                <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-[#D9D3F0]">
                  <button
                    onClick={() => setMobileSubTab('preview')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                      mobileSubTab === 'preview'
                        ? 'bg-[#E9E6FA] text-[#3E176D] font-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    👁️ المعاينة والتحكم بالجدول الدراسي
                  </button>
                  <button
                    onClick={() => setMobileSubTab('settings')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                      mobileSubTab === 'settings'
                        ? 'bg-[#E9E6FA] text-[#3E176D] font-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    ⚙️ تعديل التوقيت والبيانات الأساسية
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Controls sidebar (Hidden on Mobile/Tablet unless 'settings' tab active) */}
                  <div className={`col-span-1 lg:col-span-4 space-y-6 ${mobileSubTab === 'settings' ? 'block' : 'hidden lg:block'}`}>
                    <StudentInfoEditor
                      schedule={activeSchedule}
                      onChange={handleUpdateActiveSchedule}
                    />

                    <ExportButton
                      schedule={activeSchedule}
                      onSave={handleCommitDraft}
                      onAddLesson={handleAddLesson}
                      onRemoveLesson={handleRemoveLesson}
                      onEditTimes={() => setIsTimesModalOpen(true)}
                      onClearAllCells={handleClearAllCells}
                      onMarkAllCompleted={handleMarkAllCompleted}
                      onUndo={handleUndoClear}
                      canUndo={deletedCellBackup !== null}
                      onDuplicate={() => handleDuplicateSchedule(activeSchedule)}
                      isSaving={isSaving}
                    />
                  </div>

                  {/* The Main Table Grid (Hidden on Mobile/Tablet unless 'preview' tab active) */}
                  <div className={`col-span-1 lg:col-span-8 space-y-4 ${mobileSubTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                    
                    {/* Floating Assistant Actions */}
                    <div className="bg-[#F5F3FF] border border-[#D9D3F0] p-3.5 rounded-2xl flex flex-wrap gap-2.5 items-center justify-between">
                      <span className="text-xs font-black text-[#3E176D] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                        <span>مساعدك الذكي للتفوق:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => {
                            setAssistantInitialCommand('study_now');
                            setIsAssistantOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-purple-50 border border-[#D9D3F0] rounded-lg text-[10px] font-bold text-[#3E176D] shadow-sm cursor-pointer"
                        >
                          🔍 ماذا يجب أن أدرس الآن؟
                        </button>
                        <button
                          onClick={() => {
                            setAssistantInitialCommand('analyze_schedule');
                            setIsAssistantOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-purple-50 border border-[#D9D3F0] rounded-lg text-[10px] font-bold text-[#3E176D] shadow-sm cursor-pointer"
                        >
                          📊 حلّل جدولي الدراسي
                        </button>
                        <button
                          onClick={() => {
                            setAssistantInitialCommand('start_emergency');
                            setIsAssistantOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-purple-50 border border-[#D9D3F0] rounded-lg text-[10px] font-bold text-[#3E176D] shadow-sm cursor-pointer animate-bounce"
                        >
                          🚨 خطة طوارئ الامتحانات
                        </button>
                        <button
                          onClick={() => {
                            setAssistantInitialCommand('');
                            setIsAssistantOpen(true);
                          }}
                          className="px-3 py-1 bg-[#5B2596] hover:bg-[#3E176D] text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>💬 اسأل المساعد</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-extrabold text-base text-[#3E176D] font-sans">
                        المعاينة التفاعلية المباشرة للجدول
                      </h3>
                      <span className="text-[10px] sm:text-xs text-[#687084] font-medium">
                        💡 اضغط على أي درس دراسي لتعديل تفاصيله بدقة وسهولة.
                      </span>
                    </div>

                    <ScheduleGrid
                      schedule={activeSchedule}
                      onEditCell={(dayIdx, lessonIdx) => setEditingCell({ dayIndex: dayIdx, lessonIndex: lessonIdx })}
                      onClearCell={handleClearCell}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: METRICS & EXPECTED AVERAGE DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* High Level stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-[#D9D3F0] space-y-2">
                    <span className="block text-xs text-[#687084] font-bold">نسبة إنجاز الجدول</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-600 font-mono">{activeSchedule.completionRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${activeSchedule.completionRate || 0}%` }} />
                    </div>
                    <span className="block text-[10px] text-gray-500">تم إنهاء {activeSchedule.completedCount || 0} درس من المجموع الكلي.</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#D9D3F0] space-y-2">
                    <span className="block text-xs text-[#687084] font-bold">مجموع الساعات الدراسية المقدرة</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#5B2596] font-mono">{activeSchedule.studyHours || 0}</span>
                      <span className="text-xs font-semibold text-[#687084]">ساعة</span>
                    </div>
                    <span className="block text-[10px] text-gray-500">مجموع الوقت المخصص للمذاكرة الفعالة بالكامل.</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#D9D3F0] space-y-2">
                    <span className="block text-xs text-[#687084] font-bold">مستوى الالتزام بجدول تطبيق مدرسي</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-blue-600 font-mono">{activeSchedule.adherenceRate || 100}%</span>
                    </div>
                    <span className="block text-[10px] text-gray-500">معدل الانضباط وتفادي الدروس المؤجلة والمتأخرة.</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#D9D3F0] space-y-2">
                    <span className="block text-xs text-[#687084] font-bold">المعدل المستهدف الإجمالي</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-purple-600 font-mono">{isTerminalGrade(activeSchedule.gradeClass) ? calculateAverage() : onboardingData.expectedAverage}%</span>
                    </div>
                    <span className="block text-[10px] text-gray-500">معدل البكالوريا أو الامتحان النهائي الطموح.</span>
                  </div>
                </div>

                {/* Interactive average calculator */}
                <div className="bg-white p-6 rounded-3xl border border-[#D9D3F0] space-y-5">
                  <div className="border-b border-[#D9D3F0] pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-[#5B2596]" />
                      <h3 className="font-extrabold text-base sm:text-lg text-[#3E176D]">مخطط ومحاكي معدل البكالوريا والامتحانات</h3>
                    </div>
                    <p className="text-xs text-[#687084] mt-0.5">أدخل درجاتك المستهدفة أو درجات السعي لكل مادة لتوقع المعدل الوزاري بدقة مدهشة.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="block text-xs font-black text-[#3E176D] mb-1">الدرجات المستهدفة للمواد الدراسية:</span>
                      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                        {Object.keys(subjectExpectedGrades).map((sub) => (
                          <div key={sub} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-[#3E176D] truncate w-1/3">{sub}</span>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="range"
                                min="50"
                                max="100"
                                value={subjectExpectedGrades[sub] || 90}
                                onChange={(e) => setSubjectExpectedGrades({
                                  ...subjectExpectedGrades,
                                  [sub]: Number(e.target.value)
                                })}
                                className="flex-1 accent-[#5B2596]"
                              />
                              <span className="text-xs font-black text-[#5B2596] w-8 text-left">{subjectExpectedGrades[sub] || 90}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#F5F3FF]/55 p-6 rounded-2xl border border-[#D9D3F0]/60 flex flex-col justify-center items-center text-center space-y-4">
                      <span className="text-xs font-bold text-[#687084]">معدلك المتوقع الإجمالي</span>
                      <div className="inline-flex bg-white text-[#3E176D] p-8 rounded-full shadow-inner border-2 border-[#5B2596]/10 text-4xl font-black">
                        {calculateAverage()}%
                      </div>
                      <div className="space-y-1">
                        <span className="block text-sm font-bold text-[#3E176D]">
                          {calculateAverage() >= 95 ? 'نطاق القبول المتميز (كليات المجموعة الطبية) 🩺' : calculateAverage() >= 90 ? 'نطاق الهندسة والمميزين 📐' : calculateAverage() >= 80 ? 'نطاق العلوم والإدارة والمبرزين 🎓' : 'نطاق التميز الأكاديمي والنجاح ✨'}
                        </span>
                        <p className="text-[11px] text-[#687084] max-w-sm leading-relaxed">تطبيق مدرسي يوصيك بتوزيع المذاكرة بانتظام ومراجعة الأسئلة الوزارية لضمان الحصول على السعي المميز وتحقيق الحلم.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CURRICULUM TREE TRACKING (Sixth grade & final grades) */}
            {activeTab === 'curriculum' && (
              <CurriculumTreeEditor
                activeSchedule={activeSchedule}
                onUpdateSchedule={handleUpdateActiveSchedule}
                gradeClass={activeSchedule.gradeClass}
              />
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="no-print bg-white border-t border-[#D9D3F0] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2 text-xs text-[#687084]">
          <p className="text-[#3E176D] font-extrabold text-sm">تطبيق مدرسي</p>
          <p className="leading-relaxed">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • تطبيق مدرسي لتنظيم وتخطيط وتتبع المناهج والدروس المدرسية للامتحانات التحريرية والوزارية بكفاءة تامة.
          </p>
        </div>
      </footer>

      {/* PRINT-ONLY FLUID CONTAINER */}
      <div className="print-only hidden p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-[#3E176D] tracking-tight font-sans mb-1">تطبيق مدرسي</h1>
          <p className="text-sm text-[#687084] font-bold font-sans">منظّم وجدول الدروس الدراسي الذكي والمثالي</p>
        </div>

        <div className="grid grid-cols-3 gap-4 border border-[#D9D3F0] p-4 rounded-xl bg-[#F5F3FF] text-xs mb-6">
          <div>
            <span className="text-[#687084] block font-bold mb-1">اسم الطالب:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.studentName || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">الصف الدراسي:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.gradeClass || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">اسم الجدول:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.scheduleName || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">نوع الجدول:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.scheduleType || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">الفترة الزمنية:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.timePeriod || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">نسبة الإنجاز:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeSchedule.completionRate || 0}%</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-[#D9D3F0] text-center text-xs">
          <thead>
            <tr className="bg-[#F5F3FF]">
              <th className="border border-[#D9D3F0] p-3 font-bold text-[#3E176D]">الدروس / الأيام</th>
              {activeSchedule.days.map((day) => (
                <th key={day} className="border border-[#D9D3F0] p-3 font-bold text-[#3E176D]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeSchedule.lessons.map((lesson, lessonIdx) => {
              const time = activeSchedule.lessonTimes[lessonIdx] || { start: '--:--', end: '--:--' };
              return (
                <tr key={lessonIdx}>
                  <td className="border border-[#D9D3F0] p-2 bg-[#F5F3FF]/40 font-bold text-[#3E176D]">
                    <div>{lesson}</div>
                    <div className="text-[10px] text-[#687084] font-mono mt-0.5">{time.start} - {time.end}</div>
                  </td>
                  {activeSchedule.days.map((_, dayIdx) => {
                    const cellKey = `${dayIdx}-${lessonIdx}`;
                    const cell = activeSchedule.cells[cellKey];
                    const hasData = cell && cell.subject;

                    return (
                      <td key={dayIdx} className={`border border-[#D9D3F0] p-2 h-[85px] align-top relative ${hasData ? 'bg-purple-50/10' : ''}`}>
                        {hasData ? (
                          <div className="flex flex-col justify-between h-full text-right p-0.5">
                            <div>
                              <div className="font-bold text-xs text-[#1D2433] leading-tight mb-1">{cell.subject}</div>
                              {cell.topic && <div className="text-[9px] text-[#687084] truncate">{cell.topic}</div>}
                            </div>
                            <div className="flex justify-between items-center text-[8px] text-[#687084] mt-2">
                              <span>{cell.teacher || ''}</span>
                              <span className="font-bold text-[#5B2596]">{cell.room || ''}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#D9D3F0]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {activeSchedule.notes && (
          <div className="mt-6 border border-[#D9D3F0] p-4 rounded-xl bg-[#F5F3FF]/10 text-xs text-[#687084]">
            <span className="font-bold text-[#3E176D] block mb-1">إرشادات تطبيق مدرسي:</span>
            <p className="leading-relaxed">{activeSchedule.notes}</p>
          </div>
        )}
      </div>

      {/* FLOATING SMART ASSISTANT TOGGLE */}
      {userRole === 'student' && !isOnboarding && (
        <button
          onClick={() => {
            setAssistantInitialCommand('');
            setIsAssistantOpen(!isAssistantOpen);
          }}
          className="no-print fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#3E176D] to-[#7641B4] hover:from-[#5B2596] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-2 border-white/20"
          title="المساعد الذكي المحلي"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
          <span className="text-xs font-black">اسأل المساعد الذكي لتنظيم الدراسة</span>
        </button>
      )}

      {/* MODALS */}
      <SmartAssistant
        activeSchedule={activeSchedule}
        studentProfile={profile}
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onUpdateSchedule={handleUpdateActiveSchedule}
        isOpenAsModal={isAssistantOpen}
        onCloseModal={() => setIsAssistantOpen(false)}
        initialCommand={assistantInitialCommand}
      />

      <CellEditorModal
        isOpen={editingCell !== null}
        dayName={editingCell ? activeSchedule.days[editingCell.dayIndex] : ''}
        lessonName={editingCell ? activeSchedule.lessons[editingCell.periodIndex] : ''}
        initialCell={editingCell ? activeSchedule.cells[`${editingCell.dayIndex}-${editingCell.periodIndex}`] : null}
        gradeClass={activeSchedule.gradeClass}
        onClose={() => setEditingCell(null)}
        onSave={handleSaveCell}
      />

      <PeriodTimesModal
        isOpen={isTimesModalOpen}
        lessons={activeSchedule.lessons}
        initialTimes={activeSchedule.lessonTimes}
        onClose={() => setIsTimesModalOpen(false)}
        onSave={handleSaveTimes}
      />

      <ScheduleList
        isOpen={isListOpen}
        schedules={schedules}
        currentScheduleId={currentScheduleId}
        onSelect={handleSelectSchedule}
        onDelete={handleDeleteSchedule}
        onDuplicate={handleDuplicateSchedule}
        onClose={() => setIsListOpen(false)}
      />
    </div>
  );
}
