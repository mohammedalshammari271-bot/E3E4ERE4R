import { Schedule, ScheduleCell, LessonType, LessonStatus, SUBJECT_COLORS, IRAQI_DAYS } from '../types';

// Helper to format time into HH:MM
const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Convert HH:MM to minutes
const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper to get random subject color from custom list
const getRandomColor = () => {
  const idx = Math.floor(Math.random() * SUBJECT_COLORS.length);
  return SUBJECT_COLORS[idx].hexBg;
};

// 1. GENERATE SMART DAILY SCHEDULE
interface DailyGenParams {
  scheduleName: string;
  date: string;
  studyPreference: 'day' | 'night' | 'both';
  wakeTime: string;
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  lessonCount: number;
  lessonDuration: number;
  breakDuration: number;
  selectedSubjects: string[];
}

export const generateDailySchedule = (params: DailyGenParams, studentName: string, gradeClass: string, stage: string): Schedule => {
  const {
    scheduleName,
    date,
    studyPreference,
    wakeTime,
    lunchTime,
    dinnerTime,
    sleepTime,
    lessonCount,
    lessonDuration,
    breakDuration,
    selectedSubjects
  } = params;

  const wakeMins = parseTimeToMinutes(wakeTime);
  let sleepMins = parseTimeToMinutes(sleepTime);
  if (sleepMins < wakeMins) {
    sleepMins += 24 * 60; // Rollover midnight
  }

  const lunchMins = parseTimeToMinutes(lunchTime);
  const dinnerMins = parseTimeToMinutes(dinnerTime);

  // Excluded blocks (meals, 45 mins each)
  const isExcluded = (mins: number) => {
    // Lunch block
    if (mins >= lunchMins && mins < lunchMins + 45) return true;
    // Dinner block
    if (mins >= dinnerMins && mins < dinnerMins + 45) return true;
    return false;
  };

  const lessonTimes: { start: string; end: string }[] = [];
  const lessons: string[] = [];
  const cells: Record<string, ScheduleCell> = {};

  let currentMins = wakeMins + 30; // 30 mins buffer after waking up
  let createdCount = 0;

  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  while (currentMins + lessonDuration <= sleepMins && createdCount < lessonCount) {
    // Skip if in meal time
    if (isExcluded(currentMins) || isExcluded(currentMins + lessonDuration)) {
      currentMins += 15; // Shift forward
      continue;
    }

    const startStr = formatTime(currentMins);
    const endStr = formatTime(currentMins + lessonDuration);

    lessonTimes.push({ start: startStr, end: endStr });
    const lessonTitle = `الدرس ${ordinals[createdCount] || (createdCount + 1)}`;
    lessons.push(lessonTitle);

    // Pick a subject
    const subIdx = createdCount % (selectedSubjects.length || 1);
    const subject = selectedSubjects[subIdx] || 'دراسة عامة';

    cells[`0-${createdCount}`] = {
      subject,
      topic: 'مراجعة وتلخيص الفصل الأول',
      type: 'study',
      status: 'upcoming',
      color: getRandomColor(),
      effort: 'medium',
      startTime: startStr,
      endTime: endStr,
      notes: 'تطبيق مدرسي يوصي بالتركيز والابتعاد عن المشتتات.'
    };

    createdCount++;
    currentMins += lessonDuration + breakDuration;
  }

  // Create resting cell if any remaining time
  return {
    id: `daily-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: scheduleName || `جدول يومي - ${date}`,
    scheduleType: 'جدول يومي ذكي',
    timePeriod: `يوم ${date}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate: date,
    endDate: date,
    days: ['اليوم المفرد'],
    lessons,
    lessonTimes,
    cells,
    notes: 'تم توليد هذا الجدول اليومي الذكي وتوزيع أوقات المذاكرة والراحة تلقائياً لتناسب أسلوب حياتك.',
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((createdCount * lessonDuration) / 60),
    completedCount: 0
  };
};

// 2. GENERATE SMART WEEKLY SCHEDULE (Starts on Friday, ends on Thursday)
interface WeeklyGenParams {
  scheduleName: string;
  startDate: string; // must be Friday
  selectedSubjects: string[];
  lessonsPerDay: number;
  lessonDuration: number;
  breakDuration: number;
  strategy: 'balanced' | 'weak' | 'difficulty' | 'exams' | 'priority';
  restDays: string[]; // List of days that are rest days
}

export const generateWeeklySchedule = (params: WeeklyGenParams, studentName: string, gradeClass: string, stage: string): Schedule => {
  const {
    scheduleName,
    startDate,
    selectedSubjects,
    lessonsPerDay,
    lessonDuration,
    breakDuration,
    strategy,
    restDays
  } = params;

  // Let's create periods
  const lessons: string[] = [];
  const lessonTimes: { start: string; end: string }[] = [];
  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  // Start at 8:00 AM
  let currentStartMins = 8 * 60;
  for (let l = 0; l < lessonsPerDay; l++) {
    lessons.push(`الدرس ${ordinals[l] || (l + 1)}`);
    lessonTimes.push({
      start: formatTime(currentStartMins),
      end: formatTime(currentStartMins + lessonDuration)
    });
    currentStartMins += lessonDuration + breakDuration;
  }

  const cells: Record<string, ScheduleCell> = {};

  // For each day (Friday to Thursday)
  IRAQI_DAYS.forEach((day, dayIdx) => {
    if (restDays.includes(day)) {
      // It's a resting day, put Rest lessons or empty
      for (let l = 0; l < lessonsPerDay; l++) {
        cells[`${dayIdx}-${l}`] = {
          subject: 'راحة واستراحة',
          topic: 'يوم استراحة مدرسي معتمد',
          type: 'rest',
          status: 'upcoming',
          color: '#ECFDF5', // Soft green rest color
          effort: 'easy',
          notes: 'وقت مخصص لتجديد النشاط والراحة الذهنية.'
        };
      }
      return;
    }

    // Populate actual study lessons based on strategy
    for (let l = 0; l < lessonsPerDay; l++) {
      // Pick subject based on strategy
      let subIdx = (dayIdx * lessonsPerDay + l) % (selectedSubjects.length || 1);
      
      if (strategy === 'weak' && selectedSubjects.length > 1) {
        // Boost first few (weakest) subjects
        const weightedPool: string[] = [];
        selectedSubjects.forEach((sub, sIdx) => {
          // Double weights for first subjects
          const weight = sIdx === 0 || sIdx === 1 ? 3 : 1;
          for (let w = 0; w < weight; w++) weightedPool.push(sub);
        });
        const poolIdx = (dayIdx * lessonsPerDay + l) % weightedPool.length;
        subIdx = selectedSubjects.indexOf(weightedPool[poolIdx]);
      }

      const subject = selectedSubjects[subIdx] || 'مذاكرة حرة';

      // Pick type (alternating study, solve, review)
      const types: LessonType[] = ['study', 'review', 'solve', 'ministerial'];
      const type = types[(dayIdx + l) % types.length];

      cells[`${dayIdx}-${l}`] = {
        subject,
        topic: type === 'ministerial' ? 'حل الأسئلة الوزارية المهمة' : 'دراسة وتلخيص الباب الأول',
        type,
        status: 'upcoming',
        color: getRandomColor(),
        effort: l % 2 === 0 ? 'medium' : 'hard',
        notes: 'تطبيق مدرسي: واظب على التعلم المنظم لأفضل النتائج.'
      };
    }
  });

  const endDateObj = new Date(startDate);
  endDateObj.setDate(endDateObj.getDate() + 6);
  const endDateStr = endDateObj.toISOString().split('T')[0];

  return {
    id: `weekly-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: scheduleName || 'الجدول الدراسي الأسبوعي الذكي',
    scheduleType: 'جدول أسبوعي ذكي',
    timePeriod: `${startDate} إلى ${endDateStr}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate,
    endDate: endDateStr,
    days: IRAQI_DAYS,
    lessons,
    lessonTimes,
    cells,
    notes: 'تم توزيع دروس هذا الجدول الأسبوعي الذكي بصورة متوازنة تبدأ من الجمعة وتنتهي بالخميس طبقاً للتسلسل المدرسي العراقي العريق.',
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((lessonsPerDay * (IRAQI_DAYS.length - restDays.length) * lessonDuration) / 60),
    completedCount: 0
  };
};

// 3. GENERATE PLAN OF REVISIONS, EMERGENCY, MINISTERIAL WITH TIMETABLE GRID
// Reuses the Iraqi 7-day grid format for clear visual presentation
export const generateRevisionPlan = (
  title: string,
  startDate: string,
  endDate: string,
  selectedSubjects: string[],
  lessonsPerDay: number,
  lessonDuration: number,
  type: string, // خطة مراجعة، خطة وزارية، خطة طوارئ
  studentName: string,
  gradeClass: string,
  stage: string
): Schedule => {
  const lessons: string[] = [];
  const lessonTimes: { start: string; end: string }[] = [];
  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  let currentStartMins = 8 * 60;
  for (let l = 0; l < lessonsPerDay; l++) {
    lessons.push(`الدرس ${ordinals[l] || (l + 1)}`);
    lessonTimes.push({
      start: formatTime(currentStartMins),
      end: formatTime(currentStartMins + lessonDuration)
    });
    currentStartMins += lessonDuration + 15; // 15 min breaks by default
  }

  const cells: Record<string, ScheduleCell> = {};

  // Distribute subjects sequentially
  IRAQI_DAYS.forEach((day, dayIdx) => {
    for (let l = 0; l < lessonsPerDay; l++) {
      const subIdx = (dayIdx * lessonsPerDay + l) % (selectedSubjects.length || 1);
      const subject = selectedSubjects[subIdx] || 'مراجعة عامة';

      // Pick lesson attributes depending on plan type
      let lessonType: LessonType = 'review';
      let topic = 'مراجعة المنهج والمفردات الأساسية';
      if (type.includes('وزارية')) {
        lessonType = 'ministerial';
        topic = 'مراجعة وحل الدفاتر والأسئلة الوزارية السابقة';
      } else if (type.includes('طوارئ')) {
        lessonType = 'solve';
        topic = 'تغطية طارئة وحل المسائل المضمونة بالامتحان';
      }

      cells[`${dayIdx}-${l}`] = {
        subject,
        topic,
        type: lessonType,
        status: 'upcoming',
        color: getRandomColor(),
        effort: 'hard',
        notes: 'الاستمرارية والمثابرة اليومية هي مفتاح التفوق والنجاح.'
      };
    }
  });

  return {
    id: `plan-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: title,
    scheduleType: type,
    timePeriod: `الفترة من ${startDate} إلى ${endDate}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate,
    endDate,
    days: IRAQI_DAYS,
    lessons,
    lessonTimes,
    cells,
    notes: `تم إنشاء خطة المذاكرة المكثفة بنجاح للفترة الزمنية المحددة لتغطية كل مفردات المناهج الدراسية الخاصة بالصف وتتبع نسبة إنجازك بانتظام.`,
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((lessonsPerDay * IRAQI_DAYS.length * lessonDuration) / 60),
    completedCount: 0
  };
};
